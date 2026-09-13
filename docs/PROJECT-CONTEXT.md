# BlockWise — Complete Project Context

**Purpose of this document.** This is the single briefing that gives any AI assistant (or any new
human contributor) everything needed to work on BlockWise competently. Feed this document plus the
repository, and the assistant should have the full picture: what the project is, what exists today,
what the architecture is and why, who owns what, how work is done, what the non-negotiable
constraints are, and what mistakes to avoid.

**How to use it.** Paste this whole document at the start of a session, then state which feature you
are working on. The assistant should read `BlockWise.md` (the master plan), `docs/ownership.md`,
`docs/workflow.md` and `packages/contracts/` for specifics — this document tells it what those files
mean and how they fit together.

**Status of this document.** Written 2026-09-13, after Pre-Day-1 restructuring completed and before
Day 1 began. Sections marked **[VOLATILE]** change as the week progresses — verify against the repo
rather than trusting this document for those. Everything else is stable design intent.

---

# PART 1 — WHAT BLOCKWISE IS

## 1.1 The competition and the problem statement

BlockWise is built for **Smart India Hackathon (SIH) 2026**, against a problem statement about
**coordinated maintenance block planning for Indian Railways**.

A "block" is a scheduled period during which a section of railway track is taken out of service so
maintenance work can be performed on it. Blocks are expensive: while a section is blocked, trains
cannot use it. Every block is a trade-off between asset maintenance and train operations.

## 1.2 The actual problem being solved

Three engineering departments maintain the railway, and each raises its own block demands
independently:

| Department | Code | Maintains |
|---|---|---|
| Engineering | `ENGG` | Track, rails, ballast, sleepers, formation |
| Signal & Telecommunication | `S&T` / `SNT` | Signals, interlocking, axle counters, point machines |
| Traction Distribution | `TRD` | Overhead equipment (OHE), masts, feeders, traction substations |

Each department files its demand through **BDMS** (Block Demand Management System), independently of
the others. Meanwhile the data that should inform those decisions sits in separate systems:

| System | Holds |
|---|---|
| **TMS** | Track management — track condition, TQI, rail/ballast defects |
| **SMMS** | Signalling maintenance — signal health, interlocking, axle counters |
| **TDMS** | Traction distribution — OHE status, electrical defects, pantograph hits |
| **COA** | Control Office Application — corridor availability, Working Time Table, goods forecast |
| **BDMS** | Block demands raised by the three departments |

**Nobody sees all of it at once.** So blocks are granted serially: three departments needing work on
the same section on the same night take three separate blocks instead of one shared block. The result
is avoidable asset downtime and reduced infrastructure availability for train operations.

## 1.3 What BlockWise does

```
  MAINTENANCE REQUIREMENTS (BDMS)
+ TRACK / ASSET HEALTH (TMS · SMMS · TDMS)
+ TRAIN TIME TABLE (COA)
+ GOODS TRAIN FORECAST (COA)
+ CORRIDOR AVAILABILITY (COA)
                │
                ▼
   AUTOMATIC BLOCK PLANNING ENGINE
                │
   PRIORITISATION + COORDINATION + OPTIMISATION
                │
                ▼
        OPTIMISED BLOCK PLAN
                │
                ▼
  LESS DOWNTIME · HIGHER ASSET AVAILABILITY
```

The central claim of the demo, in one sentence:

> *Instead of departments independently requesting blocks, the system intelligently coordinates
> maintenance across departments and train operations to generate the most efficient block plan.*

## 1.4 The flagship demonstration case

This specific case is the heart of the demo and must survive every refactor. It is the thing an
evaluator is shown:

**`SEC-104` (Aligarh Jn – Tundla Jn), night of 12 September 2026.** Three departments file
independently through BDMS:

| Request | Dept | Activity | Requested | Duration |
|---|---|---|---|---|
| `BDMS/2026/BR-0412` | ENGG | Through rail renewal — 380 m | 01:45–04:30 | 165 min |
| `BDMS/2026/BR-0418` | TRD | OHE insulator replacement — mast 141/12 | 02:30–04:00 | 90 min |
| `BDMS/2026/BR-0423` | SNT | Point machine 24A overhaul | 03:00–04:15 | 75 min |

Worked serially that is **5.5 hours** of corridor time. The engine detects that they share a section
and a date, that none demands sole occupation, and merges them into **one block of 165 + 20 minutes**
— the longest task plus a handover allowance per additional department. The UI draws the before/after
comparison side by side so the saving is visible without explanation.

`SEC-104` is deliberately the worst section on the division: **48% health, CRITICAL**.

**The counter-case matters just as much:** requests marked `EXCLUSIVE` (e.g. `BR-0478`, where a BCM
track machine occupies the entire section) are deliberately **kept stand-alone**. This is what makes
the merge logic read as engineering judgement rather than a blanket "merge everything" rule. Never
remove the exclusive-occupation handling to make a demo look better.

## 1.5 Scale of the modelled division

- **20 sections** across **4 corridors** (`GC-1`, `NW-2`, `NE-3`, `SC-4`)
- **21 stations and junctions**
- **19 block requests** raised by the three departments
- Two user roles (see §7.4)

## 1.6 Domain glossary

| Term | Meaning |
|---|---|
| **Block** | A period during which a track section is taken out of service for maintenance |
| **Block window** | A time slot published by COA during which a block *may* be taken on a given section/date |
| **Section** | A stretch of track between two points, the unit of planning (`SEC-104`) |
| **Corridor** | A route made of multiple sections (`GC-1` = Golden Corridor 1) |
| **Block clubbing / merging** | Combining multiple departments' work into one shared block |
| **Power block** | OHE isolation — prerequisite for traction work, bars certain concurrent engineering work |
| **Exclusive occupation** | Work that requires sole possession of the section; cannot share a block |
| **Overdue** | Scheduled maintenance that has passed its due date |
| **TQI** | Track Quality Index |
| **WTT** | Working Time Table — the scheduled passenger/express train paths |
| **Disconnection** | Taking signalling equipment out of service for work |
| **Sanctioned block** | A block already approved through the existing process |
| **P.Way** | Permanent Way — the track itself; "Senior Section Engineer (P.Way)" is the staff role |
| **Rake** | A formed train set (used in goods forecast: "rakes/night") |
| **Chainage** | Distance measurement along the track from a datum point |

---

# PART 2 — CURRENT STATE OF THE PROJECT

## 2.1 Where the project stands right now **[VOLATILE]**

**Pre-Day-1 restructuring is complete and pushed to `main`. Day 1 has not started.**

Recent commits on `main`:

```
fb430c1  Add BlockWise.md — the master feature plan
036826b  Carve out docs/violations/ from the frozen docs/ boundary
dc0a036  Codebase Modified for Collaboration        ← the Pre-Day-1 foundation (R1–R8)
5bfd3e5  Check deployment
30a287d  Check deployment
cb0b445  Show real IST time and live backend connectivity in the topbar
3e023a0  Add deployment setup: Vercel frontend + Render backend skeleton
1ce2da9  Merge PR #3: BlockWise frontend prototype (milestone 1)
```

Verified green as of the last commit: **46 tests passing**, `npm run build` clean, dev views
confirmed absent from the production bundle, `backend/server.js` syntax-checks.

## 2.2 What the project was before Pre-Day-1 (important for understanding decisions)

A frontend-only prototype:

- One Vite/React SPA at the repo root
- Every record was a static JavaScript module in `src/data/`
- The planning engine (`src/lib/planningEngine.js`) lived **inside the frontend** and imported those
  data modules directly
- All state was in-memory React state — **nothing survived a page reload**
- `backend/` was a 69-line Express skeleton whose `POST /api/plan` returned 501
- **No tests, no test runner, no CI, no ownership boundaries, no written contracts**

Understanding this matters because most of the current architecture exists specifically to undo these
limitations without redesigning the UI, which was already correct.

## 2.3 What Pre-Day-1 delivered (R1–R8)

