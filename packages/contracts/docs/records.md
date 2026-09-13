# Record shapes

Frozen Pre-Day-1, transcribed from what the current prototype UI already renders — see the file
named under each record. Additive-only after Pre-Day-1: a real endpoint may add fields, never
rename or remove one of these.

## Section (list item)

From `src/data/tracks.js` (`TRACKS`), the fields the network map, section register and search use:

```
id, trackId, corridor, from, to, name, lengthKm, chainage, lineConfig, sectionalSpeed, gauge,
health, status, assetAvailability, trainsPerDay, gmt, inCharge
```

## SectionDetail (full record)

Section fields, plus:

```
lastModified, currentIssue, maintenanceFrequency, lastInspection, nextScheduledMaintenance,
currentActivity, currentBlockStatus, nextBlockWindow, corridorAvailability,
engineering: { condition, tqi, maintenanceStatus, lastInspection, upcoming, rails, ballast },
signalling:  { health, status, maintenanceStatus, lastInspection, upcoming, interlocking, axleCounters },
traction:    { status, health, maintenanceStatus, lastInspection, upcoming, ohe, pantographCheck },
defects: Defect[], overdue: Overdue[]
```

## Defect

```
id, dept, system, description, severity (HIGH|MEDIUM|LOW), reportedOn, status
```
`GET /api/defects` and `GET /api/sections/:id/defects` additionally carry `section, sectionName, corridor`
(as `ALL_DEFECTS` already does in `src/data/tracks.js`).

## Overdue

```
task, dept, dueOn, overdueDays, system
```
Division-wide listing additionally carries `section, sectionName, corridor`.

## BlockRequest

From `src/data/blockRequests.js`:

```
id, section, dept (ENGG|SNT|TRD), system, activity, description,
requestedDate, requestedStart, requestedEnd, durationMin,
criticality (CRITICAL|HIGH|MEDIUM|LOW), urgency (IMMEDIATE|HIGH|NORMAL|PLANNED),
safetyImpact (HIGH|MEDIUM|LOW), assetImpact, assetImpactNote,
overdueDays, status (PENDING|SELECTED|REJECTED|SCHEDULED), requestedBy, requestedOn,
linkedDefects[], compatibility (COMPATIBLE|EXCLUSIVE), resources, machinery,
powerBlock, minDurationMin
```

`GET /api/requests` additionally carries `priority` — the baked `ScoringOutput` score record for this
request, see `scoring.md`. It is not part of the prototype's original data shape; it is the field B1's
mock layer and A9's real endpoint both populate so B never computes a score.

## Ticket (inspection)

From `src/data/tickets.js`:

```
id, section, dept, reason, remarks, urgency (IMMEDIATE|HIGH|NORMAL|PLANNED),
status (OPEN|ACKNOWLEDGED|INSPECTION SCHEDULED|CLOSED),
raisedBy, raisedOn, region, assignedTo, outcome
```

## Block (sanctioned or optimised)

From `src/data/plans.js` and the engine's optimiser output — this is the shape both
`GET /api/blocks` and a `PlanningOutput.blocks[]` entry use, so B7/B8 render either source unchanged:

```
id, date, section, sectionName, corridor, start, end, durationMin, serialMin, savedMin,
depts[], tasks: [{ dept, activity, requestId, durationMin, score, band }],
priority (LOW|MEDIUM|HIGH|CRITICAL), priorityScore, leadRequestId,
trains: { express, passenger, goods }, trainsAffected, baselineTrainsAffected,
assetHealth, assetAvailability, window, alternatives[], reasoning[],
merged, exclusive, overrunMin, impact, state (PROPOSED|SANCTIONED|IN PROGRESS|COMPLETED),
source (SANCTIONED|OPTIMISED)
```

## Window

Per section, per date (see `docs/planning.md` for why this is now dated rather than a template):

```
id, section, date, start, end, capacityMin, fits, counts: { express, passenger, goods },
trafficLoad, disruption, trainsAffected, densityIndex, coa, note
```

## TimetableEntry

```
no, name, type (EXPRESS|PASSENGER|GOODS), time, dir (UP|DN), halts
```

## GoodsForecast (per corridor)

```
rakesPerNight, tonnage, trend, peakHours, note, priorityRakes
```

## Corridor / Station / Network

```
Corridor:  id, name, shortName, accent, routeKm, classification, trafficDensity
Station:   code, name, x, y, type, platforms, corridor, interlocking
Network:   division: { zone, zoneCode, division, divisionCode, controlOffice, headquarters },
           corridors: Corridor[], stations: Station[]
```

## SourceSystem

```
code (TMS|SMMS|TDMS|COA|BDMS), name, dept, records, lastSync, status (CONNECTED|SYNCING|ERROR)
```

## User

```
role (ADMIN|STAFF), name, designation, unit, employeeId, userId, permissions[]
```
