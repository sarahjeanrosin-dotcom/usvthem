import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPermissions } from "@/lib/permissions";
import { HistoryTable } from "@/components/history/history-table";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const permissions = user ? await getPermissions(user.id) : null;
  if (!permissions?.can_view_history) redirect("/");

  const admin = createAdminClient();

  const { data: cards } = await admin
    .from("battle_cards")
    .select("id, decision_maker, vertical, product_category, competitor_ids, pdf_url, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: competitors } = await admin
    .from("competitors")
    .select("id, name, logo_url")
    .eq("is_genea", false);

  const competitorMap = Object.fromEntries(
    (competitors ?? []).map((c) => [c.id, c])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">History</h1>
        <p className="mt-1 text-sm text-gray-text">
          All generated battle cards — search, filter, and re-download.
        </p>
      </div>
      <HistoryTable cards={cards ?? []} competitorMap={competitorMap} />
    </div>
  );
}
