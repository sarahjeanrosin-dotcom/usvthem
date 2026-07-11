import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs your@email.com");
  process.exit(1);
}

const { data: { users }, error } = await supabase.auth.admin.listUsers();
if (error) { console.error(error.message); process.exit(1); }

const user = users.find(u => u.email === email);
if (!user) { console.error("User not found"); process.exit(1); }

const { error: updateError } = await supabase
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", user.id);

if (updateError) { console.error(updateError.message); process.exit(1); }

console.log(`✓ ${email} is now an admin`);
