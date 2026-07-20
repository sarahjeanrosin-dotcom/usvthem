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
- [x] **T17b** Manually set your account's role to `admin` via Supabase dashboard SQL: `UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';`

---

## Phase 4 — Authenticated Shell

- [x] **T18** Create the `(app)/layout.tsx` authenticated shell with sidebar navigation
- [x] **T19** Add nav links: New Battle Card, History, Admin (admin role only — read role from `profiles`)
- [x] **T20** Build `/` dashboard page (placeholder: recent cards + quick-start CTA)

---

## Phase 5 — Competitor Management (Admin)

- [x] **T21** Build `/admin/competitors` page listing all competitors (name, logo, active toggle, last refresh date, doc count)
- [x] **T22** Build `CompetitorForm` component for add/edit (all fields from PRD including logo upload)
- [x] **T23** Add logo upload to Supabase Storage bucket `competitor-logos/` via the form
- [x] **T24** Wire `POST /api/competitors` and `PUT /api/competitors/[id]` route handlers
- [x] **T25** Wire `DELETE /api/competitors/[id]` (soft-delete: set `active = false`)

---

## Phase 6 — Knowledge Ingestion Pipeline

- [x] **T26** Build `lib/ingestion/scraper.ts` — fetch URL, extract readable text with `@mozilla/readability` + `cheerio`
- [x] **T27** Build `lib/ingestion/chunker.ts` — split text into 800-token chunks with 100-token overlap using `tiktoken`
- [x] **T28** Build `lib/ingestion/embedder.ts` — call OpenAI `text-embedding-3-small`, upsert chunks into `knowledge_chunks`
- [x] **T29** Build `lib/ingestion/pipeline.ts` — orchestrate scrape → chunk → embed for all competitor URLs; run up to 5 URLs concurrently
- [x] ~~**T30** Supabase Edge Function~~ → superseded: `/api/competitors/[id]/refresh` runs the pipeline directly with `maxDuration = 300`, no separate Edge Function needed
- [x] **T30b** Write `POST /api/competitors/[id]/refresh` Next.js route — marks status as `running`, runs the ingestion pipeline in-process, returns result
- [x] **T31** Build `RefreshKnowledgeButton` component — calls refresh endpoint, subscribes to Supabase Realtime on `competitors.refresh_status`, shows live progress and outcome
- [x] **T32** Add Serper integration `lib/serper/search.ts` — search by term, return top 10 URLs + snippets
- [x] **T33** Integrate Serper into pipeline: if `serper_terms` present, search → fetch top results → chunk → embed

---

## Phase 7 — Battle Card Generation

- [x] **T34** Build `lib/retrieval/search.ts` — vector similarity search in `knowledge_chunks` given a query string and optional `competitor_id`
- [x] **T35** Write the system prompt in `lib/claude/prompts.ts` — include: Genea brand voice, competitor positioning rules, persona/vertical/product framing instructions, JSON output schema for all 14 sections
- [x] **T36** Build `lib/claude/generate.ts` — assemble RAG context + Serper context + prompt; call Claude with streaming; parse JSON incrementally; emit section events
- [x] **T37** Write `POST /api/battle-cards/generate` SSE route — validate input, call generate, stream section events to client
- [x] **T38** Build the `WizardForm` component (`/battle-cards/new`) → built as 4 steps (Decision Maker, Vertical, Product Category, Competitor selector + Generate trigger combined) rather than 5
- [x] **T39** Build generation progress UI — implemented inline in `WizardForm`'s `generating` state (not a separate component); connects to the SSE stream, shows per-section completion status
- [x] **T40** Build `BattleCardPreview` component — render each of the 14 sections from the returned JSON; use markdown rendering for lists and tables

---

## Phase 8 — PDF Generation & Export

- [x] **T41** Install `@react-pdf/renderer`; create `lib/pdf/theme.ts` with Genea brand colors and typography
- [x] **T42** Build `BattleCardDocument` React PDF component — landscape A4, all 14 sections, Genea + competitor logos, auto-paginated
- [x] **T43** Handle multi-competitor layout in the feature comparison table (Genea + N competitor columns) — fixed `lib/claude/prompts.ts` to build the table header/sections dynamically per selected competitor instead of a hardcoded 2-column example
- [x] **T44** Write `POST /api/pdf` route — render PDF to buffer, upload to Supabase Storage `battle-cards/`, return signed URL
- [x] **T45** Wire "Export PDF" button on preview page — calls `/api/pdf`, saves URL to `battle_cards.pdf_url`, triggers download

---

## Phase 9 — History & Search

- [x] ~~**T46** `POST /api/battle-cards` route~~ → superseded: save happens inline in `lib/claude/generate.ts` (`.insert()` at the end of the SSE generation stream) rather than a separate endpoint
- [x] **T47** `GET /api/battle-cards` route — now supports `competitor_id`, `decision_maker`, `vertical`, `product_category`, `date_from`, `date_to`, `keyword` (FTS) via the `search_battle_cards` Postgres function (migration `0006_search_battle_cards.sql`)
- [x] **T48** Build `SearchFilters` component with dropdowns and date range picker — extracted from `HistoryTable` into `components/history/search-filters.tsx`; filter changes are debounced (300ms) and re-query `GET /api/battle-cards` server-side, including real FTS keyword search over generated content
- [x] **T49** Build `HistoryTable` component — paginated, sortable by date; columns: decision maker, vertical, product, competitors, date, PDF download link
- [x] **T50** Wire delete action on history table rows

---

## Phase 10 — Genea Knowledge Refresh

- [x] **T51** Seed Genea as a competitor record (`is_genea = true`) with the 3 knowledge URLs from PRD
- [x] **T52** Expose Genea in the admin competitors list with its own Refresh Knowledge button
- [x] **T53** Verify Genea chunks are correctly retrieved during generation (confirm `is_genea` competitor is always included in RAG query)

---

## Phase 11 — Polish & Hardening

- [ ] **T54** Add error boundaries and user-facing error states for: fetch failures, Claude timeout, PDF generation failure, no knowledge chunks
- [ ] **T55** Add loading skeletons to History table and competitor list
- [ ] **T56** Add empty-state messaging when a competitor has 0 knowledge chunks
- [ ] **T57** Validate logo upload on client + server (PNG/SVG only, max 2MB)
- [ ] **T58** Add a Supabase Realtime subscription to the battle card preview so PDF URL appears automatically once generation completes
- [ ] **T59** Smoke test full flow end-to-end: login → generate → preview → export PDF → history search

---

## Phase 12 — Admin: Users & Roles (added post-MVP)

- [x] **T60** Add an `AdminTabs` bar (`components/admin/admin-tabs.tsx`) inside `AdminLayout` — tabs for "Competitors" and "Users"
- [x] **T61** Build `/admin/users` page — list all users (email from `auth.users`, role + joined date from `profiles`)
- [x] **T62** Build `UserRoleToggle` component + `PUT /api/admin/users/[id]` route (admin-only) to flip a user between `admin`/`user`; blocks a user from changing their own role to avoid accidental lockout
- [ ] **T63** Verify in-browser: toggling a role actually changes what nav/pages that user can reach

---

## Blocked / Pre-work Required

| Blocker | Status | Blocks |
|---------|--------|--------|
| Genea brand hex colors + font | ✅ Resolved — see ARCHITECTURE.md §2 | T41, T42 |
| Genea logo file (SVG) | ✅ Resolved — `public/genea-logo.svg` | T42 |
| Auth provider | ✅ Resolved — email magic link via Supabase (switched from Google OAuth; Genea Workspace blocks Cloud Console access) | T13–T17b |
| Hosting platform | ✅ Resolved — Netlify + `@netlify/plugin-nextjs` | T05b |
| Supabase project created and credentials provided | ⏳ Pending | T05, T06–T11 |
| Google Cloud OAuth credentials | ⏳ Pending | T13 |
| Anthropic API key | ⏳ Pending | T36 |
| OpenAI API key (embeddings) | ⏳ Pending | T28 |
| Serper API key | ⏳ Pending | T32 |
