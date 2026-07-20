"use client";

import { Search } from "lucide-react";
import { DECISION_MAKER_GROUPS, VERTICALS, PRODUCT_CATEGORIES } from "@/lib/claude/prompts";

const ALL_DECISION_MAKERS = DECISION_MAKER_GROUPS.flatMap((g) => g.options);

export interface HistoryFilters {
  keyword: string;
  decisionMaker: string;
  vertical: string;
  productCategory: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
}

export function SearchFilters({ filters, onChange }: Props) {
  const hasActiveFilters =
    filters.keyword ||
    filters.decisionMaker ||
    filters.vertical ||
    filters.productCategory ||
    filters.dateFrom ||
    filters.dateTo;

  function set<K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[180px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={filters.keyword}
          onChange={(e) => set("keyword", e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      <select
        value={filters.decisionMaker}
        onChange={(e) => set("decisionMaker", e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
      >
        <option value="">All decision makers</option>
        {ALL_DECISION_MAKERS.map((dm) => (
          <option key={dm} value={dm}>{dm}</option>
        ))}
      </select>

      <select
        value={filters.vertical}
        onChange={(e) => set("vertical", e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
      >
        <option value="">All verticals</option>
        {VERTICALS.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <select
        value={filters.productCategory}
        onChange={(e) => set("productCategory", e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
      >
        <option value="">All products</option>
        {PRODUCT_CATEGORIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-text focus:border-brand-blue focus:outline-none"
        />
        <span className="text-sm text-gray-400">to</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-text focus:border-brand-blue focus:outline-none"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={() =>
            onChange({
              keyword: "",
              decisionMaker: "",
              vertical: "",
              productCategory: "",
              dateFrom: "",
              dateTo: "",
            })
          }
          className="text-sm text-brand-blue hover:text-brand-navy transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
