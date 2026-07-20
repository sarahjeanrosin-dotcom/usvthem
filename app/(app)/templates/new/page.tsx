import { redirect } from "next/navigation";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { TemplateForm } from "@/components/templates/template-form";

export default async function NewTemplatePage() {
  const { permissions } = await getCurrentUserPermissions();
  if (!permissions.can_manage_templates) redirect("/");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Add Template</h1>
        <p className="mt-1 text-sm text-gray-text">
          Author a gold-standard example battle card
        </p>
      </div>
      <TemplateForm />
    </div>
  );
}
