import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPermissions } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await getPermissions(user.id);
  if (!permissions?.can_manage_users) redirect("/");

  return <div className="space-y-6">{children}</div>;
}
