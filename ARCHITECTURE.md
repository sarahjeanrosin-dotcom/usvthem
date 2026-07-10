# Architecture — Genea AI Battle Card Generator

Version: 0.2 | Date: 2026-07-10 | Status: Proposed

---

## 1. Missing Requirements, Edge Cases & Technical Risks

### Missing Requirements

| # | Gap | Impact | Recommendation |
|---|-----|--------|---------------|
| 1 | **Auth provider & admin role** | Blocks multi-user routing | ✅ **Resolved:** Google OAuth via Supabase Auth. Add `role` field (`admin \| user`) to `profiles` table. Protect `/admin` routes server-side. |
| 2 | **Genea brand assets** | Blocks PDF design | ✅ **Resolved:** Colors and logo confirmed (see Brand System section below). |
| 3 | **Embedding model** | Blocks knowledge ingestion | Use OpenAI `text-embedding-3-small` (cheap, fast, Supabase pgvector-native). Can swap to Voyage AI later. |
| 4 | **Multi-competitor PDF layout** | Blocks PDF design | Recommend: 1 competitor = 2-column layout; 2–3 competitors = feature table with N+1 columns (Genea + each competitor). |
| 5 | **Genea knowledge refresh** | Genea data may go stale | Treat Genea as a special `is_genea = true` competitor record; expose the same Refresh Knowledge button in admin. |
| 6 | **PDF storage mechanism** | Blocks history feature | Store PDFs in a Supabase Storage bucket (`battle-cards/`). Save the public URL in the `battle_cards` table. |
| 7 | **Serper API role in generation** | Ambiguous | Use Serper at generation time to supplement RAG with live competitor news when the knowledge base is stale (>30 days old). Also used during "Refresh Knowledge." |
| 8 | **Battle card section conditionality** | Ambiguous | All 14 sections are generated for every request. The prompt instructs Claude to weight sections differently by persona/vertical/product/competitor. |

### Edge Cases

- **Knowledge refresh on a paywalled URL** — Gracefully skip, log a warning, record partial refresh.
- **Competitor with 0 knowledge chunks** — Warn user before generation. Allow generation with a disclaimer that data is limited to Serper results only.
- **3-competitor comparison** — Feature table becomes wide. PDF must scroll horizontally in preview, not clip.
- **Long generation time (>30s)** — Stream Claude output progressively; show a live section-by-section progress indicator.
- **Duplicate battle cards** — Do not deduplicate. Save every generation separately; the user may want to compare runs.
- **Knowledge refresh mid-generation** — Do not mutate the knowledge base while a generation is in progress. Lock refresh per competitor or queue behind generation.
- **Logo upload validation** — Enforce PNG/SVG, max 2MB, store in Supabase Storage bucket `competitor-logos/`.

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Serverless timeout on knowledge ingestion (scraping + embedding many pages) | High | Run ingestion as a Supabase Edge Function or background job via `pg_cron` + Supabase Queue. Do not block the API route. |
| Serverless timeout on generation (Claude + RAG + PDF) | High | Stream Claude response to the client. Generate PDF client-side OR in a separate non-streaming route. |
| Web scraping fragility (competitor sites block bots or change structure) | Medium | Use `Readability` + `cheerio` for best-effort extraction. Store raw HTML as fallback. Alert admin on fetch failure. |
| pgvector dimension mismatch | Medium | Standardize on 1536-dim (OpenAI `text-embedding-3-small`) from day one. Add a migration check. |
| Claude prompt instability across model upgrades | Medium | Pin model version in config (`claude-sonnet-4-6`). Test prompt suite on upgrade. |
| PDF visual regression when branding changes | Low | Keep PDF templates in a dedicated `/lib/pdf/templates/` folder. Version alongside the design system. |

---

## 2. Brand System

Extracted from the Genea Brand Guide and confirmed logo SVG. **Only blues are used** per product direction.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-navy` | `#003865` | Primary headers, logo color, nav background, dark text |
| `brand-blue` | `#009CDE` | CTA buttons, links, active states, highlights, section rules |
| `brand-blue-soft` | `#B2D6E5` | Table row alternates, card backgrounds, subtle dividers |
| `brand-blue-ice` | `#CCF0FF` | Page backgrounds, hover states, callout box fills |
| `white` | `#FFFFFF` | Body text on dark, card surfaces |
| `gray-text` | `#44546A` | Secondary body text (from PPTX theme dk2) |

