/**
 * Projects a PlanningInput into a ScoringInput (packages/contracts/docs/scoring.md §1).
 *
 * Group 2 fields (health history, defects, overdue, …) are read if present on the PlanningInput
 * and passed through as empty collections otherwise — see packages/contracts/docs/planning.md on
 * why they are not guaranteed to exist in every PlanningInput yet.
 */
export function toScoringInput(planningInput) {
  return {
    requests: planningInput.requests || [],
    sections: planningInput.sections || [],
    defects: planningInput.defects || [],
    overdue: planningInput.overdue || [],
    operations: {
      timetable: planningInput.timetable || {},
      goodsForecast: planningInput.goodsForecast || {},
      corridorStatus: planningInput.corridorStatus || [],
    },
    context: planningInput.context || {},
  };
}
