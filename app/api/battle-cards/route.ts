import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPermissions } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const permissions = await getPermissions(user.id);
  if (!permissions?.can_view_history)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const admin = createAdminClient();

  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc("search_battle_cards", {
    user_id_filter: user.id,
    competitor_id_filter: searchParams.get("competitor_id") || null,
    decision_maker_filter: searchParams.get("decision_maker") || null,
    vertical_filter: searchParams.get("vertical") || null,
    product_category_filter: searchParams.get("product_category") || null,
    date_from_filter: searchParams.get("date_from") || null,
    date_to_filter: searchParams.get("date_to") || null,
    keyword_filter: searchParams.get("keyword") || null,
    limit_count: limit,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
