// NEON VICE — the gta6-01 round-5 entry (Node 22, standard library only).
//
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline — game/index.html and its ES modules, no library
// and no network request. This file is the entrypoint AND the game's
// content pipeline. It owns the content catalogue (the districts of Vice
// Bay, the radio stations, the car roster, the story beats, the six
// missions), writes that catalogue into game/src/content.js, validates the
// whole game against the scorer's caps, copies game/ and screenshots/ to
// /output, and writes /output/dossier.json — the summary the judge reads —
// with the vendored make.fun library.
//
// The game itself is an original top-down open-world crime story set in the
// fictional coastal city of Vice Bay. Vic Marlowe, a getaway driver, owes
// $60,000 to the Sunset Kings. Six jobs. One week. The player walks and
// drives a full 8x8 street grid, steals cars, dodges a five-star wanted
// level with police cruisers that chase and ram, fights on foot, and pays
// the debt off job by job. A HUD with a live minimap and a radio station
// keeps score; progress saves to localStorage; ?seed=N rebuilds the same
// city and ?shot= stages a screenshot scene.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// ---------------------------------------------------------------------------
// The game's content catalogue. This is the single source of truth for
// game/src/content.js: the entrypoint writes it out at build time, and the
// game reads it for the district guide, the radio stations, the car roster
// and the story beats on the title screen. The mission catalogue below is
// the same list the game runs in game/src/missions.js — the two must agree,
// and the validator checks that they do. Editing the words or the metal of
// Vice Bay means editing them here, in main.ts.
// ---------------------------------------------------------------------------

export const GAME_TITLE = 'NEON VICE';
export const CITY_NAME = 'Vice Bay';
export const PLAYER_NAME = 'Vic Marlowe';
export const DEBT = 60000;

export const STORY =
  'Vic Marlowe is a getaway driver who owes $60,000 to the Sunset Kings. ' +
  'One week. Six jobs. The whole bay is hiring — if you can drive, run, ' +
  'and stay out of the cells long enough to collect.';

export const DISTRICTS = [
  { name: 'Ocean Drive', blurb: 'Palms, neon and the sea — the strip never sleeps.' },
  { name: 'Marina', blurb: 'Yachts, warehouses and quiet money.' },
  { name: 'Downtown', blurb: 'Glass towers, clubs and the Kings’ front doors.' },
  { name: 'Northside', blurb: 'Garages, chop shops and old debts.' },
  { name: 'West End', blurb: 'Bars, motels and people who ask no questions.' },
  { name: 'East Side', blurb: 'Docks, cranes and the payroll run.' },
  { name: 'Midtown', blurb: 'Hotels, offices and the city’s soft middle.' },
];

export const RADIO = [
  { name: 'NEON 88.5', tag: 'synthwave all night' },
  { name: 'BAY FM 101', tag: 'Vice Bay talk and traffic' },
  { name: 'SUNSET 92', tag: 'slow jams for fast getaways' },
  { name: 'PALM 76', tag: 'the Kings’ own frequency' },
];

// The cars of Vice Bay, in the same order as game/src/config.js lists them.
export const CARS = [
  { name: 'Comet', blurb: 'A pink rocket. Quick, loud, unmistakable.' },
  { name: 'Voodoo', blurb: 'Low, heavy, and always turning heads.' },
  { name: 'Banshee', blurb: 'The fastest thing on Ocean Drive.' },
  { name: 'Sultan', blurb: 'Four doors, no questions, plenty of room.' },
  { name: 'Taxi', blurb: 'Yellow, patient, and everywhere at once.' },
  { name: 'Patriot', blurb: 'Big, square, and hard to stop.' },
];

// One-liners that rotate across the title screen while the city pans.
export const BEATS = [
  'The Kings own the night, but the night is hiring.',
  'Six jobs. One week. Sixty thousand dollars.',
  'In Vice Bay, the getaway is the job.',
  'Drive fast. Spend faster. Stay free.',
];

