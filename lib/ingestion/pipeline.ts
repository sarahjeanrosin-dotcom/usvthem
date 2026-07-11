import { scrapeUrl } from "./scraper";
import { chunkText } from "./chunker";
import { embedAndStore } from "./embedder";
import { searchSerper } from "@/lib/serper/search";
import { createAdminClient } from "@/lib/supabase/admin";

const CONCURRENCY = 5;
const MAX_SERPER_TERMS = 3;
const MAX_SERPER_RESULTS_PER_TERM = 5;

async function processUrl(competitorId: string, url: string): Promise<void> {
  const text = await scrapeUrl(url);
  const chunks = chunkText(text, url);
  await embedAndStore(competitorId, url, chunks);
}

export async function runPipeline(competitorId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: competitor, error } = await admin
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .single();

  if (error || !competitor) throw new Error("Competitor not found");

  // Collect all URLs to process
  const urls: string[] = [
    competitor.website,
    competitor.help_center_url,
    ...((competitor.release_notes_urls as string[]) ?? []),
    ...((competitor.product_news_urls as string[]) ?? []),
    ...((competitor.documentation_urls as string[]) ?? []),
  ].filter((u): u is string => Boolean(u));

  // Add Serper search results if API key is available
  if (process.env.SERPER_API_KEY) {
    const terms = ((competitor.serper_terms as string[]) ?? []).slice(
      0,
      MAX_SERPER_TERMS
    );
    for (const term of terms) {
      try {
        const results = await searchSerper(term);
        urls.push(
          ...results.slice(0, MAX_SERPER_RESULTS_PER_TERM).map((r) => r.link)
        );
      } catch {
        // Serper failure is non-fatal
      }
    }
  }

  const uniqueUrls = [...new Set(urls)];

  // Process in batches of CONCURRENCY
  for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY) {
    const batch = uniqueUrls.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map((url) => processUrl(competitorId, url))
    );
  }

  // Update competitor record with final stats
  const { count } = await admin
    .from("knowledge_chunks")
    .select("*", { count: "exact", head: true })
    .eq("competitor_id", competitorId);

  await admin
    .from("competitors")
    .update({
      doc_count: count ?? 0,
      last_refresh_at: new Date().toISOString(),
      refresh_status: "success",
      refresh_error: null,
    })
    .eq("id", competitorId);
}
