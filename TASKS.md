# MVP Tasks — Genea AI Battle Card Generator

Each task is small, ordered by dependency, and independently completable.
Mark status as: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 1 — Project Scaffold

- [ ] **T01** Initialize Next.js 14 app with TypeScript, Tailwind, App Router
- [ ] **T02** Install and configure shadcn/ui component library
- [ ] **T03** Set up ESLint, Prettier, and path aliases (`@/`)
- [ ] **T04** Create `.env.local` template with all required keys:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SERPER_API_KEY`
- [ ] **T05** Initialize Supabase project (local dev via `supabase init`)
- [ ] **T05b** Add `netlify.toml` with Next.js plugin config; install `@netlify/plugin-nextjs` dev dependency
- [ ] **T05c** Copy `Genea_Logo_Inline_One_Color_RGB.svg` to `public/genea-logo.svg`
- [ ] **T05d** Add Genea brand color tokens to `tailwind.config.ts` (navy `#003865`, blue `#009CDE`, blue-soft `#B2D6E5`, blue-ice `#CCF0FF`, gray-text `#44546A`)

---

## Phase 2 — Database Schema

- [ ] **T06** Write migration `0001`: create `profiles` table with RLS
- [ ] **T07** Write migration `0002`: create `competitors` table with RLS
- [ ] **T08** Write migration `0003`: enable `pgvector` extension; create `knowledge_chunks` table with vector index
- [ ] **T09** Write migration `0004`: create `battle_cards` table with FTS index and RLS
- [ ] **T10** Write `supabase/seed.sql` seeding the 7 initial competitors (Brivo, Acre, Verkada, Lenel S2, Genetec, Gallagher, Avigilon Alta) and Genea itself
- [ ] **T11** Generate TypeScript types from Supabase schema (`supabase gen types`)

---

## Phase 3 — Authentication (Email Magic Link via Supabase)