These were conditions that had to be true on Day 1 morning, not a feature list:

| Ref | Delivered |
|---|---|
| **R1** | Ownership boundaries written down (`docs/ownership.md`); each team given its own directories, including footholds inside other areas |
| **R2** | Cross-team contracts frozen (`packages/contracts/`) — envelope, record shapes, PlanningInput→PlanningOutput, ScoringInput→ScoringOutput, date/time/id conventions |
| **R3** | Team B's frozen fixture layer (`src/mocks/`), generated from real data + a real engine run, with priority scores baked in |
| **R4** | Planning engine extracted out of the frontend into `packages/engine/`, split into scorer and optimiser behind frozen interfaces |
| **R5** | Backend shell that auto-mounts each team's module without shared edits; auth placeholder in its final shape |
| **R6** | Dev-only views `/dev/data` (Team A) and `/dev/planner` (Team C), absent from production builds |
| **R7** | One test runner (Vitest), all dependencies installed up front, CI on every PR |
| **R8** | Nightly merge machinery — CODEOWNERS, integration log, PR template, tag convention |

**Critical point about R4:** it was *extraction and isolation only*. Behaviour before and after the
move is identical — same selection produces the same blocks, windows, metrics and reasoning strings.
No new scoring logic, no new optimisation rules, no new constraints. Those are Team C's Day-1-onward
work. If an assistant is tempted to "improve" the engine while doing something else, that is a scope
violation.

---

# PART 3 — REPOSITORY ARCHITECTURE

## 3.1 Full layout with ownership

```
BlockWise.md                    THE MASTER PLAN — source of truth for features, acceptance
                                conditions, endpoint availability. Read this first.

packages/
  contracts/          [FROZEN — integrator only]
    docs/envelope.md            response envelope, error shape, date/time/id conventions
    docs/records.md             Section, Defect, BlockRequest, Ticket, Block, Window, …
    docs/planning.md            PlanningInput → PlanningOutput
    docs/scoring.md             ScoringInput → ScoringOutput (internal to Team C)
    src/envelope.js             ok() / fail() helpers
    src/validate-planning.js    validatePlanningInput, validatePlanningOutput
    src/validate-scoring.js     validateScoringInput, validateScoringOutput
    src/index.js                re-exports
    test/validators.test.js     (7 tests)

  engine/             [TEAM C]
    src/index.js                runPlan(planningInput, { scorer }) — entry point
    src/scoring/
      index.js                  the frozen score(ScoringInput) → ScoringOutput interface
      placeholder-scorer.js     the deterministic placeholder (six-factor weighted sum)
      from-planning-input.js    projects PlanningInput → ScoringInput
    src/optimiser/
      index.js                  clustering, merging, the runPlanner body, reasoning strings
      windows.js                evaluateWindow, rankWindows
      metrics.js                computeMetrics
      time.js                   time helpers — DELIBERATELY duplicated from src/lib/format.js
    scenarios/                  [TEAM C] empty + README — C1 fills this on Day 1
    test/scoring.test.js        (7 tests)
    test/boundary.test.js       (3 tests) — proves the scorer/optimiser boundary is real
    test/optimiser.test.js      (6 tests)
    test/fixtures.js            shared test fixtures

backend/
  server.js           [FROZEN]  integrator-owned shell; auto-mounts modules/*; never edited to add a route
  lib/                [FROZEN]
    envelope.js                 ok() / fail()
    auth.js                     requireAuth, requireRole(role), verifyToken — final shape
    registerModules.js          readdirSync + dynamic import; Windows-safe
  modules/
    team-a/index.js   [TEAM A]  A3–A10 land here
    team-b/index.js   [TEAM B]  B2 (real authentication) — Team B's backend foothold
    team-c/index.js   [TEAM C]  C7 (POST /api/plan, POST /api/ml/score)
  test/server.test.js           (5 tests)
  package.json                  SEPARATE package — has its own node_modules

src/
  data/               [TEAM A/B]  today's mock datasets — read by scripts/build-fixtures.mjs
                                  until A1/A2 replace them with a real database
  mocks/              [FROZEN]    R3 fixtures — generated, never hand-edited
  dev/
    flag.js           [FROZEN]    DEV_VIEWS_ENABLED
    index.jsx         [FROZEN]    dev route registration — the ONE integration point in App.jsx
    team-a/           [TEAM A]    /dev/data — A3/A7/A11
    team-c/           [TEAM C]    /dev/planner — C4/C8/C11
  lib/
    planningInput.js  [TEAM B]    converts src/data/* into a PlanningInput
    engineStages.js   [TEAM B]    presentation-only stage list for the run animation
    format.js         [TEAM B]    date, week/month, duration, percentage helpers
  context/AppState.jsx [TEAM B]   single store: role, tickets, requests, plan, toasts
  components/         [TEAM B]    common/, layout/, visualizer/, dashboard/, planning/
  pages/              [TEAM B]    one file per route
  styles/             [TEAM B]    app.css (tokens + primitives), views.css
  test/
    fixtures.test.js            (17 tests) — every fixture validates against the contracts
    smoke.test.jsx              (1 test)

scripts/build-fixtures.mjs  [FROZEN]  regenerates src/mocks/ from src/data/ + a real engine run
docs/                       [FROZEN, except docs/violations/]
  ownership.md                    path → owner table, frozen list, footholds
  workflow.md                     daily routine, nightly integrator routine, violations convention
  integration-log.md              what shipped, what's newly available, which fixture to retire
  violations/         [ALL TEAMS] {FEATURE-ID}-violations.md — documented boundary exceptions
  PROJECT-CONTEXT.md              this document
.github/                    [FROZEN]
  workflows/ci.yml                Node 20, Postgres 16 service, fixtures check, test, build
  CODEOWNERS                      mirrors ownership.md — handles still placeholders
  pull_request_template.md        boundary checklist, acceptance evidence, per-team sections
vitest.config.js            [FROZEN]  one runner: node for packages/backend, jsdom for src/
```

## 3.2 Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Role selection (currently a picker, not real auth — B2 replaces this) |
| `/app/dashboard` | both | Divisional position at a glance |
| `/app/network` | both | Network visualiser — the schematic line diagram |
| `/app/tickets` | both | Inspection tickets |
| `/app/requests` | **admin** | Block requests register |
| `/app/engine` | **admin** | Block planning engine |
| `/app/schedule` | **admin** | Weekly / monthly block schedule |
| `/app/operations` | **admin** | Train operations (WTT, goods, COA) |
| `/dev/data` | dev builds only | Team A's proof surface |
| `/dev/planner` | dev builds only | Team C's proof surface |

## 3.3 How the backend module system works (important, frequently misunderstood)

`backend/lib/registerModules.js` scans `backend/modules/`, finds every `<team>/index.js`, dynamically
imports it, and mounts its default export with:

```js
app.use('/api', router);
```

**Routes mount directly under `/api`, NOT under `/api/team-a`.** A route defined as
`router.get('/sections', ...)` in `backend/modules/team-a/index.js` is served at `/api/sections`.

Each module is a standard Express router:

```js
import express from 'express';
const router = express.Router();
// ... routes here ...
export default router;
```

Startup log confirms what mounted: `Mounted modules: team-a, team-b, team-c`. There is also
`GET /api/_modules` returning the mounted list, used by `/dev/data`.

**This design exists to remove the single most likely nightly-merge conflict.** Adding an API area
never requires editing a file another team edits.

## 3.4 Always-on backend routes (frozen, do not change)

| Route | Returns |
|---|---|
| `GET /` | `{ status, service, version, time }` |
| `GET /health` | same — used by `/dev/data` reachability check and Render health check |
| `GET /api/version` | enveloped `{ service, version }` |
| `GET /api/time` | enveloped, with IST string — **the topbar live-clock depends on this** |
| `GET /api/_modules` | enveloped `{ mounted: [...] }` |

## 3.5 Package linking — no npm workspaces (deliberate)

`packages/contracts` and `packages/engine` are linked as `file:` dependencies:

