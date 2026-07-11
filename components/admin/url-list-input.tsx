"use client";

import { Plus, X } from "lucide-react";

interface UrlListInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function UrlListInput({ label, values, onChange, placeholder = "https://" }: UrlListInputProps) {
  function update(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...values, ""]);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-navy">{label}</label>
      <div className="space-y-2">
        {values.map((val, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="url"
              value={val}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-sm text-brand-blue hover:text-brand-navy transition-colors"
        >
          <Plus size={14} />
          Add URL
        </button>
      </div>
    </div>
  );
}
