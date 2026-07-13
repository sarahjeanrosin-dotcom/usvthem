import { createClient } from "@/lib/supabase/server";
import { generateBattleCard } from "@/lib/claude/generate";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decision_maker, vertical, product_category, competitor_ids } =
    await request.json();

  if (!decision_maker || !vertical || !product_category || !competitor_ids?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        for await (const event of generateBattleCard({
          userId: user.id,
          decisionMaker: decision_maker,
          vertical,
          productCategory: product_category,
          competitorIds: competitor_ids,
        })) {
          emit(event);
        }
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Generation failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