- Root `package.json`: `"@blockwise/contracts": "file:packages/contracts"`, `"@blockwise/engine": "file:packages/engine"`
- `backend/package.json`: `"@blockwise/contracts": "file:../packages/contracts"`

**npm workspaces were deliberately NOT used.** Reason: Vercel builds from the repo root and Render
builds with `rootDir: backend`. Workspaces would break one or both. Do not "modernise" this into a
workspace setup — it will break deployment.

**Consequence:** `backend/` has its own `node_modules`. You must run `npm install` in **both** the
root and `backend/`.

---

# PART 4 — THE CONTRACTS

## 4.1 The response envelope (frozen)

Every real API response uses this shape:

```json
{ "ok": true, "data": { }, "error": null, "meta": {} }
```

On failure:

```json
{ "ok": false, "data": null,
  "error": { "code": "NOT_FOUND", "message": "Section not found", "details": {} },
  "meta": {} }
```

- `ok` — boolean, always present
- `data` — payload on success, `null` on failure
- `error` — `null` on success; `{ code, message, details }` on failure. `code` is
  SCREAMING_SNAKE_CASE (`NOT_FOUND`, `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`,
  `NOT_IMPLEMENTED`, `INTERNAL_ERROR`)
- `meta` — optional metadata, always an object, `{}` if unused

Team B's fixtures in `src/mocks/` follow this same envelope, so switching a screen from mock to live
is a data-source change only, never a response-shape change.

## 4.2 Conventions (frozen)

| Thing | Format | Example |
|---|---|---|
| Date | `YYYY-MM-DD` | `2026-09-12` |
| Time of day | `HH:MM` 24h IST | `01:45` |
| Window crossing midnight | `end < start` | `23:30`–`02:15` |
| Timestamp | ISO-8601 UTC | `2026-09-06T09:42:00.000Z` |
| Section | `SEC-###` | `SEC-104` |
| Track id | `TRK-<corridor>-<seq>-<UD\|DN>` | `TRK-GC1-04-UD` |
| Block request | `BDMS/YYYY/BR-####` | `BDMS/2026/BR-0412` |
| Inspection ticket | `INS-YYYY-####` | `INS-2026-0043` |
| Sanctioned block | `BLK-YYYY MM-##` | |
| Optimised block | `BLK-AI-###` (renumbered per run) | |
| Corridor | short code | `GC-1`, `NW-2`, `NE-3`, `SC-4` |
| Defect | `<SYSTEM>-DF-####` | `TMS-DF-2101` |

## 4.3 The additive-only rule (applies the whole week, not just Pre-Day-1)

**Fields may be ADDED to any contract. They may NEVER be renamed or removed.**

This is what makes rolling integration safe: Team C can enrich the plan response on Day 3 and Team B's
existing screen keeps working unchanged. Breaking this rule breaks whoever is consuming the field —
possibly while they are sitting next to you.

Only the integrator changes files in `packages/contracts/`, and only with all three leads informed.

## 4.4 Validators

`packages/contracts/src/` provides hand-written, zero-dependency validators returning
`{ valid, errors: [{ path, message }] }`:

- `validatePlanningInput`, `validatePlanningOutput`
- `validateScoringInput`, `validateScoringOutput`
- envelope/record helpers

No schema library was used deliberately — it keeps the package dependency-free so A11's valid/invalid
indicator and Team C's tests can use it anywhere.

---

# PART 5 — THE PLANNING ENGINE

## 5.1 Two stages, not one

This is the single most important architectural idea in the project:

```
Railway source data → Planning Input → ML scoring interface → urgency/criticality/priority scores
                                                                        │
                                                                        ▼
                                                                 Block Optimiser
                                                                        │
                                                                        ▼
                                                             Optimised block schedule
                                                                        │
                                                                        ▼
                                                       POST /api/plan → Team B UI
```

- **The scoring stage** answers: *how urgent and how critical is this maintenance work?*
- **The optimiser** answers: *given those priorities and every operational constraint, what block
  schedule should actually be created?*

The scoring stage is where a machine-learning model would belong. Defining that boundary now is what
allows a model to be added later without touching the optimiser.

## 5.2 The boundary, and why it is enforced by tests

Three properties are asserted by `packages/engine/test/boundary.test.js`:

1. **The optimiser has no import of, or call path into, `src/scoring/`.** It receives scores as given.
   It cannot compute or override a score.
2. **The optimiser never reads `scorerStatus`.** It must behave identically regardless of what is
   behind the scoring interface.
3. **Substituting a different stub scorer changes the plan with zero optimiser changes.** This is the
   test that proves the boundary is real rather than decorative.

Additionally: the engine **imports nothing from `src/`, `backend/`, or a database.** `src/optimiser/time.js`
duplicates helpers from `src/lib/format.js` **deliberately** — the engine may not import the frontend.
Do not "DRY this up"; the duplication is the boundary.

## 5.3 The placeholder scorer — current implementation

A transparent deterministic weighted sum of six factors (carried over unchanged from the prototype):

| Factor | Weight | Source |
|---|---|---|
| Criticality of activity | 0.24 | request |
| Urgency raised by department | 0.20 | request |
| Safety impact | 0.16 | request |
| Asset-health deficit (100 − health) | 0.14 | track master |
| Overdue status | 0.14 | overdue register |
| Impact on asset availability | 0.12 | request |

Bands: **CRITICAL** ≥ 85 · **HIGH** ≥ 70 · **MEDIUM** ≥ 50 · **LOW** below.

Each factor's raw value, weight and contribution is reported in `factors[]`, and the contributions
reconcile with the total. This is what makes the score defensible in front of a judge.

## 5.4 ScoringOutput shape

```
scorerStatus  { implementation: "deterministic-placeholder", trained: false,
                model: null, version: "placeholder-0.1",
                note: "Placeholder for a future ML scorer. Not a trained ML model." }
scores[]      { requestId, urgency, criticality, priority, band,
                factors[] { key, label, value, weight, contribution, note },
                explanation { summary, featureContributions[] },
                confidence }
unscored[]    { requestId, reason }
```

- `urgency`, `criticality`, `priority` — integers 0–100, higher = more pressing
- `band` is a **presentation convenience** derived from priority; **the optimiser uses the number,
  never the band**
- `explanation.featureContributions[]` and `confidence` are **reserved slots** for a future model,
  left empty/null by the placeholder
- A request that cannot be scored goes in `unscored[]` with a reason. It is **never silently given a
  default**; it is left out of the plan and reported in `PlanningOutput.unscheduled[]` with the reason
  carried through, so a missing score is visible rather than invented

## 5.5 Optimiser behaviour (as extracted — Team C extends this)

**Merging:** requests clustered by `section × date`. Compatible requests in a cluster become one block
lasting `longest task + 10 min × (departments − 1)` instead of the serial sum. `EXCLUSIVE` requests
are split back out into their own blocks.

**Window selection:** every COA window for the section is scored by a disruption index:

```
trafficLoad × 2 + corridor density
```

where traffic load weights **express ×4, passenger ×3, goods ×1.5**, counted over the period the
block would *actually occupy* (not the whole window), plus penalties:

- `Restricted` window: **+18**
- `Not preferred` window: **+40**
- Window too short: **+60**

The lowest-disruption window that fits wins; the runner-up is reported in the UI with its reason. If
nothing fits, the block is extended and the plan says so explicitly.

**Metrics:** before/after block count and block hours, hours saved, downtime reduction %,
asset-availability gain, train paths protected, merged blocks, combined departmental activities.

## 5.6 Entry point

```js
import { runPlan } from '@blockwise/engine';
const output = runPlan(planningInput);                          // placeholder scorer by default
const output2 = runPlan(planningInput, { scorer: otherScorer }); // substitution
```

---

# PART 6 — THE HONESTY CONSTRAINT (NON-NEGOTIABLE)

This section is not stylistic. It is a hard project rule with its own tests, and it exists because
presenting a deterministic placeholder as a trained model would be dishonest to the evaluators.

