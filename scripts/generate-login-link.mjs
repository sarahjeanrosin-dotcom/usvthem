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
  console.error("Usage: node scripts/generate-login-link.mjs your@email.com");
  process.exit(1);
}

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo: "https://usvthem.netlify.app/auth/callback" },
});

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log("\nOpen this link in your browser to sign in:\n");
const link = `${data.properties.action_link}&apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
console.log(link);
console.log("\n(Link expires in 1 hour)");
