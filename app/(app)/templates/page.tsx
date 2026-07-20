import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { Plus } from "lucide-react";

export default async function TemplatesPage() {
  const { permissions } = await getCurrentUserPermissions();
  if (!permissions.can_manage_templates) redirect("/");

  const admin = createAdminClient();
  const { data: templates } = await admin
    .from("battle_card_templates")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Templates</h1>
          <p className="mt-1 text-sm text-gray-text">
            Gold-standard example battle cards Claude references at generation time
          </p>
        </div>
        <Link
          href="/templates/new"
          className="flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-blue"
        >
          <Plus size={16} />
          Add Template
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Decision Maker</th>
              <th className="px-6 py-3">Vertical</th>
              <th className="px-6 py-3">Product Category</th>
              <th className="px-6 py-3">Updated</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {templates?.map((t) => (
              <tr
                key={t.id}
                className="border-b border-gray-50 last:border-0 hover:bg-brand-blue-ice/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-brand-navy">{t.title}</td>
                <td className="px-6 py-4 text-gray-text">{t.decision_maker}</td>
                <td className="px-6 py-4 text-gray-text">{t.vertical}</td>
                <td className="px-6 py-4 text-gray-text">{t.product_category}</td>
                <td className="px-6 py-4 text-gray-text">
                  {new Date(t.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/templates/${t.id}`}
                    className="text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {templates?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                  No templates yet — add one so Claude has a reference example to work from.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