## 6.1 The rule

**No trained ML model exists in this project.** Behind the scoring interface sits a deterministic
placeholder, clearly labelled as such in every response it returns.

Therefore:

- **No model is trained. No training data is collected.**
- **No accuracy, precision, recall, F1, or any other model-performance figure may be claimed
  anywhere** — not in the UI, not in `/dev/planner`, not in proof documents, not in the submission.
- `confidence` is a **reserved slot**. The placeholder returns it as `null`, always. Nothing may
  calculate, estimate, or imply a confidence value.
- Every scoring response declares `scorerStatus`. Anything rendering or reporting a score must be
  able to show that status.
- Where the implementation is named anywhere, it is named as **a placeholder for a future ML scorer**.

## 6.2 What was relabelled (already done, do not revert)

During Pre-Day-1 a text-only honesty pass was applied:

| Was | Now |
|---|---|
| "AI priority score" | priority score |
| "AI Prioritisation Model" | the placeholder scorer |
| `source: 'AI-OPTIMISED'` | `source: 'OPTIMISED'` |
| Stage 3 copy: "AI prioritisation model" | the placeholder scorer |

Files affected: `PlanningEnginePage.jsx`, `BlockDetail.jsx`, `RequestDetail.jsx`, `plans.js`,
`SchedulePage.jsx`, `engineStages.js`.

> **Note:** the README's demo-path section still contains some older "AI priority" phrasing in its
> narrative text. That is documentation drift, not a contract — the code and UI are relabelled.

## 6.3 What IS claimed, honestly

The project legitimately demonstrates **the optimisation**, not a model:

- Three departments' work merged into one block, with the real time saving
- Window selection that genuinely reasons over train traffic
- Constraint handling (exclusive occupation, power blocks, resource conflicts)
- A complete, readable reasoning trail for every decision

That is a strong, true claim. It does not need an ML embellishment.

## 6.4 The ML story that IS true

The project defines and exercises a **frozen scoring interface** such that a trained model can later
replace the placeholder — possibly as a separate service in another language — **without the optimiser
changing at all**. That boundary is proven by a test. "We built the seam where the model goes, and
proved it is a real seam" is both honest and architecturally impressive.

---

# PART 7 — TEAMS, OWNERSHIP AND ROLES

## 7.1 The four roles

| Team | Name | Owns | Proof surface |
|---|---|---|---|
| **A** | Data & Track Intelligence | Database, schema, railway data models, TMS/SMMS/TDMS/COA/BDMS integration, normalisation, all data APIs | `/dev/data` |
| **B** | Product Application | UI, navigation, visualisation, planning screens, tickets, authentication, authorisation, app state, the data access layer, loading/error behaviour | `/app/*` — the real product |
| **C** | Planning & Optimisation | The engine, the scoring interface + placeholder, the optimiser, constraints, clubbing, train-aware scheduling, explainability, synthetic scenarios, `POST /api/plan`, daily proof material | `/dev/planner` |
| **4th** | Integrator | Pre-Day-1 restructuring; Days 1–3 nightly merges, conflict resolution, keeping `main` healthy, the integration log; Day 4+ coordination. **The only person who may change a frozen contract.** | The nightly green `main` |

## 7.2 A critical clarification about how teams work

A common misreading: *"Teams A and C only work in dev views until Day 3."* **That is wrong.**

- **Teams A and C build real features** — a real database, real endpoints, a real planner. The dev
  views (`/dev/data`, `/dev/planner`) are just where they *prove* their real work exists, without
  disturbing Team B's product UI.
- **Team B builds the actual website users see**, integrating A's and C's real endpoints as they ship
  — one endpoint at a time, not all at once.
- **The integrator** merges all three PRs every night and verifies everything is wired together.

**A and C never use mocks.** The frozen mocks exist only for Team B, and only for endpoints that do
not exist yet.

## 7.3 Ownership table (from `docs/ownership.md`)

| Path | Owner |
|---|---|
| `backend/server.js`, `backend/lib/` | **Integrator** (frozen) |
| `backend/modules/team-a/` | Team A |
| `backend/modules/team-b/` | Team B (auth foothold in the backend) |
| `backend/modules/team-c/` | Team C |
| `packages/contracts/` | **Integrator** (frozen, additive-only) |
| `packages/engine/` incl. `scenarios/` | Team C |
| `src/data/` | Team A / Team B |
| `src/mocks/` | **Integrator** (frozen, generated) |
| `src/dev/flag.js`, `src/dev/index.jsx` | **Integrator** (frozen) |
| `src/dev/team-a/` | Team A |
| `src/dev/team-c/` | Team C |
| `src/lib/planningInput.js`, `src/lib/engineStages.js` | Team B |
| `src/App.jsx`, `src/context/`, `src/pages/`, `src/components/` | Team B |
| `scripts/build-fixtures.mjs` | **Integrator** (frozen) |
| `docs/`, `.github/` | **Integrator** (frozen) |
| **`docs/violations/`** | **Every team** — the one exception to `docs/` being frozen |

**Frozen for the whole week** (only the integrator edits, and only with all three leads informed):
`packages/contracts/**`, `backend/server.js`, `backend/lib/**`, `src/mocks/**`, `src/dev/flag.js`,
`src/dev/index.jsx`, `scripts/**`, `.github/**`, `docs/**` (except `docs/violations/`).

## 7.4 Application user roles (product-level, not team-level)

| | Admin — *Sr. Divisional Operations Manager* | Staff — *Senior Section Engineer (P.Way)* |
|---|---|---|
| Dashboard | ✔ | ✔ |
| Network Visualiser & track records | ✔ | ✔ |
| Inspection tickets | ✔ | ✔ |
| Block Requests | ✔ | ✖ |
| Block Planning Engine | ✔ | ✖ |
| Block Schedule | ✔ | ✖ |
| Train Operations | ✔ | ✖ |

The Block Planning group is **hidden from the sidebar** for staff *and* **guarded at the route level**
— a staff user typing `/app/engine` gets a "restricted module" screen. Both are required; hiding alone
is not authorisation.

---

# PART 8 — THE PLAN: DAYS 1–4

Full detail is in `BlockWise.md`. This is the orientation summary.

## 8.1 Shape of the week

```
Days 1–3   parallel development + rolling feature-level integration
           nightly batch merges by the integrator
Day 4+     final end-to-end integration; normal collaborative development
           (PR/nightly-merge process ENDS here)
Then       testing, deployment, stabilisation — no new features
```

**Day 4 may extend into Day 5.** Getting the complete real chain working matters more than finishing
on a particular day. Do not cut integration short to protect the schedule.

## 8.2 The feature list

**Team A — Data & Track Intelligence**

| Id | Day | What |
|---|---|---|
| A1 | 1 | Railway database and schema (windows **per section per date**, not an undated template) |
| A2 | 1 | Seeded railway dataset — reproducible, fixed order, identical for every developer |
| A3 | 1 | First read endpoints (`GET /api/sections`, `GET /api/network`) + `/dev/data` v1 |
| A4 | 2 | Track/section/network APIs (`/api/sections/:id`, `/search`, filters) |
| A5 | 2 | Defect, maintenance requirement and track-health APIs |
| A6 | 2 | Train operations and block-window availability APIs |
| A7 | 2 | `/dev/data` v2 — live browser over everything built so far |
| A8 | 3 | Source-system integration layer (TMS/SMMS/TDMS/COA/BDMS, each in its native shape) |
| A9 | 3 | Block request, ticket and block APIs — **the write paths** |
| A10 | 3 | `GET /api/planning-input` — the critical hand-off to Team C |
| A11 | 3 | `/dev/data` v3 — sync status + Planning Input valid/invalid indicator |

**Team B — Product Application**

