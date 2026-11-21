// The Vice Bay PD.
//
// A wanted level from 0 to 5 stars. At 1–2 stars a couple of cruisers give
// chase; at 3 and above they ram and box the player in; at 5 they come in
// numbers. Cruisers chase the player's car across the road grid, and on
// foot officers close in to arrest him — stand still next to one for a
// moment at any wanted level and you are busted. Outrun them and the heat
// cools off on its own.

import { WORLD, PITCH, TUNING } from './config.js';
import { mulberry32, clamp, distance, angleTo, wrapAngle } from './random.js';
import { makeCar, carForward } from './vehicles.js';
import { roadCenter } from './city.js';

export class Police {
  constructor(city, seed) {
    this.city = city;
    this.rng = mulberry32(seed ^ 0x33c0ffee);
    this.cars = [];
    this.officers = [];
    this.spawnTimer = 0;
    this.sirenTimer = 0;
  }

  // How many cruisers a wanted level puts on the road.
  wantedCount(wanted) {
    if (wanted <= 0) return 0;
    if (wanted === 1) return 1;
    if (wanted === 2) return 2;
    if (wanted === 3) return 3;
    if (wanted === 4) return 4;
    return 5;
  }

  spawnCruiser(player) {
    const rng = this.rng;
    // Spawn on a road a little way from the player, facing him.
    const dir = rng() < 0.5 ? 1 : -1;
    const offset = 420 + rng() * 260;
    let x = player.x + dir * offset;
    let y = player.y + (rng() < 0.5 ? -1 : 1) * (140 + rng() * 220);
    x = clamp(x, 60, WORLD.size - 60);
    y = clamp(y, 60, WORLD.beachY - 60);
    const car = makeCar(x, y, angleTo(x, y, player.x, player.y), { police: true });
    car.speed = TUNING.policeSpeed * 0.8;
    this.cars.push(car);
    return car;
  }

  spawnOfficer(player) {
    const rng = this.rng;
    const a = rng() * Math.PI * 2;
    const x = clamp(player.x + Math.cos(a) * 260, 30, WORLD.size - 30);
    const y = clamp(player.y + Math.sin(a) * 260, 30, WORLD.beachY - 30);
    const officer = {
      x, y,
      angle: angleTo(x, y, player.x, player.y),
      speed: 165,
      radius: 11,
    };
    this.officers.push(officer);
    return officer;
  }

  update(dt, player, world) {
    const wanted = player.wanted;
    // A siren blip every couple of seconds while the heat is on.
    this.sirenTimer -= dt;
    if (wanted > 0 && this.sirenTimer <= 0) {
      this.sirenTimer = 1.7;
      if (world && world.sound) world.sound.sirenBlip();
    }
    // Keep the right number of cruisers on the road, one spawn at a time.
    const want = this.wantedCount(wanted);
    this.spawnTimer -= dt;
    if (this.cars.length < want && this.spawnTimer <= 0) {
      this.spawnCruiser(player);
      this.spawnTimer = 1.1;
    }
    if (this.cars.length > want && this.spawnTimer <= 0) {
      this.cars.pop();
      this.spawnTimer = 1.1;
    }
    // On foot, officers replace cruisers at low speed.
    const wantOfficers = !player.car && wanted > 0 ? Math.min(2, wanted) : 0;
    if (this.officers.length < wantOfficers && this.spawnTimer <= 0) {
      this.spawnOfficer(player);
      this.spawnTimer = 1.4;
    }
    if (this.officers.length > wantOfficers) this.officers.pop();

    // Cruisers chase: steer toward the player, ram at close range.
    for (const car of this.cars) {
      const targetAngle = angleTo(car.x, car.y, player.x, player.y);
      const diff = wrapAngle(targetAngle - car.angle);
      car.angle += clamp(diff, -2.6 * dt, 2.6 * dt);
      const d = distance(car.x, car.y, player.x, player.y);
      const targetSpeed = d > 700
        ? TUNING.policeSpeed
        : d > 160 ? TUNING.policeSpeed * 0.92 : TUNING.policeSpeed * 0.7;
      car.speed += clamp(targetSpeed - car.speed, -700 * dt, 560 * dt);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      if (this.city.isBlocked(car.x, car.y)) {
        car.angle += Math.PI / 2;
        car.speed *= 0.5;
      }
      car.x = clamp(car.x, 30, WORLD.size - 30);
      car.y = clamp(car.y, 30, WORLD.beachY - 30);
      // Ramming the player's car damages its speed and shakes the player.
      if (player.car && d < 52 && Math.abs(car.speed) > 200) {
        player.car.speed *= 0.72;
        car.speed *= 0.6;
        if (world && world.onCrash) world.onCrash(car.x, car.y);
      }
      // A cruiser that touches the player on foot busts him after a beat.
      if (!player.car && d < 34 && world) {
        world.bustedFlag = true;
      }
    }
    // Officers walk the player down and arrest on contact.
    for (const o of this.officers) {
      const a = angleTo(o.x, o.y, player.x, player.y);
      o.angle = a;
      o.x += Math.cos(a) * o.speed * dt;
      o.y += Math.sin(a) * o.speed * dt;
      if (distance(o.x, o.y, player.x, player.y) < 26 && world) {
        world.bustedFlag = true;
      }
    }
  }
}
