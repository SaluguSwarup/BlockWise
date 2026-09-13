BlockWise — Master Feature Plan (3 teams + integrator)
Context
BlockWise is a frontend-only SIH 2026 prototype: a React SPA where every record is a static file and every change lives in browser memory. Nothing survives a reload. The planning engine runs in the browser. The backend is a stub. There is no database, no authentication and no tests.

We are building the real system with three teams working in parallel and a fourth person who owns nightly integration during Days 1–3 and coordinates integration from Day 4 onward.

Integration is continuous, not a Day-4 event. Teams A and C build real implementations and expose real endpoints as they go. Team B consumes each endpoint as soon as it is available and develops the UI against the real response. The frozen mock layer exists only as a fallback for endpoints that do not exist yet, and every mock follows the same contract as the real endpoint it stands in for, so switching is a substitution rather than a rewrite.

The model this plan preserves throughout:

A = real and changing locally      exposes real endpoints from Day 1  (/dev/data)
C = real and changing locally      exposes the real planner from Day 2 (/dev/planner)
B = builds against real endpoints as they appear; frozen mocks only where nothing exists yet
Days 1–3   parallel development + rolling feature-level integration
Day 4+     final end-to-end integration and stabilisation
Nightly batch merges during Days 1–3; normal collaborative development from Day 4 onward
This document defines WHAT each team must deliver each day, WHY, and — for every endpoint — WHO consumes it and WHEN. It deliberately does not prescribe files, algorithms or commands. A developer takes one feature, asks Claude to inspect the repository and propose an implementation, builds it, then asks Claude separately how to verify it locally. The plan states only the acceptance condition each feature must satisfy.

Team B never has to invent an endpoint. For every piece of data B needs, this plan names the endpoint, its owner, the day it ships, and the day B switches to it.

The planning engine is two stages, not one
The engine Team C owns is conceptually a scoring stage followed by an optimiser, with a frozen contract between them:

Railway source data  →  Planning Input  →  ML scoring interface  →  urgency / criticality / priority scores
                                                                              ↓
                                                                       Block Optimizer
                                                                              ↓
                                                                   Optimised block schedule
                                                                              ↓
                                                             POST /api/plan  →  Team B UI
The scoring stage answers one question — how urgent and how critical is this maintenance work? The optimiser answers a different one — given those priorities and every railway operational constraint, what block schedule should actually be created? The scoring stage is where a machine-learning model belongs, and defining that boundary now is what lets a model be added later without touching the optimiser.

No trained ML model is implemented in this version. Behind the scoring interface sits a deterministic placeholder, clearly labelled as such in every response it returns. No model is trained, no training data exists, and no accuracy, precision, recall or other model-performance figure is claimed anywhere in this project or its proof material. The optimiser is not ML and is not being replaced by ML; it remains Team C's main body of work, exactly as planned.

1. Pre-Day-1 repository and workflow restructuring
Owned entirely by the fourth person, merged before any team starts. These are conditions that must be true on Day 1 morning, not a task list.

R1 — Ownership boundaries exist in the repository. Each team has directories only it writes to, and the boundaries are written down. Where a team needs a foothold inside another team's area (Team B needs a server-side place to issue auth tokens; Team C needs a place to expose the planner over HTTP), it gets its own dedicated folder there rather than sharing a file. Why: three PRs must be mergeable at night with near-zero conflict.

R2 — Cross-team contracts are frozen. One document defines: the API response envelope; the record shapes the APIs will return (these are simply the shapes the current UI already renders, so nothing needs designing); the PlanningInput → PlanningOutput boundary; the ScoringInput → ScoringOutput boundary between the scoring stage and the optimiser; and the date/time and identifier conventions. After this, contracts may only be added to, never renamed or removed. Why: this is what lets Team B build against a mock today and swap in the real endpoint tomorrow without touching the screen.

R3 — Team B has a frozen mock layer that mirrors the real contracts. Today's data files plus one canned planner result are set aside as B's fixtures, with priority scores already baked into the request records so B never computes anything. Those baked scores follow the ScoringOutput score shape, so when the real planner arrives the priority display on B's screens is a substitution rather than a rework. Each mock is shaped exactly like the endpoint it stands in for, so replacing it is a one-line change in the data access layer. Mocks are retired one endpoint at a time as the real endpoints appear — not all at once on Day 4. Why: B is never blocked, and B never builds against a shape that will not exist.

R4 — The planning engine is extracted out of the frontend. The engine moves into its own package that takes a PlanningInput and returns a PlanningOutput, and is forbidden from importing the database, the backend or the frontend. Inside that package the scorer and the optimiser are two separately replaceable parts: the scorer turns requests into scores, the optimiser turns scored requests into a schedule, and the optimiser may not compute or override a score itself. The existing prototype's scoreRequest logic is extracted behind the scorer interface and relabelled as the placeholder it is. Why: this boundary is what lets Team C work on synthetic data while still exposing a real endpoint B can call, and the inner boundary is what lets a trained model replace the placeholder later without the optimiser being rewritten.

R5 — The backend shell mounts each team's modules without a shared edit. Adding a new API area must not require editing a file another team also edits. An authentication placeholder with its final shape exists so A and C can protect routes from Day 1 while B fills in the real logic. Why: removes the single most likely nightly conflict.

R6 — Development views exist and are development-only. /dev/data and /dev/planner are registered inside the same application, behind a flag, with a separate folder for Team A and Team C. They never appear in a production build. Why: A and C must see their real, changing work every day without disturbing B's product UI.

R7 — One test runner, all dependencies, and CI are installed once. Every dependency the week will need is added up front, one test runner is chosen, and CI runs the suite on every PR. Why: if three teams each add a runner and dependencies on Day 1, the first nightly merge is a dependency fight.

R8 — Nightly merge machinery is in place for Days 1–3. Code ownership is recorded so a cross-boundary PR is flagged automatically, an integration log exists, and there is a convention for tagging a healthy main each night. The integration log's most important job is announcing which endpoints became available tonight and who should now switch off a mock. Why: continuous integration only happens if availability is announced; otherwise B forgets and drifts back to mocks. The merge routine retires on Day 4; the integration log carries on.

