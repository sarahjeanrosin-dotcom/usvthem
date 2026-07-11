import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are a competitive intelligence researcher specializing in physical access control and security technology. For the company "${name}", provide their key URLs.

Return ONLY valid JSON with no markdown fences, no explanation:
{
  "website": "https://...",
  "domain": "example.com",
  "help_center_url": "https://... or null",
  "release_notes_urls": [],
  "product_news_urls": [],
  "documentation_urls": [],
  "serper_terms": []
}

Rules:
- website: their primary marketing/homepage URL
- domain: bare domain only, e.g. "brivo.com" (used for logo lookup)
- help_center_url: support or help center URL, null if unknown
- release_notes_urls: up to 2 changelog or release notes pages
- product_news_urls: up to 2 blog or news pages about their product
- documentation_urls: up to 2 technical docs or API docs pages
- serper_terms: 4–5 Google search queries good for competitive intelligence, e.g. "${name} access control pricing", "${name} vs alternatives"
- Only include URLs you are highly confident are correct. Use empty arrays if unsure.`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  let aiData: Record<string, unknown> = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    aiData = JSON.parse(match ? match[0] : text);
  } catch {
    // Return empty data rather than error
  }

  let logo_url: string | null = null;
  const domain = (aiData.domain as string | undefined)?.trim();

  if (domain && process.env.BRANDFETCH_API_KEY) {
    try {
      const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: { Authorization: `Bearer ${process.env.BRANDFETCH_API_KEY}` },
      });
      if (res.ok) {
        const brand = await res.json();
        for (const logo of brand.logos ?? []) {
          for (const fmt of logo.formats ?? []) {
            if (fmt.src && (fmt.format === "svg" || fmt.format === "png")) {
              logo_url = fmt.src;
              break;
            }
          }
          if (logo_url) break;
        }
      }
    } catch {
      // Logo fetch failed — not critical
    }
  }

  return NextResponse.json({
    website: (aiData.website as string) ?? "",
    help_center_url: (aiData.help_center_url as string) ?? "",
    release_notes_urls: (aiData.release_notes_urls as string[]) ?? [],
    product_news_urls: (aiData.product_news_urls as string[]) ?? [],
    documentation_urls: (aiData.documentation_urls as string[]) ?? [],
    serper_terms: (aiData.serper_terms as string[]) ?? [],
    logo_url,
  });
}
