"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SECTION_KEYS, SECTION_LABELS, type SectionKey } from "@/lib/claude/prompts";

interface Competitor {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Props {
  content: Record<string, string>;
  competitors: Competitor[];
  decisionMaker: string;
  vertical: string;
  productCategory: string;
}

export function BattleCardPreview({
  content,
  competitors,
  decisionMaker,
  vertical,
  productCategory,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-brand-navy p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/genea-logo.svg" alt="Genea" className="h-6 brightness-0 invert" />
            {competitors.length > 0 && (
              <>
                <span className="text-brand-blue-soft">vs.</span>
                <div className="flex items-center gap-3">
                  {competitors.map((c) =>
                    c.logo_url ? (
                      <img
                        key={c.id}
                        src={c.logo_url}
                        alt={c.name}
                        className="h-5 max-w-[80px] object-contain brightness-0 invert opacity-80"
                      />
                    ) : (
                      <span key={c.id} className="text-sm font-semibold text-white/80">
                        {c.name}
                      </span>
                    )
                  )}
                </div>
              </>
            )}
          </div>
          <div className="text-right text-sm text-brand-blue-soft">
            <p>{decisionMaker}</p>
            <p>{vertical} · {productCategory}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTION_KEYS.map((key) => {
        const text = content[key];
        if (!text) return null;
        return <Section key={key} sectionKey={key} content={text} />;
      })}
    </div>
  );
}

function Section({ sectionKey, content }: { sectionKey: SectionKey; content: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-blue">
        {SECTION_LABELS[sectionKey]}
      </h2>
      <div className="prose prose-sm max-w-none text-gray-text prose-headings:text-brand-navy prose-strong:text-brand-navy prose-a:text-brand-blue prose-table:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