// The six jobs. Rewards sum to $68,000 — the $60,000 debt, with $8,000 to
// spare for the trouble. The game in game/src/missions.js runs this same
// list, step by step, in this same order.
export const MISSION_CATALOGUE = [
  { id: 'm1', title: 'First Pickup', reward: 8000, brief: 'The Kings left a package at the Marina. Drive there, grab it, bring it back to the Northside garage.' },
  { id: 'm2', title: 'Hot Wheels', reward: 9500, brief: 'A Banshee is parked on Ocean Drive and the Kings want it. Steal it, then lose the heat before you drop it at the chop shop in East Side.' },
  { id: 'm3', title: 'Courier Run', reward: 11000, brief: 'Three drops, one night. Hit the Downtown club, the West End bar and the Midtown hotel — in any order.' },
  { id: 'm4', title: 'Getaway', reward: 12000, brief: 'A Kings wheelman is pinned down by the PD in Midtown. Get him out and drive him to the Marina while the whole department gives chase.' },
  { id: 'm5', title: 'Payday', reward: 13000, brief: 'The Kings are moving a payroll through the Northside. Intercept the armoured car, take the cash, and get it to the Downtown club.' },
  { id: 'm6', title: 'The Big One', reward: 14500, brief: 'Last job. The Sunset Kings are settling accounts at the Ocean Drive hotel. Get in, take the ledger, and drive it to the Marina.' },
];

export const FEATURES = [
  'Top-down open world: an 8x8 street grid with a beach, a marina, a neon downtown and suburbs',
  'Drive and walk: steal any car, get in and out, traffic and pedestrians react to you',
  'Five-star wanted level with police cruisers that chase and ram, and officers who arrest on foot',
  'Six story missions with cash rewards that pay off a $60,000 debt',
  'Combat: punch and a pistol, with ammo pickups',
  'HUD with cash, health, ammo, wanted stars, district, current job, a live minimap and a radio station',
  'Synthesised WebAudio sound: engine hum, sirens, gunshots, cash chimes, crashes',
  'Start, pause, busted, wasted and complete screens; progress saves to localStorage',
  'Deterministic city: ?seed=N rebuilds the same Vice Bay; ?shot= stages a screenshot scene',
];

// The game modules the entrypoint expects under game/src. If any is
// missing or empty, the build refuses — a broken game must never be handed
// to the judge.
const REQUIRED_MODULES = [
  'main.js',
  'config.js',
  'random.js',
  'city.js',
  'input.js',
  'audio.js',
  'vehicles.js',
  'player.js',
  'traffic.js',
  'police.js',
  'missions.js',
  'render.js',
  'hud.js',
  'shots.js',
  'content.js',
];

// ---------------------------------------------------------------------------
// Content generation: write game/src/content.js from the catalogue above.
// ---------------------------------------------------------------------------

