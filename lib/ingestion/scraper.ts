import * as cheerio from "cheerio";

export async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; GeneaBattleCardBot/1.0; +https://usvthem.netlify.app)",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();

  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    "script, style, nav, footer, header, aside, noscript, iframe, svg, [role=navigation], [role=banner], [role=complementary]"
  ).remove();

  // Prefer semantic content containers
  const content =
    $("main").text() ||
    $("article").text() ||
    $('[role="main"]').text() ||
    $(".content, .post-content, .entry-content, .page-content").first().text() ||
    $("body").text();

  return content.replace(/\s+/g, " ").trim();
}
