"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  battleCardId: string;
  existingPdfUrl?: string | null;
}

export function ExportPdfButton({ battleCardId, existingPdfUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battle_card_id: battleCardId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "PDF generation failed");
      }
      const { pdf_url } = await res.json();
      if (pdf_url) {
        window.open(pdf_url, "_blank");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
        {loading ? "Generating PDF…" : "Export PDF"}
      </button>
      {existingPdfUrl && !loading && (
        <a
          href={existingPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-blue hover:underline"
        >
          Download previous PDF
        </a>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