| Id | Day | What |
|---|---|---|
| B1 | 1 | Data access layer with **per-endpoint** mock/live switching (not a global flag) |
| B2 | 1 | Real authentication — server-side credential check, session token, sign-out |
| B3 | 1 | Authorisation, roles, restricted access (hidden **and** route-guarded) |
| B4 | 2 | Network and track visualisation — switches to real `/api/sections`, `/api/network` |
| B5 | 2 | Track detail and record experience |
| B6 | 2 | Inspection and defect ticket experience |
| B7 | 3 | Block planning experience — **calls the real `POST /api/plan` from the day it is built** |
| B8 | 3 | Schedule, dashboard and operations experience |
| B9 | 3 | Application robustness — loading, error, empty states, retry, session expiry |

**Team C — Planning & Optimisation**

| Id | Day | What |
|---|---|---|
| C1 | 1 | Planning contract + synthetic scenario library |
| C2 | 1 | ML scoring interface (in-process Day 1; HTTP Day 2) + deterministic placeholder |
| C3 | 1 | Basic planner with cross-department block clubbing — the two stages joined |
| C4 | 1 | Day-1 proof of concept + `/dev/planner` v1 |
| C5 | 2 | Activity compatibility, exclusive occupation, power-block rules |
| C6 | 2 | Resource conflicts and departmental coordination |
| C7 | 2 | `POST /api/plan` over HTTP (+ `POST /api/ml/score`, internal) |
| C8 | 2 | Day-2 proof + `/dev/planner` v2 (constraint toggles) |
| C9 | 3 | Train-aware window selection — **additive fields only** |
| C10 | 3 | Multi-day scheduling and explainability — **additive fields only** |
| C11 | 3 | Day-3 proof + `/dev/planner` v3 (multi-day view) |

**Integration (Day 4+)**

| Id | What | Who |
|---|---|---|
| I1 | Real Planning Input feeding the real planner | A + C |
| I2 | The last fixtures retired | A + B |
| I3 | The real chain through the planning experience | B + C |
| I4 | Integration proof of concept on real data | C |

## 8.3 The endpoint availability catalogue (the contract between teams)

**"Ships Day N" → "Available Day N+1".** An endpoint shipped today merges tonight and is in the
consumer's hands tomorrow morning. This is what makes integration continuous while the nightly merge
model stays intact: nobody depends on unmerged work, and nobody waits three days.

| Endpoint(s) | Owner | Ships | Available | Consumer | Fixture retires |
|---|---|---|---|---|---|
| `GET /api/sections`, `GET /api/network` | A (A3) | Day 1 | Day 2 | B4, B5 | Day 2 |
| `GET /api/sections/:id`, `/search`, filters | A (A4) | Day 2 | Day 3 | B5, B4 | Day 3 |
| `GET /api/defects`, `/overdue`, `/sections/:id/health` | A (A5) | Day 2 | Day 3 | B5, B6, B8 | Day 3 |
| `GET /api/operations/*` | A (A6) | Day 2 | Day 3 | B5, B8 | Day 3 |
| `POST /api/plan` | C (C7) | Day 2 | Day 3 | B7 | Day 3 |
| `POST /api/ml/score` | C (C2/C7) | Day 2 | — | **Team C's own optimiser only** | n/a |
| `GET/PATCH /api/requests`, `/api/tickets`, `GET /api/blocks` | A (A9) | Day 3 | Day 4 | B6, B7, B8 | Day 4 |
| `GET /api/sources`, `/integrations/*` | A (A8) | Day 3 | Day 4 | B8 | Day 4 |
| `GET /api/planning-input` | A (A10) | Day 3 | Day 4 | **Team C (I1)** | Day 4 |
| Enriched plan fields (train-aware, multi-day, reasoning) | C (C9, C10) | Day 3 | Day 4 | B7, B8 | none needed (additive) |

**Team B never calls `POST /api/ml/score`.** Scoring is Team C's internal stage. B calls
`POST /api/plan` and receives the final plan with scores already carried in it.

**Screens may be part real and part mocked, and that is expected.** B7's planning run is real from
Day 3 while its request register is still mocked until Day 4. There is no rule that a screen must
switch over all at once.

## 8.4 The rules that make parallel work possible

Rules 1, 2 and 5 apply to **Days 1–3 only**. From Day 4, same-day cross-team dependencies are normal.

1. **No same-day cross-team dependency.** You may consume anything already in `main`; you may not
   consume something another team is writing today.
2. **A dependency must already be in `main` from a previous night**, or be represented by a
   contract-shaped mock.
3. **Contracts are additive-only.** (Whole week.)
4. **Frozen files stay frozen.** (Whole week.)
5. **Stay inside your boundary.** A PR touching another team's area is returned, not debated.
6. **Switch off a mock as soon as its endpoint is available.** A mock still in use after its
   availability day is **a defect, not a choice**. Each carried-forward mock is an integration
   surprise deferred to the worst possible moment.

---

# PART 9 — WORKFLOW

## 9.1 Every team, every morning (Days 1–3)

1. Pull the previous night's merged `main` (or that night's `night-N-green` tag).
2. `npm install` at the root **and in `backend/`**; reset the local database to the seeded state
   (once A1/A2 exist).
3. `npm test`. **If it fails, report it and stop** — do not start work on a broken base, and do not
   debug someone else's failure inside your own branch.
4. Read `docs/integration-log.md` for last night's newly available endpoints. **If one replaces a
   fixture you are using, switching to it is part of today's work, not something to defer.**
5. Create a branch for today's work.
6. Implement only your team's features for today.
7. `npm test`, including new tests for today's work.
8. Verify each feature against its acceptance condition in `BlockWise.md` and put the **evidence** in
   the PR.
9. Confirm you touched nothing outside your ownership boundary.
10. Push and raise the PR using `.github/pull_request_template.md`.

**Do not build on another team's unmerged pull request.**

**Team A / Team C additionally:** if today's features expose an endpoint another team is waiting for,
say so in the PR description — that line becomes tonight's integration-log entry.

**Team C additionally:** the day's proof document and visual must be regenerated **from a real run**
and included in the PR. A Team C PR without the day's proof is incomplete.

**Team B additionally:** state which fixtures were retired today and which remain.

## 9.2 Test-first discipline

For every feature, **the test exists before the implementation that satisfies it.** This is not
ceremony — it is how you prove you understood the acceptance condition before writing code against it,
and it is what makes the PR's "acceptance evidence" section true rather than asserted.

1. Read the feature's acceptance condition in `BlockWise.md`.
2. Write a failing test that encodes that condition.
3. Run it; confirm it fails **for the right reason** (not a typo).
4. Only then implement, iterating until it passes.

## 9.3 Verification is different for each team (and this matters)

The acceptance conditions are deliberately behavioural, not "the code runs":

- **Team A** — change a value at the source, run the real data load or sync, and confirm the changed
  value appears in `/dev/data` read from the database. *Proving the data is real matters more than
  proving an endpoint returns 200.*
- **Team C** — run the real engine against a controlled scenario and inspect the actual output.
  Inspect scoring output and optimiser output **separately**, so it is always visible which stage
  produced which number. *Proving the optimisation happened matters more than proving the code ran.*
- **Team B** — run the frontend and perform the actual user interaction. For a switched-over screen
  the check is stronger: **change a value in the database, reload the screen, see the new value** —
  which proves the screen is genuinely on the real endpoint and not silently still on a mock.

**Avoid any check that only proves "the code runs."**

## 9.4 Recording a boundary or contract exception

If a feature genuinely requires touching a file outside your ownership boundary or a frozen area:

1. Make the **minimum** change required.
2. Record it in `docs/violations/{FEATURE-ID}-violations.md` (create the file if it does not exist —
   this path is the one exception to `docs/` being frozen).
3. For each entry record: the file/area touched, the rule or boundary crossed, what changed, why it
   was necessary, how it relates to the feature, why it could not reasonably be avoided, and why it
   was kept to minimum scope.
4. Surface it in the PR's Ownership section.

**Never make the change silently.** This file is what the integrator reads before deciding whether to
merge the cross-boundary change as-is.

## 9.5 The integrator's nightly routine (Days 1–3)

