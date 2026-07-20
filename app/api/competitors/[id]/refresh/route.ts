import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canEditCompetitor } from "@/lib/permissions";
import { runPipeline } from "@/lib/ingestion/pipeline";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await canEditCompetitor(user.id, id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  await admin
    .from("competitors")
    .update({ refresh_status: "running", refresh_error: null })
    .eq("id", id);

  try {
    await runPipeline(id);
    return NextResponse.json({ status: "success" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await admin
      .from("competitors")
      .update({ refresh_status: "error", refresh_error: message })
      .eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
