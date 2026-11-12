import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';
import { LEVEL } from './level.js';
import { resolveCircle } from './collision.js';

const FLASH_COLOR = new THREE.Color(0.9, 0.05, 0.05);

function lerpAngle(a, b, t) {
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
}

function fallbackZombie() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.8, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x6a8a5a })
  );
  body.position.y = 0.9;
  g.add(body);
  return g;
}

export async function createZombies(scene, colliders, hooks) {
  const loader = new GLTFLoader();
  let template = null;
  try {
    template = (await loader.loadAsync(CONFIG.ZOMBIE.model)).scene;
  } catch (err) {
    console.warn('No se pudo cargar el zombi GLB, se usa un modelo básico', err);
  }

  const list = [];

  function spawn(def) {
    const type = CONFIG.ZOMBIE.types[def.type];
    const root = template ? template.clone(true) : fallbackZombie();
    root.rotation.order = 'YXZ';
    root.position.set(def.x, 0, def.z);
    root.rotation.y = Math.random() * Math.PI * 2;
    root.scale.setScalar(type.scale);

    const mats = [];
    const tint = new THREE.Color(type.tint);
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.color.multiply(tint);
      o.material.userData.baseEmissive = o.material.emissive.clone();
      mats.push(o.material);
    });

    const zombie = {
      root,
      type: def.type,
      state: 'idle',
      hp: CONFIG.ZOMBIE.hp,
      speed: type.speed,
      detect: type.detect,
      radius: CONFIG.ZOMBIE.radius,
      phase: Math.random() * Math.PI * 2,
      flash: 0,
      deathT: 0,
      avoidT: 0,
      avoidSign: 1,
      mats,
      parts: {
        armL: root.getObjectByName('BrazoIzq'),
        armR: root.getObjectByName('BrazoDer'),
        legL: root.getObjectByName('PiernaIzq'),
        legR: root.getObjectByName('PiernaDer'),
        head: root.getObjectByName('Cabeza'),
      },
    };
    root.userData.zombie = zombie;
    scene.add(root);
    return zombie;
  }

  for (const def of LEVEL.zombies) list.push(spawn(def));

  function animateIdle(z, time) {
    const p = z.parts;
    if (p.armL) p.armL.rotation.x = -0.25 + Math.sin(time * 1.5 + z.phase) * 0.05;
    if (p.armR) p.armR.rotation.x = -0.25 + Math.sin(time * 1.5 + z.phase + 1) * 0.05;
    if (p.head) p.head.rotation.z = Math.sin(time * 0.8 + z.phase) * 0.12;
  }

  function animateWalk(z) {
    const p = z.parts;
    const s = Math.sin(z.phase);
    if (p.legL) p.legL.rotation.x = s * 0.7;
    if (p.legR) p.legR.rotation.x = -s * 0.7;
    if (p.armL) p.armL.rotation.x = -1.35 + Math.sin(z.phase * 2) * 0.1;
    if (p.armR) p.armR.rotation.x = -1.35 + Math.sin(z.phase * 2 + 1) * 0.1;
    if (p.head) p.head.rotation.z = Math.sin(z.phase * 0.5) * 0.15;
  }

  function die(z) {
    z.state = 'dead';
    z.deathT = 0;
    const p = z.parts;
    if (p.legL) p.legL.rotation.x = 0;
    if (p.legR) p.legR.rotation.x = 0;
    if (p.armL) p.armL.rotation.x = -0.4;
    if (p.armR) p.armR.rotation.x = -0.4;
  }

  function damage(z, amount = 1) {
    if (z.state === 'dead') return false;
    z.hp -= amount;
    z.flash = 0.15;
    if (z.hp <= 0) {
      die(z);
      return true;
    }
    if (z.state === 'idle') {
      z.state = 'active';
      hooks.onAlert?.(z);
    }
    return false;
  }

  function update(dt, playerPos, time) {
    let caught = false;
    const active = [];

    for (const z of list) {
      const pos = z.root.position;

      for (const m of z.mats) {
        m.emissive.copy(z.flash > 0 ? FLASH_COLOR : m.userData.baseEmissive);
      }
      if (z.flash > 0) z.flash -= dt;

      if (z.state === 'dead') {
        z.deathT += dt;
        const k = Math.min(1, z.deathT / 0.6);
        z.root.rotation.x = -k * (Math.PI / 2);
        pos.y = 0.12 * k;
        continue;
      }

      const dx = playerPos.x - pos.x;
      const dz = playerPos.z - pos.z;
      const dist = Math.hypot(dx, dz);

      if (z.state === 'idle') {
        animateIdle(z, time);
        if (dist < z.detect) {
          z.state = 'active';
          hooks.onAlert?.(z);
        }
      }

      if (z.state === 'active') {
        active.push(z);
        let nx = dx / (dist || 1);
        let nz = dz / (dist || 1);
        if (z.avoidT > 0) {
          z.avoidT -= dt;
          const a = 1.1 * z.avoidSign;
          const rx = nx * Math.cos(a) - nz * Math.sin(a);
          const rz = nx * Math.sin(a) + nz * Math.cos(a);
          nx = rx;
          nz = rz;
        }

        const step = z.speed * dt;
        const px = pos.x;
        const pz = pos.z;
        pos.x += nx * step;
        pos.z += nz * step;
        resolveCircle(pos, z.radius, colliders);

        if (Math.hypot(pos.x - px, pos.z - pz) < step * 0.35 && z.avoidT <= 0) {
          z.avoidT = 0.7;
          z.avoidSign = Math.random() < 0.5 ? -1 : 1;
        }

        z.root.rotation.y = lerpAngle(z.root.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 8));
        z.phase += dt * z.speed * 3.2;
        animateWalk(z);

        if (dist < CONFIG.ZOMBIE.attackDistance) caught = true;
      }
    }

    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i].root.position;
        const b = active[j].root.position;
        const ddx = b.x - a.x;
        const ddz = b.z - a.z;
        const d = Math.hypot(ddx, ddz);
        const min = 0.9;
        if (d > 0 && d < min) {
          const push = (min - d) / 2;
          a.x -= (ddx / d) * push;
          a.z -= (ddz / d) * push;
          b.x += (ddx / d) * push;
          b.z += (ddz / d) * push;
        }
      }
    }

    return caught;
  }

  return {
    list,
    update,
    damage,
    aliveRoots: () => list.filter((z) => z.state !== 'dead').map((z) => z.root),
    aliveCount: () => list.filter((z) => z.state !== 'dead').length,
  };
}
