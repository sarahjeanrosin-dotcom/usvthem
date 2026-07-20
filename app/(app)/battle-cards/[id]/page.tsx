import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { BattleCardPreview } from "@/components/battle-card/battle-card-preview";
import { ExportPdfButton } from "@/components/battle-card/export-pdf-button";
import { ArrowLeft } from "lucide-react";

export default async function BattleCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { permissions } = await getCurrentUserPermissions();
  if (!permissions.can_create_battlecards && !permissions.can_view_history) redirect("/");

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
        <ExportPdfButton battleCardId={id} existingPdfUrl={card.pdf_url} />
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
