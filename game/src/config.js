// NEON VICE — tuning, layout, palette and story. One place for every number
// the rest of the game reads, so balancing never means hunting through files.
// The city is Vice Bay: a neon-drenched coastal town at launch week, all
// sunset pinks, palm shade and chrome. The player is Vic Marlowe, a getaway
// driver who owes $60,000 to the Sunset Kings. Six jobs. One week. The whole
// bay is hiring — if you can drive, run, and stay out of the cells.

export const WORLD = {
  size: 2700,
  blocks: 8,
  block: 250,
  road: 70,
  beachY: 2580,
  waterY: 2632,
};

export const PITCH = WORLD.block + WORLD.road; // 320 px from one road's edge to the next

export const TUNING = {
  walkSpeed: 180,
  runSpeed: 275,
  playerRadius: 13,
  playerHealth: 100,
  carAccel: 460,
  carBrake: 760,
  carReverseMax: 180,
  carMaxSpeed: 580,
  carTurn: 2.7,
  carRadius: 17,
  trafficSpeed: 135,
  policeSpeed: 610,
  punchRange: 36,
  punchDamage: 28,
  pistolRange: 340,
  pistolDamage: 48,
  pistolAmmoStart: 30,
  wantedDecaySeconds: 13,
  bustedHoldSeconds: 1.4,
  missionRewardBase: 8000,
};

export const PALETTE = {
  grass: '#6fae5e',
  grassDark: '#649e52',
  sand: '#eecf9a',
  water: '#2e7fa8',
  waterDeep: '#256b8f',
  asphalt: '#3a3d44',
  asphaltDark: '#32343b',
  lane: '#e8d95a',
  sidewalk: '#b5afa0',
  curb: '#8f8a7c',
  buildingRoof: ['#c96f4a', '#4a7fa5', '#a55a6e', '#5a8a6a', '#b08a3e', '#6e5a8a', '#8a6a4a', '#4a8a8a', '#d86a8a', '#3e6e9e'],
  buildingEdge: 'rgba(0,0,0,0.28)',
  buildingNeon: ['#ff5da2', '#4dd8ff', '#ffd34d', '#9dff5d', '#ff8a3d'],
  park: '#5d9b4a',
  tree: '#2f6b2a',
  treeLight: '#4c8a3a',
  palm: '#3a7a34',
  palmLight: '#5da34c',
  hudPanel: 'rgba(10,12,18,0.74)',
  hudText: '#f5f2e8',
  hudGold: '#ffd34d',
  hudPink: '#ff5da2',
  mission: '#ffd34d',
  police: '#3a6fd8',
  star: '#ffd34d',
  health: '#58d164',
  damage: '#e5484d',
  neonSign: '#ff5da2',
};

// Car paint jobs the city spawns with. Police and taxi are reserved models.
export const CAR_PAINTS = [
  '#c23b2e', '#2e6fc2', '#e8b73a', '#e8e4da', '#22262b', '#7a4a9e',
  '#3fae7a', '#d86a1e', '#5a8a9e', '#b03a5a', '#8a9e2e', '#4a4a55',
  '#ff5da2', '#4dd8ff',
];

export const CAR_MODELS = [
  { name: 'Comet', top: 560, accel: 460, turn: 2.7 },
  { name: 'Voodoo', top: 520, accel: 430, turn: 2.5 },
  { name: 'Banshee', top: 610, accel: 500, turn: 2.9 },
  { name: 'Sultan', top: 540, accel: 450, turn: 2.6 },
  { name: 'Taxi', top: 480, accel: 400, turn: 2.4 },
  { name: 'Patriot', top: 500, accel: 420, turn: 2.3 },
];

export const PLAYER_NAME = 'Vic Marlowe';
export const CITY_NAME = 'Vice Bay';
export const GAME_TITLE = 'NEON VICE';
export const DEBT = 60000;
export const STORY =
  'Vic Marlowe is a getaway driver who owes $60,000 to the Sunset Kings. ' +
  'One week. Six jobs. The whole bay is hiring — if you can drive, run, ' +
  'and stay out of the cells long enough to collect.';
