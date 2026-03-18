# PLAN.md — Nova Market Intelligence Platform

> Read this file at the start of every Claude Code session before writing any code.
> Update the "Status" fields as layers are completed.

---

## What this is

Nova is a B2B fintech sales intelligence tool used by value consultants and AEs at Backbase.
It generates pre-meeting briefs, qualification scores, ROI models, discovery narratives,
and competitive positioning for 35+ banking prospects across Europe and MENA.

The tool currently works as a curated intelligence system — bank profiles are largely
hand-authored with light automation layered on top. The goal of this plan is to evolve it
into a live intelligence platform: verified facts, sourced data, tracked changes, and
briefs that a rep can trust to be accurate the morning of a meeting.

---

## Current state (as of audit)

### What works well
- 4-layer architecture: UI → Context/State → API → Agent cascade
- Clean agent separation: meetingPrepAgent, discoveryStorylineAgent, landingZoneAgent, valueHypothesisAgent
- Signal ingestion pipeline with Claude classification
- SQLite WAL storage with 12 tables
- ROI engine with 5 levers and 3 scenarios
- Role-tailored meeting prep with persona mapping
- Brief feedback loop (sections_used + accuracy rating)

### Known structural issues (from audit)
1. **Dual-truth problem**: Bank data lives in both `src/data/banks.js` (bundled JS)
   AND SQLite. No reconciliation. Bundle goes stale after pipeline runs.
2. **Data-blob-in-relational-DB**: All substantive data lives in TEXT `data` JSON blobs.
   Can't SQL-query across banks for analytics. No relational integrity inside blobs.
3. **No entity identity**: Persons, signals, pain points, landing zones are embedded
   arrays with no PKs. Can't reference, link, or version them.
4. **No source lineage**: No per-field provenance. Can't tell where any fact came from
   or how old it is.
5. **No change detection**: Snapshot-only. Old values are overwritten, not versioned.
6. **BankPage.jsx god component**: 347KB, orchestrates everything. Needs decomposition
   but this is NOT in scope for this plan — frontend refactor is separate work.
7. **Signal blending fragility**: Live signals and embedded signals deduped by
   50-char string truncation. Collision-prone.

---

## Target architecture

```
┌─────────────────────────────────────────────────────┐
│  LAYER 0 (existing) — Ingestion pipeline            │
│  newsSignals, jobSignals, appRatings, stockData,    │
│  pressReleaseFeeds, signalClassifier                │
│  → No changes in this plan                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  LAYER 1 (new) — Source lineage + confidence tiers  │
│  Every fact carries: source_url, source_date,       │
│  confidence_tier (1/2/3), is_stale flag             │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  LAYER 2 (new) — Entity normalization               │
│  persons table, pain_points table,                  │
│  landing_zones table — all with stable PKs          │
│  Entity resolution: link aliases to canonical       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  LAYER 3 (new) — Change detection                   │
│  entity_history table: what changed, when, from     │
│  what to what. Delta feed per bank.                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  LAYER 4 (new) — Deal context integration           │
│  meeting_history, prior_objections, commitments     │
│  pulled into brief context alongside company intel  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  EXISTING — Agent cascade + Brief generation        │
│  meetingPrepAgent reads from enriched store         │
│  Briefs now annotated with confidence tiers         │
└─────────────────────────────────────────────────────┘
```

---

## Core data model (target)

### New tables to add (do not modify existing tables until migration is ready)

