# src/mocks — Team B's frozen fixtures (R3)

Generated, not hand-written. Regenerate with `npm run fixtures` from the repo root — **never
hand-edit a file in this directory.**

Each file is one endpoint from the availability catalogue (`BlockWise.md` §2.4), shaped exactly
like the real response (see `packages/contracts/docs/envelope.md` and `records.md`):

| File | Stands in for |
|---|---|
| `sections.json` | `GET /api/sections` (A3) |
| `network.json` | `GET /api/network` (A3) |
| `section-detail.json` | `GET /api/sections/:id` (A4) |
| `defects.json`, `overdue.json` | `GET /api/defects`, `GET /api/overdue` (A5) |
| `health.json` | `GET /api/sections/:id/health` (A5) |
| `operations.json` | `GET /api/operations/*` (A6) |
| `requests.json` | `GET /api/requests` (A9) — **priority baked in** per record, in the `ScoringOutput` score shape, so B never computes a score |
| `tickets.json` | `GET/POST/PATCH /api/tickets` (A9) |
| `blocks.json` | `GET /api/blocks` (A9) |
| `sources.json` | `GET /api/sources` (A8) |
| `plan.json` | `POST /api/plan` (C7) — one canned `PlanningOutput`, recorded from a real run of the extracted engine over the fixture dataset |

`plan.json` is the **strict canned fixture**: Team B does not run the engine as a fallback. The
planning screen shows this fixture verbatim until B7 switches to the real `POST /api/plan` on
Day 3 — see `BlockWise.md` §R3 and the Pre-Day-1 plan.

Retire each fixture the day its real endpoint becomes available (§2.4) — not all at once on Day 4.
