import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

function fallbackWeapon() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.08, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  body.position.z = -0.15;
  g.add(body);
  return g;
}

export async function createWeapons(camera, scene, hooks) {
  const loader = new GLTFLoader();
  const defs = CONFIG.WEAPONS;
  const slots = [];

  for (const def of defs) {
    let model;
    try {
      model = (await loader.loadAsync(def.model)).scene;
    } catch (err) {
      console.warn('No se pudo cargar el arma GLB:', def.model, err);
      model = fallbackWeapon();
    }
    model.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    model.scale.setScalar(def.scale);

    const holder = new THREE.Group();
    holder.add(model);
    holder.position.fromArray(def.position);
    holder.visible = false;

    const muzzlePos = new THREE.Vector3().fromArray(def.muzzle).multiplyScalar(def.scale);
    const muzzle = new THREE.Object3D();
    muzzle.position.copy(muzzlePos);
    holder.add(muzzle);

    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffdd88, fog: false })
    );
    flash.position.copy(muzzlePos);
    flash.visible = false;
    holder.add(flash);

    const light = new THREE.PointLight(0xffaa55, 0, 8);
    light.position.copy(muzzlePos);
    holder.add(light);

    camera.add(holder);
    slots.push({ def, holder, muzzle, flash, light });
  }

  slots[0].holder.visible = true;

  const ammo = defs.map((d) => d.ammoStart);
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const pellet = new THREE.Vector3();
  const muzzleWorld = new THREE.Vector3();
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.8 });
  const tracers = [];

  let current = 0;
  let swapTarget = null;
  let swapT = 1;
  let cooldown = 0;
  let kick = 0;
  let flashT = 0;

  function select(index) {
    if (index < 0 || index >= slots.length) return;
    if (swapTarget === null && index === current) return;
    swapTarget = index;
    swapT = 0;
    hooks.onSwitch?.(defs[index]);
  }

  function shoot() {
    if (swapT < 1 || cooldown > 0) return;
    const slot = slots[current];
    const def = slot.def;

    if (ammo[current] <= 0) {
      cooldown = 0.25;
      hooks.onEmpty?.();
      return;
    }

    ammo[current] -= 1;
    cooldown = def.cooldown;
    kick = def.kick * 10;
    flashT = 0.05;
    hooks.onShot?.(def);

    camera.getWorldPosition(origin);
    camera.getWorldDirection(dir);
    right.crossVectors(dir, camera.up).normalize();
    up.crossVectors(right, dir).normalize();
    slot.muzzle.getWorldPosition(muzzleWorld);

    const targets = hooks.getTargets();
    const hitZombies = new Set();

    for (let p = 0; p < def.pellets; p++) {
      pellet.copy(dir);
      if (def.spread > 0) {
        pellet
          .addScaledVector(right, (Math.random() * 2 - 1) * def.spread)
          .addScaledVector(up, (Math.random() * 2 - 1) * def.spread)
          .normalize();
      }
      raycaster.set(origin, pellet);
      raycaster.far = def.range;
      const hits = raycaster.intersectObjects(targets, true);

      let end = origin.clone().addScaledVector(pellet, def.range);
      if (hits.length > 0) {
        end = hits[0].point.clone();
        let obj = hits[0].object;
        while (obj && !obj.userData.zombie) obj = obj.parent;
        if (obj) hitZombies.add(obj.userData.zombie);
      }

      const geo = new THREE.BufferGeometry().setFromPoints([muzzleWorld.clone(), end]);
      const line = new THREE.Line(geo, tracerMat);
      scene.add(line);
      tracers.push({ line, life: 0.05 });
    }

    for (const zombie of hitZombies) {
      const killed = hooks.damageZombie(zombie);
      hooks.onHit?.(killed);
    }
  }

  function addAmmo(id) {
    const i = defs.findIndex((d) => d.id === id);
    if (i < 0) return { amount: 0, name: '' };
    ammo[i] += defs[i].ammoPerCrate;
    return { amount: defs[i].ammoPerCrate, name: defs[i].name };
  }

  function update(dt, moving, time) {
    cooldown = Math.max(0, cooldown - dt);
    kick = Math.max(0, kick - dt * 5);
    flashT = Math.max(0, flashT - dt);

    let swapOffset = 0;
    if (swapT < 1) {
      swapT = Math.min(1, swapT + dt / 0.3);
      if (swapT >= 0.5 && swapTarget !== null) {
        slots[current].holder.visible = false;
        current = swapTarget;
        slots[current].holder.visible = true;
        swapTarget = null;
      }
      swapOffset = -Math.sin(swapT * Math.PI) * 0.3;
    }

    const slot = slots[current];
    const base = slot.def.position;
    const bx = moving ? Math.sin(time * 9) * 0.008 : 0;
    const by = moving ? Math.abs(Math.cos(time * 9)) * 0.008 : Math.sin(time * 1.5) * 0.002;
    slot.holder.position.set(base[0] + bx, base[1] + by + swapOffset, base[2] + kick * 0.2);
    slot.holder.rotation.x = kick * 0.4;
    slot.flash.visible = flashT > 0;
    slot.light.intensity = flashT > 0 ? 6 : 0;

    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].life -= dt;
      if (tracers[i].life <= 0) {
        scene.remove(tracers[i].line);
        tracers[i].line.geometry.dispose();
        tracers.splice(i, 1);
      }
    }
  }

  function getInfo() {
    const other = (current + 1) % slots.length;
    return {
      name: defs[current].name,
      ammo: ammo[current],
      otherName: defs[other].name,
      otherAmmo: ammo[other],
    };
  }

  return { shoot, select, update, addAmmo, getInfo };
}
