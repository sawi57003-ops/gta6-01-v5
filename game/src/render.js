// The camera and the renderer: a top-down view of Vice Bay that follows the
// player, draws the city (roads, sidewalks, buildings with neon, parks,
// palms, beach and water), then traffic, police, the player and the mission
// beacon. Screens: title, play, paused, busted, wasted, complete. The camera
// zooms out slightly at speed so driving feels fast.

import { WORLD, PITCH, PALETTE, GAME_TITLE, CITY_NAME, STORY, PLAYER_NAME } from './config.js';
import { clamp, distance } from './random.js';
import { districtAt } from './city.js';
import { drawCar } from './vehicles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_WASTED = 'wasted';
export const SCREEN_COMPLETE = 'complete';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
  }

  follow(px, py, speed, vw, vh, dt) {
    const targetZoom = speed > 420 ? 0.78 : speed > 220 ? 0.88 : 1;
    this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 2.5);
    const tx = px - vw / 2 / this.zoom;
    const ty = py - vh / 2 / this.zoom;
    const k = 1 - Math.pow(0.0015, dt);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let vw = 0;
  let vh = 0;

  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawWorld(world, camera, time) {
    const cam = camera;
    ctx.save();
    ctx.clearRect(0, 0, vw, vh);
    // Sunset gradient sky behind the world edge.
    const sky = ctx.createLinearGradient(0, 0, 0, vh);
    sky.addColorStop(0, '#1a1030');
    sky.addColorStop(0.55, '#3a1a4a');
    sky.addColorStop(1, '#7a2a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, vw, vh);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    const view = {
      x0: cam.x - 80, y0: cam.y - 80,
      x1: cam.x + vw / cam.zoom + 80, y1: cam.y + vh / cam.zoom + 80,
    };
    const city = world.city;

    // Ground: grass.
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, WORLD.size, WORLD.beachY);
    // Grass variation patches.
    ctx.fillStyle = PALETTE.grassDark;
    for (let i = 0; i < 40; i += 1) {
      const gx = (i * 613) % WORLD.size;
      const gy = (i * 331) % WORLD.beachY;
      ctx.fillRect(gx, gy, 90, 46);
    }
    // Beach sand and water.
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(0, WORLD.beachY, WORLD.size, WORLD.waterY - WORLD.beachY);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(0, WORLD.waterY, WORLD.size, WORLD.size - WORLD.waterY);
    ctx.fillStyle = PALETTE.waterDeep;
    for (let i = 0; i < 26; i += 1) {
      const wx = (i * 211) % WORLD.size;
      ctx.fillRect(wx, WORLD.waterY + 14 + ((i * 37) % 40), 70, 5);
    }

    // Roads: asphalt strips along every grid line, with centre dashes.
    ctx.fillStyle = PALETTE.asphalt;
    for (let i = 0; i <= WORLD.blocks; i += 1) {
      const c = i * PITCH + WORLD.road / 2;
      ctx.fillRect(0, c - WORLD.road / 2, WORLD.size, WORLD.road);
      ctx.fillRect(c - WORLD.road / 2, 0, WORLD.road, WORLD.beachY);
    }
    ctx.fillStyle = PALETTE.asphaltDark;
    for (let i = 0; i <= WORLD.blocks; i += 1) {
      const c = i * PITCH + WORLD.road / 2;
      ctx.fillRect(0, c - 4, WORLD.size, 8);
      ctx.fillRect(c - 4, 0, 8, WORLD.beachY);
    }
    // Lane dashes.
    ctx.fillStyle = PALETTE.lane;
    for (let i = 0; i <= WORLD.blocks; i += 1) {
      const c = i * PITCH + WORLD.road / 2;
      for (let d = 0; d < WORLD.size; d += 64) {
        ctx.fillRect(d, c - 2, 30, 4);
        if (c < WORLD.beachY) ctx.fillRect(c - 2, d, 4, 30);
      }
    }

    // Parks.
    for (const p of city.parks) {
      if (p.x0 > view.x1 || p.x0 + p.w < view.x0 || p.y0 > view.y1 || p.y0 + p.h < view.y0) continue;
      ctx.fillStyle = PALETTE.park;
      ctx.fillRect(p.x0, p.y0, p.w, p.h);
      ctx.fillStyle = PALETTE.tree;
      ctx.beginPath();
      ctx.arc(p.x0 + p.w * 0.3, p.y0 + p.h * 0.4, 16, 0, Math.PI * 2);
      ctx.arc(p.x0 + p.w * 0.65, p.y0 + p.h * 0.6, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    // Parking lots.
    ctx.fillStyle = '#4a4d55';
    for (const lot of city.parkingLots) {
      ctx.fillRect(lot.x0, lot.y0, lot.w, lot.h);
      ctx.strokeStyle = 'rgba(232,217,90,0.7)';
      ctx.lineWidth = 2;
      for (let s = 0; s < 5; s += 1) {
        const sx = lot.x0 + 20 + s * 44;
        ctx.strokeRect(sx, lot.y0 + 12, 34, 60);
      }
    }
    // Buildings with roof colour and a neon edge downtown.
    for (const b of city.buildings) {
      if (b.x > view.x1 || b.x + b.w < view.x0 || b.y > view.y1 || b.y + b.h < view.y0) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = PALETTE.buildingEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      // Roof detail: a lighter inner rectangle and a skylight.
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(b.x + b.w * 0.3, b.y + b.h * 0.35, b.w * 0.22, b.h * 0.22);
      if (b.neon) {
        const glow = 0.55 + 0.45 * Math.sin(time * 3 + b.x);
        ctx.strokeStyle = b.neon;
        ctx.globalAlpha = glow;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
        ctx.globalAlpha = 1;
      }
    }
    // Neon signs.
    ctx.textAlign = 'center';
    for (const s of city.neonSigns) {
      if (s.x > view.x1 || s.x < view.x0 || s.y > view.y1 || s.y < view.y0) continue;
      const glow = 0.6 + 0.4 * Math.sin(time * 4 + s.x);
      ctx.globalAlpha = glow;
      ctx.fillStyle = s.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(s.text, s.x, s.y);
      ctx.globalAlpha = 1;
    }
    // Palm trees.
    for (const p of city.palms) {
      if (p.x > view.x1 || p.x < view.x0 || p.y > view.y1 || p.y < view.y0) continue;
      ctx.strokeStyle = '#6a4a2a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 3 * p.s, p.y - 16 * p.s);
      ctx.stroke();
      ctx.fillStyle = PALETTE.palm;
      for (let f = 0; f < 5; f += 1) {
        const a = (f / 5) * Math.PI * 2 + 0.4;
        ctx.beginPath();
        ctx.ellipse(p.x + 3 * p.s + Math.cos(a) * 11 * p.s, p.y - 16 * p.s + Math.sin(a) * 7 * p.s, 12 * p.s, 4 * p.s, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.palmLight;
      ctx.beginPath();
      ctx.arc(p.x + 3 * p.s, p.y - 16 * p.s, 3 * p.s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Skid marks.
    ctx.strokeStyle = 'rgba(20,20,24,0.4)';
    ctx.lineWidth = 5;
    for (const s of world.skids) {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }
    // Pickups (cash, health, ammo).
    for (const pk of world.pickups) {
      const bob = Math.sin(time * 5 + pk.x) * 3;
      ctx.save();
      ctx.translate(pk.x, pk.y + bob);
      if (pk.kind === 'cash') {
        ctx.fillStyle = '#2fae4e';
        ctx.fillRect(-11, -7, 22, 14);
        ctx.fillStyle = '#ffd34d';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 4);
      } else if (pk.kind === 'health') {
        ctx.fillStyle = '#f5f2e8';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#e5484d';
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillRect(-8, -3, 16, 6);
      } else {
        ctx.fillStyle = '#ffd34d';
        ctx.fillRect(-10, -6, 20, 12);
        ctx.fillStyle = '#22262b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AMMO', 0, 3);
      }
      ctx.restore();
    }

    // Parked cars.
    for (const car of world.parkedCars) drawCar(ctx, car, time);
    // Traffic.
    for (const car of world.traffic.cars) drawCar(ctx, car, time);
    // Police cruisers.
    for (const car of world.police.cars) drawCar(ctx, car, time);
    // Pedestrians.
    for (const ped of world.traffic.peds) {
      ctx.fillStyle = ped.color;
      ctx.beginPath();
      ctx.arc(ped.x, ped.y, ped.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(ped.x, ped.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Police officers.
    for (const o of world.police.officers) {
      ctx.fillStyle = '#1c2733';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a6fd8';
      ctx.beginPath();
      ctx.arc(o.x, o.y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // The player (on foot: a figure; in a car: the car itself).
    const player = world.player;
    if (player.car) {
      drawCar(ctx, player.car, time);
    } else {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(2, 3, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Jacket (pink, Vic's signature) and head.
      ctx.fillStyle = '#ff5da2';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b73a';
      ctx.beginPath();
      ctx.arc(6, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      // Direction tick.
      ctx.strokeStyle = '#f5f2e8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      ctx.restore();
      // Punch arc.
      if (player.punchTimer > 0.2) {
        ctx.strokeStyle = 'rgba(255,211,77,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 30, player.angle - 0.7, player.angle + 0.7);
        ctx.stroke();
      }
    }
    // Particles (cash bursts, impacts).
    for (const pt of world.particles) {
      ctx.fillStyle = pt.color || '#ffd34d';
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
    // Mission beacon: a pulsing gold column and ring at the target.
    const target = world.missions.stepTarget();
    if (target && world.missions.active) {
      const pulse = 0.6 + 0.4 * Math.sin(time * 5);
      ctx.save();
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(target.x - 5, target.y - 190, 10, 190);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 30 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffd34d';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼', target.x, target.y - 34);
      ctx.restore();
    }
    // A route hint: a faint line from the player toward the mission target.
    if (target && world.missions.active) {
      const d = distance(player.x, player.y, target.x, target.y);
      if (d > 260) {
        const a = Math.atan2(target.y - player.y, target.x - player.x);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,211,77,0.55)';
        ctx.lineWidth = 3;
        ctx.setLineDash([14, 12]);
        ctx.beginPath();
        ctx.moveTo(player.x + Math.cos(a) * 40, player.y + Math.sin(a) * 40);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
    return { vw, vh };
  }

  function drawTitle(world, time) {
    const cx = vw / 2;
    ctx.fillStyle = 'rgba(12,8,24,0.72)';
    ctx.fillRect(0, 0, vw, vh);
    // Big neon title.
    ctx.textAlign = 'center';
    const glow = 0.7 + 0.3 * Math.sin(time * 2.4);
    ctx.save();
    ctx.shadowColor = '#ff5da2';
    ctx.shadowBlur = 34 * glow;
    ctx.fillStyle = '#ff5da2';
    ctx.font = 'bold 84px sans-serif';
    ctx.fillText('NEON VICE', cx, vh * 0.3);
    ctx.restore();
    ctx.fillStyle = '#4dd8ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('A Vice Bay crime story  •  launch week', cx, vh * 0.3 + 44);
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'italic 17px sans-serif';
    ctx.fillText(world.beat || '', cx, vh * 0.3 + 74);
    ctx.fillStyle = '#f5f2e8';
    ctx.font = '17px sans-serif';
    const lines = [
      STORY,
      '',
      'WASD / arrows — move & drive      Shift — run',
      'E — get in / out of a car      Space — punch      F — shoot',
      'M — jobs      P / Esc — pause',
      '',
      'Steal cars, outrun the PD, finish all six jobs and pay off the $60,000.',
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, cx, vh * 0.44 + i * 26);
    });
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Press ENTER to start', cx, vh * 0.44 + lines.length * 26 + 18);
    ctx.fillStyle = 'rgba(245,242,232,0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Best: ' + (world.best || '—') + '      •      Progress saves automatically', cx, vh - 30);
  }

  function drawOverlay(title, sub, hint) {
    ctx.fillStyle = 'rgba(12,8,24,0.66)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5f2e8';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(title, vw / 2, vh * 0.4);
    ctx.font = '19px sans-serif';
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(sub, vw / 2, vh * 0.4 + 42);
    ctx.fillStyle = '#f5f2e8';
    ctx.font = '16px sans-serif';
    ctx.fillText(hint, vw / 2, vh * 0.4 + 84);
  }

  return {
    resize,
    drawWorld,
    drawTitle,
    drawOverlay,
    get vw() { return vw; },
    get vh() { return vh; },
  };
}
