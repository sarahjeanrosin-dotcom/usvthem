import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedQuery, searchKnowledgeByEmbedding } from "@/lib/retrieval/search";
import { searchSerper } from "@/lib/serper/search";
import { findBestTemplate } from "./templates";
import { buildSystemPrompt, buildUserMessage, formatTemplateExample, SECTION_KEYS, type SectionKey } from "./prompts";

export interface GenerateParams {
  userId: string;
  decisionMaker: string;
  vertical: string;
  productCategory: string;
  competitorIds: string[];
}

export type GenerateEvent =
  | { type: "status"; message: string }
  | { type: "section"; key: SectionKey; content: string }
  | { type: "complete"; battleCardId: string }
  | { type: "error"; message: string };

// Parses Claude's [SECTION:key] ... [END_SECTION] streaming format
class SectionStreamParser {
  private buffer = "";
  private currentKey = "";
  private currentContent = "";

  feed(text: string): Array<{ key: string; content: string }> {
    this.buffer += text;
    const emitted: Array<{ key: string; content: string }> = [];

    while (true) {
      if (!this.currentKey) {
        const tagMatch = this.buffer.match(/\[SECTION:([a-z_]+)\]\n?/);
        if (!tagMatch) {
          // Trim junk before first tag
          if (this.buffer.length > 30) this.buffer = this.buffer.slice(-20);
          break;
        }
        this.currentKey = tagMatch[1];
        this.buffer = this.buffer.slice(tagMatch.index! + tagMatch[0].length);
        this.currentContent = "";
      } else {
        const endIdx = this.buffer.indexOf("[END_SECTION]");
        if (endIdx === -1) {
          // Accumulate, but keep a tail in case [END_SECTION] is split across chunks
          const safe = Math.max(0, this.buffer.length - 13);
          this.currentContent += this.buffer.slice(0, safe);
          this.buffer = this.buffer.slice(safe);
          break;
        }
        this.currentContent += this.buffer.slice(0, endIdx);
        this.buffer = this.buffer.slice(endIdx + "[END_SECTION]".length);
        emitted.push({ key: this.currentKey, content: this.currentContent.trim() });
        this.currentKey = "";
        this.currentContent = "";
      }
    }

    return emitted;
  }
}

export async function* generateBattleCard(
  params: GenerateParams
): AsyncGenerator<GenerateEvent> {
  const { userId, decisionMaker, vertical, productCategory, competitorIds } = params;
  const admin = createAdminClient();

  // Fetch competitors
  const { data: competitors } = await admin
    .from("competitors")
    .select("id, name, serper_terms")
    .in("id", competitorIds);

  const { data: geneaRow } = await admin
    .from("competitors")
    .select("id, name")
    .eq("is_genea", true)
    .single();

  const competitorNames = (competitors ?? []).map((c) => c.name);
  const query = `${decisionMaker} ${vertical} ${productCategory} access control security`;

  // Gather all context concurrently — RAG (Genea + each competitor), Serper, and the
  // few-shot template are all independent lookups with no dependency on each other.
  yield { type: "status", message: "Gathering knowledge and context…" };

  const queryEmbedding = await embedQuery(query);

  const [geneaContext, competitorContextEntries, serperContext, templateExample] =
    await Promise.all([
      geneaRow?.id
        ? searchKnowledgeByEmbedding(queryEmbedding, geneaRow.id, 20)
            .then((chunks) => chunks.map((c) => `[${c.source_url}]\n${c.content}`).join("\n\n"))
            .catch(() => "")
        : Promise.resolve(""),

      Promise.all(
        (competitors ?? []).map((comp) =>
          searchKnowledgeByEmbedding(queryEmbedding, comp.id, 15)
            .then(
              (chunks) =>
                [comp.name, chunks.map((c) => `[${c.source_url}]\n${c.content}`).join("\n\n")] as const
            )
            .catch(() => [comp.name, ""] as const)
        )
      ),

      process.env.SERPER_API_KEY
        ? Promise.allSettled(
            competitorNames.map((name) =>
              searchSerper(`${name} vs ${productCategory} ${new Date().getFullYear()}`)
            )
          ).then((results) =>
            results
              .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
              .slice(0, 10)
              .map((r) => `${r.title}: ${r.snippet}`)
              .join("\n")
          )
        : Promise.resolve(""),

      findBestTemplate(decisionMaker, vertical, productCategory)
        .then((match) => (match ? formatTemplateExample(match.content) : ""))
        .catch(() => ""),
    ]);

  const competitorContext = Object.fromEntries(competitorContextEntries);

  // Build prompt and call Claude
  yield { type: "status", message: "Generating battle card…" };

  const anthropic = new Anthropic();
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: buildSystemPrompt(competitorNames),
    messages: [
      {
        role: "user",
        content: buildUserMessage({
          decisionMaker,
          vertical,
          productCategory,
          competitorNames,
          geneaContext,
          competitorContext,
          serperContext,
          templateExample,
        }),
      },
    ],
  });

  const parser = new SectionStreamParser();
  const collectedSections: Record<string, string> = {};

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const completed = parser.feed(event.delta.text);
      for (const s of completed) {
        collectedSections[s.key] = s.content;
        if (SECTION_KEYS.includes(s.key as SectionKey)) {
          yield { type: "section", key: s.key as SectionKey, content: s.content };
        }
      }
    }
  }

  // Save battle card to database
  const { data: saved, error } = await admin
    .from("battle_cards")
    .insert({
      user_id: userId,
      decision_maker: decisionMaker,
      vertical,
      product_category: productCategory,
      competitor_ids: competitorIds,
      generated_content: collectedSections,
      source_citations: [],
    })
    .select("id")
    .single();

  if (error) {
    yield { type: "error", message: `Failed to save battle card: ${error.message}` };
    return;
  }

  yield { type: "complete", battleCardId: saved.id };
}
