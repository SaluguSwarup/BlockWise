# BlockWise by Swarup

**Automatic Block Planning System for Indian Railways** — front-end prototype for the Smart India Hackathon 2026 problem statement on coordinated maintenance block planning across the Engineering (ENGG), Signal & Telecommunication (S&T) and Traction Distribution (TRD) departments.

> **Milestone 1 — front-end only.**  
> No backend, no API calls, no database, no authentication service, no ML model.
> Every record is realistic mock data held in React state. The interface *is* the deliverable;
> real services are designed to be plugged into this exact UI later without redesigning it.

---

## The problem

Today each department raises its own block/disconnection demand through **BDMS**, independently.
Defect and overdue-maintenance data sits in three separate systems — **TMS** (track),
**SMMS** (signalling) and **TDMS** (traction) — while **COA** holds corridor availability, the
working time table and the goods forecast. Nobody sees all of it at once, so blocks are granted
serially: three departments working on the same section on the same night take three separate
blocks instead of one.

The result is avoidable asset downtime and reduced infrastructure availability for train operations.

## What BlockWise does

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

The central message of the demo:

> *Instead of departments independently requesting blocks, the system intelligently coordinates
> maintenance across departments and train operations to generate the most efficient block plan.*

---

## Running it

```bash
npm install
npm run dev        # opens http://localhost:5173
```

```bash
npm run build      # static bundle in dist/
npm run preview    # serve the built bundle
```

Requires **Node 18+** (developed on Node 24). Stack: **React 18 + React Router 6 + Vite 5**.  
No UI framework, no chart library — every chart, the network diagram and all layout are
hand-built SVG/CSS so the visuals stay exactly on the railway-enterprise brief.

---

## Roles

The entry screen is a role picker, not a real login — no password, no auth service.

|  | Admin — *Sr. Divisional Operations Manager* | Staff — *Senior Section Engineer (P.Way)* |
|---|---|---|
| Dashboard | ✔ | ✔ |
| Network Visualiser & track records | ✔ | ✔ |
| Inspection tickets | ✔ | ✔ |
| Block Requests | ✔ | ✖ |
| **Block Planning Engine** | ✔ | ✖ |
| Weekly / Monthly Block Schedule | ✔ | ✖ |
| Train Operations (WTT · goods · COA) | ✔ | ✖ |

The Block Planning group is **hidden from the sidebar** for staff *and* **guarded at the route level** — a staff user who types `/app/engine` gets a "restricted module" screen.

---

## The demo path

Run this in order and the whole product story tells itself.

**1 · Sign in as Administrator** — role selection screen. Choose between Admin (full access) and Staff (visualiser only). No password needed.

**2 · Dashboard** — divisional position at a glance: active sections, sections under maintenance, critical defects, pending tickets, pending block requests, infrastructure availability and block hours saved. Source-system strip (TMS / SMMS / TDMS / COA / BDMS) shows the integration story. Charts show maintenance demand by department, track-health distribution, block requests by AI priority band, and 8-week block utilisation trend. Plus sections needing attention, upcoming blocks and live corridor availability.

**3 · Network Visualiser** — a schematic line diagram of **20 sections across 4 corridors** with 21 stations and junctions, drawn the way Indian Railways line diagrams are drawn, not as a generic map. Pan with middle-click drag, zoom with buttons, filter by corridor, hover for tooltips.

**Health drives the rendering** — this is the visual centrepiece:

| Band | Health | Rendering |
|---|---|---|
| Healthy | ≥ 75 % | Continuous rail with regular sleepers |
| Degraded | 60–74 % | Worn, dashed rail in amber |
| Critical | < 60 % | Fractured rail with a visible break marker, in red |

Status glyphs overlay the rail for **Blocked ✕**, **Under maintenance ⚒** and **Under inspection ◎**.

**4 · Search `SEC-104`** — search by section number, track ID, route or corridor. The map zooms to the section and a banner states plainly whether it is available for traffic or not. `SEC-104` (Aligarh Jn – Tundla Jn) is deliberately the worst section on the division at **48 % health, CRITICAL** — it carries the flagship three-department merge later in the demo.

**5 · Track record** — click any section to open the full drawer. Shows section number, track ID, corridor, chainage, line configuration, sectional speed, status, health against the threshold, asset availability, last modified date, current issue, maintenance frequency, last inspection, next scheduled maintenance, current block status, current activity, next available block window, corridor availability and trains per day. Three tabs show:

- **Engineering** — track condition, TQI, rails, ballast, defects, maintenance status
- **Signalling** — signal health, interlocking, axle counters, defects, maintenance status
- **Traction** — OHE status, electrical defects, feed/TSS, pantograph hits, maintenance status

Plus the section's open defect register, overdue tasks and train activity.

