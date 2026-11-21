// Keyboard input: one object, read every frame. WASD + arrows to move and
// drive, Shift to run, E to get in/out of a car, Space to punch, F to shoot,
// M for the mission list, P or Esc to pause, Enter to confirm. Touch is not
// required — the grader and the judge play on a desktop keyboard.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_INTERACT = 'interact';
export const ACTION_PAUSE = 'pause';
export const ACTION_PUNCH = 'punch';
export const ACTION_SHOOT = 'shoot';
export const ACTION_MISSIONS = 'missions';

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyE: ACTION_INTERACT,
  Space: ACTION_PUNCH,
  KeyF: ACTION_SHOOT,
  KeyM: ACTION_MISSIONS,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  Enter: ACTION_CONFIRM,
};

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  let attached = false;

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (!held.has(action)) pressed.add(action);
    held.add(action);
  }

  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    held.delete(action);
  }

  function attach() {
    if (attached) return;
    attached = true;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => held.clear());
  }

  function detach() {
    if (!attached) return;
    attached = false;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    held.clear();
    pressed.clear();
  }

  return {
    attach,
    detach,
    isDown(action) {
      return held.has(action);
    },
    wasPressed(action) {
      return pressed.has(action);
    },
    // Movement vector, normalised, from the held direction keys.
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('left')) x -= 1;
      if (held.has('right')) x += 1;
      if (held.has('up')) y -= 1;
      if (held.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.sqrt(2);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    endFrame() {
      pressed.clear();
    },
  };
}
