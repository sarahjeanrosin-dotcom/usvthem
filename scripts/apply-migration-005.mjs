import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!accessToken || !supabaseUrl) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// Extract project ref from URL: https://xxxx.supabase.co → xxxx
const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
const sql = readFileSync("supabase/migrations/0005_match_function.sql", "utf8");

console.log(`Applying migration to project: ${projectRef}`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

if (!res.ok) {
  const err = await res.text();
  console.error("Migration failed:", err);
  process.exit(1);
}

console.log("✓ match_knowledge_chunks function created");
