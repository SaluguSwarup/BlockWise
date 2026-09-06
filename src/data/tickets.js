/**
 * BlockWise — Inspection tickets raised by field staff (MOCK DATA)
 * New tickets created in the UI are appended to this list in app state.
 */

export const TICKET_STATUS = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  INSPECTION_SCHEDULED: 'INSPECTION SCHEDULED',
  CLOSED: 'CLOSED',
};

export const URGENCY_OPTIONS = ['IMMEDIATE', 'HIGH', 'NORMAL', 'PLANNED'];

export const REASON_OPTIONS = [
  'Rail fracture / weld failure suspected',
  'Abnormal track geometry observed',
  'Ballast deficiency / drainage issue',
  'Signal aspect irregularity',
  'Point machine abnormal operation',
  'OHE arcing / dropper failure',
  'Bridge / structure distress',
  'Vibration or riding-quality complaint from loco pilot',
  'Level crossing defect',
  'Other — described below',
];

export const INSPECTION_TICKETS = [
  {
    id: 'INS-2026-0341', section: 'SEC-104', dept: 'ENGG',
    reason: 'Rail fracture / weld failure suspected',
    remarks: 'Loco pilot of 12312 reported a jerk at approx Km 141/6. Temporary fish plate holding, needs urgent verification.',
    urgency: 'IMMEDIATE', status: TICKET_STATUS.INSPECTION_SCHEDULED,
    raisedBy: 'SSE/P.Way/ALJN', raisedOn: '04 Sep 2026, 06:40',
    region: 'Aligarh (ALJN) — Sr.DEN/Co', assignedTo: 'ADEN/Aligarh',
    outcome: 'USFD verification done 04 Sep — rail renewal proposed under BR-0412',
  },
  {
    id: 'INS-2026-0344', section: 'SEC-204', dept: 'TRD',
    reason: 'OHE arcing / dropper failure',
    remarks: 'Fourth dropper snapping event in the same stretch. Pantograph hits recorded on 3 services.',
    urgency: 'IMMEDIATE', status: TICKET_STATUS.ACKNOWLEDGED,
    raisedBy: 'JE/TRD/AWR', raisedOn: '04 Sep 2026, 21:15',
    region: 'Alwar (AWR) — Sr.DEE/TRD', assignedTo: 'Sr.DEE/TRD Alwar',
    outcome: 'Linked to block request BR-0436',
  },
  {
    id: 'INS-2026-0347', section: 'SEC-302', dept: 'SNT',
    reason: 'Signal aspect irregularity',
    remarks: 'Intermittent blanking of signal S-14. Cable insulation resistance measured below 1 M-ohm.',
    urgency: 'HIGH', status: TICKET_STATUS.INSPECTION_SCHEDULED,
    raisedBy: 'SSE/Signal/GJL', raisedOn: '05 Sep 2026, 09:30',
    region: 'Gajraula (GJL) — Sr.DSTE', assignedTo: 'Sr.DSTE Moradabad',
    outcome: 'Cable replacement proposed under BR-0440',
  },
  {
    id: 'INS-2026-0351', section: 'SEC-305', dept: 'ENGG',
    reason: 'Bridge / structure distress',
    remarks: 'Bearing displacement noticed during monsoon inspection of Br. 214. Caution order imposed.',
    urgency: 'HIGH', status: TICKET_STATUS.OPEN,
    raisedBy: 'SSE/P.Way/BE', raisedOn: '06 Sep 2026, 05:55',
    region: 'Bareilly (BE) — AEN/Bridges', assignedTo: 'AEN/Bridges Bareilly',
    outcome: 'Awaiting Sr.DEN inspection',
  },
  {
    id: 'INS-2026-0353', section: 'SEC-404', dept: 'TRD',
    reason: 'OHE arcing / dropper failure',
    remarks: 'Three loco pilots reported heavy arcing at the neutral section near Km 158/4.',
    urgency: 'HIGH', status: TICKET_STATUS.ACKNOWLEDGED,
    raisedBy: 'SSE/TRD/GWL', raisedOn: '06 Sep 2026, 07:10',
    region: 'Gwalior (GWL) — Sr.DEE/TRD', assignedTo: 'Sr.DEE/TRD Gwalior',
    outcome: 'Linked to block request BR-0455',
  },
  {
    id: 'INS-2026-0356', section: 'SEC-203', dept: 'ENGG',
    reason: 'Abnormal track geometry observed',
    remarks: 'Side wear on the high rail noticed during trolley inspection; grinding cycle overdue.',
    urgency: 'NORMAL', status: TICKET_STATUS.OPEN,
    raisedBy: 'SSE/P.Way/RE', raisedOn: '06 Sep 2026, 08:25',
    region: 'Rewari (RE) — Sr.DEN/West', assignedTo: 'ADEN/Rewari',
    outcome: 'Pending assessment',
  },
];

export const REGION_BY_SECTION = {
  'SEC-101': 'New Delhi (NDLS) — Sr.DEN/Co', 'SEC-102': 'Ghaziabad (GZB) — Sr.DEN/Co',
  'SEC-103': 'Khurja (KRJ) — Sr.DEN/Co', 'SEC-104': 'Aligarh (ALJN) — Sr.DEN/Co',
  'SEC-105': 'Tundla (TDL) — Sr.DEN/East', 'SEC-106': 'Etawah (ETW) — Sr.DEN/East',
  'SEC-201': 'Delhi Cantt (DEC) — Sr.DEN/West', 'SEC-202': 'Gurgaon (GGN) — Sr.DEN/West',
  'SEC-203': 'Rewari (RE) — Sr.DEN/West', 'SEC-204': 'Alwar (AWR) — Sr.DEN/West',
  'SEC-205': 'Jaipur (JP) — Sr.DEN/West', 'SEC-301': 'Hapur (HPU) — Sr.DEN/North',
  'SEC-302': 'Gajraula (GJL) — Sr.DEN/North', 'SEC-303': 'Moradabad (MB) — Sr.DEN/North',
  'SEC-304': 'Rampur (RMU) — Sr.DEN/North', 'SEC-305': 'Bareilly (BE) — Sr.DEN/North',
  'SEC-401': 'Agra Cantt (AGC) — Sr.DEN/South', 'SEC-402': 'Dholpur (DHO) — Sr.DEN/South',
  'SEC-403': 'Morena (MRA) — Sr.DEN/South', 'SEC-404': 'Gwalior (GWL) — Sr.DEN/South',
};