**6 · Raise Inspection Ticket** — from the open track record. The section number and the *entire* section record are attached automatically; you fill in only request-specific fields — time requested, region details, department, reason, observations, urgency. A collapsible panel shows exactly what track data is being attached. Submitting shows a confirmation state with the new ticket ID.

**7 · Block Requests** (admin) — **19 demands** raised independently by the three departments through BDMS. Table view with department, activity, requested date/window, duration, criticality, urgency, asset impact and a computed **AI priority score**. Filter and search; click any row for the detail view, which carries the implicitly associated track record, existing defects, overdue maintenance, train activity during the requested period, corridor availability and what the *other* departments are doing on the same section. **Select** or **Reject** — rejected requests visibly change state.

**8 · Planning Engine** (admin) — the heart of the demo. The selected requests run through a **10-stage pipeline**, animated with a live log naming the source system at each stage:

1. Collecting maintenance requirements — *BDMS*
2. Reading asset health — *TMS / SMMS / TDMS*
3. Evaluating criticality & urgency — *AI prioritisation model*
4. Reading defects & overdue register — *TMS / SMMS / TDMS*
5. Checking corridor availability — *COA*
6. Checking passenger train timetable — *Working Time Table*
7. Checking goods train forecast — *COA freight forecast*
8. Detecting overlapping maintenance opportunities — *coordination model*
9. Coordinating Engineering / Signalling / Traction work — *coordination model*
10. Assigning priorities & generating the optimised plan — *optimiser*

Every stage line is populated with figures actually computed from the selected requests, not fixed text.

**9 · The result** — before vs after metrics, the multi-department merges drawn out explicitly, and every generated block with its window, departments, tasks, priority, trains affected, asset health, operational impact and full **reasoning trail** including the rejected candidate windows. **Commit** publishes the plan to the divisional schedule.

**10 · Block Schedule** (admin) — **Weekly** and **Monthly** toggle. Weekly shows blocks laid out across the days of the week with times, sections, departments, activities, priority and state; monthly is a calendar with per-day block chips. Sanctioned blocks and newly AI-optimised blocks are visually distinguished.

**11 · Train Operations** (admin) — the data the engine reasons over: 24-hour corridor traffic profile, working time table extract, goods train forecast (rakes/night, tonnage, trend, peak hours) and the COA-published block availability windows.

---

## Multi-department coordination — the flagship case

`SEC-104`, night of **12 Sep 2026**, three departments file independently through BDMS:

| Request | Dept | Activity | Requested | Duration |
|---|---|---|---|---|
| BR-0412 | ENGG | Through rail renewal — 380 m | 01:45–04:30 | 165 min |
| BR-0418 | TRD | OHE insulator replacement — mast 141/12 | 02:30–04:00 | 90 min |
| BR-0423 | SNT | Point machine 24A overhaul | 03:00–04:15 | 75 min |

Worked serially that is **5.5 hr** of corridor time. The engine finds they share a section and a date, that none of them demands sole occupation, and merges them into **one block of 165 + 20 min of coordination margin** — the longest task plus a handover allowance per additional department. The UI draws the before/after side by side so an evaluator sees the saving without explanation.

Requests marked `EXCLUSIVE` — e.g. BR-0478, where a BCM track machine occupies the whole section — are deliberately **kept stand-alone**, so the merge logic reads as engineering judgement rather than a blanket rule.

---

## How the engine works (Milestone 1)

`src/lib/planningEngine.js` is a **transparent, deterministic rule-based stand-in** for the AI/ML service — not a fake progress bar. Every number on screen is genuinely computed from the same mock data the rest of the UI reads, which is what makes the reasoning panels defensible in a live demo.

**Priority score (0–100)** — weighted sum of six factors, each shown in the UI with its raw value, weight and contribution:

| Factor | Weight | Source |
|---|---|---|
| Criticality of activity | 0.24 | request |
| Urgency raised by department | 0.20 | request |
| Safety impact | 0.16 | request |
| Asset-health deficit (100 − health) | 0.14 | track master |
| Overdue status | 0.14 | overdue register |
| Impact on asset availability | 0.12 | request |

Bands: **CRITICAL** ≥ 85 · **HIGH** ≥ 70 · **MEDIUM** ≥ 50 · **LOW** below.

**Merging** — requests are clustered by `section × date`. Compatible requests in a cluster become one block lasting `longest task + 10 min × (departments − 1)` instead of the serial sum. `EXCLUSIVE` requests are split back out into their own blocks.

**Window selection** — every COA window for the section is scored by a disruption index:  
`trafficLoad × 2 + corridor density`, where traffic load weights **express ×4, passenger ×3, goods ×1.5** counted over the period the block would *actually occupy* (not the whole window), plus penalties for `Restricted` (+18) and `Not preferred` (+40) windows and for windows too short (+60). The lowest-disruption window that fits wins; the runner-up is reported in the UI with its reason. If nothing fits, the block is extended and the plan says so explicitly.

