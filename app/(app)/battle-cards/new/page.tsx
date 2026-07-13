import { createAdminClient } from "@/lib/supabase/admin";
import { WizardForm } from "@/components/battle-card/wizard-form";

export default async function NewBattleCardPage() {
  const admin = createAdminClient();
  const { data: competitors } = await admin
    .from("competitors")
    .select("id, name, logo_url, doc_count")
    .eq("active", true)
    .eq("is_genea", false)
    .order("name");

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-brand-navy">New Battle Card</h1>
        <p className="mt-1 text-sm text-gray-text">
          Answer a few questions and Claude will generate a customized competitive battle card.
        </p>
      </div>
      <WizardForm competitors={competitors ?? []} />
    </div>
  );
}