- [x] **T12** Create Supabase auth client helpers: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- [x] **T13** ~~Google OAuth~~ → switched to email magic link (Genea Google Workspace blocks Cloud Console access)
- [x] **T14** Build login page (`/login`) with email input + magic link via `supabase.auth.signInWithOtp()`
- [x] **T15** Add auth callback route (`/auth/callback`) to exchange code for session
- [x] **T16** Add middleware to protect all routes; redirect unauthenticated users to `/login`
- [x] **T17** Profiles row auto-created on sign-in via database trigger (migration 0001)
- [ ] **T17b** Manually set your account's role to `admin` via Supabase dashboard SQL: `UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';`

---

## Phase 4 — Authenticated Shell

- [ ] **T18** Create the `(app)/layout.tsx` authenticated shell with sidebar navigation
- [ ] **T19** Add nav links: New Battle Card, History, Admin (admin role only — read role from `profiles`)
- [ ] **T20** Build `/` dashboard page (placeholder: recent cards + quick-start CTA)

---

## Phase 5 — Competitor Management (Admin)

- [ ] **T21** Build `/admin/competitors` page listing all competitors (name, logo, active toggle, last refresh date, doc count)
- [ ] **T22** Build `CompetitorForm` component for add/edit (all fields from PRD including logo upload)
- [ ] **T23** Add logo upload to Supabase Storage bucket `competitor-logos/` via the form
- [ ] **T24** Wire `POST /api/competitors` and `PUT /api/competitors/[id]` route handlers
- [ ] **T25** Wire `DELETE /api/competitors/[id]` (soft-delete: set `active = false`)

---

## Phase 6 — Knowledge Ingestion Pipeline

- [ ] **T26** Build `lib/ingestion/scraper.ts` — fetch URL, extract readable text with `@mozilla/readability` + `cheerio`
- [ ] **T27** Build `lib/ingestion/chunker.ts` — split text into 800-token chunks with 100-token overlap using `tiktoken`
- [ ] **T28** Build `lib/ingestion/embedder.ts` — call OpenAI `text-embedding-3-small`, upsert chunks into `knowledge_chunks`
- [ ] **T29** Build `lib/ingestion/pipeline.ts` — orchestrate scrape → chunk → embed for all competitor URLs; run up to 5 URLs concurrently
- [ ] **T30** Write Supabase Edge Function `supabase/functions/refresh-knowledge/index.ts` — runs the full ingestion pipeline (long-running, up to 150s, avoids Netlify's 10s timeout)
- [ ] **T30b** Write `POST /api/competitors/[id]/refresh` Next.js route — marks status as `running`, calls the Supabase Edge Function via `fetch`, returns immediately
- [ ] **T31** Build `RefreshKnowledgeButton` component — calls refresh endpoint, subscribes to Supabase Realtime on `competitors.refresh_status`, shows live progress and outcome
- [ ] **T32** Add Serper integration `lib/serper/search.ts` — search by term, return top 10 URLs + snippets
- [ ] **T33** Integrate Serper into pipeline: if `serper_terms` present, search → fetch top results → chunk → embed

---

## Phase 7 — Battle Card Generation

- [ ] **T34** Build `lib/retrieval/search.ts` — vector similarity search in `knowledge_chunks` given a query string and optional `competitor_id`
- [ ] **T35** Write the system prompt in `lib/claude/prompts.ts` — include: Genea brand voice, competitor positioning rules, persona/vertical/product framing instructions, JSON output schema for all 14 sections
- [ ] **T36** Build `lib/claude/generate.ts` — assemble RAG context + Serper context + prompt; call Claude with streaming; parse JSON incrementally; emit section events
- [ ] **T37** Write `POST /api/battle-cards/generate` SSE route — validate input, call generate, stream section events to client
- [ ] **T38** Build the 5-step `WizardForm` component (`/battle-cards/new`):
  - Step 1: Decision Maker selector (grouped by category)
  - Step 2: Vertical selector
  - Step 3: Product Category selector
  - Step 4: Competitor selector (1–3, max 3)
  - Step 5: Generate trigger
- [ ] **T39** Build `GenerationProgress` component — connect to SSE stream, show per-section completion status
- [ ] **T40** Build `BattleCardPreview` component — render each of the 14 sections from the returned JSON; use markdown rendering for lists and tables

---

## Phase 8 — PDF Generation & Export

- [ ] **T41** Install `@react-pdf/renderer`; create `lib/pdf/theme.ts` with Genea brand colors and typography
- [ ] **T42** Build `BattleCardDocument` React PDF component — 4-page layout, landscape A4, all 14 sections, Genea + competitor logos
- [ ] **T43** Handle multi-competitor layout in the feature comparison table (Genea + N competitor columns)
- [ ] **T44** Write `POST /api/pdf` route — render PDF to buffer, upload to Supabase Storage `battle-cards/`, return signed URL
- [ ] **T45** Wire "Export PDF" button on preview page — calls `/api/pdf`, saves URL to `battle_cards.pdf_url`, triggers download

---

## Phase 9 — History & Search

- [ ] **T46** Write `POST /api/battle-cards` route — save completed battle card record (content, citations, pdf_url)
- [ ] **T47** Write `GET /api/battle-cards` route — support filter params: `competitor_id`, `decision_maker`, `vertical`, `product_category`, `date_from`, `date_to`, `keyword` (FTS)
- [ ] **T48** Build `SearchFilters` component with dropdowns and date range picker
- [ ] **T49** Build `HistoryTable` component — paginated, sortable by date; columns: decision maker, vertical, product, competitors, date, PDF download link
- [ ] **T50** Wire delete action on history table rows

---

## Phase 10 — Genea Knowledge Refresh

- [ ] **T51** Seed Genea as a competitor record (`is_genea = true`) with the 3 knowledge URLs from PRD
- [ ] **T52** Expose Genea in the admin competitors list with its own Refresh Knowledge button
- [ ] **T53** Verify Genea chunks are correctly retrieved during generation (confirm `is_genea` competitor is always included in RAG query)

---

## Phase 11 — Polish & Hardening

- [ ] **T54** Add error boundaries and user-facing error states for: fetch failures, Claude timeout, PDF generation failure, no knowledge chunks
- [ ] **T55** Add loading skeletons to History table and competitor list
- [ ] **T56** Add empty-state messaging when a competitor has 0 knowledge chunks
- [ ] **T57** Validate logo upload on client + server (PNG/SVG only, max 2MB)
- [ ] **T58** Add a Supabase Realtime subscription to the battle card preview so PDF URL appears automatically once generation completes
- [ ] **T59** Smoke test full flow end-to-end: login → generate → preview → export PDF → history search

---

## Blocked / Pre-work Required

| Blocker | Status | Blocks |
|---------|--------|--------|
| Genea brand hex colors + font | ✅ Resolved — see ARCHITECTURE.md §2 | T41, T42 |
| Genea logo file (SVG) | ✅ Resolved — `public/genea-logo.svg` | T42 |
| Auth provider | ✅ Resolved — Google OAuth via Supabase | T13–T17b |
| Hosting platform | ✅ Resolved — Netlify + `@netlify/plugin-nextjs` | T05b |
| Supabase project created and credentials provided | ⏳ Pending | T05, T06–T11 |
| Google Cloud OAuth credentials | ⏳ Pending | T13 |
| Anthropic API key | ⏳ Pending | T36 |
| OpenAI API key (embeddings) | ⏳ Pending | T28 |
| Serper API key | ⏳ Pending | T32 |
