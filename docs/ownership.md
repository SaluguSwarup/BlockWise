# Ownership boundaries (R1)

One directory, one owner. A pull request touching another team's area during Days 1–3 is
returned, not debated (see `workflow.md`). From Day 4 the boundaries relax to whatever
integration requires, but each team remains accountable for its own area.

## Path → owner

| Path | Owner | Notes |
|---|---|---|
| `backend/server.js`, `backend/lib/` | **Integrator** | Frozen. Mounts `backend/modules/*` automatically — never edited to add a route. |
| `backend/modules/team-a/` | **Team A** | A3–A10 land here (Days 1–3). |
| `backend/modules/team-b/` | **Team B** | B2 (real authentication) lands here — Team B's foothold inside the backend (R1). |
| `backend/modules/team-c/` | **Team C** | C7 (`POST /api/plan`, `POST /api/ml/score`) lands here (Day 2). |
| `packages/contracts/` | **Integrator** | Frozen. Additive-only after Pre-Day-1 — see its own README. |
| `packages/engine/` (all except `scenarios/`) | **Team C** | The real planning engine — C1–C10. |
| `packages/engine/scenarios/` | **Team C** | C1's synthetic scenario library. |
| `src/data/` | **Team A / Team B** | Today's mock data. A's real database (A1/A2) supersedes it; until then it is what `scripts/build-fixtures.mjs` reads. |
| `src/mocks/` | **Integrator** | Frozen. Regenerate with `npm run fixtures`; never hand-edit. |
| `src/dev/flag.js`, `src/dev/index.jsx` | **Integrator** | Frozen — the one integration point in `App.jsx` (R6). |
| `src/dev/team-a/` | **Team A** | `/dev/data` — A3/A7/A11. |
| `src/dev/team-c/` | **Team C** | `/dev/planner` — C4/C8/C11. |
| `src/lib/planningInput.js` | **Team B** | Converts today's mock data into a `PlanningInput` — used by `/dev/planner` and the fixture script. |
| `src/lib/engineStages.js` | **Team B** | Presentation-only stage list for the planning-run animation. Not part of the engine. |
| `src/App.jsx`, `src/context/AppState.jsx`, `src/pages/`, `src/components/` | **Team B** | The product UI. |
| `scripts/build-fixtures.mjs` | **Integrator** | Frozen. |
| `docs/`, `.github/` | **Integrator** | Frozen. |
| `docs/violations/` | **Every team** | Exception to the row above. Each team may create and append to its own `docs/violations/{FEATURE-ID}-violations.md` to record a necessary cross-boundary or contract exception for that feature — see `workflow.md`. Never edit another team's violation file. |

## Frozen files (whole week, not just Pre-Day-1)

Only the integrator edits these, and only with all three leads informed:

- `packages/contracts/**`
- `backend/server.js`, `backend/lib/**`
- `src/mocks/**`
- `src/dev/flag.js`, `src/dev/index.jsx`
- `scripts/**`
- `.github/**`
- `docs/**`

A pull request that touches a frozen file outside the integrator's own commit is a boundary
violation — see `workflow.md`. (`docs/violations/` is the one exception, per the row above.)

## Footholds inside another team's area

Two deliberate exceptions to "one directory, one team", both named in `BlockWise.md`'s R1:

- **Team B needs a server-side place to issue auth tokens** → `backend/modules/team-b/`, not a
  shared file inside `backend/lib/`.
- **Team C needs a place to expose the planner over HTTP** → `backend/modules/team-c/`, and a
  development view → `src/dev/team-c/`.

Team A gets the same treatment symmetrically: `backend/modules/team-a/` and `src/dev/team-a/`.
