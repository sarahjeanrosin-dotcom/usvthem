import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PermissionToggles } from "@/components/admin/permission-toggles";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, created_at, can_view_history, can_create_battlecards, can_edit_us, can_edit_them, can_manage_users"
      )
      .order("created_at"),
    admin.auth.admin.listUsers(),
  ]);

  const emailById = new Map(authUsers?.users.map((u) => [u.id, u.email]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Users</h1>
        <p className="mt-1 text-sm text-gray-text">
          Manage who can view history, create battle cards, edit Us/Them profiles, and manage users
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-50 last:border-0 hover:bg-brand-blue-ice/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-brand-navy align-top">
                  {emailById.get(p.id) ?? p.id}
                  {p.id === currentUser?.id && (
                    <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-text align-top">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <PermissionToggles
                    userId={p.id}
                    permissions={{
                      can_view_history: p.can_view_history,
                      can_create_battlecards: p.can_create_battlecards,
                      can_edit_us: p.can_edit_us,
                      can_edit_them: p.can_edit_them,
                      can_manage_users: p.can_manage_users,
                    }}
                    isSelf={p.id === currentUser?.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
