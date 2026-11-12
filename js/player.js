import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CONFIG } from './config.js';
import { resolveCircle } from './collision.js';

export function createPlayer(camera, colliders) {
  const controls = new PointerLockControls(camera, document.body);
  const keys = {};
  let moving = false;

  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  function update(dt) {
    if (!controls.isLocked) return;

    const forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
    const right = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    moving = forward !== 0 || right !== 0;

    if (moving) {
      const norm = forward !== 0 && right !== 0 ? Math.SQRT1_2 : 1;
      const step = CONFIG.WALK_SPEED * dt * norm;
      controls.moveForward(forward * step);
      controls.moveRight(right * step);
    }

    resolveCircle(camera.position, CONFIG.PLAYER_RADIUS, colliders);
    camera.position.y = CONFIG.PLAYER_HEIGHT;
  }

  return { controls, update, get moving() { return moving; } };
}
