## What this ships

<!-- Feature id(s) from BlockWise.md, e.g. "A3", "B4", "C7". -->

## Acceptance evidence

<!-- Paste the observable proof the acceptance condition (BlockWise.md) is met — command output,
     a screenshot of /dev/data or /dev/planner, a curl response. "Tests pass" alone is not this. -->

## Boundary check

- [ ] I touched only paths my team owns (see `docs/ownership.md`)
- [ ] I did not rename or remove a field in `packages/contracts/`
- [ ] `npm test` passes locally on a freshly pulled `main`

## Ownership

<!-- If docs/violations/{FEATURE-ID}-violations.md does NOT exist for this feature: -->
All modified files are within my assigned ownership boundary.

<!-- If it DOES exist, list each entry here instead of the line above: file/area, boundary
     crossed, why it was necessary, how it relates to this feature, why it was kept minimal.
     The integrator reads docs/violations/{FEATURE-ID}-violations.md as the source of truth
     when deciding whether to merge a cross-boundary change as-is. -->

## Endpoints newly available (Team A / Team C only)

<!-- e.g. "GET /api/sections and GET /api/network ship tonight — available to Team B tomorrow (B4)." -->

## Fixtures retired / remaining (Team B only)

<!-- e.g. "Retired: sections.json, network.json (B4). Remaining: requests, tickets, blocks, sources." -->

## Proof of the day (Team C only)

<!-- Link or paste the regenerated proof document/visual (C4/C8/C11). A Team C PR without it is incomplete. -->
