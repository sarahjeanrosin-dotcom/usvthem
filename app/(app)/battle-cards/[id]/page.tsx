import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BattleCardPreview } from "@/components/battle-card/battle-card-preview";
import { ArrowLeft } from "lucide-react";

export default async function BattleCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: card } = await admin
    .from("battle_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (!card) notFound();

  const { data: competitors } = await admin
    .from("competitors")
    .select("id, name, logo_url")
    .in("id", card.competitor_ids);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-text hover:text-brand-navy transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-brand-navy">
              {card.decision_maker} · {card.vertical} · {card.product_category}
            </h1>
            <p className="text-sm text-gray-text">
              vs. {(competitors ?? []).map((c) => c.name).join(", ")} ·{" "}
              {new Date(card.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-400">
            Export PDF — coming soon
          </span>
        </div>
      </div>

      <BattleCardPreview
        content={card.generated_content as Record<string, string>}
        competitors={competitors ?? []}
        decisionMaker={card.decision_maker}
        vertical={card.vertical}
        productCategory={card.product_category}
      />
    </div>
  );
}
