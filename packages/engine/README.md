# @blockwise/engine

The BlockWise planning engine, extracted out of the frontend (`R4`). Takes a `PlanningInput` and
returns a `PlanningOutput` (see `packages/contracts/docs/planning.md`). **Forbidden from importing
the database, the backend, or the frontend** — verified by a lint/test rule, not by convention alone.

## Pre-Day-1 scope: extraction and isolation only

This package exists so the boundary is real before Day 1, not to improve the planner. Everything in
here is the prototype's existing logic (`src/lib/planningEngine.js`, now deleted from the frontend),
carried across unchanged and reorganised behind two interfaces:

- **`src/scoring/`** — the frozen `score(ScoringInput) → ScoringOutput` interface, with the
  prototype's existing six-factor weighted scoring wrapped behind it as the deterministic
  placeholder. **Not a trained ML model** — see `scorerStatus` on every response, and
  `packages/contracts/docs/scoring.md`.
- **`src/optimiser/`** — the prototype's existing clustering, window ranking, merging and metrics
  logic, now consuming scores as given rather than computing them itself.

**No new scoring logic, weighting, factors, compatibility rules, resource constraints, train-aware
window scoring, or multi-day scheduling is added here.** That is Team C's Day-1-onward work
(`C1`–`C10` in `BlockWise.md`) and happens in this same package, on top of this boundary.

## The boundary, enforced

- The optimiser (`src/optimiser/index.js`) receives already-scored requests. It has no import of, or
  call path into, `src/scoring/` — it cannot compute or override a score, and it never reads
  `scorerStatus`. This is asserted by `test/boundary.test.js`: the optimiser produces the identical
  plan when the exact same scored requests are handed to it through two different stub scorers.
- A request the scorer could not score (`unscored[]`) is left out of the plan and reported in
  `PlanningOutput.unscheduled[]` with its reason — never silently defaulted.
- `confidence` in `ScoringOutput.scores[]` is `null` for the placeholder, always. It is a reserved slot
  for a future trained model — see `packages/contracts/docs/scoring.md`. Nothing in this package
  calculates or implies a confidence figure.

## Entry point

```js
import { runPlan } from '@blockwise/engine';
const output = runPlan(planningInput); // uses the placeholder scorer by default
const output2 = runPlan(planningInput, { scorer: someOtherScorer }); // substitution test
```

## `scenarios/`

Empty except for this README — **Team C's** synthetic scenario library (`C1`) is built here on Day 1,
to the `PlanningInput` contract.
