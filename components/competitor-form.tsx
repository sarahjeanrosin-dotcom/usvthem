"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UrlListInput } from "./admin/url-list-input";
import type { Database } from "@/types/database";

type Competitor = Database["public"]["Tables"]["competitors"]["Row"];

interface CompetitorFormProps {
  competitor?: Competitor;
  redirectTo?: string;
}

export function CompetitorForm({ competitor, redirectTo = "/them" }: CompetitorFormProps) {
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
  const [autoFilledLogoUrl, setAutoFilledLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillDone, setAutofillDone] = useState(false);
  const [error, setError] = useState("");

  async function handleAutofill() {
    if (!name.trim()) return;
    setAutofilling(true);
    setAutofillDone(false);
    setError("");
    try {
      const res = await fetch("/api/competitors/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Auto-fill failed");
      }
      const data = await res.json();
      if (data.website) setWebsite(data.website);
      if (data.help_center_url) setHelpCenterUrl(data.help_center_url);
      if (data.release_notes_urls?.length) setReleaseNotesUrls(data.release_notes_urls);
      if (data.product_news_urls?.length) setProductNewsUrls(data.product_news_urls);
      if (data.documentation_urls?.length) setDocumentationUrls(data.documentation_urls);
      if (data.serper_terms?.length) setSerperTerms(data.serper_terms);
      if (data.logo_url) setAutoFilledLogoUrl(data.logo_url);
      setAutofillDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-fill failed");
    } finally {
      setAutofilling(false);
    }
  }

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
      } else if (autoFilledLogoUrl) {
        logoUrl = autoFilledLogoUrl;
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

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const currentLogoUrl = logoFile
    ? URL.createObjectURL(logoFile)
    : autoFilledLogoUrl ?? competitor?.logo_url ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {autofillDone && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-blue-soft bg-brand-blue-ice px-4 py-3 text-sm text-brand-navy">
          <svg className="h-4 w-4 shrink-0 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          AI pre-filled the fields below — review and edit before saving.
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-brand-navy">Basic Information</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-navy">
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setAutofillDone(false); }}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <button
              type="button"
              onClick={handleAutofill}
              disabled={autofilling || name.trim().length < 2}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-blue px-3 py-2 text-sm font-medium text-brand-blue transition hover:bg-brand-blue hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {autofilling ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Researching…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Auto-fill with AI
                </>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Enter the company name, then click Auto-fill to have AI suggest URLs and fetch their logo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-navy">Logo</label>
            {currentLogoUrl && (
              <div className="mb-2 flex items-center gap-2">
                <img
                  src={currentLogoUrl}
                  alt="Logo preview"
                  className="h-10 max-w-[140px] object-contain rounded border border-gray-100 bg-gray-50 p-1"
                />
                {autoFilledLogoUrl && !logoFile && (
                  <span className="text-xs text-brand-blue">via Brandfetch</span>
                )}
              </div>
            )}
            <input
              type="file"
              accept=".png,.svg,.jpg,.jpeg,.webp"
              onChange={(e) => {
                setLogoFile(e.target.files?.[0] ?? null);
                if (e.target.files?.[0]) setAutoFilledLogoUrl(null);
              }}
              className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-ice file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-navy hover:file:bg-brand-blue-soft"
            />
            <p className="mt-1 text-xs text-gray-400">
              {autoFilledLogoUrl && !logoFile
                ? "Logo fetched automatically — upload a file to replace it."
                : "PNG, SVG, JPG — max 5MB"}
            </p>
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
