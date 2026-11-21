// Staged screenshot scenes. ?shot=cover|chase|mission|street places the
// player, cars and police in a composed frame, paints it once and sets
// window.__shotReady so a screenshot tool knows the frame is done. The cover
// is the neon downtown at dusk with the player driving; chase is a police
// pursuit; mission is the gold beacon at the Marina; street is a quiet
// Ocean Drive cruise. Deterministic: the same seed, the same frame.

import { WORLD, PITCH } from './config.js';
import { roadCenter } from './city.js';
import { makeCar } from './vehicles.js';

export function stageShot(world, name) {
  const player = world.player;
  const traffic = world.traffic;
  const police = world.police;
  const missions = world.missions;

  // Clear the default scatter and compose deliberately.
  traffic.cars.length = 0;
  traffic.peds.length = 0;
  police.cars.length = 0;
  police.officers.length = 0;
  world.parkedCars.length = 0;
  world.pickups.length = 0;

  if (name === 'cover') {
    // Downtown neon, player driving a pink Comet through the strip.
    const car = makeCar(roadCenter(4), roadCenter(3), 0, { color: '#ff5da2' });
    car.speed = 320;
    world.parkedCars.push(
      makeCar(roadCenter(4) - 120, roadCenter(3) + 26, 0, { color: '#4dd8ff' }),
      makeCar(roadCenter(4) + 180, roadCenter(3) - 26, Math.PI, { color: '#e8b73a' }),
    );
    player.enterCar(car);
    player.wanted = 2;
    police.cars.push(makeCar(roadCenter(4) - 260, roadCenter(3), 0, { police: true }));
    missions.active = true;
    missions.index = 0;
    missions.step = 0;
  } else if (name === 'chase') {
    // A three-star pursuit on the Northside grid.
    const car = makeCar(roadCenter(2), roadCenter(1), 0, { color: '#c23b2e' });
    car.speed = 480;
    player.enterCar(car);
    player.wanted = 3;
    police.cars.push(
      makeCar(roadCenter(2) - 220, roadCenter(1), 0, { police: true }),
      makeCar(roadCenter(2) + 200, roadCenter(1) + 70, Math.PI, { police: true }),
      makeCar(roadCenter(2), roadCenter(1) - 220, Math.PI / 2, { police: true }),
    );
    traffic.cars.push(makeCar(roadCenter(2) + 420, roadCenter(1), Math.PI, { color: '#e8e4da' }));
  } else if (name === 'mission') {
    // The gold beacon at the Marina pickup, player on foot.
    player.exitCar();
    player.x = roadCenter(7) - 120;
    player.y = roadCenter(6) - 40;
    player.angle = Math.PI / 4;
    missions.active = true;
    missions.index = 0;
    missions.step = 0;
    world.parkedCars.push(makeCar(roadCenter(7) + 60, roadCenter(6) + 20, Math.PI / 2, { color: '#3fae7a' }));
  } else {
    // A quiet Ocean Drive cruise at sunset, palms and water.
    const car = makeCar(roadCenter(3), roadCenter(7), 0, { color: '#4dd8ff' });
    car.speed = 240;
    player.enterCar(car);
    world.parkedCars.push(makeCar(roadCenter(3) + 260, roadCenter(7) - 24, Math.PI, { color: '#e8b73a' }));
  }

  // Let the renderer settle one frame, then signal readiness.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
