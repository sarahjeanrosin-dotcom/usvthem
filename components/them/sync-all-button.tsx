"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface Competitor {
  id: string;
  name: string;
}

interface Props {
  competitors: Competitor[];
}

export function SyncAllButton({ competitors }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);

  async function handleSyncAll() {
    setRunning(true);
    setFailed([]);
    const failures: string[] = [];

    for (let i = 0; i < competitors.length; i++) {
      setIndex(i);
      const competitor = competitors[i];
      try {
        const res = await fetch(`/api/competitors/${competitor.id}/refresh`, {
          method: "POST",
        });
        if (!res.ok) failures.push(competitor.name);
      } catch {
        failures.push(competitor.name);
      }
    }

    setFailed(failures);
    setRunning(false);
    router.refresh();
  }

  if (competitors.length === 0) return null;

  if (running) {
    return (
      <span className="flex items-center gap-2 text-sm text-brand-blue">
        <RefreshCw size={14} className="animate-spin" />
        Syncing {index + 1} of {competitors.length} — {competitors[index]?.name}…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSyncAll}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-text transition-colors hover:border-brand-blue/50 hover:text-brand-navy"
      >
        <RefreshCw size={15} />
        Sync All
      </button>
      {failed.length > 0 && (
        <span className="text-xs text-red-500">
          {failed.length} failed: {failed.join(", ")}
        </span>
      )}
    </div>
  );
}