1. Collect the three PRs; confirm each stayed inside its boundary. A conflict inside a frozen file
   means a boundary was crossed — **ask the author rather than guessing**.
2. Merge one at a time, running `npm test` after each, so it is always clear which one broke something.
3. Full suite on the merged result, with a clean reseeded database.
4. Open the application and check **all three surfaces** load: the product UI, `/dev/data`,
   `/dev/planner`.
5. Confirm Team C's proof for the night is present and regenerates.
6. Record in `docs/integration-log.md` which endpoints became available tonight and which team should
   switch off which fixture tomorrow. **This entry is what makes continuous integration actually
   happen** — without it, Team B has no reliable signal and quietly stays on mocks.
7. Tag: `git tag night-N-green && git push origin night-N-green`.
8. Tell the team `main` is green, which tag to start from, and what is newly available.

**If a PR breaks `main`, revert that PR and tell its author. Never leave `main` broken overnight** —
it costs three teams their next morning.

## 9.6 Day 4 onward

The PR-and-nightly-merge process **ends**. Teams work together on one integrated system: change code
directly, test as they go, resolve cross-team issues in real time.

What still holds:

- Contracts remain additive-only.
- Each team still owns and is accountable for its own area, even though anyone may now touch what
  integration requires. A mismatch is fixed on the side that owns it.
- The integrator **coordinates** (keeps the system runnable, tracks what is blocking whom, keeps the
  integration log) rather than gatekeeping merges.
- Team C still produces proof material (I4), now on real integrated data.
- **Keep the system runnable at all times.**

---

# PART 10 — THE AI-ASSISTED WORKFLOW (how work actually gets done)

The team works through **disciplined prompting**: structured context, explicit planning before
implementation, tests before code. Each contributor works one feature at a time in a fresh session.

## 10.1 The task sequence

| Task | What |
|---|---|
| 1 | Start from latest `main` — pull, install (root **and** `backend/`), `npm test`. If it fails, STOP and report. |
| 2 | Create the branch: `git checkout -b team-{a\|b\|c}/{FEATURE-ID}-{short-name}` |
| 3 | **Give the AI the feature.** Provide `BlockWise.md`, `docs/ownership.md`, `docs/workflow.md`, `packages/contracts/`, this document, and the feature requirement. Ask it to determine scope, ownership, allowed files, frozen areas, contracts to use, and the acceptance condition — **and to produce a plan without writing code.** |
| 4 | **Write the test first.** The test must directly verify the acceptance condition. Run it, see it fail, confirm the failure is for the right reason. |
| 5 | **Implement** — only this feature. No adjacent features, no invented contracts, no unrelated refactoring. Then `npm test`. |
| 6 | **Manual verification.** Ask the AI for a feature-specific checklist: exactly where to go, what to click, which record to inspect, what correct looks like, what a problem looks like. Then actually do it. |
| 7 | **Final automated verification** — `npm test`, `npm run build`, `git status`, `git diff --stat main`; ownership check; contract check; acceptance condition check. |
| 8 | **Pre-commit safety review** — only this feature? boundaries respected? contracts unchanged? no invented fields? violations recorded? FINAL STATUS: PASS / STOP. |
| 9 | **Commit** — message `{FEATURE-ID}: {short description}`, attributed to the contributor's own git identity. |
| 10 | **Push** — `git push -u origin HEAD` |
| 11 | **Prepare the PR** — title, description, tests, acceptance evidence, ownership (using the violations file if one exists), notes for other teams. |
| 12 | **Create the PR on GitHub** from the contributor's own account, and report back: PR link, feature, tests, build, ownership status. |

## 10.2 Rules for the AI in this workflow

- **Never write code before the plan is approved.**
- **Never implement before the failing test exists.**
- **Never touch another team's files or a frozen file silently.** Identify it, explain why it is
  necessary, record it in `docs/violations/{FEATURE-ID}-violations.md`.
- **Never invent an endpoint, contract field, or data shape.** If Team B appears to need something not
  in the availability catalogue, that is escalated to the integrator the same day — not invented.
- **Never implement an adjacent feature** because it seems convenient.
- **Never do unrelated refactoring** inside a feature branch.
- **Stop and report** anything unexpected rather than improvising.

## 10.3 Model selection guidance

Planning benefits from the strongest available model — a bad plan (missing a contract detail,
misjudging a boundary) is more expensive than slow implementation. Implementation can run on a
mid-tier model effectively, since the plan has already removed the ambiguity.

---

# PART 11 — ENVIRONMENT AND SETUP

## 11.1 Prerequisites

- **Node 18+** (developed on Node 24; CI runs Node 20)
- Git configured with the contributor's own `user.name` / `user.email`
- Push access to the repository (collaborator with write permission), plus working push credentials
  (PAT in the credential manager, or SSH)

## 11.2 First-time setup

```bash
git clone https://github.com/SaluguSwarup/BlockWise.git
cd BlockWise

npm install                        # root — frontend, tests, contracts, engine
cd backend && npm install && cd ..  # backend — express, cors, pg (SEPARATE package)
```

**Both installs are required.** `backend/` is not an npm workspace; it has its own `node_modules`.

## 11.3 Local environment file

Create `.env.local` at the root (gitignored) so `/dev/data`'s reachability check has something to ping:

```
VITE_API_URL=http://localhost:4000
```

Without this, `/dev/data` will report the backend as unreachable and it looks like a broken feature
when it is only missing config.

## 11.4 Running

```bash
npm run dev            # frontend  → http://localhost:5173  (dev views enabled automatically)
cd backend && npm start # backend  → http://localhost:4000
```

Other scripts:

```bash
npm run build      # production bundle → dist/
npm run preview    # serve the built bundle
npm test           # full suite, one run
npm run test:watch # watch mode
npm run fixtures   # regenerate src/mocks/ (integrator-owned; safe to run locally to check)
```

## 11.5 The development auth token

`backend/lib/auth.js` provides the auth placeholder in its **final shape**: `requireAuth`,
`requireRole(role)`, and a swappable `verifyToken()` that Team B replaces in B2 without any other
module changing.

Until B2 ships, one documented dev token maps to an ADMIN identity:

```
Authorization: Bearer dev-any-team
```

Override with the env var `BLOCKWISE_DEV_TOKEN`. Example:

```bash
curl -s http://localhost:4000/api/sections -H "Authorization: Bearer dev-any-team"
```

`requireAuth` returns **401 `UNAUTHORIZED`** without a valid token; `requireRole` returns
**403 `FORBIDDEN`** if the role does not match. Teams A and C can protect routes from Day 1 using
these, and nothing changes when real sessions arrive.

## 11.6 Dev views

`src/dev/flag.js`:

```js
export const DEV_VIEWS_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_VIEWS === 'true';
```

- Enabled automatically under `npm run dev`
- A normal production build excludes the entire subtree — `src/dev/index.jsx` builds an empty route
  array and Vite's dead-code elimination drops the views and their chunks from `dist/`
- Verify with: `npm run build && grep -r "dev/planner\|dev/data" dist/` → must return nothing

`/dev/data` is Team A's; `/dev/planner` is Team C's. **Team B has no dev view** — Team B's proof
surface is the real product UI.

## 11.7 Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | frontend | Base URL of the API. Blank = frontend-only. |
| `VITE_ENABLE_DEV_VIEWS` | frontend | `true` forces dev views into a production-style build |
| `PORT` | backend | Defaults to 4000 |
| `FRONTEND_ORIGIN` | backend | CORS origin; defaults to `*` |
| `BLOCKWISE_DEV_TOKEN` | backend | Overrides the dev bearer token |

---

# PART 12 — TESTING

## 12.1 The runner

**Vitest**, one config at the root (`vitest.config.js`):

- `node` environment by default — for `packages/**` and `backend/**`
- `jsdom` for `src/**` (via `environmentMatchGlobs`)
- Include globs: `packages/**/test/**/*.test.js`, `backend/**/test/**/*.test.js`,
  `src/**/test/**/*.test.{js,jsx}`

