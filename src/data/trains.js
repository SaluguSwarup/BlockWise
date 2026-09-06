/**
 * BlockWise — Train operations data (MOCK DATA)
 *
 * In production this comes from the Control Office Application (COA):
 *   - Working Time Table (passenger / express)
 *   - Goods train forecast (rake movement projection)
 *   - Corridor block availability
 */

export const TRAIN_TYPES = {
  EXPRESS: { id: 'EXPRESS', label: 'Express / Mail', accent: '#e0553a', weight: 4 },
  PASSENGER: { id: 'PASSENGER', label: 'Passenger / MEMU', accent: '#4aa3df', weight: 3 },
  GOODS: { id: 'GOODS', label: 'Goods / Freight', accent: '#8a929e', weight: 1.5 },
};

/** Working Time Table extract — night-hours traffic per corridor. */
export const TIMETABLE = {
  'GC-1': [
    { no: '12002', name: 'Bhopal Shatabdi', type: 'EXPRESS', time: '06:15', dir: 'DN', halts: 'Runs through' },
    { no: '12280', name: 'Taj Express', type: 'EXPRESS', time: '07:10', dir: 'DN', halts: 'ALJN 2 min' },
    { no: '12310', name: 'Rajdhani Express', type: 'EXPRESS', time: '23:40', dir: 'UP', halts: 'Runs through' },
    { no: '12312', name: 'Kalka Mail', type: 'EXPRESS', time: '00:25', dir: 'UP', halts: 'TDL 5 min' },
    { no: '14163', name: 'Sangam Express', type: 'EXPRESS', time: '01:05', dir: 'DN', halts: 'ALJN 3 min' },
    { no: '64551', name: 'ALJN–TDL MEMU', type: 'PASSENGER', time: '04:45', dir: 'DN', halts: 'All stations' },
    { no: '64554', name: 'TDL–ALJN MEMU', type: 'PASSENGER', time: '05:20', dir: 'UP', halts: 'All stations' },
    { no: 'GDS-4412', name: 'BOXN Coal Rake', type: 'GOODS', time: '02:10', dir: 'DN', halts: 'Loop at KRJ' },
    { no: 'GDS-4418', name: 'Container Rake', type: 'GOODS', time: '03:35', dir: 'UP', halts: 'Runs through' },
    { no: 'GDS-4425', name: 'BCN Cement Rake', type: 'GOODS', time: '05:05', dir: 'DN', halts: 'Loop at ALJN' },
  ],
  'NW-2': [
    { no: '12958', name: 'Swarna Jayanti Rajdhani', type: 'EXPRESS', time: '23:10', dir: 'DN', halts: 'Runs through' },
    { no: '12015', name: 'Ajmer Shatabdi', type: 'EXPRESS', time: '06:05', dir: 'DN', halts: 'AWR 2 min' },
    { no: '19708', name: 'Aravali Express', type: 'EXPRESS', time: '03:50', dir: 'UP', halts: 'RE 5 min' },
    { no: '54413', name: 'Rewari–Alwar Passenger', type: 'PASSENGER', time: '05:40', dir: 'DN', halts: 'All stations' },
    { no: 'GDS-6620', name: 'BTPN Tank Rake', type: 'GOODS', time: '01:20', dir: 'DN', halts: 'Loop at RE' },
    { no: 'GDS-6631', name: 'DFC Feeder Container', type: 'GOODS', time: '02:45', dir: 'UP', halts: 'Runs through' },
    { no: 'GDS-6640', name: 'BOXN Stone Rake', type: 'GOODS', time: '04:15', dir: 'DN', halts: 'Loop at AWR' },
  ],
  'NE-3': [
    { no: '12040', name: 'Kathgodam Shatabdi', type: 'EXPRESS', time: '06:30', dir: 'DN', halts: 'MB 5 min' },
    { no: '15035', name: 'Uttarakhand Express', type: 'EXPRESS', time: '00:50', dir: 'DN', halts: 'GJL 2 min' },
    { no: '14315', name: 'Bareilly Intercity', type: 'EXPRESS', time: '05:15', dir: 'UP', halts: 'RMU 2 min' },
    { no: '64207', name: 'GZB–MB MEMU', type: 'PASSENGER', time: '04:55', dir: 'DN', halts: 'All stations' },
    { no: 'GDS-7712', name: 'BCN Foodgrain Rake', type: 'GOODS', time: '02:25', dir: 'DN', halts: 'Loop at HPU' },
    { no: 'GDS-7720', name: 'BOXN Empty Rake', type: 'GOODS', time: '03:55', dir: 'UP', halts: 'Runs through' },
  ],
  'SC-4': [
    { no: '12050', name: 'Gatimaan Express', type: 'EXPRESS', time: '08:10', dir: 'DN', halts: 'Runs through' },
    { no: '12621', name: 'Tamil Nadu Express', type: 'EXPRESS', time: '23:55', dir: 'DN', halts: 'AGC 5 min' },
    { no: '12615', name: 'Grand Trunk Express', type: 'EXPRESS', time: '01:35', dir: 'UP', halts: 'GWL 5 min' },
    { no: '11078', name: 'Jhelum Express', type: 'EXPRESS', time: '03:20', dir: 'DN', halts: 'DHO 2 min' },
    { no: '51886', name: 'Agra–Gwalior Passenger', type: 'PASSENGER', time: '05:30', dir: 'DN', halts: 'All stations' },
    { no: 'GDS-8814', name: 'BOXN Coal Rake', type: 'GOODS', time: '02:05', dir: 'UP', halts: 'Loop at DHO' },
    { no: 'GDS-8822', name: 'BCN Cement Rake', type: 'GOODS', time: '04:30', dir: 'DN', halts: 'Loop at MRA' },
  ],
};

