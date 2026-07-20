import { createAdminClient } from "@/lib/supabase/admin";

export interface MatchedTemplate {
  title: string;
  content: Record<string, string>;
}

/**
 * Picks the best-matching template for this generation request, scoring by
 * exact field matches (decision maker / vertical / product category).
 * Always returns the highest-scoring template if any exist — even a 0-match
 * template still demonstrates the expected section depth, tone, and
 * structure Claude should follow.
 */
export async function findBestTemplate(
  decisionMaker: string,
  vertical: string,
  productCategory: string
): Promise<MatchedTemplate | null> {
  const admin = createAdminClient();
  const { data: templates } = await admin
    .from("battle_card_templates")
    .select("title, decision_maker, vertical, product_category, content, updated_at")
    .order("updated_at", { ascending: false });

  if (!templates || templates.length === 0) return null;

  let best = templates[0];
  let bestScore = -1;

  for (const template of templates) {
    const score =
      (template.decision_maker === decisionMaker ? 1 : 0) +
      (template.vertical === vertical ? 1 : 0) +
      (template.product_category === productCategory ? 1 : 0);

    if (score > bestScore) {
      best = template;
      bestScore = score;
    }
  }

  return { title: best.title, content: best.content as Record<string, string> };
}
