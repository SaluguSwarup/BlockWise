# PlanningInput → PlanningOutput

Frozen Pre-Day-1. This is the boundary between Team A's real data (arriving via `A10` /
`GET /api/planning-input` on Day 4) and Team C's engine (`packages/engine`). It is also the shape
Team C's own synthetic scenarios (`C1`) must be built to, and the shape Team B's canned planner
fixture (`src/mocks/plan.json`) is checked against.

## PlanningInput

PlanningInput carries two distinct groups of fields. Keep them distinct when reading this contract:

**Group 1 — everything the current engine already reads today.** These fields exist in the prototype's
data right now (`src/data/tracks.js`, `trains.js`) and the extracted engine (`packages/engine`) reads
them unchanged:

```
requests: BlockRequest[]              // the demands under consideration
sections: Section[]                   // by id, health/status/corridor etc.
windows: Window[]                     // per section, per date (see note below)
timetable: { [corridorId]: TimetableEntry[] }
goodsForecast: { [corridorId]: GoodsForecast }
corridorStatus: CorridorStatus[]
context: { horizonStart, horizonEnd, division }
```

**Group 2 — the additional scoring fields required by the frozen `ScoringInput` contract** (see
`scoring.md`): per-request declared activity criticality, urgency, safety-consequence class, overdue
days, due date, last-performed date, scheduled frequency; per-section health index **with history**,
track class, traffic density, speed restrictions in force; defect and overdue records per section and
department with severity, age and count.

These Group 2 fields are **contract requirements for the future scoring stage** — they are declared
frozen now so `A10` (Team A) and `C1` (Team C's scenario library) are both built against the same
shape from Day 1. Listing them here is **not** a claim that they already exist in today's frontend
data (most do not — e.g. health history and per-defect age are not tracked in `src/data/tracks.js`
today). The deterministic placeholder scorer only consumes what is actually present in a given
PlanningInput; it does not invent values for fields that are absent, and per the scoring contract, a
request that is missing what the scorer needs is reported in `unscored[]` with a reason, not scored on
invented data.

**Windows are per section, per date** — not a single undated template. Today's prototype data
(`getWindowsForSection` in `src/data/trains.js`) is an undated per-corridor template; that is a known
gap the contract already accounts for, and `A1`/`A6` own producing the real dated version. The engine
extraction (`R4`) does not change today's undated template into a dated one — it is carried across
as-is; A1 supplies real dated windows on Day 1/2.

## PlanningOutput

```
planId, generatedAt (timestamp), engineVersion,
scorerStatus,                          // verbatim from ScoringOutput — see scoring.md
scores: ScoringOutput['scores'],       // carried through, one per scored request
unscored: ScoringOutput['unscored'],   // carried through
blocks: Block[],                       // exactly the Block shape in records.md
metrics: { ... },                      // before/after figures — see the engine's computeMetrics
unscheduled: [{ requestId, reason }]   // requests left out of the plan (e.g. because they are unscored)
```

`blocks[]` is deliberately identical to the `Block` shape `GET /api/blocks` returns, so Team B's
planning and schedule screens render either source unchanged — this is what makes B7's Day-3 switch
from the canned fixture to the real `POST /api/plan` a substitution rather than a rewrite.

## Internal to Team C: ScoringInput → ScoringOutput

The scoring stage sits between PlanningInput and the optimiser and is internal to Team C — Team B
never calls it and never sees `ScoringInput`. See `scoring.md` for its contract in full.
