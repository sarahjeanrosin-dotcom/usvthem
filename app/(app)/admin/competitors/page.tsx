import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default async function CompetitorsAdminPage() {
  const supabase = await createClient();
  const { data: competitors } = await supabase
    .from("competitors")
    .select("*")
    .order("is_genea", { ascending: false })
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Competitors</h1>
          <p className="mt-1 text-sm text-gray-text">
            Manage competitors and their knowledge sources
          </p>
        </div>
        <Link
          href="/admin/competitors/new"
          className="flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue"
        >
          <Plus size={16} />
          Add Competitor
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Competitor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Refresh</th>
              <th className="px-6 py-3">Docs</th>
              <th className="px-6 py-3">Knowledge</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {competitors?.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-50 last:border-0 hover:bg-brand-blue-ice/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="h-7 w-16 object-contain" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-blue-soft text-xs font-bold text-brand-navy">
                        {c.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-brand-navy">{c.name}</p>
                      {c.is_genea && (
                        <span className="text-xs text-brand-blue">Genea (us)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {c.active ? (
                    <span className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <XCircle size={14} /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-text">
                  {c.last_refresh_at
                    ? new Date(c.last_refresh_at).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-6 py-4 text-gray-text">{c.doc_count ?? 0}</td>
                <td className="px-6 py-4">
                  {c.refresh_status === "running" ? (
                    <span className="flex items-center gap-1.5 text-brand-blue">
                      <RefreshCw size={13} className="animate-spin" /> Running
                    </span>
                  ) : c.refresh_status === "success" ? (
                    <span className="text-green-600">Up to date</span>
                  ) : c.refresh_status === "error" ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    <span className="text-gray-400">Not synced</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/competitors/${c.id}`}
                    className="text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