**Metrics** — before/after block count and block hours, hours saved, downtime reduction %, asset-availability gain, train paths protected, merged blocks and combined departmental activities.

---

## Project structure

```
src/
  data/                    mock datasets — the swap point for Milestone 2
    network.js             division, 4 corridors, 21 stations, schematic SVG geometry
    tracks.js              20 sections: health, status, ENGG/SNT/TRD tabs, defects, overdue
    trains.js              WTT, goods forecast, COA windows, corridor status
    blockRequests.js       19 BDMS block demands + weights (criticality/urgency/safety)
    tickets.js             inspection tickets, statuses, reason options
    plans.js              12 sanctioned blocks, demo users, source systems, KPIs
  lib/
    planningEngine.js      scoring · merging · window ranking · metrics · stages
    format.js              date, week/month, duration and percentage helpers
  context/
    AppState.jsx           single store: role, tickets, requests, plan, toasts
  components/
    common/                Icon, Badge, Panel, Stat, Tabs, Drawer, Modal, HealthBar, …
    layout/AppShell.jsx    topbar, role-aware sidebar, live clock, nav
    visualizer/            NetworkMap · TrackSearch · TrackDetailDrawer · TicketForm
    dashboard/Charts.jsx   donut, bar list, health histogram, utilisation (hand-built SVG)
    planning/              RequestDetail · BlockDetail
  pages/                   one file per route
  styles/
    app.css                design tokens + primitives
    views.css              view-specific styling
```

Routes: `/` role selection · `/app/dashboard` · `/app/network` · `/app/tickets` ·  
`/app/requests`* · `/app/engine`* · `/app/schedule`* · `/app/operations`*  (* admin only).

---

## Where real functionality plugs in (Milestone 2)

The frontend is built so the second milestone is an integration job, not a rewrite:

- **Data** — every file in `src/data/` is a pure export with no logic. A fetch/service layer returning the same shapes replaces them file by file: `tracks.js` → TMS/SMMS/TDMS, `trains.js` → COA, `blockRequests.js` → BDMS.

- **Engine** — the UI consumes exactly two entry points: `scoreRequest(request)` and `runPlanner(selectedRequests)`. Point those at the real optimisation/ML service, keep the return shapes, and the entire planning experience works unchanged — including the reasoning panels, which render whatever factors and explanations the service returns.

- **Auth** — `login(role)` in `AppState.jsx` is the only place a session is created; the route guards in `App.jsx` already enforce role separation. Add a JWT/session layer there.

- **State** — tickets, request status transitions and plan commits all flow through `AppStateProvider`, so database persistence is added in one file.

---

## Data notes

All figures — health indices, defects, TQI values, train numbers, goods tonnage, availability percentages, officer names and employee IDs — are **realistic mock data created for demonstration only**. They are internally consistent (a section clicked on the map shows the same section number, health and defects that appear in its block requests, its blocks and the engine's reasoning) but they do not represent any actual Indian Railways record.

---

## Stack & dependencies

- **React 18** + React Router 6
- **Vite 5** (dev server, build)
- No UI component library
- No chart library (SVG + CSS)
- No build-time or runtime polyfills
- 6894 lines of code (all components + data + engine)

---

## Development notes

To run the demo from cold start:

```bash
git clone [this repo]
cd blockWise
npm install
npm run dev
```

The dev server opens at `http://localhost:5173`. Hot reload works; saved files rebuild immediately.

To build a static site:

```bash
npm run build
npm run preview   # preview the built bundle before deployment
```

The `dist/` folder is ready to serve from any static host.

---

## For evaluators

**The 10-step demo**, starting from the Dashboard, takes ~8–10 minutes and shows:

1. **Divisional status** at a glance (dashboard charts)
2. **Railway-specific visualiser** (network schematic, health-driven rendering)
3. **Track health and defects** (detailed tabs for three departments)
4. **Inspection ticket workflow** (auto-prefilled section data)
5. **Multi-department block demands** (19 requests, AI priority scores)
6. **Automated coordination** (three-department merge on SEC-104)
7. **Before/after metrics** (block time saved, availability gain)
8. **Weekly and monthly plans** (sanctioned + AI-optimised blocks side-by-side)
9. **Train operations integration** (WTT, goods forecast, COA windows)
10. **Role separation** (admin vs. staff access control)

**Key talking points:**

- *The visual* — track health drives rendering, no generic dashboard aesthetics
- *The coordination* — the SEC-104 three-department merge in 165 min vs. 330 min
- *The reasoning* — every block carries its full decision trail
- *The readiness for integration* — the engine is a deterministic stand-in; swapping in the real service is one function call
- *The role model* — staff see only visualiser, tickets and track records; admins see the full planning suite

---

Built for **Smart India Hackathon 2026**, Northern Railway · Delhi Division problem statement.
