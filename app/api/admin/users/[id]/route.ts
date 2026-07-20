import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPermissions, type Permissions } from "@/lib/permissions";
import { NextResponse } from "next/server";

const PERMISSION_KEYS: (keyof Permissions)[] = [
  "can_view_history",
  "can_create_battlecards",
  "can_edit_us",
  "can_edit_them",
  "can_manage_users",
];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerPermissions = await getPermissions(currentUser.id);
  if (!callerPermissions?.can_manage_users)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const update: Partial<Permissions> = {};
  for (const key of PERMISSION_KEYS) {
    if (key in body) {
      if (typeof body[key] !== "boolean")
        return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 });
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "No valid permission fields provided" }, { status: 400 });

  if (id === currentUser.id && update.can_manage_users === false) {
    return NextResponse.json(
      { error: "You cannot remove your own user-management access" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
