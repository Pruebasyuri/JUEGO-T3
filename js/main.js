import * as THREE from 'three';
import { LEVEL } from './level.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createZombies } from './zombies.js';
import { createWeapons } from './weapons.js';
import { createPickups } from './pickups.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';

const hud = createHud();
const audio = createAudio();
hud.setMenu('Cargando recursos…');

const textureLoader = new THREE.TextureLoader();
async function loadTexture(url) {
  try {
    const tex = await textureLoader.loadAsync(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  } catch (err) {
    console.warn('No se pudo cargar la textura', url, err);
    return null;
  }
}

const textures = {
  asfalto: await loadTexture('./textures/asfalto.jpg'),
  concreto: await loadTexture('./textures/concreto.jpg'),
};

const world = createWorld(textures);
const player = createPlayer(world.camera, world.colliders);
const zombies = await createZombies(world.scene, world.colliders, {
  onAlert: () => audio.alert(),
});
const weapons = await createWeapons(world.camera, world.scene, {
  getTargets: () => [...zombies.aliveRoots(), ...world.solids],
  damageZombie: (zombie) => zombies.damage(zombie, 1),
  onShot: (def) => audio.shot(def.id),
  onEmpty: () => { audio.empty(); hud.toast('¡Sin munición!'); },
  onHit: (killed) => { hud.hitMarker(killed); if (killed) audio.kill(); else audio.hit(); },
  onSwitch: () => audio.swap(),
});
const pickups = createPickups(world.scene, LEVEL.crates, weapons);

let state = 'menu';
let flashlightOn = true;
const clock = new THREE.Clock();
let time = 0;

hud.setMenu('Haz clic para jugar');
hud.setWeapon(weapons.getInfo());
hud.setZombies(zombies.aliveCount());

document.getElementById('menu').addEventListener('click', () => {
  if (state === 'menu' || state === 'playing') {
    audio.init();
    player.controls.lock();
  }
});
player.controls.addEventListener('lock', () => {
  if (state === 'menu') state = 'playing';
  hud.setMenu('', false);
});
player.controls.addEventListener('unlock', () => {
  if (state === 'playing') hud.setMenu('PAUSA - haz clic para continuar');
});

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || state !== 'playing' || !player.controls.isLocked) return;
  weapons.shoot();
});

window.addEventListener('keydown', (e) => {
  if ((state === 'over' || state === 'won') && e.code === 'KeyR') {
    location.reload();
    return;
  }
  if (state !== 'playing' || !player.controls.isLocked) return;
  if (e.code === 'Digit1') weapons.select(0);
  if (e.code === 'Digit2') weapons.select(1);
  if (e.code === 'KeyF') {
    flashlightOn = !flashlightOn;
    world.setFlashlight(flashlightOn);
  }
});

function endGame(newState, title, message, kind) {
  state = newState;
  hud.showEnd(title, message, kind);
  player.controls.unlock();
}

function insideExtraction(pos) {
  const e = LEVEL.extraction;
  return Math.abs(pos.x - e.x) < e.w / 2 && Math.abs(pos.z - e.z) < e.d / 2;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;
  world.update(time);

  if (state === 'playing' && player.controls.isLocked) {
    const pos = world.camera.position;
    player.update(dt);
    const caught = zombies.update(dt, pos, time);
    weapons.update(dt, player.moving, time);
    pickups.update(dt, time, pos, (name, amount) => {
      audio.pickup();
      hud.toast(`+${amount} balas de ${name}`);
    });

    hud.setWeapon(weapons.getInfo());
    hud.setZombies(zombies.aliveCount());
    hud.setDistance(Math.max(0, Math.round(pos.z - LEVEL.extraction.z)));

    if (caught) {
      audio.gameOver();
      endGame('over', 'GAME OVER', 'Un zombi te atrapó.', 'over');
    } else if (insideExtraction(pos)) {
      audio.win();
      endGame('won', '¡MISIÓN COMPLETADA!', 'Has llegado a la zona de extracción', 'win');
    }
  }

  world.renderer.render(world.scene, world.camera);
}
animate();
