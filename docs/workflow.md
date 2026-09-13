# Development workflow (R8)

Transcribed from `BlockWise.md` §8, with the repo-specific mechanics filled in. See
`ownership.md` for the boundary table this workflow enforces.

## Days 1–3 — PR and nightly merge

### Every team, every morning

1. Pull the previous night's merged `main` (or that night's tag — see below).
2. `npm install` at the root and in `backend/`; reset the local database to the seeded state
   (once A1/A2 exist).
3. `npm test`. If it fails, report it and stop — do not start work on a broken base, and do not
   debug someone else's failure inside your own branch.
4. Read `integration-log.md` for last night's newly available endpoints. If one replaces a fixture
   you are using, switching to it is part of today's work, not something to defer.
5. Create a branch for today's work.
6. Implement only your team's features for today (see `ownership.md`).
7. `npm test`, including new tests for today's work.
8. Verify each feature against its acceptance condition (`BlockWise.md`) and put the evidence in
   the pull request.
9. Confirm you touched nothing outside your ownership boundary.
10. Push and raise the pull request (see `.github/pull_request_template.md`).

Do not build on another team's unmerged pull request.

**Recording a necessary boundary or contract exception:** if a feature genuinely requires
touching a file outside your ownership boundary (`ownership.md`) or a frozen area, make the
minimum change required and record it in `docs/violations/{FEATURE-ID}-violations.md` (create the
file if it doesn't exist — this path is the one exception to `docs/` being frozen, see
`ownership.md`). For each entry, record: the file/area touched, the rule or boundary crossed, what
changed, why it was necessary, how it relates to the feature, why it couldn't reasonably be
avoided, and why the change was kept to the minimum scope. Never make the change silently — this
file is what the integrator reads before deciding whether to merge it as-is.

**Team A and Team C additionally:** if today's features expose an endpoint another team is
waiting for, say so in the pull request description — that line becomes tonight's
integration-log entry.

**Team C additionally:** the day's proof document and visual must be regenerated from a real run
and included in the pull request. A Team C pull request without the day's proof is incomplete.

**Team B additionally:** state in the pull request which fixtures were retired today and which
remain. A fixture still in use after its endpoint became available is a defect, not a choice.

### The integrator, every night (Days 1–3 only)

1. Collect the three pull requests and confirm each stayed inside its boundary
   (`ownership.md`) — a conflict inside a frozen file means a boundary was crossed; ask the
   author rather than guessing.
2. Merge them one at a time, running `npm test` after each, so it is always clear which one broke
   something.
3. Run the full suite on the merged result, with a clean reseeded database.
4. Open the application and check all three surfaces load: the product UI, `/dev/data` and
   `/dev/planner`.
5. Confirm Team C's proof for the night is present and regenerates.
6. Record in `integration-log.md` which endpoints became available tonight and which team should
   switch off which fixture tomorrow.
7. Tag `main` as that night's healthy build: `git tag night-N-green && git push origin night-N-green`.
8. Tell the team `main` is green, which tag to start from, and what is newly available.

If a pull request breaks `main`, revert that pull request and tell its author. Never leave `main`
broken overnight.

## Day 4 onward — normal collaborative development

The PR-and-nightly-merge process above ends here. The teams work together on one integrated
system: change code directly, test as they go, resolve cross-team issues in real time.

What still holds:

- Contracts remain additive-only (`packages/contracts/`).
- Each team still owns and is accountable for its own area, even though anyone may now touch what
  integration requires — a mismatch is fixed on the side that owns it.
- The integrator coordinates (keeps the integrated system runnable, tracks what is blocking whom,
  keeps `integration-log.md`) rather than gatekeeping merges.
- Team C still produces its proof material (I4), now on real integrated data.
- Keep the system runnable at all times.
