"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  competitorId: string;
  initialStatus: string | null;
}

export function RefreshKnowledgeButton({ competitorId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus ?? "idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`competitor-${competitorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "competitors",
          filter: `id=eq.${competitorId}`,
        },
        (payload) => {
          const newStatus = payload.new.refresh_status as string;
          setStatus(newStatus);
          if (newStatus !== "running") setLoading(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitorId]);

  async function handleRefresh() {
    setLoading(true);
    setStatus("running");
    try {
      const res = await fetch(`/api/competitors/${competitorId}/refresh`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Refresh failed");
      }
    } catch {
      setStatus("error");
      setLoading(false);
    }
  }

  if (status === "running" || loading) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-brand-blue">
        <RefreshCw size={13} className="animate-spin" />
        Syncing…
      </span>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle size={13} />
          Up to date
        </span>
        <button
          onClick={handleRefresh}
          className="text-xs text-gray-400 hover:text-brand-blue transition-colors"
          title="Re-sync knowledge"
        >
          <RefreshCw size={12} />
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle size={13} />
          Error
        </span>
        <button
          onClick={handleRefresh}
          className="text-xs text-brand-blue hover:text-brand-navy transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors"
    >
      <RefreshCw size={13} />
      Sync knowledge
    </button>
  );
}
