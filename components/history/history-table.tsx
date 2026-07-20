"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Trash2, Loader2 } from "lucide-react";
import { SearchFilters, type HistoryFilters } from "./search-filters";

interface Card {
  id: string;
  decision_maker: string;
  vertical: string;
  product_category: string;
  competitor_ids: string[];
  pdf_url: string | null;
  created_at: string;
}

interface Competitor {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Props {
  cards: Card[];
  competitorMap: Record<string, Competitor>;
}

const EMPTY_FILTERS: HistoryFilters = {
  keyword: "",
  decisionMaker: "",
  vertical: "",
  productCategory: "",
  dateFrom: "",
  dateTo: "",
};

function buildQuery(filters: HistoryFilters): string {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.decisionMaker) params.set("decision_maker", filters.decisionMaker);
  if (filters.vertical) params.set("vertical", filters.vertical);
  if (filters.productCategory) params.set("product_category", filters.productCategory);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  return params.toString();
}

export function HistoryTable({ cards: initialCards, competitorMap }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/battle-cards?${buildQuery(filters)}`, {
          signal: controller.signal,
        });
        if (res.ok) setCards(await res.json());
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Search failed:", err);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this battle card? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/battle-cards/${id}`, { method: "DELETE" });
      if (res.ok) setCards((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchFilters filters={filters} onChange={setFilters} />
        {searching && (
          <Loader2 size={14} className="animate-spin text-brand-blue shrink-0" />
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">Decision Maker</th>
              <th className="px-5 py-3">Vertical</th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Competitor(s)</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  {hasActiveFilters
                    ? "No results match your filters."
                    : "No battle cards yet — generate your first one."}
                </td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-brand-blue-ice/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/battle-cards/${card.id}`}
                      className="font-medium text-brand-navy hover:text-brand-blue transition-colors"
                    >
                      {card.decision_maker}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-text">{card.vertical}</td>
                  <td className="px-5 py-3 text-gray-text">{card.product_category}</td>
                  <td className="px-5 py-3 text-gray-text">
                    {card.competitor_ids
                      .map((id) => competitorMap[id]?.name ?? id)
                      .join(", ")}
                  </td>
                  <td className="px-5 py-3 text-gray-text whitespace-nowrap">
                    {new Date(card.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {card.pdf_url && (
                        <a
                          href={card.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-blue hover:text-brand-navy transition-colors"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(card.id)}
                        disabled={deleting === card.id}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {cards.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400">
            {cards.length} battle card{cards.length === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </div>
  );
}
