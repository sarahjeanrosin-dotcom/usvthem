import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Permissions = {
  can_view_history: boolean;
  can_create_battlecards: boolean;
  can_edit_us: boolean;
  can_edit_them: boolean;
  can_manage_users: boolean;
};

const EMPTY_PERMISSIONS: Permissions = {
  can_view_history: false,
  can_create_battlecards: false,
  can_edit_us: false,
  can_edit_them: false,
  can_manage_users: false,
};

export async function getPermissions(userId: string): Promise<Permissions | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(
      "can_view_history, can_create_battlecards, can_edit_us, can_edit_them, can_manage_users"
    )
    .eq("id", userId)
    .single();

  return data ?? null;
}

/** Resolves the current session's user + permissions in one call. Never throws — returns EMPTY_PERMISSIONS if signed out. */
export async function getCurrentUserPermissions(): Promise<{
  userId: string | null;
  permissions: Permissions;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, permissions: EMPTY_PERMISSIONS };

  const permissions = await getPermissions(user.id);
  return { userId: user.id, permissions: permissions ?? EMPTY_PERMISSIONS };
}

/**
 * Permission required to edit a competitor record: can_edit_us for the Genea
 * profile (is_genea = true), can_edit_them for everyone else.
 */
export function competitorEditPermission(isGenea: boolean): keyof Permissions {
  return isGenea ? "can_edit_us" : "can_edit_them";
}

/** Looks up a competitor's is_genea flag and checks the caller has the matching edit permission. */
export async function canEditCompetitor(
  userId: string,
  competitorId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const [{ data: competitor }, permissions] = await Promise.all([
    admin.from("competitors").select("is_genea").eq("id", competitorId).single(),
    getPermissions(userId),
  ]);

  if (!competitor || !permissions) return false;
  return permissions[competitorEditPermission(competitor.is_genea)];
}