/**
 * Corridor block availability windows published by the Control Office.
 * densityIndex = weighted traffic disruption if a block is taken in this window.
 */
const TEMPLATE_WINDOWS = {
  'GC-1': [
    { id: 'W-A', start: '01:30', end: '04:30', passenger: 2, express: 1, goods: 4, densityIndex: 16, coa: 'Available', note: 'Post-mail corridor — standard maintenance slot' },
    { id: 'W-B', start: '23:00', end: '01:00', passenger: 0, express: 3, goods: 3, densityIndex: 34, coa: 'Available', note: 'Rajdhani / Kalka Mail paths fall in this window' },
    { id: 'W-C', start: '04:30', end: '06:30', passenger: 4, express: 2, goods: 2, densityIndex: 41, coa: 'Restricted', note: 'Morning MEMU build-up — high suburban load' },
    { id: 'W-D', start: '13:00', end: '15:00', passenger: 3, express: 4, goods: 1, densityIndex: 48, coa: 'Not preferred', note: 'Daytime express density — needs traffic diversion' },
  ],
  'NW-2': [
    { id: 'W-A', start: '00:15', end: '04:00', passenger: 1, express: 1, goods: 5, densityIndex: 18, coa: 'Available', note: 'Freight-dominant window — goods regulation possible' },
    { id: 'W-B', start: '22:30', end: '00:30', passenger: 0, express: 2, goods: 4, densityIndex: 29, coa: 'Available', note: 'Swarna Jayanti Rajdhani path to be protected' },
    { id: 'W-C', start: '03:30', end: '06:00', passenger: 3, express: 2, goods: 2, densityIndex: 38, coa: 'Restricted', note: 'Aravali + Shatabdi paths' },
    { id: 'W-D', start: '11:00', end: '13:30', passenger: 2, express: 3, goods: 3, densityIndex: 44, coa: 'Not preferred', note: 'Daytime goods loading peak at Rewari' },
  ],
  'NE-3': [
    { id: 'W-A', start: '01:00', end: '04:00', passenger: 1, express: 1, goods: 3, densityIndex: 12, coa: 'Available', note: 'Lowest-density corridor slot in the division' },
    { id: 'W-B', start: '23:30', end: '01:00', passenger: 0, express: 2, goods: 2, densityIndex: 24, coa: 'Available', note: 'Uttarakhand Express path' },
    { id: 'W-C', start: '04:00', end: '06:30', passenger: 3, express: 2, goods: 1, densityIndex: 36, coa: 'Restricted', note: 'MEMU + Shatabdi build-up' },
    { id: 'W-D', start: '12:00', end: '14:30', passenger: 2, express: 2, goods: 2, densityIndex: 33, coa: 'Available', note: 'Mid-day lull — usable for short blocks' },
  ],
  'SC-4': [
    { id: 'W-A', start: '00:45', end: '03:45', passenger: 1, express: 2, goods: 3, densityIndex: 22, coa: 'Available', note: 'GT Express path to be regulated' },
    { id: 'W-B', start: '22:00', end: '00:30', passenger: 0, express: 3, goods: 2, densityIndex: 37, coa: 'Restricted', note: 'Tamil Nadu Express + southbound trunk load' },
    { id: 'W-C', start: '03:15', end: '05:45', passenger: 2, express: 2, goods: 3, densityIndex: 31, coa: 'Available', note: 'Jhelum Express path in window' },
    { id: 'W-D', start: '09:00', end: '11:00', passenger: 1, express: 4, goods: 1, densityIndex: 52, coa: 'Not preferred', note: 'Gatimaan Express corridor — no block permitted' },
  ],
};

