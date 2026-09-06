# BlockWise — Automatic Block Planning System

Front-end prototype for the Smart India Hackathon 2026 problem statement on
**Automatic Block Planning for fixed infrastructure maintenance** of the
Engineering, Traction Distribution and Signal & Telecommunication departments.

> **Milestone 1 — front-end only.** There is no backend, no API and no database.
> Every record is realistic mock data held in browser state. The UI is the
> deliverable; real services get plugged into this exact interface later.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

`npm run build` produces a static bundle in `dist/`.

## The demo path

1. **Sign in** as *Administrator* or *Field Staff* (role selection screen — no password).
2. **Dashboard** — divisional position, source-system integration strip, health and demand charts.
3. **Network Visualiser** — schematic of 20 sections across 4 corridors. Track health drives the
   rendering: healthy sections show continuous rail, degraded sections worn/dashed rail, critical
   sections a fractured rail with a break marker. Pan, zoom, filter by corridor, click any section.
4. **Search `SEC-104`** — the map zooms to the section and a banner states whether it is available
   for traffic or not, with a route through to the full record.
5. **Track record** — status, health against the threshold, live block/corridor position, and
   separate Engineering / Signalling / Traction tabs plus defects and train operations.
6. **Raise Inspection Ticket** — the section number and the whole section record are attached
   automatically; the user enters only request-specific fields. Confirmation state on submit.
7. **Block Requests (admin)** — 19 demands raised independently by the three departments, each with
   an AI priority score and a detail view carrying the associated track record, defects, overdue
   tasks, train activity and corridor availability. Approve/select or reject.
8. **Planning Engine (admin)** — a 10-stage run over the selected requests, then the optimised plan:
   before/after metrics, the multi-department merges drawn out, and every block's reasoning and
   rejected candidate windows. Commit publishes it to the schedule.
9. **Block Schedule (admin)** — weekly and monthly views of sanctioned and AI-optimised blocks.
10. **Train Operations (admin)** — working time table, goods forecast and COA block windows.

Staff never see the Block Planning group; the routes are guarded as well as hidden.

## Structure

```
src/
  data/          mock datasets — swap these for API calls later
    network.js       stations, corridors, schematic geometry
    tracks.js        20 sections: health, status, ENGG/SNT/TRD detail, defects, overdue
    trains.js        working time table, goods forecast, COA block windows
    blockRequests.js BDMS block demands
    tickets.js       inspection tickets
    plans.js         already-sanctioned blocks, users, source systems
  lib/
    planningEngine.js  scoring, merging, window selection, metrics  ← the swap point
    format.js          date/duration helpers
  context/AppState.jsx state store (role, tickets, requests, plan)
  components/          common · layout · visualizer · dashboard · planning
  pages/               one file per route
  styles/              app.css (tokens, primitives) · views.css (view-specific)
```

### Where real functionality plugs in

The planning engine is deliberately a transparent rule-based stand-in, not a fake
animation — the numbers shown are computed from the same mock data the rest of the
UI reads. `scoreRequest()` and `runPlanner()` in `src/lib/planningEngine.js` are the
only two entry points the UI consumes, so replacing them with service calls that
return the same shapes swaps in the real AI/ML model without touching the interface.
Likewise every file in `src/data/` is a pure export that a fetch layer can replace.

**Priority score** = weighted sum of criticality (0.24), urgency (0.20), safety impact (0.16),
asset-health deficit (0.14), overdue status (0.14) and asset-availability impact (0.12).

**Merging** groups compatible requests by section and date, so a block runs for the longest
task plus a 10-minute coordination margin per additional department instead of the serial sum.
Requests flagged `EXCLUSIVE` (e.g. a track machine needing sole occupation) stay standalone.

**Window selection** ranks the Control Office windows by a disruption index weighing express
paths ×4, passenger ×3 and goods ×1.5 over the period the block would actually occupy, plus the
published corridor density and penalties for restricted windows.

All figures in the UI are mock data for demonstration only.
