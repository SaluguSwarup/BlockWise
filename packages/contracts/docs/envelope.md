# Response envelope & conventions

Frozen Pre-Day-1. Additive-only after that — see the package README.

## Envelope

Every real API response (Team A and Team C's HTTP endpoints) uses this shape:

```json
{ "ok": true, "data": { /* endpoint-specific payload */ }, "error": null, "meta": {} }
```

On failure:

```json
{ "ok": false, "data": null, "error": { "code": "NOT_FOUND", "message": "Section not found", "details": {} }, "meta": {} }
```

- `ok` — boolean, always present.
- `data` — the payload on success, `null` on failure. Shape is endpoint-specific (see `records.md`).
- `error` — `null` on success; on failure `{ code, message, details }`. `code` is a short
  SCREAMING_SNAKE_CASE machine-readable string (`NOT_FOUND`, `VALIDATION_FAILED`, `UNAUTHORIZED`,
  `FORBIDDEN`, `NOT_IMPLEMENTED`, `INTERNAL_ERROR`, …). `message` is human-readable. `details` is an
  optional object (e.g. validation errors).
- `meta` — optional, endpoint-specific metadata (pagination, timestamps). Always an object, `{}` if unused.

Team B's dev-only mocks in `src/mocks/` follow this same envelope so switching a screen from mock to
live is a data-source change only, never a response-shape change.

## Dates, times, identifiers

- **Date**: `YYYY-MM-DD` (e.g. `2026-09-12`).
- **Time of day**: `HH:MM`, 24-hour, IST (e.g. `01:45`). A window that crosses midnight has
  `end < start` and is interpreted as spanning into the next day (see `windowLength` in the engine).
- **Timestamp**: ISO-8601 UTC (e.g. `2026-09-06T09:42:00.000Z`) for anything machine-logged
  (`lastSync`, `generatedAt`). Human-displayed "on" strings (e.g. `requestedOn`) may keep the existing
  prototype's `'DD Mon YYYY, HH:MM'` display format — that is presentation, not a contract field.
- **Identifiers** (unchanged from the current prototype, now frozen):
  - Section: `SEC-###` (e.g. `SEC-104`)
  - Track id: `TRK-<corridor>-<seq>-<UD|DN>` (e.g. `TRK-GC1-04-UD`)
  - Block request: `BDMS/YYYY/BR-####`
  - Inspection ticket: `INS-YYYY-####`
  - Sanctioned/optimised block: `BLK-YYYY MM-##` (sanctioned) or `BLK-AI-###` per-run (optimiser output,
    renumbered — see `docs/planning.md`)
  - Corridor: short code (`GC-1`, `NW-2`, `NE-3`, `SC-4`)
  - Defect: `<SYSTEM>-DF-####` (e.g. `TMS-DF-2101`)