/** Section-specific overrides where the Control Office has published a special note. */
const SECTION_WINDOW_OVERRIDES = {
  'SEC-104': [
    { id: 'W-A', start: '01:45', end: '05:00', passenger: 2, express: 1, goods: 4, densityIndex: 14, coa: 'Available', note: 'Preferred slot — only Sangam Exp path to regulate' },
    { id: 'W-B', start: '23:15', end: '01:15', passenger: 0, express: 3, goods: 3, densityIndex: 35, coa: 'Available', note: 'Rajdhani + Kalka Mail paths — high priority trains' },
    { id: 'W-C', start: '04:30', end: '06:30', passenger: 4, express: 2, goods: 2, densityIndex: 44, coa: 'Restricted', note: 'MEMU 64551/64554 + morning express load' },
    { id: 'W-D', start: '13:00', end: '15:00', passenger: 3, express: 4, goods: 1, densityIndex: 51, coa: 'Not preferred', note: 'Diversion via Kasganj required — not economical' },
  ],
  'SEC-402': [
    { id: 'W-A', start: '22:00', end: '06:00', passenger: 2, express: 4, goods: 5, densityIndex: 46, coa: 'Corridor block in force', note: 'Mega block sanctioned for Br. 88 — single line working' },
    { id: 'W-B', start: '01:00', end: '03:30', passenger: 1, express: 2, goods: 2, densityIndex: 26, coa: 'Available after 09 Sep', note: 'Available once mega block is lifted' },
  ],
};

export function getWindowsForSection(sectionId, corridorId) {
  return SECTION_WINDOW_OVERRIDES[sectionId] || TEMPLATE_WINDOWS[corridorId] || TEMPLATE_WINDOWS['GC-1'];
}

/** Goods train forecast issued by the Control Office for the planning week. */
export const GOODS_FORECAST = {
  'GC-1': { rakesPerNight: 11, tonnage: '46,200 T', trend: 'up', peakHours: '02:00 – 04:00', note: 'Coal rakes to NTPC Dadri; DFC transfer traffic', priorityRakes: 3 },
  'NW-2': { rakesPerNight: 14, tonnage: '58,800 T', trend: 'up', peakHours: '00:30 – 03:00', note: 'Stone / cement traffic ex-Alwar; heavy loading', priorityRakes: 4 },
  'NE-3': { rakesPerNight: 6, tonnage: '24,600 T', trend: 'flat', peakHours: '02:00 – 04:00', note: 'Foodgrain rakes to Bareilly; light density', priorityRakes: 1 },
  'SC-4': { rakesPerNight: 9, tonnage: '39,400 T', trend: 'down', peakHours: '01:30 – 04:30', note: 'Coal to Gwalior; reduced due to Br. 88 restriction', priorityRakes: 2 },
};

/** Live-feel COA snapshot for the corridor availability strip. */
export const CORRIDOR_STATUS = [
  { corridor: 'GC-1', punctuality: 91.4, sectionsBlocked: 0, trainsRunning: 42, controllerNote: 'Normal working' },
  { corridor: 'NW-2', punctuality: 87.2, sectionsBlocked: 0, trainsRunning: 26, controllerNote: 'Goods regulation at Rewari' },
  { corridor: 'NE-3', punctuality: 94.1, sectionsBlocked: 0, trainsRunning: 18, controllerNote: 'Normal working' },
  { corridor: 'SC-4', punctuality: 78.6, sectionsBlocked: 1, trainsRunning: 31, controllerNote: 'Br. 88 block — 18 trains diverted' },
];

export function trainsInWindow(corridorId, start, end) {
  const list = TIMETABLE[corridorId] || [];
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s = toMin(start);
  let e = toMin(end);
  const wrap = e <= s;
  if (wrap) e += 24 * 60;
  return list.filter((t) => {
    let v = toMin(t.time);
    if (wrap && v < s) v += 24 * 60;
    return v >= s && v <= e;
  });
}
