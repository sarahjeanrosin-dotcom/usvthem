import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: users } = await supabase.auth.admin.listUsers();
const user = users.users.find(u => u.email === "srosin@getgenea.com");

if (!user) { console.log("User not found in auth"); process.exit(1); }

console.log("Auth user ID:", user.id);

const { data: profile, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

if (error) {
  console.log("Profile not found — creating it now...");
  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id, role: "admin" });
  if (insertError) console.error("Insert failed:", insertError.message);
  else console.log("✓ Profile created with admin role");
} else {
  console.log("Profile found:", profile);
  if (profile.role !== "admin") {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
    console.log("✓ Role updated to admin");
  } else {
    console.log("✓ Already admin");
  }
}
