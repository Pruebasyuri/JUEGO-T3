import * as THREE from 'three';
import { CONFIG } from './config.js';

export function createPickups(scene, defs, weapons) {
  const items = defs.map((def) => {
    const color = def.weapon === 'pistola' ? 0xffc933 : 0xff5a36;
    const group = new THREE.Group();

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.4, 0.4),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.5 })
    );
    box.position.y = 0.6;
    group.add(box);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 2.2, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, fog: false,
      })
    );
    beam.position.y = 1.1;
    group.add(beam);

    group.position.set(def.x, 0, def.z);
    scene.add(group);
    return { def, group, box, taken: false };
  });

  function update(dt, time, playerPos, onCollect) {
    const r2 = CONFIG.PICKUP_RADIUS * CONFIG.PICKUP_RADIUS;
    for (const item of items) {
      if (item.taken) continue;
      item.box.rotation.y += dt * 1.5;
      item.box.position.y = 0.6 + Math.sin(time * 2 + item.def.x) * 0.08;

      const dx = playerPos.x - item.def.x;
      const dz = playerPos.z - item.def.z;
      if (dx * dx + dz * dz < r2) {
        item.taken = true;
        item.group.visible = false;
        const { amount, name } = weapons.addAmmo(item.def.weapon);
        onCollect(name, amount);
      }
    }
  }

  return { update, remaining: () => items.filter((i) => !i.taken).length };
}
