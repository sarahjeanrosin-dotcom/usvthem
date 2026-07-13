import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const admin = createAdminClient();

  let query = admin
    .from("battle_cards")
    .select(
      "id, decision_maker, vertical, product_category, competitor_ids, pdf_url, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const competitor = searchParams.get("competitor_id");
  if (competitor) {
    query = query.contains("competitor_ids", [competitor]);
  }

  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
