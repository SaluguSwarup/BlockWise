/**
 * A minimal, hand-built PlanningInput used only by this package's own tests — small and
 * self-contained so the engine's boundary properties can be asserted without any frontend data.
 * This is NOT Team C's scenario library (C1); that is built in ../scenarios on Day 1.
 */
export function buildSamplePlanningInput() {
  return {
    requests: [
      {
        id: 'REQ-1', section: 'SEC-A', dept: 'ENGG', system: 'TMS', activity: 'Rail renewal',
        requestedDate: '2026-09-12', requestedStart: '01:00', requestedEnd: '03:00', durationMin: 120,
        criticality: 'CRITICAL', urgency: 'IMMEDIATE', safetyImpact: 'HIGH', assetImpact: 90,
        assetImpactNote: 'Removes speed restriction', overdueDays: 20, requestedBy: 'Sr.DEN',
        compatibility: 'COMPATIBLE',
      },
      {
        id: 'REQ-2', section: 'SEC-A', dept: 'TRD', system: 'TDMS', activity: 'OHE inspection',
        requestedDate: '2026-09-12', requestedStart: '01:30', requestedEnd: '03:00', durationMin: 90,
        criticality: 'HIGH', urgency: 'HIGH', safetyImpact: 'HIGH', assetImpact: 70,
        assetImpactNote: 'Reduces trip risk', overdueDays: 5, requestedBy: 'Sr.DEE',
        compatibility: 'COMPATIBLE',
      },
      {
        id: 'REQ-3', section: 'SEC-A', dept: 'SNT', system: 'SMMS', activity: 'Point machine overhaul',
        requestedDate: '2026-09-12', requestedStart: '02:00', requestedEnd: '03:15', durationMin: 75,
        criticality: 'HIGH', urgency: 'HIGH', safetyImpact: 'HIGH', assetImpact: 60,
        assetImpactNote: 'Restores route setting', overdueDays: 10, requestedBy: 'Sr.DSTE',
        compatibility: 'COMPATIBLE',
      },
    ],
    sections: [
      { id: 'SEC-A', name: 'Sample Section A', corridor: 'COR-1', health: 55, assetAvailability: 88 },
    ],
    windows: [
      { id: 'W-A', section: 'SEC-A', date: '2026-09-12', start: '01:00', end: '04:00', densityIndex: 15, coa: 'Available', note: 'Test window A' },
      { id: 'W-B', section: 'SEC-A', date: '2026-09-12', start: '23:00', end: '00:30', densityIndex: 30, coa: 'Available', note: 'Test window B' },
    ],
    timetable: {
      'COR-1': [
        { no: '1', name: 'Test Express', type: 'EXPRESS', time: '01:45', dir: 'DN', halts: 'Runs through' },
        { no: '2', name: 'Test Goods', type: 'GOODS', time: '02:10', dir: 'UP', halts: 'Runs through' },
      ],
    },
    goodsForecast: {
      'COR-1': { rakesPerNight: 5, tonnage: '10,000 T', trend: 'flat', peakHours: '02:00 - 04:00', note: 'sample', priorityRakes: 1 },
    },
    corridorStatus: [{ corridor: 'COR-1', punctuality: 90, sectionsBlocked: 0, trainsRunning: 10, controllerNote: 'Normal working' }],
    context: { horizonStart: '2026-09-12', horizonEnd: '2026-09-12', division: 'Test Division' },
  };
}
