export function makeBox(x, z, w, d) {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

export function resolveCircle(pos, r, boxes) {
  for (let iter = 0; iter < 2; iter++) {
    for (const b of boxes) {
      const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      const dx = pos.x - cx;
      const dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        const k = (r - d) / d;
        pos.x += dx * k;
        pos.z += dz * k;
      } else {
        const l = pos.x - b.minX + r;
        const rr = b.maxX - pos.x + r;
        const t = pos.z - b.minZ + r;
        const bt = b.maxZ - pos.z + r;
        const m = Math.min(l, rr, t, bt);
        if (m === l) pos.x = b.minX - r;
        else if (m === rr) pos.x = b.maxX + r;
        else if (m === t) pos.z = b.minZ - r;
        else pos.z = b.maxZ + r;
      }
    }
  }
}
