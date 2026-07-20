import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { CompetitorForm } from "@/components/competitor-form";

export default async function EditCompetitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { permissions } = await getCurrentUserPermissions();
  if (!permissions.can_edit_them) redirect("/");

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: competitor } = await supabase
    .from("competitors")
    .select("*")
    .eq("id", id)
    .single();

  if (!competitor) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Edit — {competitor.name}
        </h1>
        <p className="mt-1 text-sm text-gray-text">
          Update competitor details and knowledge sources
        </p>
      </div>
      <CompetitorForm competitor={competitor} redirectTo="/them" />
    </div>
  );
}