Available libraries: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`,
`supertest` (root devDependencies — usable from backend tests too).

## 12.2 Current suite **[VOLATILE]** — 46 tests across 7 files

| File | Tests | Proves |
|---|---|---|
| `packages/contracts/test/validators.test.js` | 7 | The sample PlanningInput validates; a deliberately broken one reports the reason |
| `packages/engine/test/scoring.test.js` | 7 | Determinism; factor contributions reconcile with the total; every response carries `scorerStatus` and `confidence: null` |
| `packages/engine/test/boundary.test.js` | 3 | The optimiser has no access to the scoring code path; a second stub scorer changes the plan with zero optimiser changes |
| `packages/engine/test/optimiser.test.js` | 6 | The extracted optimiser reproduces the pre-extraction result |
| `src/test/fixtures.test.js` | 17 | Every fixture parses and validates against the contracts |
| `src/test/smoke.test.jsx` | 1 | The app renders |
| `backend/test/server.test.js` | 5 | `/health` 200; envelope shape; all three modules auto-mounted; `requireAuth` 401 without a token |

These are **boundary proofs, not feature tests**. They exist to make architectural properties
non-negotiable. If one starts failing, the architecture has drifted — investigate rather than adjust
the test.

## 12.3 CI (`.github/workflows/ci.yml`)

Runs on push to `main` and on every PR:

1. Node 20; a **Postgres 16 service container** is provisioned (ready for Team A's Day-1 tests;
   nothing consumes it yet — `blockwise`/`blockwise`/`blockwise` on 5432)
2. `npm install` at root and in `backend/`
3. **Regenerate fixtures and check they are up to date** — `npm run fixtures` then
   `git diff --exit-code -- src/mocks`. If fixtures are stale, CI fails with instructions.
4. `npm test`
5. `npm run build`
6. `node --check server.js` in `backend/`

## 12.4 Fixture reproducibility

`npm run fixtures` must be deterministic: running it twice produces an identical `git diff` (i.e.
none). This is enforced by CI. `src/mocks/*.json` is **generated, never hand-edited**.

---

# PART 13 — DEPLOYMENT

Two services, wired with one environment variable:

| Service | Host | Root | Build | Start/Output |
|---|---|---|---|---|
| Frontend (Vite SPA) | **Vercel** | `./` | `npm run build` | output `dist/` |
| API (`backend/`) | **Render** (Web Service, free) | `backend` | `npm install` | `npm start` |

Config files: `vercel.json` (SPA rewrite so React Router deep links do not 404), `render.yaml`
(Render blueprint), `.env.example`.

**Deploy order:**

1. **Render** — New → Web Service → import repo → Root Directory `backend`, Build `npm install`,
   Start `npm start`, Free instance. Env var `FRONTEND_ORIGIN` (`*` initially). Check `/health`.
2. **Vercel** — Add New → Project → import repo → auto-detects Vite. Env var `VITE_API_URL` = the
   Render URL. Deploy.
3. Back in Render, set `FRONTEND_ORIGIN` to the exact Vercel URL to lock down CORS.

Pushes to `main` auto-redeploy both.

**Two things to plan for explicitly:**

- **First-response delay.** Render's free tier sleeps after ~15 min idle; the first request then takes
  ~30–50 s to wake. That is what judges will experience. Measure it, and keep the system warm before
  the demonstration.
- **Recoverability.** Keep a way to reset the demo database to a known good state in under a minute.
  A demonstration that cannot be recovered is a demonstration that can be lost.

---

# PART 14 — GIT WORKFLOW

## 14.1 Repository

- `origin` → `https://github.com/SaluguSwarup/BlockWise.git` (public)
- `upstream` → `https://github.com/namish-shankar/BlockWise-.git` (a second remote present in the
  maintainer's local checkout; all workflow commands explicitly target `origin`)
- Main branch: `main`

## 14.2 Two different conventions, do not confuse them

| Who | Convention |
|---|---|
| **Teams A, B, C (Days 1–3)** | Branch per feature → push → PR → integrator merges nightly. This is what `docs/workflow.md` and the task sequence describe. |
| **The maintainer/integrator working solo** | Commits directly to `main`, no branches, no PRs. |

Branch naming for teams: `team-{a|b|c}/{FEATURE-ID}-{short-name}` — e.g. `team-a/A3-defect-endpoint`.

Commit message format: `{FEATURE-ID}: {short description}`, then a 2–3 line body explaining what
changed and why.

## 14.3 Local settings

- `.claude/settings.json` — committed; shared permission allowlist so the team hits fewer prompts
- `.claude/settings.local.json` — **gitignored**; personal overrides

`.gitignore` covers: `node_modules`, `dist`, `.DS_Store`, `.env`, `.env.local`, `.vercel`,
`.claude/settings.local.json`.

---

# PART 15 — KEY DECISIONS AND THEIR REASONS

These were deliberated and settled. Re-opening them wastes time; changing one without understanding
the reason breaks something downstream.

| Decision | Reason |
|---|---|
| **Team B's pre-Day-3 planner result is a strict canned fixture — no engine fallback in the frontend** | Team B must never run the engine. Consequence: until B7 switches to `POST /api/plan` on Day 3, the planning screen shows the canned plan **regardless of which requests are selected** — so run the demo with the fixture's own selection until then. This is known and accepted. |
| **Postgres (`pg`)** installed up front | Team A's database choice, in place before Day 1 so no dependency fight at the first merge. CI already provisions Postgres 16. |
| **No npm workspaces; `file:` dependencies instead** | Vercel builds from the repo root and Render builds with `rootDir: backend`. Workspaces would break one or both. |
| **The "AI" labelling was removed before Day 1** | The deterministic placeholder must not be presented as a model. See Part 6. |
| **`src/optimiser/time.js` duplicates `src/lib/format.js`** | The engine may not import the frontend. The duplication *is* the boundary. |
| **Backend modules auto-discovered, not registered in `server.js`** | Removes the single most likely nightly-merge conflict. |
| **Fixtures generated by a script, not hand-written** | Reproducible, and provably identical to what the prototype produced — the numbers on screen do not change during restructuring. |
| **The fixture script is a recorder, not a planner** | It may only exercise behaviour the prototype already has. If the prototype does not produce the flagship merge, the fixture must not invent it — C3 implements it on Day 1. |
| **Per-endpoint mock/live switching (B1), not a global flag** | A global flag forces B to switch everything at once. Per-endpoint switching is what makes rolling integration possible. |
| **`docs/violations/` carved out of frozen `docs/`** | The workflow requires every team to record exceptions there; leaving `docs/` wholly frozen made the exception-recording mechanism itself a violation. Fixed in commit `036826b`. |
| **Dev views are dev-only, verified by grepping `dist/`** | They must never reach production; the check is mechanical, not a promise. |

---

# PART 16 — KNOWN GAPS AND OPEN ITEMS **[VOLATILE]**

As of 2026-09-13, before Day 1:

| Item | Status | Impact |
|---|---|---|
| **`.github/CODEOWNERS` handles** | Still placeholders (`@integrator`, `@team-a`, `@team-b`, `@team-c`) — not real GitHub usernames | Auto review-request will not fire. Not blocking; silently inert until filled in. |
| **GitHub collaborator access** | Unverified | **Blocking if missed.** The repo is public to read, but pushing a branch and opening a PR needs write access. If teammates are not collaborators, every `git push -u origin HEAD` fails with 403 on Day 1 morning simultaneously. |
| **Push credentials for teammates** | Unverified | HTTPS push prompts for auth; needs a PAT in the credential manager or SSH configured. |
| **Claude Code access on free-tier accounts** | Unverified | The plan of a teammate contributing on a free tier depends on whether Claude Code works without a paid plan. Verify directly; the fallback is an Anthropic API key (pay-per-token, no subscription). |
| **README demo-path narrative** | Contains some pre-relabel "AI priority" phrasing | Documentation drift only; code and UI are relabelled. Worth a cleanup pass. |
| **`docs/violations/`** | Directory does not exist yet | Expected — the first team to record an exception creates it. |
| **`src/data/` still authoritative** | Yes, until A1/A2 land | `scripts/build-fixtures.mjs` reads it. Team A's database supersedes it. |

---

# PART 17 — THE DEMO PATH

Run in order, the product story tells itself. This is also the regression path — if a change breaks
any step, it is a defect regardless of what the tests say.

1. **Sign in as Administrator** — role selection (no password until B2).
2. **Dashboard** — active sections, sections under maintenance, critical defects, pending tickets,
   pending block requests, infrastructure availability, block hours saved. Source-system strip
   (TMS/SMMS/TDMS/COA/BDMS). Charts: maintenance demand by department, track-health distribution,
   block requests by priority band, 8-week utilisation trend.
3. **Network Visualiser** — schematic line diagram of 20 sections across 4 corridors with 21 stations,
   drawn the way Indian Railways line diagrams are drawn. Pan (middle-click drag), zoom, corridor
   filter, hover tooltips.
   **Health drives the rendering** — the visual centrepiece:

   | Band | Health | Rendering |
   |---|---|---|
   | Healthy | ≥ 75% | Continuous rail with regular sleepers |
   | Degraded | 60–74% | Worn, dashed rail in amber |
   | Critical | < 60% | Fractured rail with a visible break marker, in red |

   Status glyphs overlay the rail for **Blocked ✕**, **Under maintenance ⚒**, **Under inspection ◎**.
4. **Search `SEC-104`** — map zooms; a banner states plainly whether the section is available for
   traffic.
5. **Track record** — full drawer: identity, chainage, line config, sectional speed, status, health
   vs threshold, asset availability, current issue, maintenance frequency, last inspection, next
   scheduled maintenance, block status, current activity, next available window, corridor availability,
   trains/day. Three tabs: **Engineering** (track condition, TQI, rails, ballast), **Signalling**
   (signal health, interlocking, axle counters), **Traction** (OHE, electrical defects, feed/TSS,
   pantograph hits). Plus the open defect register, overdue tasks and train activity.
6. **Raise Inspection Ticket** — from the open track record; the section number and the *entire*
   section record attach automatically. A collapsible panel shows exactly what is being attached.
7. **Block Requests** (admin) — 19 demands raised independently through BDMS, with the computed
   priority score. Row detail carries the associated track record, defects, overdue work, train
   activity during the requested period, corridor availability, and what the *other* departments are
   doing on the same section. **Select** or **Reject**.
8. **Planning Engine** (admin) — the selected requests run through a 10-stage animated pipeline naming
   the source system at each stage. **Every stage line is populated with figures actually computed
   from the selected requests, not fixed text.**
9. **The result** — before/after metrics, the multi-department merges drawn explicitly, every block
   with its window, departments, tasks, priority, trains affected, asset health, operational impact
   and full **reasoning trail including the rejected candidate windows**. **Commit** publishes to the
   schedule.
10. **Block Schedule** (admin) — Weekly/Monthly toggle. Sanctioned and newly optimised blocks visually
    distinguished.
11. **Train Operations** (admin) — 24-hour corridor traffic profile, WTT extract, goods forecast
    (rakes/night, tonnage, trend, peak hours), COA-published block windows.

Then: **sign out, sign in as Staff**, confirm `/app/engine` is hidden **and** blocked by URL.

## 17.1 The integration acceptance flow (Day 4+)

Integration is complete when this runs end to end on one machine **with nothing mocked**:

1. Sign in as administrator with real credentials
2. Network visualiser → search the worst section → real health and status from the database
3. Open its track record → three tabs show real defects and overdue work
4. Raise an inspection ticket → **it persists and survives a reload**
5. Block requests register → select the three departmental requests sharing one section and date →
   the priorities shown came from the scoring stage
6. Run the planning engine → **ONE block covering all three departments**
7. Open that block → the score explanation names the scorer that produced it; the optimiser reasoning
   explains the merge, the chosen window, and what was rejected
8. Commit the plan → appears in the schedule and **survives a reload**
9. Sign out, sign in as field staff → block planning hidden and unreachable

---

# PART 18 — COMMON PITFALLS

Things that have already caused confusion, or are likely to.

## 18.1 Architecture

- **Backend routes mount at `/api`, not `/api/team-a`.** A route `router.get('/sections')` in
  `backend/modules/team-a/index.js` serves `/api/sections`. Module names appear only in the startup
  log and `GET /api/_modules`.
- **`backend/` needs its own `npm install`.** Root install does not cover it. Fresh clones that skip
  this fail at `npm start` and possibly at `npm test`.
- **Do not convert to npm workspaces.** It breaks Vercel or Render.
- **Do not deduplicate `src/optimiser/time.js` against `src/lib/format.js`.** That import would
  violate the engine boundary.
- **Team B must never import `@blockwise/engine`.** B calls `POST /api/plan`. The frontend running the
  engine in-process is exactly what R4 removed.

## 18.2 Scope

- **R4 was extraction only.** Behaviour is identical before and after. Do not add scoring logic,
  weights, factors, optimisation rules, compatibility rules, resource constraints, train-aware
  scoring or multi-day scheduling while doing something else — those are C1–C10, owned by Team C.
- **Do not invent endpoints or contract fields.** If something needed is missing from the availability
  catalogue, escalate to the integrator the same day.
- **Do not implement adjacent features** because they are convenient while you are in the file.
- **`packages/engine/scenarios/` is empty on purpose.** Team C fills it on Day 1 (C1).

## 18.3 Honesty

- **Never claim accuracy, precision, recall, or model performance.** There is no model.
- **Never compute or imply a `confidence` value.** It is `null`, always, for the placeholder.
- **Never describe placeholder output as ML** — in the UI, `/dev/planner`, proof documents or the
  submission.

## 18.4 Process

- **Do not start work on a failing base.** Report it and stop.
- **Do not build on another team's unmerged PR** (Days 1–3).
- **Do not carry a mock past its availability day.** That is a defect.
- **Do not cross a boundary silently.** Record it in `docs/violations/{FEATURE-ID}-violations.md`.
- **"Tests pass" is not acceptance evidence.** The acceptance conditions are behavioural.
- **Do not hand-edit `src/mocks/`.** Regenerate with `npm run fixtures`.

## 18.5 Demo

- **Until B7 (Day 3), the planning screen shows the canned plan regardless of selection.** Run the
  demo with the fixture's own selection until then. This is a known consequence of the strict-fixture
  decision, not a bug.
- **`EXCLUSIVE` requests must stay stand-alone.** Removing that to make merges look better destroys
  the credibility of the merge logic.

---

# PART 19 — QUICK REFERENCE

```bash
# Setup
npm install && (cd backend && npm install)

# Run
npm run dev                      # → http://localhost:5173
cd backend && npm start          # → http://localhost:4000

# Test
npm test                         # 46 tests
npm run test:watch

# Verify
npm run build
grep -r "dev/planner\|dev/data" dist/        # must return nothing
curl -s http://localhost:4000/health
curl -s http://localhost:4000/api/_modules
curl -s http://localhost:4000/api/sections -H "Authorization: Bearer dev-any-team"

# Fixtures
npm run fixtures                 # then `git diff` must be empty on a second run

# Branch (teams, Days 1–3)
git checkout -b team-a/A3-defect-endpoint
git push -u origin HEAD
```

| Need | Read |
|---|---|
| What a feature requires + its acceptance condition | `BlockWise.md` |
| What I own / what is frozen | `docs/ownership.md` |
| How the day works | `docs/workflow.md` |
| What shipped last night / what to switch off | `docs/integration-log.md` |
| Response shapes and conventions | `packages/contracts/docs/` |
| Which fixture stands in for which endpoint | `src/mocks/README.md` |
| Engine structure and boundary rules | `packages/engine/README.md` |
| Everything above, in context | this document |