2. Team ownership and dependency rules
2.1 Who owns what
Team	Owns	Sees their work through
A — Data & Track Intelligence	Database and schema · railway data models · TMS/SMMS/TDMS/COA/BDMS integration · data normalisation · track, section, defect, maintenance and health information · train operations data · the APIs that expose all of it to Team B and to the planner	/dev/data — their real database and APIs
B — Product Application	The application UI and navigation · track visualisation and detail screens · block planning screens · ticket screens · authentication · authorisation, roles and permissions · application state · the data access layer that switches each screen from mock to real endpoint · loading and error behaviour	/app/* — the product UI, progressively backed by real endpoints
C — Planning & Optimisation	The real planning and optimisation engine · the ML scoring interface and its deterministic placeholder scorer · the block optimiser · constraints · block clubbing · train-aware scheduling · explainability · its own synthetic test scenarios · the planner endpoint B calls · the daily proof-of-concept material	/dev/planner — their real engine on synthetic scenarios
4th person	Pre-Day-1 restructuring · Days 1–3: nightly merges, conflict resolution, keeping main healthy, announcing newly available endpoints in the integration log · Day 4 onward: coordinates integration rather than gatekeeping merges · throughout: the only person who may change a frozen contract	The nightly green main (Days 1–3)
A and C never use mocks. Their implementations are real from Day 1 and change daily. The frozen mocks exist only for Team B, and only for endpoints that do not exist yet.

2.2 The rules that make parallel work possible
Rules 1, 2 and 5 apply to Days 1–3 only. From Day 4 onward, same-day cross-team dependencies are expected and normal.

No same-day cross-team dependency — Days 1–3. You may consume anything already in main; you may not consume something another team is writing today. This is not a bar on integration — it simply means an endpoint shipped today becomes available to its consumer tomorrow morning.
A dependency on another team must already be in main from a previous night — Days 1–3 — or be represented by a mock that follows the same contract.
Contracts are additive-only after Pre-Day 1. Add a field freely; never rename or remove one. This holds for the whole week, and it is what makes rolling integration safe.
Frozen files stay frozen. Only the fourth person edits them, and only with all three leads informed. This holds for the whole week.
Stay inside your boundary — Days 1–3. A PR touching another team's area is returned, not debated. From Day 4 the boundaries relax to whatever integration requires, though each team remains the owner of, and accountable for, its own area.
Switch off a mock as soon as its endpoint is available. Do not carry a mock forward "until Day 4." Each carried-forward mock is an integration surprise deferred to the worst possible moment.
2.3 What "available" means, and why integration is continuous
Term	Meaning
Ships Day N	The owning team raises the PR on Day N; it merges that night
Available Day N+1	From the next morning's main, the consuming team can build against it
Switch day	The day the consumer replaces the mock with the real endpoint — normally Day N+1
So an endpoint Team A ships on Day 1 is in Team B's hands on Day 2. This is what makes integration continuous while the nightly merge model stays intact: nobody depends on unmerged work, and nobody waits three days either.

If the teams choose to coordinate directly and pull each other's branch, they may — that is a bonus, not the plan. The plan's guarantee is availability on the next morning.

Screens may be part real and part mocked, and that is expected. Team B's planning screen, for instance, calls the real planner from Day 3 while its request register is still mocked until Day 4. There is no rule that a screen must switch over all at once.

2.4 Endpoint availability catalogue
This is the contract between the teams. Team A and Team C: expose these by the day stated. Team B: consume them on the switch day stated.

Available Day 2 — shipped Day 1
GET /api/sections            (list)
GET /api/network             (corridors, stations, schematic geometry)
  Owner        A  (feature A3)
  Ships        Day 1        Available  Day 2
  Consumer     B  (B4 network visualisation, B5 track detail entry)
  Used for     the schematic line diagram, corridor filtering, the section register,
               and health-driven rendering of each section
  Mock before  yes — frozen section and network fixtures in the same shape
  Switch       Day 2, at the start of B4
  Unlocks      B4 is built against real section data from the outset; the health bands
               drawn on the map reflect real health values, not fixture values
Available Day 3 — shipped Day 2
GET /api/sections/:id        (full record: engineering, signalling, traction views)
GET /api/sections/search
GET /api/sections?filters
  Owner        A  (feature A4)
  Ships        Day 2        Available  Day 3
  Consumer     B  (B5 track detail, B4 search)
  Used for     the full track record drawer and section search by number, track id,
               route or corridor
  Mock before  yes — the frozen track record fixture
  Switch       Day 3, when B5 is being completed
  Unlocks      the three departmental tabs render real asset data; search returns real
               matches instead of filtered fixtures
GET /api/defects             GET /api/overdue
GET /api/sections/:id/defects
GET /api/sections/:id/health (including history for a trend)
  Owner        A  (feature A5)
  Ships        Day 2        Available  Day 3
  Consumer     B  (B5 track detail, B6 ticket context, B8 dashboard)
  Used for     the per-section defect and overdue registers, the health indicator and
               its trend, and the division-wide defect counts on the dashboard
  Mock before  yes — frozen defect and overdue fixtures
  Switch       Day 3 for B5; Day 3 for B8's defect and health figures
  Unlocks      health indicators become live; the "sections needing attention" list is
               computed from real defects rather than a fixed list
GET /api/operations/timetable        GET /api/operations/goods-forecast
GET /api/operations/windows?section=&date=
GET /api/operations/corridor-status
  Owner        A  (feature A6)
  Ships        Day 2        Available  Day 3
  Consumer     B  (B5 next-available-window, B8 operations screen)
  Used for     the working timetable extract, goods forecast, corridor availability and
               the block windows shown on a track record
  Mock before  yes — frozen timetable and window fixtures
  Switch       Day 3, as B8 is built
  Unlocks      the operations screen shows real Control Office data; a track record's
               "next available window" becomes a real dated window
POST /api/plan               (planner over HTTP)
  Owner        C  (feature C7)
  Ships        Day 2        Available  Day 3
  Consumer     B  (B7 planning engine screen)
  Used for     running the plan from the application and rendering the result — blocks,
               metrics, merges and reasoning
  Internally   the endpoint calls the scoring interface first and hands the returned
               scores to the optimiser. This is invisible to Team B: what B sends and
               what B receives are unchanged by it
  Mock before  yes — the canned planner result, which follows C's contract exactly
  Switch       Day 3, when B7 is built. B7 calls the real planner from the day it exists
  Unlocks      the planning screen stops being a rehearsed animation over a fixed result
               and becomes a real request-in, plan-out flow. C's later improvements then
               reach B automatically without any frontend change

Internal to Team C — not part of Team B's contract surface
POST /api/ml/score           (the scoring stage over HTTP)
  Owner        C  (feature C2)
  Ships        Day 1 as an in-process interface; Day 2 over HTTP, with C7
  Consumer     Team C's own optimiser — NOT Team B, on any day
  Used for     turning maintenance requests into urgency, criticality and priority scores
               before the optimiser runs
  Status       the implementation behind it is a deterministic placeholder, not a trained
               ML model. It is exposed over HTTP so that a future model — possibly a
               separate service in another language — can replace it behind the same
               contract without the optimiser changing
  Team B       never calls this. B calls POST /api/plan and receives the final plan
Available Day 4 — shipped Day 3
GET /api/requests            PATCH /api/requests   (select / reject, single and bulk)
GET/POST/PATCH /api/tickets  (full lifecycle)
GET /api/blocks              (sanctioned and committed blocks for the schedule)
  Owner        A  (feature A9)
  Ships        Day 3        Available  Day 4
  Consumer     B  (B6 ticket interface, B7 request register, B8 schedule)
  Used for     the block request register and its selection, the inspection ticket
               register and raising a ticket, and the weekly/monthly schedule
  Mock before  yes — frozen request, ticket and block fixtures with optimistic writes
  Switch       Day 4
  Unlocks      writes become persistent — a raised ticket and a committed plan survive
               a reload, which is what turns the demo into a working system
GET /api/sources             POST /api/sources/:code/sync
/integrations/{tms,smms,tdms,coa,bdms}
  Owner        A  (feature A8)
  Ships        Day 3        Available  Day 4
  Consumer     B  (B8 dashboard source-system strip)
  Used for     the "five source systems connected" strip with genuine last-sync times
               and record counts
  Mock before  yes — the frozen source-systems fixture
  Switch       Day 4
  Unlocks      the integration story on the dashboard becomes true rather than decorative
Enriched plan output — train-aware figures, multi-day horizon, full reasoning trail
  Owner        C  (features C9, C10 — same POST /api/plan, additive fields only)
  Ships        Day 3        Available  Day 4
  Consumer     B  (B7 block reasoning display, B8 multi-day schedule)
  Used for     showing why a block was merged, why its window was chosen, what was
               rejected, and laying blocks across several days on the schedule
  Mock before  not needed — B is already calling the real planner from Day 3; these are
               additive fields on a response B already receives
  Switch       Day 4 — B renders the new fields as they appear
  Unlocks      the explainability panel and the multi-day view become real
GET /api/planning-input
  Owner        A  (feature A10)
  Ships        Day 3        Available  Day 4
  Consumer     C  (feature I1) — not Team B
  Used for     feeding the real division's data into the real planner in place of
               Team C's synthetic scenarios
  Mock before  Team C uses its own synthetic scenarios, built to the same contract
  Switch       Day 4
  Unlocks      the complete chain: real railway data → real planner → real UI
2.5 How verification works in this plan
Each feature states an acceptance condition — the observable behaviour that proves it genuinely works. It does not state the commands. After implementing a feature, ask Claude for the exact verification steps for that specific feature.

Verification is deliberately different for each team, and should use the simplest environment that actually proves the behaviour:

Team A — change a value at the source, run the real data load or sync, and confirm the changed value appears in /dev/data read from the database. Proving the data is real matters more than proving an endpoint returns 200.
Team C — run the real engine directly against a controlled scenario and inspect the actual output and the day's proof material. Inspect the scoring output and the optimiser output separately, so it is always visible which stage produced which number. Proving the optimisation happened matters more than proving the code ran.
Team B — run the frontend and perform the actual user interaction. For a switched-over screen, the check is stronger: change a value in the database, reload the screen, and see the new value — which proves the screen is genuinely on the real endpoint and not silently still on a mock.
Avoid any check that only proves "the code runs."

3. Day 1
Team A — Day 1
A1 · Railway database and schema

Provides: a real persistent store modelling the division — corridors, stations, sections, the three departmental asset views, defects, overdue work, block requests, inspection tickets, timetable, goods forecast, block windows and sanctioned blocks. Block windows must be held per section per date, not as a single undated template, because the planner will later schedule across a horizon.
Why: everything Team A builds this week rests on this, and today the application forgets everything on reload.
Dependencies: none beyond Pre-Day 1.
Acceptance: the schema holds every piece of information the current track record screen displays, with nothing lost, and windows can be asked for by section and date.
Boundary: database and backend only. Do not touch the frontend outside Team A's development view.
A2 · Seeded railway dataset

Provides: the full division loaded into the database — reproducibly, in a fixed order, so every developer's database is identical, and re-loading twice gives the same result.
Why: three developers with silently different data is the most expensive failure mode in a parallel week; the demo also needs a known, resettable state.
Dependencies: A1.
Acceptance: the loaded record counts match the existing dataset exactly, and running the load twice produces an identical database. A deliberate change to a source value appears in the database after reloading.
Boundary: as A1.
A3 · First read endpoints and Team-A development view (v1)

Exposes: GET /api/sections (list) · GET /api/network (corridors, stations, geometry) — consumed by B4 and B5 from Day 2.
Provides: the first two real read endpoints, plus /dev/data showing database connection status, record counts per entity, and a browsable section list — built on those same endpoints, so the development view proves the API works rather than bypassing it.
Why: Team A must see its own real work from Day 1, and shipping these two endpoints today is what lets Team B start building against real data tomorrow instead of waiting.
Dependencies: A1, A2.
Acceptance: changing a value in the seed source, reloading the data and opening /dev/data shows the new value — proving the view reads the database through the real API and not any mock file.
Boundary: Team A's backend modules and development-view folder. Do not touch /app/* or Team B's fixtures.
Team B — Day 1
B1 · Application data access layer with per-endpoint mock/live switching

Provides: a single place through which every screen requests data, with consistent loading and error handling, and a switch that resolves each request either from the frozen fixture or from the real endpoint — decided per endpoint, not globally.
Why: this is the mechanism that makes rolling integration possible. A global mock/live flag would force B to switch everything at once; per-endpoint switching lets B move each screen the moment its endpoint appears.
Data source: all fixtures on Day 1; the first two endpoints (/api/sections, /api/network) become available tomorrow.
Dependencies: the frozen fixtures and contracts from Pre-Day 1.
Acceptance: an individual endpoint can be flipped from fixture to real without touching any screen; with the backend stopped, a live-mode endpoint shows a clear error rather than a blank page or a crash.
Boundary: the frontend and Team B's authentication folder. Never modify the frozen fixtures.
B2 · Real authentication

Provides: a genuine sign-in — credentials checked server-side, a session token issued and stored, the signed-in user's profile available to the application, and sign-out.
Why: the current entry screen is a role picker with no password; the problem statement expects real access control. Auth is Team B's responsibility, and the token must be issued server-side.
Data source: Team B's own backend module. The two officer accounts come from the existing fixture data, held locally by Team B — not from Team A's database, which is being built the same day.
Dependencies: none from other teams.
Acceptance: a wrong password is rejected; a correct one signs the user in; the session survives a page reload; signing out ends it.
Boundary: Team B's frontend and its own authentication module in the backend. Do not touch Team A's database or APIs.
B3 · Authorisation, roles and restricted access

Provides: role-driven access — the administrator sees the full planning suite, field staff see only the visualiser, track records and tickets. Restricted areas are both hidden from navigation and blocked when reached directly by URL.
Why: the two-role separation is an explicit part of the product story and must be enforced, not merely visual.
Dependencies: B2.
Acceptance: signed in as staff, the block planning section is absent from navigation, and typing any of its addresses directly produces a clear "restricted" response rather than the page.
Boundary: as B2.
Team C — Day 1
C1 · Planning contract and synthetic scenario library

Publishes: the PlanningInput → PlanningOutput contract — Team A builds A10 against it; Team B's canned planner fixture must follow it exactly. Also publishes the internal ScoringInput → ScoringOutput contract that C2 defines, so both boundaries are frozen on the same day.
Provides: a written definition of what the engine takes in and gives back, plus Team C's own set of synthetic test scenarios — small, hand-controlled, and covering at minimum one basic case and one where three departments want the same section on the same night.
The PlanningInput must additionally carry everything the scoring stage needs, because the scorer is fed from it: per request, the declared activity criticality, the urgency raised by the department, the safety-consequence class, overdue days and due date, last-performed date and scheduled frequency, estimated duration, department and source system; per section, the health index with enough history for a trend, track class, traffic density and any speed restriction in force; the defect and overdue records per section and department with severity, age and count; and the operational context — the traffic profile and corridor status — already required by the optimiser. The synthetic scenarios must carry these same fields, or the scoring stage cannot be exercised on them.
Why: the scenarios are what make Team C independent of Team A's data, and the contract is what lets B build a planning screen today that will still work when the real planner arrives. Carrying the scoring inputs from Day 1 is what stops A10 having to be reopened later to add fields a model needs.
Dependencies: the contract shape agreed Pre-Day 1.
Acceptance: the scenarios are committed, readable, and can be fed to the scorer and then to the optimiser without any database or backend running. The contract is specific enough that B's canned fixture and A's Planning Input can both be checked against it. The optimiser-facing contract is otherwise unchanged from what was agreed Pre-Day 1.
Boundary: the engine package, Team C's backend module and Team C's development view. Do not touch the database, Team A's APIs or the product UI.
C2 · ML maintenance scoring interface

Exposes: the scoring boundary — score(ScoringInput) → ScoringOutput — as an in-process interface from today, and over HTTP as POST /api/ml/score from Day 2 alongside C7. Consumed by Team C's own optimiser. Not consumed by Team B, on any day.
Provides: the frozen contract for the scoring stage, and a deterministic placeholder implementation sitting behind it so C3 and everything after it can actually run.

This is not a trained ML model and must not be represented as one. The placeholder exists only so that the optimiser can run end to end and so that the interface itself can be exercised and tested. No model is trained, no training data is collected, and no accuracy, precision, recall or other performance figure is claimed for it — in the proof documents, the development views, the UI or the submission. Where the implementation is named anywhere, it is named as a placeholder for a future ML scorer.

The contract, in six parts:

1. Input — ScoringInput, assembled from the PlanningInput (see C1) and therefore ultimately from TMS, SMMS, TDMS, COA and BDMS through Team A:
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

2. Output — ScoringOutput:
     scorerStatus  { implementation: "deterministic-placeholder", trained: false,
                     model: null, version: "placeholder-0.1",
                     note: "Placeholder for a future ML scorer. Not a trained ML model." }
     scores[]      { requestId, urgency, criticality, priority, band,
                     factors[] { key, label, value, weight, contribution, note },
                     explanation { summary, featureContributions[] },
                     confidence }
     unscored[]    { requestId, reason }

3. Meaning and range — urgency, criticality and priority are each an integer from 0 to 100, higher meaning more pressing. Urgency is time pressure: how soon this must happen, from overdue days, due date and rate of deterioration. Criticality is consequence severity if it is not done, from the safety class, the asset's criticality and the traffic it carries. Priority is the combined value the optimiser orders by. Band (LOW / MEDIUM / HIGH / CRITICAL) is a presentation convenience derived from priority; the optimiser uses the number, never the band.

4. How the optimiser consumes it — priority for selection and merge ordering, urgency for placement within the multi-day horizon, criticality as a tie-break against traffic disruption. The optimiser never computes, recomputes or overrides a score, and never inspects scorerStatus to change its behaviour — it must work identically whatever is behind the interface. A request that appears in unscored[] is not silently given a default: it is left out of the plan and reported in the PlanningOutput as unscheduled with the reason carried through, so a missing score is visible rather than invented.

5. Explanation slots — factors[] carries the per-factor value, weight, contribution and a readable note, exactly as the prototype already does. explanation.featureContributions[] and confidence are reserved slots for a future model's own explanation and are left empty by the placeholder. They exist now so that adding a model later is an additive change, not a contract change.

6. Status — every response declares scorerStatus. Anything rendering or reporting a score must be able to show that status, so no screen and no document can present a placeholder score as a model output.

Current implementation: a transparent deterministic weighted combination of the supplied features — the same six factors the prototype uses today (activity criticality, departmental urgency, safety consequence, asset health deficit, overdue status, impact on asset availability), each with its contribution reported. It is arithmetic over the input, chosen because it is explainable and reproducible, and it is labelled as a placeholder everywhere it surfaces.

Why: prioritisation is a core requirement and ML is an expected part of the solution, but the honest thing to build this week is the boundary rather than a model we have not trained. Defining and exercising the interface now is what makes the eventual model a substitution behind a frozen contract instead of a rewrite of the optimiser — and the per-factor breakdown is what keeps the score defensible in front of a judge in the meantime.
Dependencies: C1.
Acceptance: the same ScoringInput always produces an identical ScoringOutput; urgency, criticality and priority are within range and the per-factor contributions reconcile with the total; every response carries scorerStatus identifying the implementation as a placeholder; a request with missing inputs appears in unscored[] with a reason rather than receiving an invented score; and — the test that proves the boundary is real — substituting a second, deliberately different stub scorer behind the same interface changes the resulting plan without a single line of the optimiser changing.
Boundary: as C1.
C3 · Basic planner with cross-department block clubbing

Provides: the first working planner — the two stages joined. The planner first calls the scoring interface (C2) to obtain urgency, criticality and priority for every maintenance request, then hands those scored requests to the optimiser, which groups requests that share a section and a date, combines compatible work from different departments into a single block instead of separate ones, computes the combined duration realistically, chooses a block window, and reports the saving. The optimiser consumes the scores as given and does not recompute them.
Why: this is the central claim of the entire project: three departments taking three separate blocks on the same section should take one. Routing the scores through the interface from the very first working planner is what ensures the optimiser is never written against a scoring implementation, only against the contract.
Dependencies: C1, C2.
Acceptance: a scenario with engineering, traction and signalling work on one section and one date produces one block whose duration is materially less than the three run separately, and the plan states how much time was saved. The blocks in that plan are produced by the optimiser; the scorer produces no blocks and no schedule.
Boundary: as C1.
C4 · Day-1 proof of concept and Team-C development view (v1)

Provides: a small document plus a visual, generated from an actual run, containing: the test scenario, a before-versus-after comparison, a simple timeline or block picture, the resulting metrics, whether the expected behaviour was achieved, and any limitation observed — with the two stages shown separately rather than as one opaque run:
  1  scoring inputs      the request, asset, defect and operational features fed to the scorer
  2  scoring outputs     the urgency, criticality and priority returned, with the per-factor
                         contributions, and scorerStatus printed verbatim
  3  optimiser inputs    those scored requests, plus the windows, constraints and resources
  4  optimiser outputs   the blocks, the merges, the chosen windows and the metrics
The document makes no claim about model quality or ML performance — there is no trained model, and the proof states plainly that the scores came from a deterministic placeholder. What it demonstrates is the optimisation. /dev/planner shows the same run interactively, with the scoring output visible as a distinct stage before the optimiser's.
Why: this is the project's evidence. We must be able to show that the planner performs the optimisation we claim, not assert that it does — and separating the stages is what makes it clear the optimisation is the optimiser's work, not the scorer's. The development view is how Team C watches its own engine improve day by day.
Dependencies: C3.
Acceptance: the document is regenerated from a real run rather than written by hand, it carries the four stages above with scorerStatus shown, it contains no accuracy or model-performance figure of any kind, and it shows something of this form with real figures:
BEFORE   Engineering block · Traction block · S&T block          three blocks, N minutes total
AFTER    Engineering + Traction + S&T in one shared block         one block, M minutes
SAVED    N − M minutes, two fewer corridor blocks
Boundary: as C1.
Continuous integration during Day 1
Nothing is consumable yet — this is the only day on which that is true, because nothing has been merged. All three teams work entirely within their own areas.

What becomes available tonight, for tomorrow:

Merged tonight	Owner	Consumer tomorrow
GET /api/sections, GET /api/network	A (A3)	B4, B5 switch off their section and network fixtures on Day 2
Planner and scoring contracts published	C (C1, C2)	A builds A10 against the planner contract, including the fields the scoring stage needs; B's canned planner fixture is checked against it. The scoring contract is internal to Team C — nothing for A or B to consume
Authentication and session	B (B2)	A and C may protect their routes from Day 2 if they wish
The fourth person records these in the integration log so Team B starts Day 2 knowing exactly which two fixtures to retire.

4. Day 2
Team A — Day 2
A4 · Track, section and network information APIs

Exposes: GET /api/sections/:id (full record) · GET /api/sections/search · filters on GET /api/sections — consumed by B5 and B4 from Day 3.
Provides: the ability to list sections with filters, retrieve one section's complete record including its engineering, signalling and traction views, search by section number, track identifier, route or corridor, and read the network topology.
Why: the visualiser, search and track record are the most-used screens in the demo, and B is already rendering them — from tomorrow it renders them from real data.
Dependencies: A1, A2, A3 (own).
Acceptance: a section's record returned by the API contains every field the current track record screen displays — nothing missing, nothing renamed. This is what makes B's switch a substitution.
Boundary: database and backend. Do not touch the product UI or Team B's fixtures.
A5 · Defect, maintenance requirement and track-health information

Exposes: GET /api/defects · GET /api/overdue · GET /api/sections/:id/defects · GET /api/sections/:id/health — consumed by B5, B6 and B8 from Day 3.
Provides: division-wide defect and overdue registers with filtering, department-wise maintenance requirements, and each section's health with enough history to show a trend.
Why: defects, overdue work and asset health are exactly what drives maintenance priority — they are the substance the planner reasons over and the substance the track record displays.
Dependencies: A4.
Acceptance: the worst section on the division returns its full defect and overdue list, and the totals reconcile with the division-wide registers.
Boundary: as A4.
A6 · Train operations and block-window availability

Exposes: GET /api/operations/timetable · /goods-forecast · /windows?section=&date= · /corridor-status — consumed by B5 and B8 from Day 3; required by A10 on Day 3.
Provides: the working timetable, the goods forecast, corridor status, and the published block windows for a given section and date, together with a traffic profile across the day.
Why: these are the Control Office inputs the planner must optimise against, the operations screen displays them directly, and the Planning Input cannot be assembled without them.
Dependencies: A1.
Acceptance: asking for windows for a specific section on a specific date returns dated windows with their traffic characteristics, and the timetable can be queried by corridor.
Boundary: as A4.
A7 · Team-A development view (v2)

Provides: /dev/data extended into a live browser over everything built so far — pick a section and see its record, defects, health and windows, all read from the real database through the real APIs.
Why: Team A's daily proof that the data is not just stored but correctly assembled and served, and the fastest way to confirm an endpoint is ready for Team B before it merges.
Dependencies: A4, A5, A6.
Acceptance: every new API from today is reachable and inspectable through the view, and a value changed at source appears there after a reload of the data.
Boundary: Team A's development-view folder only.
Team B — Day 2
B4 · Network and track visualisation experience

Data source: switches today — GET /api/sections and GET /api/network (A3, available this morning). Search stays on the fixture until Day 3, when GET /api/sections/search arrives.
Provides: the schematic line diagram, corridor filtering, pan and zoom, hover detail, section search, and health-driven rendering — all fed through the data access layer.
Why: the visualiser is the product's centrepiece. Building it against the real endpoint from the first day it exists means the response shape is validated by a real screen rather than by a schema.
Dependencies: B1; A3 (in main from Night 1).
Acceptance: the map and health rendering work against the real endpoints, and changing a section's health in the database and reloading changes what the map draws — proving the screen is genuinely live.
Boundary: the frontend. Never modify the frozen fixtures; never call the engine package.
B5 · Track detail and record experience

Data source: the section list from GET /api/sections (live today); the full record, defects, health and windows stay on fixtures until Day 3, when A4, A5 and A6 arrive. Building against the fixture is safe because it is shaped like the endpoint.
Provides: the full section record — identity, health against threshold, status, the engineering, signalling and traction tabs, the defect and overdue registers, block status and the next available window — opened from the map or the section list.
Why: this is the screen a field engineer actually works from, and it feeds the ticket flow.
Dependencies: B4.
Acceptance: opening any section shows its complete record with all three departmental tabs populated, and the drawer opens and closes cleanly from every entry point.
Boundary: as B4.
B6 · Inspection and defect ticket experience

Data source: fixtures with optimistic writes. Switches to GET/POST/PATCH /api/tickets (A9) on Day 4; defect context switches on Day 3 with A5.
Provides: raising an inspection ticket from an open track record with the section data attached automatically, and the ticket register with filtering, status and detail.
Why: this is the field-to-plan chain and the one write action a staff user performs.
Dependencies: B1, B5.
Acceptance: raising a ticket produces a new ticket with the section data attached and shows it in the register; a simulated failure shows a clear error rather than silently doing nothing.
Boundary: as B4.
Team C — Day 2
C5 · Activity compatibility, exclusive occupation and power-block rules

Provides: real rules, applied by the optimiser to requests that already carry their scores from the scoring stage, about what can and cannot share a block — which departmental activities are compatible, which work demands sole occupation of the section and must stay a stand-alone block, and how a power block (overhead line isolation) acts both as a prerequisite for traction work and as a bar on certain concurrent engineering work.
Why: without this the planner merges naively. A judge will ask "what if two jobs cannot share a block?" and the answer has to be in the engine, not in the pitch.
Dependencies: C3.
Acceptance: a scenario mixing compatible work with one exclusive-occupation request produces separate blocks for the exclusive one, and the plan states why it was kept apart.
Boundary: the engine package, Team C's backend module and development view.
C6 · Resource conflicts and departmental coordination

Provides: awareness in the optimiser that the division has limited resources — gangs and heavy machinery of which there may be only one — so two blocks that need the same machine on the same night are in conflict. Plus a realistic coordination allowance when several departments share a block. Resource availability is a hard constraint the optimiser enforces; a high score never overrides it, it only decides which of the competing jobs gets the contended night.
Why: resource contention is what genuinely forces work to be spread across nights, and it is the reason multi-day scheduling on Day 3 is necessary rather than decorative.
Dependencies: C5.
Acceptance: a scenario with two jobs competing for the same machine on one night does not schedule them together, and the plan names the conflict as the reason.
Boundary: as C5.
C7 · Planner exposed over HTTP

Exposes: POST /api/plan — consumed by B7 from Day 3. Also mounts POST /api/ml/score in the same module — the scoring interface over HTTP, internal to Team C and not for Team B.
Provides: the real engine reachable as a service endpoint that accepts a planning input and returns the optimised plan, in the contract shape published on Day 1. Internally the endpoint runs the two stages in order: it calls the scoring interface, then invokes the optimiser on the scored requests. Team B sends the same request and receives the same plan shape either way — the staging is invisible from outside. Exposing the scorer separately over HTTP is what allows a future model, possibly a separate service in another language, to be swapped in behind the same contract without the optimiser or the plan endpoint changing.
Why: this is the single most valuable thing Team C can hand Team B, and handing it over now means B's planning screen is real from the day it is built. Every improvement C makes on Day 3 then reaches B automatically, with no frontend change.
Dependencies: C3, C5, C6.
Acceptance: the endpoint returns the same plan for a given scenario as running the engine directly, and it accepts an input in the published contract shape — so the same call will work unchanged when the input comes from Team A's database on Day 4. The response identifies the scorer status and version it used, and the schedule in it was produced by the optimiser, not by the scorer. POST /api/plan remains the only planner endpoint Team B calls.
Boundary: Team C's own backend module. Do not touch Team A's APIs or the product UI.
C8 · Day-2 proof of concept and development view (v2)

Provides: a regenerated proof document and visual covering the new compatibility and resource scenarios, and a re-run of the Day-1 scenario to show nothing regressed. Includes a direct comparison of the plan with and without optimisation, and keeps the four-stage separation introduced on Day 1 — scoring inputs, scoring outputs, optimiser inputs, optimiser outputs — with scorerStatus printed. /dev/planner shows scoring output and optimiser output as separate stages, and gains the ability to toggle constraints and watch the plan change; toggling a constraint changes the optimiser's result and leaves the scores untouched, which is itself worth showing.
Why: each day must show the planner is both still valid and now better. Re-running yesterday's scenario is the only way to prove the new constraints did not break the core claim.
Dependencies: C5, C6.
Acceptance: the Day-1 clubbing scenario still produces one merged block, the new scenarios behave as described, and the document records the actual figures plus any limitation observed.
Boundary: as C5.
Continuous integration during Day 2
Available to Team B this morning, from Night 1:

Endpoint	Owner	B switches today
GET /api/sections	A (A3)	B4 — the section register and the map
GET /api/network	A (A3)	B4 — corridors, stations and geometry
Team B retires those two fixtures today. Everything else on B4 and B5 stays on fixtures shaped to the same contract.

What becomes available tonight, for tomorrow:

Merged tonight	Owner	Consumer tomorrow
GET /api/sections/:id, /search, filters	A (A4)	B5 full record, B4 search
GET /api/defects, /overdue, /sections/:id/health	A (A5)	B5 defects and health, B8 dashboard
GET /api/operations/*	A (A6)	B5 next window, B8 operations screen
POST /api/plan	C (C7)	B7 — the planning screen is real from the day it is built
POST /api/ml/score	C (C2, C7)	internal to Team C — consumed by its own optimiser. No fixture retires for it, and Team B does not call it
5. Day 3
Team A — Day 3
A8 · Source-system integration layer

Exposes: GET /api/sources · POST /api/sources/:code/sync · /integrations/{tms,smms,tdms,coa,bdms} — consumed by B8 from Day 4.
Provides: the five railway source systems — TMS, SMMS, TDMS, COA and BDMS — represented as real, separately addressable sources, each presenting data in its own native shape, together with a process that pulls from them, translates into the BlockWise model and records what each synchronisation did.
Why: integrating these five systems is the literal requirement of the problem statement. Serving each one in its own shape is what makes the translation layer real work rather than a relabelled table.
Dependencies: A1, A2, A4.
Acceptance: changing a value inside one source system and running the synchronisation changes the corresponding value in the BlockWise data, and the source status reflects the run that just happened.
Boundary: database and backend. Do not touch the product UI or the engine.
A9 · Block request, inspection ticket and block APIs

Exposes: GET/PATCH /api/requests · GET/POST/PATCH /api/tickets · GET /api/blocks — consumed by B6, B7 and B8 from Day 4.
Provides: reading and updating block requests, including selection and rejection singly or in bulk; the full inspection ticket lifecycle with valid state transitions, assignment and outcome; and the sanctioned and committed blocks the schedule displays.
Why: these are the write paths behind Team B's request-selection, ticket and schedule screens. Until they exist, B's writes are optimistic and vanish on reload — this is what makes them persist.
Dependencies: A4.
Acceptance: a request's status change persists and is visible on re-reading, and an invalid state transition is refused with a clear reason rather than silently accepted.
Boundary: as A8.
A10 · Planning Input — the critical hand-off

Exposes: GET /api/planning-input — consumed by Team C (feature I1) from Day 4.
Provides: a single assembled input containing everything the planner needs for a given horizon: the sections and their health, the selected maintenance requests, the dated block windows, the timetable, the goods forecast and the available resources — validated against Team C's contract before it is returned.
Why: this is the bridge from Team A's real railway data to Team C's real planner. It ships today so Team C can consume it tomorrow from a merged main.
Dependencies: A1–A6, A8; Team C's contract, published Day 1.
Acceptance: the assembled input passes validation against Team C's committed contract, and it contains at least one section carrying three departmental requests on a single date — the flagship multi-department case.
Boundary: as A8. Do not modify the engine or its contract; satisfy the contract as written.
A11 · Team-A development view (v3)

Provides: /dev/data extended to show synchronisation status per source system and the assembled Planning Input with a clear valid/invalid indication.
Why: Team A needs to see, before handing over, that the input it produces is actually acceptable to the engine — rather than discovering it tomorrow with Team C sitting next to them.
Dependencies: A8, A10.
Acceptance: the view shows the Planning Input as valid against the contract, and a deliberate break in the data shows it as invalid with the reason.
Boundary: Team A's development-view folder only.
Team B — Day 3
B7 · Block planning experience

Data source: the planning run is real from today — POST /api/plan (C7, available this morning). The request register stays on the fixture until Day 4, when GET/PATCH /api/requests (A9) arrives. A part-real screen is expected and correct.
Provides: the administrator's planning flow — the block request register with priority, filtering and selection; the planning engine screen with its staged run and its result; the optimised plan with before-and-after metrics, the merged blocks and each block's reasoning; and committing the plan.
Why: these are the screens the entire demo is built around. Wiring the run to the real planner today means every improvement Team C makes on Day 3 and Day 4 shows up in the UI with no further frontend work.
Dependencies: B1; C7 (in main from Night 2).
Acceptance: selecting requests and running the plan calls the real planner and renders its actual response — the merged blocks and metrics on screen match what the engine returns for the same input. The screen still never imports the engine package; it calls the endpoint.
Boundary: the frontend. Never import the engine package; never modify the frozen fixtures.
B8 · Schedule, dashboard and operations experience

Data source: switches today for defects, health and operations — A5 and A6, available this morning. The source-system strip, the schedule's block list and committed blocks switch on Day 4 with A8 and A9.
Provides: the weekly and monthly block schedule with sanctioned and optimised blocks distinguished; the divisional dashboard with its indicators, charts, source-system strip and attention lists; and the train operations screen.
Why: these complete the demo path and are where the "less downtime, higher availability" story is actually shown.
Dependencies: B7; A5, A6 (in main from Night 2).
Acceptance: the operations screen and the dashboard's health and defect figures come from the real endpoints — changing a defect in the database and reloading changes what the dashboard reports.
Boundary: as B7.
B9 · Application robustness

Provides: consistent loading, error and empty states on every screen; a retry path when something fails; session expiry handled by returning the user to sign-in; and clear confirmation or failure feedback on every write.
Why: several screens are now genuinely on the network, and the network is slow and sometimes fails. A screen with no loading state looks broken during a live demonstration.
Dependencies: B1–B8.
Acceptance: with the backend deliberately stopped, every screen that is on a real endpoint shows a readable error with a way to retry — none shows a blank page, a spinner that never ends, or a crash. Screens still on fixtures continue to render.
Boundary: as B7.
Team C — Day 3
C9 · Train-aware window selection

Enriches: the POST /api/plan response with traffic figures per candidate window — additive fields only, so B7 keeps working unchanged and renders them from Day 4.
Provides: real operational awareness in the optimiser when choosing when a block runs, weighing the scored urgency and criticality of the work against the disruption each candidate window would cause — how many express, passenger and goods paths fall inside the period the block would actually occupy, how much disruption that represents, and which corridor and section constraints apply, including not blocking adjacent sections of the same corridor at the same time.
Why: "optimise against train operations" is the requirement that separates this from a generic scheduler, and it is where the planner's judgement becomes visible.
Dependencies: C3, C5, C7.
Acceptance: given a busy window and a quiet one that both fit, the planner chooses the quiet one and reports both, with the figures that decided it. Team B's existing planning screen continues to work without any change — proof the additive-only rule was respected.
Boundary: the engine package, Team C's backend module and development view.
C10 · Multi-day scheduling and explainability

Enriches: the POST /api/plan response with the reasoning trail and a multi-day horizon — additive fields only — rendered by B7 and B8 from Day 4.
Provides: scheduling across a horizon of several days rather than one date at a time, so that contended resources and limited corridor capacity spread work across nights, with the scored urgency deciding what claims the earlier nights. Every block carries a complete reasoning trail, at two distinct levels:
  scoring explanation    why this request carries the urgency, criticality and priority it
                         does, from the features supplied to the scorer — the per-factor
                         contributions, carried through from the ScoringOutput, alongside
                         the scorer's status. This level is deliberately thin today: there
                         is no trained model, so it reports the placeholder's arithmetic
                         and leaves the reserved slots for a future model's own explanation
  optimiser explanation  why this work was merged or kept apart, why this window was chosen,
                         which alternative was rejected and by how much, which hard
                         constraint bound the outcome, and what time, disruption or
                         resource was saved
Why: the horizon is what makes resource conflicts resolvable, and the reasoning trail is what makes the plan defensible to an operations officer who has to trust it. Keeping the two levels distinct matters for the same reason the stages are distinct: an officer needs to see separately why the work was judged pressing and why the schedule came out as it did.
Dependencies: C6, C9.
Acceptance: the same input always produces the same plan; work that cannot share a night is spread across the horizon rather than dropped; every block in the output carries a non-empty, readable optimiser explanation; and each scored request carries its score explanation with the scorer's status attached, so no score is displayed as if it came from a trained model.
Boundary: as C9.
C11 · Day-3 proof of concept and development view (v3)

Provides: a regenerated proof document and visual for the complex train-aware and multi-day scenarios, re-running the Day-1 and Day-2 scenarios as well to show the added realism has not broken the earlier behaviour. /dev/planner gains a multi-day view of the plan.
Why: by Day 3 the claim is no longer just "we merge blocks" but "we merge blocks correctly under real operational constraints." That has to be demonstrated, not asserted.
Dependencies: C9, C10.
Acceptance: the earlier scenarios still produce their expected merged blocks; the new complex scenarios produce valid plans that respect the train and resource constraints; the document keeps the scoring and optimiser stages and their two explanation levels distinct, records scorerStatus, and claims nothing about model performance; and it records the metrics and the limitations honestly — the absence of a trained model behind the scoring stage being named among them.
Boundary: as C9.
Continuous integration during Day 3
Available to Team B this morning, from Night 2:

Endpoint	Owner	B switches today
GET /api/sections/:id, /search, filters	A (A4)	B5 full track record, B4 search
GET /api/defects, /overdue, /sections/:id/health	A (A5)	B5 defect and health panels, B8 dashboard figures
GET /api/operations/*	A (A6)	B5 next available window, B8 operations screen
POST /api/plan	C (C7)	B7 — the planning run is real from the day the screen is built
By the end of Day 3, the only fixtures left in Team B's application are requests, tickets, blocks and the source-system strip — everything A ships today.

What becomes available tonight, for tomorrow:

Merged tonight	Owner	Consumer tomorrow
GET/PATCH /api/requests, /api/tickets, GET /api/blocks	A (A9)	B6, B7, B8 — the last fixtures retire
GET /api/sources, /integrations/*	A (A8)	B8 source-system strip
GET /api/planning-input	A (A10)	Team C (I1) — real data into the real planner
Train-aware and multi-day fields on the plan response	C (C9, C10)	B7 reasoning panel, B8 multi-day schedule
6. Day 4 onward — final integration
Day 4 is not the first time integration happens. By this morning Team B is already running against real section, network, defect, health, operations and planner endpoints. Day 4 is where the pieces that were integrated one at a time are brought together into the complete end-to-end flow.

The Days 1–3 PR and nightly-merge workflow ends here. From Day 4 onward the teams work normally and collaboratively on the integrated system. They sit together, make changes directly, test continuously, and resolve cross-team issues in real time. The fourth person coordinates integration rather than gatekeeping merges.

Day 4 may extend into Day 5 if needed. Getting the complete real chain working correctly matters more than finishing on a particular day. Do not cut integration short to protect the schedule.

Day 4 is primarily for:

completing the chain — Team A's real data into Team C's real planner, and that result into Team B's planning UI, with commit and persistence
retiring the last fixtures — requests, tickets, blocks and the source-system strip
resolving remaining cross-team mismatches that only surface with real data end to end
fixing integration bugs
validating the complete product against the acceptance flow below
handling anything that could not be integrated earlier
Railway source systems  →  Team A data  →  Planning Input
                                              ↓
                                    ML scoring interface        (placeholder implementation)
                                              ↓
                                 urgency / criticality scores
                                              ↓
                                      Block optimiser
                                              ↓
                                     Optimised block plan
                                              ↓
                                   Team B application UI  →  commit / persistence
                                              ↓
                                     dashboard and schedule
Everything Day 4 needs is already in main. This is the starting point for integration, not a constraint on it — from here teams work directly with each other's current changes rather than waiting for anything to be merged.

I1 · Real Planning Input feeding the real planner — Teams A and C together

Provides: the engine consuming GET /api/planning-input instead of synthetic scenarios — the real input feeding the scoring interface, and the resulting scores feeding the optimiser — with both stages re-tuned where real data volumes and characteristics reveal it is needed.
Why: this is the join the entire project depends on, and the one edge that has not been exercised during Days 1–3. It is also the first time the scoring stage sees real railway features rather than the hand-made ones in Team C's scenarios.
Dependencies: A10 (in main from Night 3), C7, C10.
Acceptance: the real Planning Input is accepted by the scoring interface and every real request comes back with in-range urgency, criticality and priority, or appears in unscored[] with a reason; and a plan produced from that input contains real section identifiers and real request identifiers, with the flagship multi-department case still merging into a single block. The scorer behind the interface is still the placeholder, and the output still says so.
Boundary: Team A adjusts the input; Team C adjusts the engine. Mismatches are fixed on the side that owns them.
I2 · The last fixtures retired — Teams A and B together

Provides: Team B's remaining fixtures — requests, tickets, blocks and the source-system strip — replaced with A9 and A8's endpoints, with any shape mismatches resolved and any missing filters or fields added.
Why: these are the write paths. Until they are real, a raised ticket and a committed plan vanish on reload, and the product is a convincing shell.
Dependencies: A8, A9 (in main from Night 3); B6, B7, B8.
Acceptance: no fixture is read at runtime anywhere in the application, and a ticket raised and a plan committed both survive a reload.
Boundary: Team B changes the frontend; Team A adds what is missing on the server.
I3 · The real chain through the planning experience — Teams B and C together

Provides: the planning screen driven end to end — real requests selected from A's data, sent through C's planner running on A's Planning Input, with the real reasoning and multi-day fields rendered, and the committed plan persisted through A's block API.
Why: this is the moment the demo becomes a working system rather than a rehearsed sequence. B has been calling the real planner since Day 3; today that planner is running on real railway data.
Dependencies: I1, I2, B7, C9, C10.
Acceptance: running the plan from the application produces the same result as running the engine directly on the same input, the reasoning panel shows C's actual explanations, and the committed plan survives a reload.
Boundary: Team B changes the frontend; Team C changes the engine and its endpoint.
I4 · Integration proof of concept — Team C

Provides: the proof scenarios re-run on real integrated data, recording the complete chain from railway data through to the optimised plan with actual figures.
Why: the earlier proofs used synthetic scenarios. This one proves the claim holds on the real division, and it is the strongest single piece of evidence for the submission.
Dependencies: I1.
Acceptance: the document shows the multi-department merge occurring on real database records, with real before-and-after figures.
Boundary: Team C's proof material.
Integration acceptance flow
The integration is complete when this sequence runs end to end on one machine with nothing mocked:

1  Sign in as an administrator with real credentials
2  Open the network visualiser and search for the division's worst section
      → its real health and status appear, read from the database
3  Open its track record
      → engineering, signalling and traction tabs show real defects and overdue work
4  Raise an inspection ticket from that record
      → it persists and is still there after a reload
5  Open the block requests register and select the three departmental requests
      that share one section and one date
      → the priorities shown against them came from the scoring stage
6  Run the planning engine
      → the staged run completes and produces ONE block covering all three departments
7  Open that block
      → the score explanation shows why each request was judged urgent and critical,
        and names the scorer that produced it
      → the optimiser reasoning explains why the work was merged, why this window was
        chosen, and what was rejected
8  Commit the plan
      → the block appears in the block schedule and survives a reload
9  Sign out and sign in as field staff
      → the block planning section is hidden and unreachable
7. After integration is complete — testing, deployment and stabilisation
This phase begins when the integration acceptance flow above passes, not on a particular date. Integration may well continue into Day 5, and if it does, Day 5 is still integration. Do not start this phase early to keep to a schedule — a half-integrated system cannot be usefully tested.

No new features. The loop is: test → find a bug → fix it → test again → deploy → verify. Anything that is not required to make the existing system work is out of scope until after the submission.

Focus areas

End-to-end and integration testing — the acceptance flow above, run repeatedly by all three teams
Data correctness — reproducible reloads, referential integrity after synchronisation, counts that reconcile
API behaviour — every endpoint's normal path, unauthorised access, invalid input, and missing records
Planner correctness — all proof scenarios re-run on real data, determinism confirmed, plus the awkward cases: no requests selected, a single request, everything selected at once
Scoring boundary — the scorer's determinism, ScoringInput and ScoringOutput validated against the contract, the behaviour when a request cannot be scored, and the substitution check: a different stub scorer behind the same interface changes the plan without the optimiser changing
Access control — expired and missing sessions, and field staff attempting to reach every administrator area directly
Edge cases — a section with no defects, a date with no available windows, work that fits no window, windows that cross midnight
Error handling — backend unavailable, slow responses, malformed data
Production configuration and deployment — environment variables, cross-origin access, database connectivity from the deployed service, and a seeded, resettable demo database
Production verification — the full acceptance flow against the deployed system, not a local one
Demo validation — timed dry runs on the deployed system, repeated until they are boring
Two things worth planning for explicitly

First-response delay. Free hosting tiers suspend idle services and databases. Measure the delay after fifteen minutes of inactivity, because that is what the judges will experience, and arrange to keep the system warm before the demonstration.
Recoverability. Keep a way to reset the demo database to a known good state in under a minute. A demonstration that cannot be recovered is a demonstration that can be lost.
Record every bug found before fixing it. A fix with no record is a fix that gets quietly undone by the next merge.

Exit criteria for the week: the acceptance flow passes on the deployed system three times in a row, every proof document still matches what the live system does, and main is tagged and frozen.

8. Development workflow — Days 1–3 and Day 4 onward
Days 1–3 — PR and nightly merge
Everything in this subsection applies to Days 1–3 only.

Every team, every morning
Pull the previous night's merged main.
Update dependencies and reset the local database to the seeded state.
Run the test suite. If it fails, report it and stop — do not start work on a broken base, and do not debug someone else's failure inside your own branch.
Read the integration log for last night's newly available endpoints. If one of them replaces a fixture you are using, switching to it is part of today's work — not something to defer.
Create a branch for today's work.
Implement only your team's features for today.
Run the tests, including new ones for today's work.
Verify each feature against its acceptance condition and put the evidence in the pull request.
Confirm you touched nothing outside your ownership boundary.
Push and raise the pull request.
Do not build on another team's unmerged pull request.
Team A and Team C additionally: if today's features expose an endpoint another team is waiting for, say so in the pull request description. That line becomes tonight's integration-log entry.

Team C additionally: the day's proof document and visual must be regenerated from a real run and included in the pull request. A Team C pull request without the day's proof is incomplete.

Team B additionally: state in the pull request which fixtures were retired today and which remain. A fixture still in use after its endpoint became available is a defect, not a choice.

The fourth person, every night — Days 1–3 only
Collect the three pull requests and confirm each stayed inside its boundary.
Merge them one at a time, running the tests after each, so it is always clear which one broke something.
Resolve conflicts. A conflict inside a frozen file means a boundary was crossed — ask the author rather than guessing.
Run the full suite on the merged result, with a clean reseeded database.
Open the application and check all three surfaces load: the product UI, /dev/data and /dev/planner.
Confirm Team C's proof for the night is present and regenerates.
Record in the integration log which endpoints became available tonight and which team should switch off which fixture tomorrow. This is the entry that makes continuous integration actually happen — without it, Team B has no reliable signal and quietly stays on mocks.
Tag main as that night's healthy build.
Tell the team main is green, which tag to start from, and what is newly available.
If a pull request breaks main, revert that pull request and tell its author (Days 1–3). Never leave main broken overnight — it costs three teams their next morning.

Day 4 onward — normal collaborative development
The PR and nightly-merge process above no longer applies. There is no requirement to batch work into daily pull requests, and no nightly gatekeeper.

From Day 4 the teams work together on one integrated system in the ordinary way: they sit together, change code directly, test as they go, and resolve cross-team issues in real time as they surface. Same-day cross-team dependencies are expected — that is what integration is.

What still holds from Day 4 onward:

Contracts remain additive-only. Adding a field is free; renaming or removing one breaks whoever is consuming it while they are sitting next to you.
Each team still owns and is accountable for its own area, even though anyone may now touch what integration requires. When a mismatch appears, it is fixed on the side that owns it.
The fourth person coordinates — keeps the integrated system runnable, tracks what is blocking whom, and keeps the integration log — rather than gatekeeping merges.
Team C still produces its proof material, now on real integrated data (feature I4). It is evidence for the submission and does not stop being needed because the PR process did.
Keep the system runnable at all times. The discipline that mattered nightly now matters continuously: if the integrated system stops working, fix that before adding anything else.
9. Final end-to-end acceptance checklist
Each line is independently checkable on the deployed system.

[ ] Railway data integration    All five source systems present and separately addressable;
                              synchronisation demonstrably moves a changed value into BlockWise;
                              source status shows genuine last-sync times and counts

[ ] Track information           Any section returns its real record from the database — health,
                              status, chainage, speed, the three departmental views;
                              the visualiser renders the division with health driving the drawing

[ ] Maintenance and defects     Real defect and overdue registers per section and division-wide;
                              department-wise maintenance requirements visible

[ ] Planning input              The assembled input validates against the engine's contract and
                              carries a genuine multi-department case

[ ] Maintenance scoring         The scoring interface accepts the real Planning Input and returns
                              urgency, criticality and priority in range for every request, with
                              per-factor contributions; every response declares its scorer status;
                              the implementation behind it is a deterministic placeholder and is
                              described as one everywhere it surfaces — explicitly NOT a trained
                              ML model, with no accuracy or performance figure claimed; a
                              replacement scorer can be substituted behind the same contract
                              without the optimiser changing

[ ] Optimisation                The optimiser produces the plan by consuming those scores together
                              with every hard and soft constraint — the schedule is the
                              optimiser's output, never the scorer's; the same input always
                              produces the same plan

[ ] Block clubbing              Three departmental requests on one section and one date become ONE
                              block; the time saved is shown as a real before-and-after figure

[ ] Train-aware scheduling      The chosen window is the least disruptive one that fits; the rejected
                              alternative is reported with the figures that decided it; resource and
                              adjacency conflicts are respected across the horizon

[ ] Explainable plan            Every block explains why it was merged, why this window, what was
                              rejected, and which constraint bound it; each scored request
                              separately explains the factors behind its score and names the
                              scorer that produced it

[ ] UI display                  All screens render live data with sensible loading, error and empty
                              behaviour; no fixture is read at runtime anywhere

[ ] Ticket flow                 An inspection ticket raised from a track record persists and survives
                              a reload

[ ] Authentication              Real sign-in with credentials; sessions persist and expire correctly

[ ] Authorisation               Field staff cannot see or reach any block planning area

[ ] Deployment                  The full acceptance flow passes on the deployed system;
                              first-response delay measured and acceptable;
                              the demo database can be reset to a known state quickly

[ ] Evidence                    Proof documents for Days 1–4 exist, each regenerated from a real run,
                              each showing actual inputs, outputs, before-and-after results and
                              metrics — demonstrating the optimisation rather than describing it
10. Feature-to-endpoint dependency map
10.1 Team A → endpoint → Team B
A feature	Ships	Endpoint	Available	B feature	Mock until
A3	Day 1	GET /api/sections · GET /api/network	Day 2	B4 map, register, corridor filter · B5 entry	Day 2
A4	Day 2	GET /api/sections/:id · /search · filters	Day 3	B5 full track record · B4 search	Day 3
A5	Day 2	GET /api/defects · /overdue · /sections/:id/health	Day 3	B5 defect and health panels · B6 defect context · B8 dashboard	Day 3
A6	Day 2	GET /api/operations/timetable · /goods-forecast · /windows · /corridor-status	Day 3	B5 next window · B8 operations screen	Day 3
A8	Day 3	GET /api/sources · POST /api/sources/:code/sync · /integrations/*	Day 4	B8 source-system strip	Day 4
A9	Day 3	GET/PATCH /api/requests · GET/POST/PATCH /api/tickets · GET /api/blocks	Day 4	B6 ticket register and raise · B7 request register and commit · B8 schedule	Day 4
A1, A2, A7 and A11 expose nothing to Team B — they are the database, the seed and Team A's own development view.

10.2 Team C → endpoint → Team B
C feature	Ships	Endpoint / change	Available	B feature	Mock until
C1	Day 1	the planner and scoring contracts (not endpoints)	Day 1	B's canned planner fixture must follow the planner contract	—
C2	Day 1 in-process, Day 2 over HTTP	the scoring interface · POST /api/ml/score — internal to Team C	internal only	none — Team B never calls it; its consumer is Team C's optimiser	n/a
C7	Day 2	POST /api/plan	Day 3	B7 planning run and result	Day 3
C9	Day 3	traffic figures per window — additive fields on the same endpoint	Day 4	B7 window justification panel	none needed
C10	Day 3	reasoning trail and multi-day horizon — additive fields	Day 4	B7 reasoning panel · B8 multi-day schedule	none needed
C3, C5, C6 are optimiser capability reached through POST /api/plan; C2 is the scoring stage that feeds them. All of them improve what B already receives, with no frontend change. C4, C8, C11 are proof material.

10.3 The full chain — Team A → Planning Input → scoring → optimiser → planner endpoint → Team B
TMS · SMMS · TDMS · COA · BDMS         the five railway source systems
                               │
                               ▼
A1  database and schema
A2  seeded railway dataset
A4  section and track records ──
A5  defects, overdue, health  ──┤
A6  timetable, goods, windows ──┤
A8  source-system sync        ──
                               │
                               ▼
A10   GET /api/planning-input          ships Day 3 · available Day 4
                               │
                               ▼   validated against C1's contract
C2    ML scoring interface             placeholder scorer today · POST /api/ml/score,
                               │       internal to Team C · ships Day 1, HTTP Day 2
                               ▼
      urgency / criticality / priority scores
                               │
                               ▼
C3 · C5 · C6 · C9 · C10        the block optimiser
                               │
                               ▼
      optimised block schedule
                               │
                               ▼
C7    POST /api/plan                   ships Day 2 · available Day 3
                               │
                               ▼
B7    planning experience              real planner from Day 3
                               │       real data through it from Day 4
                               ▼
A9    GET /api/blocks · PATCH /api/requests      commit and persistence
                               │
                               ▼
B8    schedule and dashboard
10.4 Rule of thumb
If Team B needs data: this map names the endpoint and its owner. B never invents one. If something B needs is genuinely missing from this map, raise it with the fourth person the same day so it can be added to the owning team's next-day features.
If Team A or C needs to expose something: the "Ships" column is a commitment. An endpoint that slips by a day delays a Team B feature by a day.
If an endpoint is not ready: Team B uses the frozen mock, which follows the same contract, and switches on the availability day. A mock still in use after its availability day is a defect.
If it concerns scoring: Team B never calls the scoring interface. B calls POST /api/plan and receives the final plan with the scores already carried in it. Scoring is Team C's internal stage, and the boundary between the scorer and the optimiser is frozen and additive-only like every other contract here.