### Typography

- **Font family:** Inter (Google Fonts — open license, closest match to Genea's clean sans-serif brand)
  - Fallback: `system-ui, -apple-system, sans-serif`
- **Headings:** Inter SemiBold (600)
- **Body:** Inter Regular (400)
- **PDF:** `@react-pdf/renderer` uses its own font loading; embed Inter via `Font.register()`

### Logo

- **File:** `Genea_Logo_Inline_One_Color_RGB.svg`
- **Color in SVG:** `#003865` (single-color navy)
- **Usage:** Place on white or `brand-blue-ice` backgrounds. Never on `brand-blue` (contrast too low).
- **Copy to:** `public/genea-logo.svg` at project setup

### Tailwind Config Additions

```js
// tailwind.config.ts
colors: {
  brand: {
    navy:      '#003865',
    blue:      '#009CDE',
    'blue-soft': '#B2D6E5',
    'blue-ice': '#CCF0FF',
  },
  gray: {
    text: '#44546A',
  }
}
```

---

## 3. Hosting — Netlify

**Answer: Yes, Netlify works.** With one important architectural note:

| Concern | Detail | Solution |
|---------|--------|----------|
| Next.js App Router support | Requires `@netlify/plugin-nextjs` | Add to `netlify.toml` at project init |
| SSE streaming (generation) | Netlify supports streaming responses | Use standard `ReadableStream` in Route Handler — works natively |
| Long-running ingestion (scraping + embedding) | Netlify standard functions time out at 10s | Run ingestion as a **Supabase Edge Function** (not a Next.js route) — platform-agnostic, up to 150s |
| Background PDF generation | Fast enough (<5s) for a standard function | Keep in Next.js Route Handler |

**Netlify-specific files to add at scaffold:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

The ingestion pipeline runs entirely inside Supabase (Edge Function + pgvector), so there is no Netlify timeout risk for that path. This is the right architecture regardless of host.

---

## 5. Recommended Folder Structure

```
usvthem/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx               # Authenticated shell + nav
│   │   ├── page.tsx                 # Dashboard / home
│   │   ├── battle-cards/
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # Battle card creation wizard
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Preview + export
│   │   ├── history/
│   │   │   └── page.tsx             # Search history
│   │   └── admin/
│   │       └── competitors/
│   │           ├── page.tsx         # Competitor list
│   │           ├── new/
│   │           │   └── page.tsx     # Add competitor form
│   │           └── [id]/
│   │               └── page.tsx     # Edit + refresh knowledge
│   └── api/
│       ├── battle-cards/
│       │   ├── route.ts             # GET (list/search), POST (create record)
│       │   ├── generate/
│       │   │   └── route.ts         # POST — streams Claude generation
│       │   └── [id]/
│       │       └── route.ts         # GET single, DELETE
│       ├── competitors/
│       │   ├── route.ts             # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts         # GET, PUT, DELETE
│       │       └── refresh/
│       │           └── route.ts     # POST — triggers ingestion job
│       └── pdf/
│           └── route.ts             # POST — generates PDF, returns URL
├── components/
│   ├── ui/                          # shadcn/ui primitives (Button, Input, etc.)
│   ├── battle-card/
│   │   ├── WizardForm.tsx           # Multi-step creation form
│   │   ├── GenerationProgress.tsx   # Streaming progress indicator
│   │   ├── BattleCardPreview.tsx    # Rendered preview before export
│   │   └── sections/                # One component per battle card section
│   ├── history/
│   │   ├── HistoryTable.tsx
│   │   └── SearchFilters.tsx
│   ├── admin/
│   │   ├── CompetitorForm.tsx
│   │   └── RefreshKnowledgeButton.tsx
│   └── pdf/
│       └── BattleCardDocument.tsx   # @react-pdf/renderer document component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client (RSC / API routes)
│   │   └── admin.ts                 # Service-role client (ingestion only)
│   ├── claude/
│   │   ├── client.ts                # Anthropic SDK init
│   │   ├── prompts.ts               # Prompt templates
│   │   └── generate.ts              # Battle card generation logic
│   ├── ingestion/
│   │   ├── scraper.ts               # Fetch + extract text from URLs
│   │   ├── chunker.ts               # Split text into chunks
│   │   ├── embedder.ts              # Generate + store embeddings
│   │   └── pipeline.ts              # Orchestrates full refresh
│   ├── retrieval/
│   │   └── search.ts                # Vector similarity search (pgvector)
│   ├── serper/
│   │   └── search.ts                # Live web search for supplemental context
│   └── pdf/
│       └── generate.ts              # PDF generation entry point
├── types/
│   ├── database.ts                  # Generated Supabase types
│   ├── battle-card.ts               # Domain types
│   └── competitor.ts
├── hooks/
│   └── useGenerate.ts               # Client-side generation + streaming state
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql                     # Initial competitors seed
└── public/
    └── genea-logo.svg
```

---

## 6. Database Schema

### Supabase Tables

#### `profiles`
Extends `auth.users`. One row per authenticated user.

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz default now()
);
```

#### `competitors`
Includes Genea itself (`is_genea = true`). Do not hardcode competitors.

```sql
create table competitors (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  is_genea            boolean not null default false,
  logo_url            text,
  website             text,
  help_center_url     text,
  release_notes_urls  jsonb default '[]',   -- text[]
  product_news_urls   jsonb default '[]',
  documentation_urls  jsonb default '[]',
  serper_terms        jsonb default '[]',   -- optional search terms
  active              boolean not null default true,
  notes               text,
  last_refresh_at     timestamptz,
  refresh_status      text check (refresh_status in ('idle', 'running', 'success', 'error')),
  refresh_error       text,
  doc_count           integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
```

#### `knowledge_chunks`
RAG store. Uses `pgvector` for semantic search.

```sql
create extension if not exists vector;

create table knowledge_chunks (
  id              uuid primary key default gen_random_uuid(),
  competitor_id   uuid not null references competitors(id) on delete cascade,
  source_url      text not null,
  content         text not null,
  embedding       vector(1536),            -- OpenAI text-embedding-3-small
  token_count     integer,
  metadata        jsonb default '{}',      -- { title, section, scraped_at }
  created_at      timestamptz default now()
);

create index knowledge_chunks_competitor_id_idx on knowledge_chunks(competitor_id);
create index knowledge_chunks_embedding_idx on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

#### `battle_cards`
One row per generated card.

```sql
create table battle_cards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id),
  decision_maker      text not null,
  vertical            text not null,
  product_category    text not null,
  competitor_ids      uuid[] not null,
  generated_content   jsonb not null,      -- keyed by section name
  source_citations    jsonb default '[]',  -- [{ url, title, excerpt }]
  pdf_url             text,                -- Supabase Storage URL
  created_at          timestamptz default now()
);

create index battle_cards_user_id_idx on battle_cards(user_id);
create index battle_cards_created_at_idx on battle_cards(created_at desc);
create index battle_cards_content_fts on battle_cards
  using gin(to_tsvector('english', generated_content::text));
```

### Row-Level Security (RLS)

- `profiles`: users read/update own row; admins read all.
- `competitors`: all authenticated users can read; only admins can write.
- `knowledge_chunks`: all authenticated users can read; only service role can write (ingestion pipeline).
- `battle_cards`: users read/write own rows only.

---

## 7. API Architecture

All routes are Next.js Route Handlers under `app/api/`.

### Battle Cards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/battle-cards/generate` | user | Streams Claude generation. Returns SSE. |
| `POST` | `/api/battle-cards` | user | Saves a completed battle card record + PDF. |
| `GET` | `/api/battle-cards` | user | Search/filter history. |
| `GET` | `/api/battle-cards/[id]` | user | Single card. |
| `DELETE` | `/api/battle-cards/[id]` | user | Delete own card. |

### Competitors (admin-only write)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/competitors` | user | List active competitors. |
| `POST` | `/api/competitors` | admin | Create competitor. |
| `PUT` | `/api/competitors/[id]` | admin | Update competitor. |
| `DELETE` | `/api/competitors/[id]` | admin | Soft-delete (set active=false). |
| `POST` | `/api/competitors/[id]/refresh` | admin | Trigger ingestion job (async, returns job ID). |

### PDF

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/pdf` | user | Generate PDF from battle card JSON. Returns Storage URL. |

---

## 8. Component Hierarchy

```
App Layout (auth shell)
├── Sidebar Nav
│   ├── New Battle Card
│   ├── History
│   └── Admin (admin role only)
│
├── Battle Card Wizard  (/battle-cards/new)
│   ├── Step 1: Select Decision Maker
│   ├── Step 2: Select Vertical
│   ├── Step 3: Select Product Category
│   ├── Step 4: Select Competitor(s) [1–3]
│   └── Step 5: Generate + Progress Stream
│
├── Battle Card Preview  (/battle-cards/[id])
│   ├── BattleCardPreview
│   │   ├── ExecutiveSummary
│   │   ├── CompetitivePositioning
│   │   ├── KeyDifferentiators
│   │   ├── FeatureComparisonTable
│   │   ├── ObjectionHandling
│   │   ├── DiscoveryQuestions
│   │   ├── TalkTrack
│   │   └── ... (remaining sections)
│   └── ExportPDFButton
│
├── History  (/history)
│   ├── SearchFilters (competitor, decision maker, vertical, product, date, keyword)
│   └── HistoryTable (sortable, paginated)
│
└── Admin  (/admin/competitors)
    ├── CompetitorList
    │   └── RefreshKnowledgeButton (per competitor)
    └── CompetitorForm (add / edit)
```

---

## 9. Page Wireframes

### Battle Card Wizard

```
┌─────────────────────────────────────────────────────────────────┐
│  Genea  [New Battle Card]  [History]  [Admin]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  New Battle Card                                                │
│                                                                 │
│  ● Step 1   ○ Step 2   ○ Step 3   ○ Step 4   ○ Generate        │
│                                                                 │
│  Who is the decision maker?                                     │
│                                                                 │
│  [Security Leadership ▼]                                        │
│    ● Chief Security Officer                                     │
│    ○ VP Security                                                │
│    ○ Director of Security                                       │
│    ○ Security Manager                                           │
│                                                                 │
│                              [Next →]                          │
└─────────────────────────────────────────────────────────────────┘
```

### Generation Progress

```
┌─────────────────────────────────────────────────────────────────┐
│  Generating Battle Card                                         │
│                                                                 │
│  CSO  ·  Healthcare  ·  Access Control  ·  vs. Brivo           │
│                                                                 │
│  ✓  Retrieving Genea knowledge                                  │
│  ✓  Retrieving Brivo knowledge                                  │
│  ✓  Running Serper for recent updates                           │
│  ⟳  Generating Executive Summary...                             │
│  ○  Competitive Positioning                                     │
│  ○  Feature Comparison Table                                    │
│  ○  ...                                                         │
│                                                                 │
│  [Cancel]                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Battle Card Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                               [Export PDF]  [Save]     │
├─────────────────────────────────────────────────────────────────┤
│  [PDF preview — landscape, full-width, scrollable]              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  GENEA logo           vs.  BRIVO logo        2026-07-10   │  │
│  │  CSO · Healthcare · Access Control                        │  │
│  │                                                           │  │
│  │  Executive Summary ....                                   │  │
│  │  ┌──────────┬──────────┐                                  │  │
│  │  │  Genea   │  Brivo   │  Feature comparison              │  │
│  │  └──────────┴──────────┘                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. User Flow

```
Login
  └─▶ Dashboard
        └─▶ New Battle Card
              ├─▶ Select Decision Maker
              ├─▶ Select Vertical
              ├─▶ Select Product Category
              ├─▶ Select Competitor(s) [1–3]
              └─▶ Generate
                    ├─▶ RAG: retrieve Genea chunks
                    ├─▶ RAG: retrieve competitor chunk(s)
                    ├─▶ Serper: live supplemental context
                    ├─▶ Claude: stream generation
                    └─▶ Preview
                          ├─▶ Export PDF
                          │     └─▶ Saved to Supabase Storage
                          └─▶ Save to History
                                └─▶ History page (searchable)

Admin Flow
  └─▶ /admin/competitors
        ├─▶ Add Competitor (form → save to DB)
        └─▶ Refresh Knowledge (per competitor)
              ├─▶ Scrape URLs
              ├─▶ Extract text
              ├─▶ Chunk (800 tokens, 100 overlap)
              ├─▶ Embed (OpenAI text-embedding-3-small)
              └─▶ Upsert into knowledge_chunks
```

---

## 11. Knowledge Ingestion Architecture

```
POST /api/competitors/[id]/refresh
  │
  ├─▶ Mark competitor refresh_status = 'running'
  │
  ├─▶ Collect all URLs from:
  │     help_center_url, release_notes_urls,
  │     product_news_urls, documentation_urls
  │
  ├─▶ For each URL (parallel, max 5 concurrent):
  │     ├─▶ HTTP GET (User-Agent spoofing, 10s timeout)
  │     ├─▶ Extract readable text (Mozilla Readability + cheerio)
  │     ├─▶ Split into chunks (800 tokens, 100-token overlap)
  │     │     using tiktoken for accurate token counting
  │     └─▶ For each chunk:
  │           ├─▶ openai.embeddings.create (text-embedding-3-small)
  │           └─▶ Upsert into knowledge_chunks
  │                 (delete old chunks for this URL first)
  │
  ├─▶ If serper_terms present:
  │     └─▶ Serper search → top 10 results → fetch → chunk → embed
  │
  └─▶ Update competitor:
        last_refresh_at, refresh_status, doc_count, refresh_error
```

**Libraries:** `cheerio`, `@mozilla/readability`, `tiktoken`, `openai` SDK

**Timeout strategy:** This runs in a Supabase Edge Function (Deno), not a Vercel API route, to avoid the 60s timeout. The API route fires-and-forgets; the client polls `refresh_status` via a Supabase Realtime subscription.

---

## 12. AI Generation Architecture

```
POST /api/battle-cards/generate  (SSE stream)
  │
  ├─▶ Input: { decision_maker, vertical, product_category, competitor_ids }
  │
  ├─▶ Validate: each competitor has knowledge chunks (warn if not)
  │
  ├─▶ RAG retrieval (parallel):
  │     ├─▶ Embed the query context (decision_maker + vertical + product_category)
  │     ├─▶ Similarity search: top 20 Genea chunks
  │     └─▶ Similarity search: top 15 chunks per competitor
  │
  ├─▶ Serper supplemental (optional):
  │     └─▶ Search "[competitor] vs [product_category] [year]" → top 5 results
  │
  ├─▶ Build prompt:
  │     ├─▶ System: Genea brand voice + positioning rules
  │     ├─▶ Context: retrieved chunks (Genea + competitors)
  │     ├─▶ Persona: decision_maker + vertical framing
  │     └─▶ Output schema: JSON with all 14 sections
  │
  ├─▶ Claude API (claude-sonnet-4-6, streaming, max_tokens=8000):
  │     └─▶ Stream JSON tokens → parse incrementally
  │           └─▶ Emit SSE event per completed section
  │
  └─▶ Client receives sections as they complete → renders preview live
```

**Prompt pinning:** Model pinned to `claude-sonnet-4-6`. Prompt version stored in `lib/claude/prompts.ts` with a version comment.

**Output format:** Claude returns a single JSON object with all 14 section keys. Each value is markdown-formatted text (lists, tables). The preview renders this markdown; the PDF converts it to styled components.

---

## 13. PDF Generation Architecture

**Library:** `@react-pdf/renderer` — pure JS, no headless browser, works on Vercel.

**Triggered:** After generation is complete, user clicks "Export PDF."

```
POST /api/pdf
  │
  ├─▶ Input: battle_card_id (or raw generated_content JSON)
  │
  ├─▶ Fetch competitor logos from Supabase Storage (base64-encode for PDF)
  │
  ├─▶ Render BattleCardDocument (React PDF component):
  │     ├─▶ Page 1: Header (Genea logo, competitor logos, metadata)
  │     │           Executive Summary, Competitive Positioning,
  │     │           Key Differentiators
  │     ├─▶ Page 2: Feature Comparison Table (full width)
  │     │           Strengths / Weaknesses
  │     ├─▶ Page 3: Objection Handling, Discovery Questions, Talk Track
  │     └─▶ Page 4: Recent Releases, Recommended Messaging,
  │                 Ideal Customer, Risks, Sources
  │
  ├─▶ pdf() → Buffer
  │
  ├─▶ Upload to Supabase Storage bucket `battle-cards/`
  │     Path: `{user_id}/{battle_card_id}.pdf`
  │
  └─▶ Return signed URL (24h expiry for download)
        Update battle_cards.pdf_url
```

**Layout rules:**
- Landscape A4 (297mm × 210mm)
- Genea brand colors applied via a theme object in `lib/pdf/theme.ts`
- Multi-competitor: feature table adds one column per competitor (max 4 columns: Genea + 3)
- Typography: sans-serif, 10pt body, 14pt section headers, 18pt card title
