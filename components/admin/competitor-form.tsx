"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UrlListInput } from "./url-list-input";
import type { Database } from "@/types/database";

type Competitor = Database["public"]["Tables"]["competitors"]["Row"];

interface CompetitorFormProps {
  competitor?: Competitor;
}

export function CompetitorForm({ competitor }: CompetitorFormProps) {
  const router = useRouter();
  const isEdit = !!competitor;

  const [name, setName] = useState(competitor?.name ?? "");
  const [website, setWebsite] = useState(competitor?.website ?? "");
  const [helpCenterUrl, setHelpCenterUrl] = useState(competitor?.help_center_url ?? "");
  const [releaseNotesUrls, setReleaseNotesUrls] = useState<string[]>(
    (competitor?.release_notes_urls as string[]) ?? []
  );
  const [productNewsUrls, setProductNewsUrls] = useState<string[]>(
    (competitor?.product_news_urls as string[]) ?? []
  );
  const [documentationUrls, setDocumentationUrls] = useState<string[]>(
    (competitor?.documentation_urls as string[]) ?? []
  );
  const [serperTerms, setSerperTerms] = useState<string[]>(
    (competitor?.serper_terms as string[]) ?? []
  );
  const [active, setActive] = useState(competitor?.active ?? true);
  const [notes, setNotes] = useState(competitor?.notes ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let logoUrl = competitor?.logo_url ?? null;

      if (logoFile) {
        const supabase = createClient();
        const ext = logoFile.name.split(".").pop();
        const path = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("competitor-logos")
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        const { data: { publicUrl } } = supabase.storage
          .from("competitor-logos")
          .getPublicUrl(path);
        logoUrl = publicUrl;
      }

      const payload = {
        name,
        website: website || null,
        help_center_url: helpCenterUrl || null,
        release_notes_urls: releaseNotesUrls.filter(Boolean),
        product_news_urls: productNewsUrls.filter(Boolean),
        documentation_urls: documentationUrls.filter(Boolean),
        serper_terms: serperTerms.filter(Boolean),
        active,
        notes: notes || null,
        ...(logoUrl !== undefined && { logo_url: logoUrl }),
      };

      const url = isEdit ? `/api/competitors/${competitor.id}` : "/api/competitors";
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

      router.push("/admin/competitors");
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">Help Center URL</label>
          <input
            type="url"
            value={helpCenterUrl}
            onChange={(e) => setHelpCenterUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">Logo</label>
            {competitor?.logo_url && (
              <img src={competitor.logo_url} alt="Current logo" className="mb-2 h-8 object-contain" />
            )}
            <input
              type="file"
              accept=".png,.svg,.jpg,.jpeg,.webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-ice file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-navy hover:file:bg-brand-blue-soft"
            />
            <p className="mt-1 text-xs text-gray-400">PNG, SVG, JPG — max 5MB</p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 ${
                active ? "bg-brand-blue" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-brand-navy">
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      {/* Knowledge sources */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-brand-navy">Knowledge Sources</h2>
        <UrlListInput
          label="Release Notes URLs"
          values={releaseNotesUrls}
          onChange={setReleaseNotesUrls}
        />
        <UrlListInput
          label="Product News URLs"
          values={productNewsUrls}
          onChange={setProductNewsUrls}
        />
        <UrlListInput
          label="Documentation URLs"
          values={documentationUrls}
          onChange={setDocumentationUrls}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Serper Search Terms
          </label>
          <div className="space-y-2">
            {serperTerms.map((term, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={term}
                  onChange={(e) => {
                    const next = [...serperTerms];
                    next[i] = e.target.value;
                    setSerperTerms(next);
                  }}
                  placeholder="e.g. Brivo access control 2026"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
                <button
                  type="button"
                  onClick={() => setSerperTerms(serperTerms.filter((_, j) => j !== i))}
                  className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSerperTerms([...serperTerms, ""])}
              className="flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-navy transition-colors"
            >
              + Add search term
            </button>
          </div>
        </div>
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
          disabled={saving}
          className="rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Competitor"}
        </button>
      </div>
    </form>
  );
}
