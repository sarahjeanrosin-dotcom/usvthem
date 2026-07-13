"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DECISION_MAKER_GROUPS,
  VERTICALS,
  PRODUCT_CATEGORIES,
  SECTION_LABELS,
  SECTION_KEYS,
  type SectionKey,
} from "@/lib/claude/prompts";
import { CheckCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  logo_url: string | null;
  doc_count: number;
}

interface Props {
  competitors: Competitor[];
}

type Step = 1 | 2 | 3 | 4;

interface GenerateEvent {
  type: "status" | "section" | "complete" | "error";
  message?: string;
  key?: SectionKey;
  content?: string;
  battleCardId?: string;
}

export function WizardForm({ competitors }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [decisionMaker, setDecisionMaker] = useState("");
  const [vertical, setVertical] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>([]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [completedSections, setCompletedSections] = useState<SectionKey[]>([]);
  const [error, setError] = useState("");

  function toggleCompetitor(id: string) {
    setSelectedCompetitorIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setCompletedSections([]);
    setStatusMessage("Starting…");

    try {
      const res = await fetch("/api/battle-cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision_maker: decisionMaker,
          vertical,
          product_category: productCategory,
          competitor_ids: selectedCompetitorIds,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start generation");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event: GenerateEvent = JSON.parse(line.slice(6));

          if (event.type === "status" && event.message) {
            setStatusMessage(event.message);
          } else if (event.type === "section" && event.key) {
            setCompletedSections((prev) => [...prev, event.key!]);
          } else if (event.type === "complete" && event.battleCardId) {
            router.push(`/battle-cards/${event.battleCardId}`);
            return;
          } else if (event.type === "error") {
            throw new Error(event.message ?? "Generation failed");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy">Generating Battle Card</h2>
          <p className="mt-1 text-sm text-gray-text">
            {decisionMaker} · {vertical} · {productCategory} · vs.{" "}
            {selectedCompetitorIds
              .map((id) => competitors.find((c) => c.id === id)?.name)
              .join(", ")}
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-brand-blue">
            <Loader2 size={14} className="animate-spin" />
            <span>{statusMessage}</span>
          </div>
        </div>

        <div className="space-y-1">
          {SECTION_KEYS.map((key) => {
            const done = completedSections.includes(key);
            return (
              <div
                key={key}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  done ? "text-green-600" : "text-gray-300"
                }`}
              >
                <CheckCircle size={14} className={done ? "opacity-100" : "opacity-30"} />
                {SECTION_LABELS[key]}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s < step
                  ? "bg-brand-blue text-white"
                  : s === step
                  ? "bg-brand-navy text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {s < step ? <CheckCircle size={14} /> : s}
            </div>
            {s < 4 && (
              <div
                className={`h-px w-8 ${s < step ? "bg-brand-blue" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* Step 1: Decision Maker */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-brand-navy">
                Who is the decision maker?
              </h2>
              <p className="text-sm text-gray-text">
                Select the persona you&apos;ll be presenting to.
              </p>
            </div>
            <div className="space-y-3">
              {DECISION_MAKER_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group.group}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDecisionMaker(option)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          decisionMaker === option
                            ? "border-brand-blue bg-brand-blue-ice text-brand-navy font-medium"
                            : "border-gray-200 text-gray-text hover:border-brand-blue/50 hover:bg-brand-blue-ice/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Vertical */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-brand-navy">
                What industry vertical?
              </h2>
              <p className="text-sm text-gray-text">Select the prospect&apos;s industry.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {VERTICALS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVertical(v)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    vertical === v
                      ? "border-brand-blue bg-brand-blue-ice text-brand-navy font-medium"
                      : "border-gray-200 text-gray-text hover:border-brand-blue/50 hover:bg-brand-blue-ice/50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Product Category */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-brand-navy">
                What product category?
              </h2>
              <p className="text-sm text-gray-text">
                What is the primary product being evaluated?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_CATEGORIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProductCategory(p)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    productCategory === p
                      ? "border-brand-blue bg-brand-blue-ice text-brand-navy font-medium"
                      : "border-gray-200 text-gray-text hover:border-brand-blue/50 hover:bg-brand-blue-ice/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Competitors */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-brand-navy">
                Select competitor(s)
              </h2>
              <p className="text-sm text-gray-text">
                Select up to 3 competitors to compare against Genea.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {competitors.map((c) => {
                const selected = selectedCompetitorIds.includes(c.id);
                const disabled = !selected && selectedCompetitorIds.length >= 3;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCompetitor(c.id)}
                    disabled={disabled}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      selected
                        ? "border-brand-blue bg-brand-blue-ice text-brand-navy font-medium"
                        : disabled
                        ? "cursor-not-allowed border-gray-100 text-gray-300"
                        : "border-gray-200 text-gray-text hover:border-brand-blue/50 hover:bg-brand-blue-ice/50"
                    }`}
                  >
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={c.name}
                        className="h-5 w-12 object-contain"
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-blue-soft text-xs font-bold text-brand-navy">
                        {c.name[0]}
                      </span>
                    )}
                    <span>{c.name}</span>
                    {c.doc_count === 0 && (
                      <span className="ml-auto text-xs text-amber-500">No data</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedCompetitorIds.length > 0 && (
              <p className="text-xs text-gray-400">
                {selectedCompetitorIds.length} of 3 selected
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          disabled={step === 1}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-text hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={
              (step === 1 && !decisionMaker) ||
              (step === 2 && !vertical) ||
              (step === 3 && !productCategory)
            }
            className="flex items-center gap-1.5 rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedCompetitorIds.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-navy disabled:opacity-40"
          >
            <Loader2 size={15} className="hidden" />
            Generate Battle Card
          </button>
        )}
      </div>
    </div>
  );
}
