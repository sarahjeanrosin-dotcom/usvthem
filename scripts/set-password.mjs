import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/set-password.mjs email@example.com newpassword");
  process.exit(1);
}

// Find user by email
const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
if (listError) { console.error(listError.message); process.exit(1); }

const user = users.find(u => u.email === email);
if (!user) { console.error("User not found"); process.exit(1); }

// Set password
const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
if (error) { console.error(error.message); process.exit(1); }

console.log(`✓ Password set for ${email}`);
