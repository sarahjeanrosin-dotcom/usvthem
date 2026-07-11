import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, FileText, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recentCards } = await supabase
    .from("battle_cards")
    .select("id, decision_maker, vertical, product_category, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count } = await supabase
    .from("battle_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-text">
            Generate competitive battle cards for Genea sales
          </p>
        </div>
        <Link
          href="/battle-cards/new"
          className="flex items-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue"
        >
          <PlusCircle size={16} />
          New Battle Card
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FileText size={20} className="text-brand-blue" />}
          label="Total Battle Cards"
          value={count ?? 0}
        />
        <StatCard
          icon={<Clock size={20} className="text-brand-blue" />}
          label="Last Generated"
          value={
            recentCards?.[0]
              ? new Date(recentCards[0].created_at).toLocaleDateString()
              : "—"
          }
        />
      </div>

      {/* Recent cards */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-brand-navy">Recent Battle Cards</h2>
        </div>

        {recentCards && recentCards.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Decision Maker</th>
                <th className="px-6 py-3">Vertical</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-brand-blue-ice/40 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-brand-navy">{card.decision_maker}</td>
                  <td className="px-6 py-3 text-gray-text">{card.vertical}</td>
                  <td className="px-6 py-3 text-gray-text">{card.product_category}</td>
                  <td className="px-6 py-3 text-gray-text">
                    {new Date(card.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-brand-blue-ice p-4">
              <FileText size={24} className="text-brand-blue" />
            </div>
            <p className="font-medium text-brand-navy">No battle cards yet</p>
            <p className="mt-1 text-sm text-gray-text">
              Create your first battle card to get started
            </p>
            <Link
              href="/battle-cards/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-blue"
            >
              <PlusCircle size={15} />
              Create Battle Card
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
      <div className="mb-3">{icon}</div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-navy">{value}</p>
    </div>
  );
}
