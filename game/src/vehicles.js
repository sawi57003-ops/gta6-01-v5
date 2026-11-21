// Cars: the model roster, the factory, and the top-down renderer.
//
// A car is a rounded rectangle with a windshield, a roof and headlights,
// drawn pointing along its angle. Police cars carry a light bar that
// flashes red and blue; taxis are yellow with a roof sign. The physics is
// deliberately arcade: accelerate along the heading, steer harder at speed,
// brake and reverse, and clamp to the model's top speed.

import { CAR_MODELS, CAR_PAINTS, TUNING } from './config.js';
import { pick } from './random.js';

let nextId = 1;

export function makeCar(x, y, angle, opts) {
  const o = opts || {};
  const isPolice = !!o.police;
  const isTaxi = !!o.taxi;
  const model = o.model
    ? CAR_MODELS.find((m) => m.name === o.model) || CAR_MODELS[0]
    : pick(Math.random, CAR_MODELS);
  return {
    id: nextId,
    kind: isPolice ? 'police' : isTaxi ? 'taxi' : 'civilian',
    model: isPolice
      ? { name: 'Interceptor', top: TUNING.policeSpeed, accel: 520, turn: 2.9 }
      : model,
    x,
    y,
    angle,
    speed: 0,
    cruise: 0,
    color: isPolice ? '#1c2733' : isTaxi ? '#f2c230' : (o.color || pick(Math.random, CAR_PAINTS)),
    width: 46,
    length: 78,
    health: 100,
    sirenPhase: Math.random() * Math.PI * 2,
    stuck: 0,
  };
}

// The unit vector the car is pointing along.
export function carForward(car) {
  return { x: Math.cos(car.angle), y: Math.sin(car.angle) };
}

// Arcade driving: throttle 1 forward, -1 brake/reverse, 0 coast. Steering
// bites harder the faster the car goes, and reverses when reversing.
export function driveCar(car, throttle, steer, dt) {
  const model = car.model;
  if (throttle > 0) {
    car.speed += model.accel * throttle * dt;
  } else if (throttle < 0) {
    if (car.speed > 8) car.speed -= TUNING.carBrake * dt;
    else car.speed -= TUNING.carReverseMax * 0.55 * dt;
  } else {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 240 * dt);
  }
  if (car.speed > model.top) car.speed = model.top;
  if (car.speed < -TUNING.carReverseMax) car.speed = -TUNING.carReverseMax;
  const grip = Math.min(1, Math.abs(car.speed) / 140);
  car.angle += steer * model.turn * grip * Math.sign(car.speed || 1) * dt;
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
}

export function drawCar(ctx, car, time) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  const w = car.width;
  const l = car.length;
  // Shadow, offset down-right.
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.roundRect(-l / 2 + 3, -w / 2 + 4, l, w, 10);
  ctx.fill();
  // Body.
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-l / 2, -w / 2, l, w, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood shading at the front.
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.roundRect(l / 2 - 16, -w / 2 + 4, 12, w - 8, 6);
  ctx.fill();
  // Windshield and rear window.
  ctx.fillStyle = 'rgba(20,28,40,0.85)';
  ctx.beginPath();
  ctx.roundRect(l / 2 - 30, -w / 2 + 5, 12, w - 10, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-l / 2 + 12, -w / 2 + 5, 10, w - 10, 4);
  ctx.fill();
  // Roof.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.roundRect(-l / 2 + 26, -w / 2 + 6, l - 62, w - 12, 7);
  ctx.fill();
  // Headlights and taillights.
  ctx.fillStyle = '#fff8c8';
  ctx.fillRect(l / 2 - 3, -w / 2 + 6, 3, 8);
  ctx.fillRect(l / 2 - 3, w / 2 - 14, 3, 8);
  ctx.fillStyle = '#ff3b30';
  ctx.fillRect(-l / 2, -w / 2 + 6, 3, 8);
  ctx.fillRect(-l / 2, w / 2 - 14, 3, 8);
  // Police light bar, flashing red/blue with the siren phase.
  if (car.kind === 'police') {
    const phase = Math.sin(time * 9 + car.sirenPhase) > 0;
    ctx.fillStyle = phase ? '#ff2d2d' : '#2d7bff';
    ctx.beginPath();
    ctx.roundRect(-8, -w / 2 + 4, 16, 10, 3);
    ctx.fill();
    ctx.fillStyle = phase ? '#2d7bff' : '#ff2d2d';
    ctx.beginPath();
    ctx.roundRect(-8, w / 2 - 14, 16, 10, 3);
    ctx.fill();
    ctx.fillStyle = '#f5f2e8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 0, 3);
  }
  // Taxi roof sign.
  if (car.kind === 'taxi') {
    ctx.fillStyle = '#22262b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, 3);
  }
  ctx.restore();
}
