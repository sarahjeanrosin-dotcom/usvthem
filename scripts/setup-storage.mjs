import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const buckets = [
  { name: "competitor-logos", public: true },
  { name: "battle-cards", public: false },
];

for (const bucket of buckets) {
  const { error } = await supabase.storage.createBucket(bucket.name, {
    public: bucket.public,
    fileSizeLimit: 5242880, // 5MB
  });
  if (error && error.message !== "The resource already exists") {
    console.error(`Failed to create ${bucket.name}:`, error.message);
  } else {
    console.log(`✓ ${bucket.name} bucket ready`);
  }
}
