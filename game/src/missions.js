// Six story jobs for the Sunset Kings.
//
// Each mission is a small chain of objectives — drive to a marker, pick
// something up, lose the cops, deliver it — with a cash reward on
// completion. Missions unlock in order; the mission marker is a gold beacon
// on the map and in the world. Finishing all six pays off the $60,000 debt
// and completes the game. Free roam opens after the story is done.
//
// Steps come in two kinds: 'go' (reach a point, optionally in a car) and
// 'steal' (be driving the named car model). A step can also carry a
// `wanted` level: arriving there raises the heat to at least that many stars.

import { WORLD, PITCH, TUNING, DEBT } from './config.js';
import { roadCenter, districtAt } from './city.js';
import { distance } from './random.js';

export const MISSIONS = [
  {
    id: 'm1',
    title: 'First Pickup',
    brief: 'The Kings left a package at the Marina. Drive there, grab it, bring it back to the Northside garage. No cops, no problems.',
    reward: 8000,
    steps: [
      { kind: 'go', x: roadCenter(7), y: roadCenter(6), label: 'Go to the Marina pickup' },
      { kind: 'go', x: roadCenter(1), y: roadCenter(1), label: 'Deliver to the Northside garage' },
    ],
  },
  {
    id: 'm2',
    title: 'Hot Wheels',
    brief: 'A Banshee is parked on Ocean Drive and the Kings want it. Steal it, then lose the heat before you drop it at the chop shop in East Side.',
    reward: 9500,
    steps: [
      { kind: 'steal', x: roadCenter(2), y: roadCenter(7), label: 'Steal the Banshee on Ocean Drive', carModel: 'Banshee' },
      { kind: 'go', x: roadCenter(6), y: roadCenter(3), label: 'Drop it at the East Side chop shop', needsCar: true },
    ],
  },
  {
    id: 'm3',
    title: 'Courier Run',
    brief: 'Three drops, one night. Hit the Downtown club, the West End bar and the Midtown hotel — in any order — before the sun comes up. The cops are already looking.',
    reward: 11000,
    steps: [
      { kind: 'go', x: roadCenter(4), y: roadCenter(3), label: 'Drop 1: Downtown club' },
      { kind: 'go', x: roadCenter(1), y: roadCenter(4), label: 'Drop 2: West End bar' },
      { kind: 'go', x: roadCenter(5), y: roadCenter(5), label: 'Drop 3: Midtown hotel' },
    ],
  },
  {
    id: 'm4',
    title: 'Getaway',
    brief: 'A Kings wheelman is pinned down by the PD in Midtown. Get him out: reach him, then drive him to the Marina while the whole department gives chase. Two stars, minimum.',
    reward: 12000,
    steps: [
      { kind: 'go', x: roadCenter(4), y: roadCenter(5), label: 'Reach the pinned wheelman in Midtown' },
      { kind: 'go', x: roadCenter(7), y: roadCenter(6), label: 'Drive him to the Marina', needsCar: true, wanted: 2 },
    ],
  },
  {
    id: 'm5',
    title: 'Payday',
    brief: 'The Kings are moving a payroll through the Northside. Intercept the armoured car, take the cash, and get it to the Downtown club. Expect a three-star welcome.',
    reward: 13000,
    steps: [
      { kind: 'go', x: roadCenter(2), y: roadCenter(1), label: 'Intercept the payroll on Northside' },
      { kind: 'go', x: roadCenter(4), y: roadCenter(3), label: 'Deliver the cash to the Downtown club', wanted: 3 },
    ],
  },
  {
    id: 'm6',
    title: 'The Big One',
    brief: 'Last job. The Sunset Kings are settling accounts at the Ocean Drive hotel — every crew in the bay is there. Get in, take the ledger, and drive it to the Marina before the PD locks the city down.',
    reward: 14500,
    steps: [
      { kind: 'go', x: roadCenter(3), y: roadCenter(7), label: 'Infiltrate the Ocean Drive hotel' },
      { kind: 'go', x: roadCenter(7), y: roadCenter(6), label: 'Escape with the ledger to the Marina', wanted: 3 },
    ],
  },
];

export class MissionManager {
  constructor() {
    this.index = 0; // current mission
    this.step = 0; // current step inside it
    this.active = false;
    this.done = false;
    this.completedCount = 0;
    this.earned = 0;
  }

  current() {
    return MISSIONS[this.index] || null;
  }

  currentStep() {
    const m = this.current();
    return m ? m.steps[this.step] : null;
  }

  start() {
    if (this.done || this.active) return;
    this.active = true;
    this.step = 0;
  }

  // The beacon's target: position and label of the current step.
  stepTarget() {
    const s = this.currentStep();
    return s ? { x: s.x, y: s.y, label: s.label } : null;
  }

  // Advance one step. Returns 'step', 'mission' or 'all' (story complete).
  advance(world) {
    const m = this.current();
    if (!m) return null;
    this.step += 1;
    if (this.step < m.steps.length) return 'step';
    const reward = m.reward;
    world.player.addCash(reward);
    this.earned += reward;
    this.completedCount += 1;
    this.index += 1;
    this.step = 0;
    this.active = false;
    if (this.index >= MISSIONS.length) {
      this.done = true;
      world.freeRoam = true;
      return 'all';
    }
    return 'mission';
  }

  // A 'steal' step completes when the player is driving the target model.
  checkSteal(player) {
    const s = this.currentStep();
    if (!s || s.kind !== 'steal') return false;
    return !!player.car && player.car.model && player.car.model.name === s.carModel;
  }

  // One line for the HUD: which job, out of six.
  progressText() {
    const m = this.current();
    if (this.done) return 'All jobs done — the debt is paid.';
    if (!m) return '';
    return 'Job ' + (this.index + 1) + '/6 — ' + m.title;
  }

  // What Vic still owes the Kings.
  debtRemaining() {
    return Math.max(0, DEBT - this.earned);
  }
}
