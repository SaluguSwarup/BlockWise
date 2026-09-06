/**
 * BlockWise — Railway network topology (MOCK DATA)
 * Northern Railway · Delhi Division — schematic line diagram.
 *
 * Coordinates are in the SVG user space of the Network Visualizer
 * (viewBox 0 0 1440 860). Sections are drawn as straight segments
 * between station nodes, the way real IR line diagrams are drawn.
 */

export const DIVISION = {
  zone: 'Northern Railway',
  zoneCode: 'NR',
  division: 'Delhi Division',
  divisionCode: 'DLI',
  controlOffice: 'Divisional Control Office, New Delhi',
  headquarters: 'State Entry Road, New Delhi',
};

export const CORRIDORS = [
  {
    id: 'GC-1',
    name: 'Delhi – Kanpur Main Line',
    shortName: 'Delhi–Kanpur',
    accent: '#e0b83a',
    routeKm: 440,
    classification: 'Group A · 130 kmph · Golden Quadrilateral',
    trafficDensity: 'Very High',
  },
  {
    id: 'NW-2',
    name: 'Delhi – Jaipur Western Link',
    shortName: 'Delhi–Jaipur',
    accent: '#4aa3df',
    routeKm: 308,
    classification: 'Group B · 110 kmph',
    trafficDensity: 'High',
  },
  {
    id: 'NE-3',
    name: 'Ghaziabad – Bareilly Section',
    shortName: 'GZB–Bareilly',
    accent: '#63c4a7',
    routeKm: 252,
    classification: 'Group B · 110 kmph',
    trafficDensity: 'Medium',
  },
  {
    id: 'SC-4',
    name: 'Tundla – Gwalior Chord',
    shortName: 'Tundla–Gwalior',
    accent: '#c98bdb',
    routeKm: 190,
    classification: 'Group A · 130 kmph · Delhi–Chennai Trunk',
    trafficDensity: 'High',
  },
];

export const STATIONS = [
  // ---- Delhi – Kanpur Main Line (GC-1) ----
  { code: 'NDLS', name: 'New Delhi', x: 190, y: 372, type: 'terminal', platforms: 16, corridor: 'GC-1', interlocking: 'RRI · EI' },
  { code: 'GZB', name: 'Ghaziabad Jn', x: 372, y: 372, type: 'junction', platforms: 6, corridor: 'GC-1', interlocking: 'RRI · EI' },
  { code: 'KRJ', name: 'Khurja Jn', x: 560, y: 372, type: 'junction', platforms: 4, corridor: 'GC-1', interlocking: 'PI' },
  { code: 'ALJN', name: 'Aligarh Jn', x: 748, y: 372, type: 'junction', platforms: 6, corridor: 'GC-1', interlocking: 'RRI' },
  { code: 'TDL', name: 'Tundla Jn', x: 936, y: 372, type: 'junction', platforms: 5, corridor: 'GC-1', interlocking: 'RRI · EI' },
  { code: 'ETW', name: 'Etawah', x: 1112, y: 372, type: 'station', platforms: 4, corridor: 'GC-1', interlocking: 'PI' },
  { code: 'CNB', name: 'Kanpur Central', x: 1300, y: 372, type: 'terminal', platforms: 10, corridor: 'GC-1', interlocking: 'RRI · EI' },

  // ---- Delhi – Jaipur Western Link (NW-2) ----
  { code: 'DEC', name: 'Delhi Cantt', x: 176, y: 476, type: 'station', platforms: 3, corridor: 'NW-2', interlocking: 'PI' },
  { code: 'GGN', name: 'Gurgaon', x: 200, y: 578, type: 'station', platforms: 3, corridor: 'NW-2', interlocking: 'PI' },
  { code: 'RE', name: 'Rewari Jn', x: 300, y: 668, type: 'junction', platforms: 5, corridor: 'NW-2', interlocking: 'RRI' },
  { code: 'AWR', name: 'Alwar Jn', x: 470, y: 730, type: 'junction', platforms: 4, corridor: 'NW-2', interlocking: 'PI' },
  { code: 'JP', name: 'Jaipur Jn', x: 668, y: 782, type: 'terminal', platforms: 6, corridor: 'NW-2', interlocking: 'RRI · EI' },

  // ---- Ghaziabad – Bareilly (NE-3) ----
  { code: 'HPU', name: 'Hapur Jn', x: 494, y: 270, type: 'junction', platforms: 4, corridor: 'NE-3', interlocking: 'PI' },
  { code: 'GJL', name: 'Gajraula Jn', x: 648, y: 200, type: 'junction', platforms: 3, corridor: 'NE-3', interlocking: 'PI' },
  { code: 'MB', name: 'Moradabad Jn', x: 830, y: 154, type: 'junction', platforms: 7, corridor: 'NE-3', interlocking: 'RRI · EI' },
  { code: 'RMU', name: 'Rampur', x: 1006, y: 124, type: 'station', platforms: 3, corridor: 'NE-3', interlocking: 'PI' },
  { code: 'BE', name: 'Bareilly Jn', x: 1196, y: 104, type: 'terminal', platforms: 5, corridor: 'NE-3', interlocking: 'RRI' },

  // ---- Tundla – Gwalior Chord (SC-4) ----
  { code: 'AGC', name: 'Agra Cantt', x: 940, y: 490, type: 'junction', platforms: 6, corridor: 'SC-4', interlocking: 'RRI · EI' },
  { code: 'DHO', name: 'Dholpur Jn', x: 1032, y: 588, type: 'junction', platforms: 4, corridor: 'SC-4', interlocking: 'PI' },
  { code: 'MRA', name: 'Morena', x: 1132, y: 672, type: 'station', platforms: 3, corridor: 'SC-4', interlocking: 'PI' },
  { code: 'GWL', name: 'Gwalior Jn', x: 1270, y: 756, type: 'terminal', platforms: 5, corridor: 'SC-4', interlocking: 'RRI · EI' },
];

export const STATION_BY_CODE = STATIONS.reduce((acc, s) => {
  acc[s.code] = s;
  return acc;
}, {});

/** Label offsets so station names never sit on top of a running line. */
export const LABEL_OFFSET = {
  NDLS: [0, -26], GZB: [0, 32], KRJ: [0, 32], ALJN: [0, -26], TDL: [-6, -26],
  ETW: [0, 32], CNB: [0, -26], DEC: [-14, 0], GGN: [-14, 0], RE: [-14, 6],
  AWR: [0, 32], JP: [0, 32], HPU: [0, 30], GJL: [0, -24], MB: [0, -24],
  RMU: [0, 30], BE: [0, -24], AGC: [-16, 4], DHO: [22, 4], MRA: [22, 4], GWL: [0, 30],
};

export const CORRIDOR_BY_ID = CORRIDORS.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});
