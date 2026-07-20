import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { TemplateForm } from "@/components/templates/template-form";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { permissions } = await getCurrentUserPermissions();
  if (!permissions.can_manage_templates) redirect("/");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: template } = await admin
    .from("battle_card_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Edit — {template.title}</h1>
        <p className="mt-1 text-sm text-gray-text">Update this example battle card</p>
      </div>
      <TemplateForm template={template} />
    </div>
  );
}