```sql
-- Persons: extracted from banks.data.key_decision_makers[]
CREATE TABLE persons (
  id TEXT PRIMARY KEY,           -- uuid
  bank_key TEXT NOT NULL,        -- FK → banks.bank_key
  canonical_name TEXT NOT NULL,
  role TEXT,
  role_category TEXT,            -- 'C-suite' | 'VP' | 'Director' | 'Manager'
  aliases TEXT,                  -- JSON array of known name variants
  linkedin_url TEXT,
  source_url TEXT,
  source_date TEXT,              -- ISO date
  confidence_tier INTEGER,       -- 1 | 2 | 3
  verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Pain points: extracted from banks.data.pain_points[]
CREATE TABLE pain_points (
  id TEXT PRIMARY KEY,
  bank_key TEXT NOT NULL,
  canonical_text TEXT NOT NULL,
  category TEXT,                 -- 'legacy_core' | 'cx' | 'ops' | 'regulatory' | 'revenue'
  source_url TEXT,
  source_date TEXT,
  confidence_tier INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Landing zones: normalized from 3 current locations
CREATE TABLE landing_zones (
  id TEXT PRIMARY KEY,
  bank_key TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  fit_score INTEGER,
  rationale TEXT,
  entry_strategy TEXT,
  source TEXT,                   -- 'curated' | 'ai_generated' | 'pipeline'
  source_url TEXT,
  confidence_tier INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Field provenance: per-field source tracking
CREATE TABLE field_provenance (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,     -- 'bank' | 'person' | 'signal' | 'qualification'
  entity_key TEXT NOT NULL,      -- bank_key or person id
  field_path TEXT NOT NULL,      -- e.g. 'operational_profile.total_assets'
  value TEXT NOT NULL,           -- current value as string
  source_type TEXT NOT NULL,     -- 'annual_report' | 'press_release' | 'news' | 'pipeline' | 'manual' | 'ai_inferred'
  source_url TEXT,
  source_date TEXT,              -- ISO date of the source document
  confidence_tier INTEGER NOT NULL, -- 1 | 2 | 3
  is_stale INTEGER DEFAULT 0,    -- bool: source_date > staleness threshold
  captured_at TEXT DEFAULT (datetime('now')),
  UNIQUE(entity_type, entity_key, field_path)
);

-- Entity history: change detection log
CREATE TABLE entity_history (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  field_path TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_at TEXT DEFAULT (datetime('now')),
  source TEXT,                   -- what triggered the change
  pipeline_run_id TEXT           -- FK → ingestion_log
);

-- Meeting history: deal context for brief enrichment
CREATE TABLE meeting_history (
  id TEXT PRIMARY KEY,
  bank_key TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  attendees TEXT,                -- JSON array of person names/roles
  key_topics TEXT,               -- JSON array
  objections_raised TEXT,        -- JSON array
  commitments_made TEXT,         -- JSON array
  outcome TEXT,                  -- 'progressed' | 'stalled' | 'lost' | 'won'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Confidence tier definitions (use these everywhere)

| Tier | Label | Meaning | Examples |
|------|-------|---------|----------|
| 1 | Verified | Primary source, ≤ 6 months old | Annual report, official press release, regulatory filing |
| 2 | Inferred | Secondary source or signal-based | Analyst report, job posting pattern, news article |
| 3 | Estimated | Derived, aged, or AI-generated without citation | Model output, >6 month old data, human estimate |

### Staleness thresholds by field type

```javascript
// scripts/config.mjs — add to existing config
export const STALENESS_THRESHOLDS = {
  financial_kpis: 180,        // days — annual report cycle
  leadership: 90,             // executive tenures change faster
  strategy: 180,
  app_ratings: 30,
  stock_data: 1,
  signals: 30,
  qualification_scores: 365,  // manual scores stay valid longer
  pain_points: 180,
};
```

---

## Layer build order

### Layer 1 — Source lineage + confidence tiers
**Status: COMPLETE (2026-03-18)**
**Depends on: nothing — can start immediately**

### Layer 2 — Entity normalization
**Status: COMPLETE (2026-03-18)**
**Depends on: Layer 1 complete (entities need provenance fields from day one)**
**Result: 107 persons, 75 pain points (79% categorized), 87 landing zones (32 sales + 55 implementation). Resolver wired and functional, 0 alias clusters in current curated data — will activate when person research introduces name variants. API returns normalized entities alongside existing data blob.**

### Layer 3 — Change detection
**Status: NOT STARTED**
**Depends on: Layer 1 (need field provenance to detect changes), Layer 2 partial (at minimum persons table)**

### Layer 4 — Deal context integration
**Status: NOT STARTED**
**Depends on: Layer 2 (persons table needed for attendee linking)**

---

## Per-layer specs

---

### Layer 1: Source lineage and confidence tiers

**Goal:** Every data record in the system carries a confidence tier and source attribution,
so the brief generator can distinguish verified facts from inferred signals.

**Inputs:** Existing SQLite data + ingestion pipeline outputs
**Outputs:** `field_provenance` table populated; brief generator reads tiers alongside facts

**Modules to build:**

1. `scripts/db.mjs` — add `field_provenance` and `entity_history` table creation to schema
   (append to existing `CREATE TABLE` block, do not modify existing tables)

2. `scripts/lib/provenanceWriter.mjs` (NEW FILE)
   - `writeProvenance(entityType, entityKey, fieldPath, value, sourceType, sourceUrl, sourceDate, confidenceTier)`
   - `bulkWriteProvenance(records[])` for pipeline batch writes
   - `markStale(entityType, entityKey, fieldPath)` — sets `is_stale = 1`
   - `runStalenessCheck()` — scans all provenance records, marks stale based on `STALENESS_THRESHOLDS`

3. `scripts/fetchers/stockData.mjs` — after writing stock data, call `writeProvenance()`
   with `source_type: 'pipeline_yahoo_finance'`, `confidence_tier: 1`

4. `scripts/fetchers/signalIngestion.mjs` — after classifying and storing each signal,
   call `writeProvenance()` with appropriate source_type and tier

5. `scripts/routes/ai.mjs` — when meetingPrepAgent is called, fetch relevant provenance
   records for the bank and include them in the context payload sent to the agent

6. `scripts/fetchers/meetingPrepAgent.mjs` — update system prompt to instruct Claude
   to annotate facts with their confidence tier when generating the brief
   (e.g., "(verified, 2024 annual report)" vs "(inferred from signals)")

7. `scripts/pipeline.mjs` — add `--provenance` flag that runs `runStalenessCheck()`
   as the final step of every pipeline run

**Do NOT touch:**
- `src/data/banks.js` or any other frontend data files
- `seed.mjs` seeding logic
- `BankPage.jsx` or any frontend components
- Existing table schemas (add new tables, never alter existing ones in this layer)
- `routes/data.mjs` read path (provenance is write-path only in this layer)

**Acceptance criteria:**
- `field_provenance` table exists and is populated after a pipeline run
- Every `live_signals` insert triggers a `writeProvenance()` call
- Every `live_stock` update triggers a `writeProvenance()` call
- `runStalenessCheck()` correctly flags records where `source_date` exceeds threshold
- Brief generator receives at least one confidence annotation alongside company facts
- No existing tests broken, no existing API endpoints changed

---

### Layer 2: Entity normalization

**Goal:** Persons, pain points, and landing zones become first-class entities with
stable PKs, enabling linking, resolution, and versioning.

**Inputs:** `banks.data` JSON blobs (existing embedded arrays)
**Outputs:** `persons`, `pain_points`, `landing_zones` tables populated;
API reads from new tables while maintaining backward-compatible response shape

**Modules to build:**

1. `scripts/db.mjs` — add `persons`, `pain_points`, `landing_zones` table creation

2. `scripts/lib/entityExtractor.mjs` (NEW FILE)
   - `extractPersons(bankKey, bankData)` — parse `key_decision_makers[]` → persons rows
   - `extractPainPoints(bankKey, bankData)` — parse `pain_points[]` → pain_points rows
   - `extractLandingZones(bankKey, bankData)` — merge 3 zone sources → landing_zones rows
   - Each extractor assigns a deterministic ID (hash of bank_key + canonical identifier)
     so re-running doesn't create duplicates

3. `scripts/lib/entityResolver.mjs` (NEW FILE)
   - `resolvePersonAliases(persons[])` — cluster name variants that likely refer to the
     same person (e.g. "M. Falck", "Malthe Falck", "Malthe Falck Jensen")
   - Use simple heuristics first: last name match + role match = likely same person
   - Write canonical_name + aliases[] back to persons table

4. `scripts/seed.mjs` — after seeding existing tables, call extractors to populate
   new entity tables. Wrap in same transaction.

5. `scripts/routes/data.mjs` — update `GET /api/banks/:key` to JOIN new entity tables
   and include persons[], pain_points[], landing_zones[] in response.
   Response shape must remain backward-compatible (same field names, same nesting).

6. `scripts/fetchers/personResearch.mjs` — after researching a person, write result
   to `persons` table (update existing row by canonical_name match, don't insert duplicate)

**Do NOT touch:**
- `src/data/banks.js` — do not remove embedded arrays yet (backward compat)
- `BankPage.jsx` or any frontend components
- `meetingPrepAgent.mjs` until entity tables are confirmed populated
- Existing table schemas

**Acceptance criteria:**
- All 35+ banks have persons rows in `persons` table after `seed.mjs` runs
- No person appears twice for the same bank (dedup by canonical_name + bank_key)
- `GET /api/banks/:key` response includes `persons` array with same shape as current
  `key_decision_makers` (no frontend changes required)
- `entityResolver` correctly clusters at least 2 known alias cases
- `landing_zones` table contains all zones from all 3 existing sources without duplicates

---

### Layer 3: Change detection

**Goal:** When pipeline runs update a value, the old value is preserved in
`entity_history`. A per-bank delta feed surfaces what changed since the last
time a rep viewed that bank.

**Inputs:** Pipeline writes, provenance layer (Layer 1)
**Outputs:** `entity_history` table; new API endpoint `GET /api/banks/:key/changes`

**Modules to build:**

1. `scripts/lib/changeWriter.mjs` (NEW FILE)
   - `recordChange(entityType, entityKey, fieldPath, oldValue, newValue, source, runId)`
   - Writes to `entity_history` table
   - Called by pipeline fetchers when overwriting an existing value

2. `scripts/fetchers/stockData.mjs` — before overwriting `live_stock`, read current
   value, compare, call `recordChange()` if different

3. `scripts/fetchers/appRatings.mjs` — same pattern for `app_rating_ios`/`app_rating_android`

4. `scripts/fetchers/signalIngestion.mjs` — when a signal is reclassified with a
   different score than a previous run, record the change

5. `scripts/routes/data.mjs` — add `GET /api/banks/:key/changes` endpoint
   - Returns `entity_history` rows for this bank, ordered by `changed_at` DESC
   - Optional query param: `?since=ISO_DATE` to filter by date
   - Optional query param: `?limit=N` (default 20)

6. `scripts/fetchers/meetingPrepAgent.mjs` — fetch recent changes (last 30 days)
   for the bank and include in context: "Since your last interaction with this account:
   [list of changes]". This becomes the "what changed" section of the brief.

**Do NOT touch:**
- Any frontend components
- Existing table schemas
- `seed.mjs` (history only tracks live changes, not seed data)
- Any agent other than meetingPrepAgent

**Acceptance criteria:**
- After two pipeline runs, `entity_history` contains at least one row showing
  a stock price change
- `GET /api/banks/:key/changes` returns valid JSON with correct shape
- Brief includes a "recent changes" section when history exists for the bank
- Old values are preserved — no data is deleted from entity_history
- Pipeline run ID is correctly linked in every history row

---

### Layer 4: Deal context integration

**Goal:** CRM relationship history and prior meeting notes are pulled into brief
context so the meeting prep feels specific to the relationship, not generic.

**Inputs:** meeting_history table (manual entry initially), persons table (Layer 2)
**Outputs:** Brief includes prior meeting summary, open objections, and commitments

**Modules to build:**

1. `scripts/db.mjs` — add `meeting_history` table creation

2. `scripts/routes/data.mjs` — add CRUD endpoints:
   - `POST /api/banks/:key/meetings` — create meeting record
   - `GET /api/banks/:key/meetings` — list meetings for bank, ordered by date DESC
   - `PUT /api/banks/:key/meetings/:id` — update meeting record

3. `scripts/fetchers/meetingPrepAgent.mjs` — fetch last 3 meeting records for bank
   and include in system prompt context. Instruct agent to reference prior discussions,
   address open objections by name, and acknowledge commitments made.

4. `src/data/api.js` — add client-side methods for meeting CRUD endpoints

5. `context/MeetingContext.jsx` — add meeting history state, expose via `useMeeting()`

**Do NOT touch:**
- `BankPage.jsx` tab structure (new Meeting History tab is separate work)
- Any data other than meeting_history and the agent prompt
- existing meeting feedback table (brief_feedback) — this is different

**Acceptance criteria:**
- A meeting record can be created and retrieved via API
- When a bank has 1+ meeting records, the brief includes a prior context section
- Prior context section correctly lists attendees, key objections, and commitments
- Brief generation does not break when no meeting history exists (graceful fallback)

---

## Conventions

**Tech stack:** Node.js ESM (`*.mjs`), SQLite via `better-sqlite3`, React frontend,
Claude API via `scripts/fetchers/claudeClient.mjs`

**Never use `require()`** — all backend files are ESM. Use `import`.

**New files go in:**
- Pipeline utilities → `scripts/lib/`
- Route handlers → `scripts/routes/`
- Data fetchers → `scripts/fetchers/`
- Frontend utilities → `src/utils/`

**Database rules:**
- Never alter existing table schemas — add new tables only
- All new tables get `created_at TEXT DEFAULT (datetime('now'))`
- All PKs are UUIDs (TEXT), generated with `crypto.randomUUID()`
- All JSON fields stored as TEXT, parsed on read via existing `parseRow()` pattern
- Use WAL mode (already set in `db.mjs`)

**Error handling:**
- All `async` functions in fetchers wrap in try/catch and log to `ingestion_log`
- Database writes use transactions for multi-row operations
- Never throw from a pipeline step — log the error and continue

**Naming conventions:**
- New table names: `snake_case`
- New module exports: `camelCase`
- Field names in new tables: `snake_case`
- Confidence tiers: always integers 1, 2, or 3 — never strings

**Before every session:**
- Read this file in full
- Check the Status fields to know where we are
- State which layer and which module you are working on
- Do not begin coding until you have stated your approach and I have confirmed it

---

## Open questions

1. **Dual-truth resolution:** `src/data/banks.js` and SQLite are currently both sources
   of truth. Long-term, the bundle should be generated from SQLite at build time.
   This is a significant refactor — not in scope for Layers 1-4, but needs a plan.

2. **CRM integration:** Layer 4 currently uses manual meeting entry. Future: pull from
   Salesforce or HubSpot API. Decide on CRM before building Layer 4 API shape.

3. **Person research automation:** `personResearch.mjs` does Claude + web search for
   executives. Once `persons` table exists (Layer 2), this should update persons rows
   automatically. Schedule: weekly refresh for active accounts.

4. **Confidence tier UI:** Briefs will carry confidence annotations after Layer 1.
   Frontend needs to render these (e.g., a small badge or tooltip per fact).
   Not in scope for Layers 1-4 — flag for frontend sprint after.

5. **Signal deduplication fix:** The 50-char string truncation dedup is fragile.
   Should move to full content hash (already used within single runs) across runs.
   Low risk to fix in Layer 3 alongside change detection work.
