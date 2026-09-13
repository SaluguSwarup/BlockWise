# ScoringInput → ScoringOutput

Frozen Pre-Day-1, transcribed from `BlockWise.md` §C2. **Internal to Team C.** The scoring stage sits
between `PlanningInput` and the block optimiser inside the engine (`packages/engine`). Team B never
calls this boundary and never receives a `ScoringInput`/`ScoringOutput` directly — B calls
`POST /api/plan` and receives the final `PlanningOutput`, which carries the scores already applied.

This document defines the contract only. **No scoring logic — placeholder or otherwise — beyond what
the current prototype (`scoreRequest` in the pre-extraction `src/lib/planningEngine.js`) already does
is implemented as part of Pre-Day-1.** C2 (Day 1) is where the interface is properly exercised and
extended; R4 only wraps the existing logic behind this shape.

## 1. Input — ScoringInput

Assembled from `PlanningInput`:

```
requests[]    id, section, department (ENGG / S&T / TRD), activity code and type,
              declared activity criticality, urgency raised by the department,
              safety-consequence class, estimated duration, requested date,
              source system, overdue days, due date, last-performed date,
              scheduled frequency
sections[]    id, health index and history, track class, traffic density,
              speed restrictions in force, age or last renewal
defects[]     per section per department: severity, age, count, repeat occurrences
overdue[]     outstanding scheduled work per section per department
operations    traffic profile for the section, corridor status, availability impact
context       horizon start and end, division, scoring-request identifier
```

## 2. Output — ScoringOutput

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

## 3. Meaning and range

`urgency`, `criticality` and `priority` are each an integer 0–100, higher = more pressing. `urgency` is
time pressure (overdue days, due date, deterioration rate). `criticality` is consequence severity if
not done (safety class, asset criticality, traffic carried). `priority` is the combined value the
optimiser orders by. `band` (LOW / MEDIUM / HIGH / CRITICAL) is a presentation convenience derived from
`priority`; the optimiser uses the number, never the band.

## 4. How the optimiser consumes it

Priority for selection and merge ordering, urgency for placement within the horizon, criticality as a
tie-break against traffic disruption. **The optimiser never computes, recomputes or overrides a score,
and never inspects `scorerStatus` to change its behaviour** — it must work identically whatever is
behind the interface. A request in `unscored[]` is not silently given a default: it is left out of the
plan and reported in `PlanningOutput.unscheduled[]` with the reason carried through.

## 5. Explanation slots

`factors[]` carries the per-factor value, weight, contribution and a readable note. `explanation.
featureContributions[]` is a reserved slot for a future model's own explanation and is left empty
(`[]`) by the placeholder.

### `confidence` — reserved, not simulated

`confidence` is a **reserved field for a future trained model**. The deterministic placeholder **must
return `confidence: null`** — it must never calculate, estimate, derive or otherwise imply a confidence
value from its arithmetic. There is no trained model behind this contract in this version of the
project, so there is nothing for a confidence figure to describe. Anywhere `confidence` is surfaced —
UI, `/dev/planner`, a proof document — it must be shown as empty/not-applicable for the placeholder,
and must never be described or labelled as "model confidence" or "ML confidence". This exists now, as
an explicit reserved slot, precisely so a future model is a substitution behind the same contract
rather than a contract change.

## 6. Status

Every response declares `scorerStatus`. Anything rendering or reporting a score must be able to show
that status, so no screen and no document can present a placeholder score as a model output.

## Current implementation (Pre-Day-1: the existing prototype logic, wrapped, not extended)

The implementation behind this interface is exactly the six-factor deterministic weighted combination
already in the current prototype (`FACTOR_WEIGHTS` in the pre-extraction `planningEngine.js`):
activity criticality, departmental urgency, safety consequence, asset health deficit, overdue status,
impact on asset availability — each with its contribution reported. Pre-Day-1 only wraps this existing
logic behind the frozen interface above (`packages/engine/src/scoring/`); it does not add, remove or
reweight a factor. It is **not a trained ML model** and must never be represented as one — no accuracy,
precision, recall or other model-performance figure is claimed for it anywhere. Extending or replacing
it is Team C's Day-1-onward work (C2 and later).
