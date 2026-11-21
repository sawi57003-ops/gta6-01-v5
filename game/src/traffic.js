// Traffic and pedestrians. Cars drive along the road grid, turning at
// intersections, slowing for the car ahead and swerving gently around a
// stopped player. Pedestrians stroll the sidewalks and flee when a gun goes
// off or a car bears down on them. Both are seeded so the city feels alive
// without ever leaving the road network.

import { WORLD, PITCH, TUNING } from './config.js';
import { mulberry32, pick, randRange, clamp, distance, angleTo, wrapAngle } from './random.js';
import { makeCar, driveCar, carForward } from './vehicles.js';
import { roadCenter, nearestRoadPoint, onRoad } from './city.js';

const PED_COLORS = ['#e8b73a', '#4dd8ff', '#ff5da2', '#9dff5d', '#e8e4da', '#d86a1e', '#7a4a9e'];

export class Traffic {
  constructor(city, seed) {
    this.city = city;
    this.rng = mulberry32(seed ^ 0x7a21d4e9);
    this.cars = [];
    this.peds = [];
    for (let i = 0; i < 15; i += 1) this.spawnCar(true);
    for (let i = 0; i < 26; i += 1) this.spawnPed(true);
  }

  spawnCar(anywhere) {
    const rng = this.rng;
    const road = Math.floor(rng() * WORLD.blocks);
    const along = 60 + rng() * (WORLD.size - 120);
    const horizontal = rng() < 0.5;
    const x = horizontal ? along : roadCenter(road);
    const y = horizontal ? roadCenter(road) : along;
    const angle = horizontal ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const car = makeCar(x, y, angle, { taxi: rng() < 0.12 });
    car.speed = TUNING.trafficSpeed * randRange(rng, 0.7, 1.05);
    car.cruise = car.speed;
    this.cars.push(car);
    return car;
  }

  spawnPed(anywhere) {
    const rng = this.rng;
    const p = this.city.randomOpenPoint();
    const ped = {
      x: p.x,
      y: p.y,
      angle: rng() * Math.PI * 2,
      speed: randRange(rng, 34, 62),
      color: pick(rng, PED_COLORS),
      radius: 9,
      flee: 0,
      target: null,
      wait: randRange(rng, 0, 3),
    };
    this.peds.push(ped);
    return ped;
  }

  update(dt, player, world) {
    const rng = this.rng;
    // --- Cars: follow their lane, turn at intersections, avoid the player.
    for (const car of this.cars) {
      const fwd = carForward(car);
      // Pick a lane target: keep going, and at an intersection sometimes turn.
      const nearIntersection = onRoad(car.x, car.y) &&
        Math.abs(((car.x % PITCH) + PITCH) % PITCH - WORLD.road / 2) < 14 &&
        Math.abs(((car.y % PITCH) + PITCH) % PITCH - WORLD.road / 2) < 14;
      if (nearIntersection && rng() < dt * 0.5) {
        car.angle += (rng() < 0.5 ? 1 : -1) * Math.PI / 2;
      }
      // Slow for a car ahead.
      let blocked = false;
      for (const other of this.cars) {
        if (other === car) continue;
        const dx = other.x - car.x;
        const dy = other.y - car.y;
        const ahead = dx * fwd.x + dy * fwd.y;
        const side = Math.abs(dx * -fwd.y + dy * fwd.x);
        if (ahead > 0 && ahead < 110 && side < 40) { blocked = true; break; }
      }
      const playerCar = player.car;
      if (playerCar) {
        const dx = playerCar.x - car.x;
        const dy = playerCar.y - car.y;
        const ahead = dx * fwd.x + dy * fwd.y;
        const side = Math.abs(dx * -fwd.y + dy * fwd.x);
        if (ahead > 0 && ahead < 120 && side < 44) blocked = true;
      }
      const targetSpeed = blocked ? 0 : car.cruise;
      car.speed += clamp(targetSpeed - car.speed, -420 * dt, 320 * dt);
      car.x += fwd.x * car.speed * dt;
      car.y += fwd.y * car.speed * dt;
      // Wrap around the world edges so traffic never runs out.
      if (car.x < -90) car.x = WORLD.size + 80;
      if (car.x > WORLD.size + 90) car.x = -80;
      if (car.y < -90) car.y = WORLD.beachY + 80;
      if (car.y > WORLD.beachY + 90) car.y = -80;
      if (this.city.isBlocked(car.x, car.y)) {
        car.angle += Math.PI / 2;
        car.x = clamp(car.x, 30, WORLD.size - 30);
        car.y = clamp(car.y, 30, WORLD.beachY - 30);
      }
      // A traffic car that hits the player on foot knocks him down.
      if (!player.car && distance(car.x, car.y, player.x, player.y) < 30 && Math.abs(car.speed) > 60) {
        player.hurt(12);
        car.speed *= 0.4;
        if (world && world.onCrash) world.onCrash(car.x, car.y);
      }
    }
    // --- Pedestrians: stroll, wait at corners, flee from danger.
    for (const ped of this.peds) {
      if (ped.flee > 0) {
        ped.flee -= dt;
        ped.x += Math.cos(ped.angle) * 150 * dt;
        ped.y += Math.sin(ped.angle) * 150 * dt;
      } else if (ped.wait > 0) {
        ped.wait -= dt;
      } else {
        ped.x += Math.cos(ped.angle) * ped.speed * dt;
        ped.y += Math.sin(ped.angle) * ped.speed * dt;
        if (rng() < dt * 0.25) ped.angle += randRange(rng, -1.2, 1.2);
        if (rng() < dt * 0.08) ped.wait = randRange(rng, 1, 4);
      }
      if (this.city.isBlocked(ped.x, ped.y)) {
        ped.angle += Math.PI * 0.7;
        ped.x = clamp(ped.x, 20, WORLD.size - 20);
        ped.y = clamp(ped.y, 20, WORLD.beachY - 20);
      }
      ped.x = clamp(ped.x, 16, WORLD.size - 16);
      ped.y = clamp(ped.y, 16, WORLD.beachY - 16);
      // Flee from the player's car or a gunshot.
      const dPlayer = distance(ped.x, ped.y, player.x, player.y);
      if ((player.car && dPlayer < 130) || (!player.car && player.shootTimer > 0.2 && dPlayer < 260)) {
        if (ped.flee <= 0) {
          ped.flee = 1.6;
          ped.angle = angleTo(player.x, player.y, ped.x, ped.y) + randRange(rng, -0.6, 0.6);
        }
      }
    }
  }

  // Scare every pedestrian near a point (a gunshot, a crash).
  scareNear(x, y, radius) {
    for (const ped of this.peds) {
      if (distance(ped.x, ped.y, x, y) < radius) {
        ped.flee = 1.8;
        ped.angle = angleTo(x, y, ped.x, ped.y);
      }
    }
  }
}
