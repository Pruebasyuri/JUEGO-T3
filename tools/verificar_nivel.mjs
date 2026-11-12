import { LEVEL } from '../js/level.js';
import { makeBox, resolveCircle } from '../js/collision.js';
const R = 0.45;
const boxes = LEVEL.walls.map(w => makeBox(w.x, w.z, w.w, w.d));
const free = (x, z) => boxes.every(b => {
  const cx = Math.max(b.minX, Math.min(x, b.maxX)), cz = Math.max(b.minZ, Math.min(z, b.maxZ));
  return Math.hypot(x - cx, z - cz) >= R - 1e-6;
});
let bad = 0;
const check = (name, p) => { if (!free(p.x, p.z)) { console.log('BLOQUEADO', name, p); bad++; } };
check('start', LEVEL.start);
LEVEL.zombies.forEach((z, i) => check('zombi' + i, z));
LEVEL.crates.forEach((c, i) => check('caja' + i, c));
const step = 0.25, x0 = -15, z0 = 10, nx = Math.round(30 / step), nz = Math.round(260 / step);
const seen = new Uint8Array((nx + 1) * (nz + 1));
const id = (i, j) => j * (nx + 1) + i;
const si = Math.round((LEVEL.start.x - x0) / step), sj = Math.round((z0 - LEVEL.start.z) / step);
const q = [[si, sj]]; seen[id(si, sj)] = 1; let reached = null; let reachedAny = false;
const E = LEVEL.extraction;
while (q.length) {
  const [i, j] = q.pop();
  const x = x0 + i * step, z = z0 - j * step;
  if (Math.abs(x - E.x) < E.w / 2 && Math.abs(z - E.z) < E.d / 2) { reached = reached || { x, z }; }
  for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni > nx || nj > nz || seen[id(ni, nj)]) continue;
    const X = x0 + ni * step, Z = z0 - nj * step;
    if (!free(X, Z)) continue;
    seen[id(ni, nj)] = 1; q.push([ni, nj]);
  }
}
console.log('Extracción alcanzable desde el inicio:', !!reached, reached || '');
const zs = LEVEL.zombies.filter(z => !seen[id(Math.round((z.x - x0) / step), Math.round((z0 - z.z) / step))]);
console.log('Zombis en zonas no alcanzables:', zs.length);
const cr = LEVEL.crates.filter(c => !seen[id(Math.round((c.x - x0) / step), Math.round((z0 - c.z) / step))]);
console.log('Cajas en zonas no alcanzables:', cr.length, ' | zombis:', LEVEL.zombies.length, ' | cajas:', LEVEL.crates.length);
const p = { x: -9.2, z: -20.3 }; resolveCircle(p, R, boxes); console.log('resolveCircle empuja fuera:', free(p.x, p.z));
console.log('problemas de colocación:', bad);
