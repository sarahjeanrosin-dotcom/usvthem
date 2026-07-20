import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { CompetitorForm } from "@/components/competitor-form";
import { RefreshKnowledgeButton } from "@/components/refresh-knowledge-button";

export default async function UsPage() {
  const { permissions } = await getCurrentUserPermissions();
  if (!permissions.can_edit_us) redirect("/");

  const admin = createAdminClient();
  const { data: genea } = await admin
    .from("competitors")
    .select("*")
    .eq("is_genea", true)
    .single();

  if (!genea) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-gray-text">
          No Genea profile found. Seed the Genea competitor record first.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Us</h1>
          <p className="mt-1 text-sm text-gray-text">
            Genea&apos;s own knowledge library — every battle card compares against this.
          </p>
        </div>
        <RefreshKnowledgeButton competitorId={genea.id} initialStatus={genea.refresh_status} />
      </div>
      <CompetitorForm competitor={genea} redirectTo="/us" />
    </div>
  );
}
