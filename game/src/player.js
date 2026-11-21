// Vic Marlowe on foot and behind the wheel. On foot he walks or runs, can
// punch and shoot, and can steal the nearest car. In a car he drives it. He
// carries health, cash, pistol ammo and a wanted level that the police read.

import { TUNING } from './config.js';
import { clamp, distance } from './random.js';
import { driveCar } from './vehicles.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.radius = TUNING.playerRadius;
    this.health = TUNING.playerHealth;
    this.cash = 0;
    this.ammo = TUNING.pistolAmmoStart;
    this.wanted = 0;
    this.wantedTimer = 0;
    this.car = null;
    this.punchTimer = 0;
    this.shootTimer = 0;
    this.hurtTimer = 0;
    this.moving = false;
  }

  get speed() {
    return this.car ? Math.abs(this.car.speed) : 0;
  }

  hurt(amount) {
    if (this.hurtTimer > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.hurtTimer = 0.55;
  }

  addCash(amount) {
    this.cash += amount;
  }

  addWanted(stars) {
    this.wanted = clamp(this.wanted + stars, 0, 5);
    this.wantedTimer = TUNING.wantedDecaySeconds;
  }

  update(dt, input, city, world) {
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.punchTimer > 0) this.punchTimer -= dt;
    if (this.shootTimer > 0) this.shootTimer -= dt;
    if (this.wanted > 0) {
      this.wantedTimer -= dt;
      if (this.wantedTimer <= 0) {
        this.wanted = Math.max(0, this.wanted - 1);
        this.wantedTimer = TUNING.wantedDecaySeconds;
      }
    }

    const mv = input.moveVector();
    this.moving = mv.x !== 0 || mv.y !== 0;

    if (this.car) {
      const throttle = mv.y < 0 ? 1 : mv.y > 0 ? -1 : 0;
      const steer = mv.x;
      driveCar(this.car, throttle, steer, dt);
      // Keep the car out of buildings and inside the world.
      if (city.isBlocked(this.car.x, this.car.y)) {
        this.car.x -= Math.cos(this.car.angle) * this.car.speed * dt;
        this.car.y -= Math.sin(this.car.angle) * this.car.speed * dt;
        this.car.speed *= 0.45;
        if (Math.abs(this.car.speed) > 240 && world && world.onCrash) world.onCrash(this.car.x, this.car.y);
      }
      this.car.x = clamp(this.car.x, 30, 2670);
      this.car.y = clamp(this.car.y, 30, 2610);
      this.x = this.car.x;
      this.y = this.car.y;
      this.angle = this.car.angle;
      return;
    }

    // On foot.
    const run = input.isDown('run');
    const speed = run ? TUNING.runSpeed : TUNING.walkSpeed;
    const nx = this.x + mv.x * speed * dt;
    const ny = this.y + mv.y * speed * dt;
    if (!city.isBlocked(nx, this.y)) this.x = nx;
    if (!city.isBlocked(this.x, ny)) this.y = ny;
    this.x = clamp(this.x, 20, 2680);
    this.y = clamp(this.y, 20, 2620);
    if (this.moving) this.angle = Math.atan2(mv.y, mv.x);
  }

  // Nearest stealable car within reach, or null.
  nearestCar(cars) {
    let best = null;
    let bestD = 64;
    for (const c of cars) {
      const d = distance(this.x, this.y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  enterCar(car) {
    this.car = car;
    this.x = car.x;
    this.y = car.y;
    this.angle = car.angle;
  }

  exitCar() {
    if (!this.car) return;
    const car = this.car;
    this.car = null;
    // Step out to the driver's side.
    const side = car.angle + Math.PI / 2;
    this.x = car.x + Math.cos(side) * 34;
    this.y = car.y + Math.sin(side) * 34;
    this.angle = car.angle;
  }

  // Punch: hits the nearest pedestrian, cop or driver in range.
  punch(targets) {
    if (this.punchTimer > 0 || this.car) return null;
    this.punchTimer = 0.34;
    let best = null;
    let bestD = TUNING.punchRange;
    for (const t of targets) {
      const d = distance(this.x, this.y, t.x, t.y);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  shoot() {
    if (this.shootTimer > 0 || this.car || this.ammo <= 0) return false;
    this.shootTimer = 0.3;
    this.ammo -= 1;
    return true;
  }
}