function contentJs(): string {
  const lines: string[] = [];
  lines.push('// NEON VICE — the game\'s content catalogue. This file is GENERATED by');
  lines.push('// main.ts (the entrypoint) from the same data, so the repo always carries a');
  lines.push('// working copy and the grader\'s run regenerates it identically. It holds the');
  lines.push('// district guide, the radio stations and the car roster the game reads: the');
  lines.push('// words and the metal of Vice Bay. Do not edit by hand — edit main.ts.');
  lines.push('');
  lines.push('export const CONTENT = {');
  lines.push('  districts: ' + JSON.stringify(DISTRICTS, null, 2).replace(/\n/g, '\n  ') + ',');
  lines.push('  radio: ' + JSON.stringify(RADIO, null, 2).replace(/\n/g, '\n  ') + ',');
  lines.push('  cars: ' + JSON.stringify(CARS, null, 2).replace(/\n/g, '\n  ') + ',');
  lines.push('  beats: ' + JSON.stringify(BEATS, null, 2).replace(/\n/g, '\n  ') + ',');
  lines.push('};');
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Validation: the game must be complete before it is copied anywhere.
// ---------------------------------------------------------------------------

function fail(message: string): never {
  throw new Error('NEON VICE build refused: ' + message);
}

function checkModuleSizes(gameDir: string): { modules: number; bytes: number } {
  let totalBytes = 0;
  let modules = 0;
  for (const mod of REQUIRED_MODULES) {
    const p = join(gameDir, 'src', mod);
    if (!existsSync(p)) fail('game/src/' + mod + ' is missing');
    const size = statSync(p).size;
    if (size < 200) fail('game/src/' + mod + ' is suspiciously small (' + size + ' bytes)');
    totalBytes += size;
    modules += 1;
  }
  return { modules, bytes: totalBytes };
}

function checkWiring(gameDir: string): void {
  // The entry page must load the game and name it.
  const indexPath = join(gameDir, 'index.html');
  if (!existsSync(indexPath)) fail('game/index.html is missing');
  const index = readFileSync(indexPath, 'utf8');
  if (!index.includes('src/main.js')) fail('game/index.html does not load src/main.js');
  if (!index.includes(GAME_TITLE)) fail('game/index.html does not name ' + GAME_TITLE);
  // The runtime entrypoint must actually read the generated catalogue.
  const mainJs = readFileSync(join(gameDir, 'src', 'main.js'), 'utf8');
  if (!mainJs.includes("from './content.js'")) fail('game/src/main.js does not import ./content.js');
  if (!mainJs.includes('CONTENT')) fail('game/src/main.js does not use CONTENT');
  // The mission list the game runs must match the catalogue this file owns.
  const missionsJs = readFileSync(join(gameDir, 'src', 'missions.js'), 'utf8');
  for (const m of MISSION_CATALOGUE) {
    if (!missionsJs.includes(m.id)) fail('game/src/missions.js is missing mission ' + m.id + ' (' + m.title + ')');
    if (!missionsJs.includes(m.title)) fail('game/src/missions.js is missing the title ' + m.title);
    if (!missionsJs.includes(String(m.reward))) fail('game/src/missions.js is missing the $' + m.reward + ' reward for ' + m.title);
  }
  // The story has to add up: six jobs must clear the debt with room to spare.
  const totalReward = MISSION_CATALOGUE.reduce((sum, m) => sum + m.reward, 0);
  if (totalReward < DEBT) fail('mission rewards total $' + totalReward + ', below the $' + DEBT + ' debt');
}

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(p);
    else n += 1;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Build.
// ---------------------------------------------------------------------------

const here = fileURLToPath(new URL('.', import.meta.url));
const gameDir = join(here, 'game');
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// 1. Generate the content catalogue the game reads.
writeFileSync(join(gameDir, 'src', 'content.js'), contentJs());

// 2. Validate the game before anything is copied.
const checked = checkModuleSizes(gameDir);
checkWiring(gameDir);
const gameFiles = countFiles(gameDir);
if (gameFiles > 993) fail('game/ holds ' + gameFiles + ' files, over the scorer cap of 993');

// 3. Copy the game and the screenshots into /output.
mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// 4. Write the dossier the judge reads, with this entry's real metadata.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// 5. A short human-readable build record beside the dossier.
const totalReward = MISSION_CATALOGUE.reduce((sum, m) => sum + m.reward, 0);
writeFileSync(
  join(out, 'BUILD.txt'),
  [
    GAME_TITLE + ' — a ' + CITY_NAME + ' crime story',
    'Player: ' + PLAYER_NAME + ' — owes $' + DEBT.toLocaleString('en-US') + ' to the Sunset Kings.',
    'Missions: ' + MISSION_CATALOGUE.length + ' jobs, $' + totalReward.toLocaleString('en-US') + ' in rewards.',
    'Modules validated: ' + checked.modules + ' (' + checked.bytes.toLocaleString('en-US') + ' bytes of game code).',
    'Game files: ' + gameFiles + '.',
    'Features:',
    ...FEATURES.map((f) => '  - ' + f),
    'Story: ' + STORY,
  ].join('\n') + '\n',
);

console.log(
  GAME_TITLE + ' built: ' + checked.modules + ' modules, ' + gameFiles +
  ' game files, ' + MISSION_CATALOGUE.length + ' missions, $' +
  totalReward.toLocaleString('en-US') + ' in rewards -> ' + out,
);
