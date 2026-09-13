# @blockwise/contracts

This package is the frozen boundary between Team A, Team B and Team C. It defines, in one
place, everything three parallel teams must agree on before Day 1:

- the API response envelope and error shape
- the record shapes each real endpoint will return (see `docs/records.md`) — these are the
  shapes the current prototype UI already renders, not a new design
- the `PlanningInput → PlanningOutput` boundary between Team A's data and Team C's engine
- the `ScoringInput → ScoringOutput` boundary between the scoring stage and the optimiser,
  internal to Team C
- date/time and identifier conventions

## Rule: additive-only after Pre-Day-1

Once Day 1 starts, fields may be **added** to any contract here. They may never be **renamed
or removed** — that breaks whoever is already consuming them. See `docs/*.md` for the frozen
shapes and `src/` for the runtime validators every team can call.

## Who may change these files

Only the fourth person (the integrator). If a contract genuinely needs to change during the
week, raise it with the integrator with all three leads informed — see `docs/workflow.md` at
the repo root.

## Contents

| File | Purpose |
|---|---|
| `docs/envelope.md` | response envelope, error shape, date/time/id conventions |
| `docs/records.md` | Section, Defect, BlockRequest, Ticket, Block, Window, … |
| `docs/planning.md` | `PlanningInput → PlanningOutput` |
| `docs/scoring.md` | `ScoringInput → ScoringOutput` (internal to Team C) |
| `src/envelope.js` | `ok()` / `fail()` envelope helpers |
| `src/validate-planning.js` | `validatePlanningInput`, `validatePlanningOutput` |
| `src/validate-scoring.js` | `validateScoringInput`, `validateScoringOutput` |
| `src/index.js` | re-exports everything above |
