"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DECISION_MAKER_GROUPS,
  VERTICALS,
  PRODUCT_CATEGORIES,
  SECTION_KEYS,
  SECTION_LABELS,
} from "@/lib/claude/prompts";
import type { Database } from "@/types/database";

type Template = Database["public"]["Tables"]["battle_card_templates"]["Row"];

interface Props {
  template?: Template;
}

export function TemplateForm({ template }: Props) {
  const router = useRouter();
  const isEdit = !!template;

  const [title, setTitle] = useState(template?.title ?? "");
  const [decisionMaker, setDecisionMaker] = useState(template?.decision_maker ?? "");
  const [vertical, setVertical] = useState(template?.vertical ?? "");
  const [productCategory, setProductCategory] = useState(template?.product_category ?? "");
  const [content, setContent] = useState<Record<string, string>>(
    (template?.content as Record<string, string>) ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = { title, decision_maker: decisionMaker, vertical, product_category: productCategory, content };
      const url = isEdit ? `/api/templates/${template.id}` : "/api/templates";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      router.push("/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Basic info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-brand-navy">Basic Information</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Security Leadership — Healthcare — Access Control"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Decision Maker <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {DECISION_MAKER_GROUPS.map((group) => (
              <div key={group.group} className="flex flex-wrap gap-1.5">
                {group.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDecisionMaker(option)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      decisionMaker === option
                        ? "border-brand-blue bg-brand-blue-ice text-brand-navy"
                        : "border-gray-200 text-gray-text hover:border-brand-blue/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">
              Vertical <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VERTICALS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVertical(v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    vertical === v
                      ? "border-brand-blue bg-brand-blue-ice text-brand-navy"
                      : "border-gray-200 text-gray-text hover:border-brand-blue/50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">
              Product Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_CATEGORIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProductCategory(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    productCategory === p
                      ? "border-brand-blue bg-brand-blue-ice text-brand-navy"
                      : "border-gray-200 text-gray-text hover:border-brand-blue/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-brand-navy">Example Content</h2>
          <p className="mt-1 text-xs text-gray-400">
            Author each section as you&apos;d want a gold-standard battle card to read. Claude
            references this example for tone, structure, and depth — it never copies the content.
          </p>
        </div>
        {SECTION_KEYS.map((key) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">
              {SECTION_LABELS[key]}
            </label>
            <textarea
              value={content[key] ?? ""}
              onChange={(e) => setContent((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={key === "feature_comparison" ? 6 : 3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-text hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !decisionMaker || !vertical || !productCategory}
          className="rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Template"}
        </button>
      </div>
    </form>
  );
}
