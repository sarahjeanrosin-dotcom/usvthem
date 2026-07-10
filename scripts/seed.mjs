import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const competitors = [
  {
    name: "Genea",
    is_genea: true,
    website: "https://www.getgenea.com",
    help_center_url: "https://help.getgenea.com/en/",
    product_news_urls: [
      "https://help.getgenea.com/en/articles/9276313-genea-security-product-updates",
      "https://portal.productboard.com/getgenea/6-customer-portal/tabs/19-in-progress",
      "https://portal.productboard.com/getgenea/6-customer-portal/tabs/20-released",
    ],
    release_notes_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Brivo",
    is_genea: false,
    website: "https://www.brivo.com",
    help_center_url: "https://support.brivo.com/s/?language=en_US",
    product_news_urls: ["https://www.brivo.com/about/product-news/"],
    release_notes_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Acre",
    is_genea: false,
    website: "https://www.acresecurity.com",
    help_center_url: "https://www.acresecurity.com/support-portal",
    release_notes_urls: [], product_news_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Verkada",
    is_genea: false,
    website: "https://www.verkada.com",
    help_center_url: "https://help.verkada.com/",
    release_notes_urls: [], product_news_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Lenel S2",
    is_genea: false,
    website: "https://www.lenel.com",
    help_center_url:
      "https://buildings.honeywell.com/us/en/support/technical-support/technical-solutions?facetgroup=brand&facet=LenelS2",
    release_notes_urls: [], product_news_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Genetec",
    is_genea: false,
    website: "https://www.genetec.com",
    help_center_url: "https://techdocs.genetec.com/",
    release_notes_urls: [
      "https://techdocs.genetec.com/r/en-US/Security-Center-Release-Notes-5.13.3.0/Release-notes",
    ],
    product_news_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Gallagher",
    is_genea: false,
    website: "https://security.gallagher.com",
    help_center_url:
      "https://help.security.gallagher.com/smb/resources/technical-guides",
    release_notes_urls: [], product_news_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
  {
    name: "Avigilon Alta",
    is_genea: false,
    website: "https://www.avigilon.com",
    help_center_url:
      "https://www.avigilon.com/blog/avigilon-brand-transition-faqs",
    release_notes_urls: [], product_news_urls: [], documentation_urls: [], serper_terms: [],
    active: true,
  },
];

const { error } = await supabase.from("competitors").insert(competitors);

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log("✓ Seeded 8 competitors (Genea + 7 external)");
