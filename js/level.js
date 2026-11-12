const walls = [];
const W = (x, z, w, d, h, kind = 'concreto', color = 0xffffff) =>
  walls.push({ x, z, w, d, h, kind, color });

W(-15.5, -120, 1, 260, 6);
W(15.5, -120, 1, 260, 6);
W(0, 10.5, 32, 1, 6);
W(0, -250.5, 32, 1, 6);

W(-9, -20, 12, 1, 3);
W(9, -20, 12, 1, 3);
W(-10, 2, 2, 2, 1.6, 'caja');
W(11, 5, 2.4, 1.6, 1.2, 'caja');
W(-11, 7, 1.6, 1.6, 1.6, 'caja');

const autos = [
  [-9, -30, 2.2, 4.4, 0x7a2e2e],
  [6, -34, 4.4, 2.2, 0x2e4a7a],
  [-3, -44, 2.2, 4.4, 0x6b6b2e],
  [10, -50, 2.2, 4.4, 0x3d3d3d],
  [-10, -58, 4.4, 2.2, 0x2e6b4a],
  [2, -62, 2.2, 4.4, 0x8a5a2a],
  [-5, -70, 4.4, 2.2, 0x7a2e2e],
  [9, -72, 2.2, 4.4, 0x2e4a7a],
];
for (const [x, z, w, d, c] of autos) W(x, z, w, d, 1.4, 'auto', c);

W(-12, -78, 6, 1.2, 5);
W(0, -78, 8, 1.2, 5);
W(12, -78, 6, 1.2, 5);
W(-3, -92, 24, 1.2, 5);
W(3, -106, 24, 1.2, 5);
W(-3, -120, 24, 1.2, 5);
W(-9, -134, 12, 1.2, 5);
W(9, -134, 12, 1.2, 5);
for (const [x, z] of [[-6, -85], [6, -86], [-4, -99], [5, -100], [6, -113], [-6, -114], [-3, -127], [5, -128]]) {
  W(x, z, 1.4, 1.4, 4.5);
}

const contenedores = [
  [-9, -146, 6, 0x8a3b2b],
  [5, -150, 8, 0x2d5c7a],
  [-4, -160, 8, 0x6b7a2d],
  [10, -164, 6, 0x7a6b2d],
  [-10, -172, 6, 0x2d5c7a],
  [3, -176, 8, 0x8a3b2b],
  [-8, -186, 6, 0x7a6b2d],
  [8, -188, 6, 0x6b7a2d],
];
for (const [x, z, w, c] of contenedores) W(x, z, w, 2.4, 2.6, 'contenedor', c);

W(-9, -196, 12, 1, 4);
W(9, -196, 12, 1, 4);
W(-5, -214, 1, 36, 3);
W(5, -214, 1, 36, 3);
W(-2, -205, 2, 1.2, 1.2, 'caja');
W(2, -215, 2, 1.2, 1.2, 'caja');
W(-2, -224, 2.4, 1.2, 1.2, 'caja');

export const LEVEL = {
  start: { x: 0, z: 4 },
  walls,
  roofs: [{ x: 0, z: -106.5, w: 30, d: 57, y: 4.9 }],
  extraction: { x: 0, z: -240, w: 16, d: 14 },
  zombies: [
    { x: -9, z: -38, type: 'normal' },
    { x: 8, z: -44, type: 'caminante' },
    { x: 0, z: -54, type: 'normal' },
    { x: -8, z: -66, type: 'caminante' },
    { x: -11, z: -85, type: 'normal' },
    { x: 3, z: -86, type: 'caminante' },
    { x: 12, z: -98, type: 'caminante' },
    { x: -2, z: -100, type: 'normal' },
    { x: -12, z: -112, type: 'normal' },
    { x: 2, z: -114, type: 'corredor' },
    { x: 10, z: -126, type: 'normal' },
    { x: -8, z: -128, type: 'caminante' },
    { x: -3, z: -146, type: 'normal' },
    { x: 10, z: -156, type: 'corredor' },
    { x: -10, z: -166, type: 'normal' },
    { x: 2, z: -182, type: 'corredor' },
    { x: 0, z: -204, type: 'corredor' },
    { x: -3, z: -214, type: 'normal' },
    { x: 3, z: -224, type: 'corredor' },
  ],
  crates: [
    { x: -7, z: -9, weapon: 'pistola' },
    { x: 12, z: -47, weapon: 'pistola' },
    { x: -12, z: -52, weapon: 'escopeta' },
    { x: 12, z: -84, weapon: 'escopeta' },
    { x: -12, z: -99, weapon: 'pistola' },
    { x: 12, z: -112, weapon: 'pistola' },
    { x: -12, z: -127, weapon: 'escopeta' },
    { x: -13, z: -155, weapon: 'pistola' },
    { x: 13, z: -174, weapon: 'escopeta' },
    { x: 4, z: -168, weapon: 'pistola' },
    { x: -3.5, z: -199, weapon: 'pistola' },
  ],
  lamps: [
    { x: -13.5, z: -10, pole: true },
    { x: 13.5, z: -60, pole: true },
    { x: 0, z: -88, pole: false },
    { x: 0, z: -110, pole: false },
    { x: 0, z: -130, pole: false },
    { x: -13.5, z: -165, pole: true },
    { x: 0, z: -212, pole: false },
  ],
  signs: [
    { text: 'ZONA SEGURA', x: -9, y: 1.7, z: -19.4, w: 5, h: 1.2 },
    { text: 'ALMACÉN INFESTADO', x: 0, y: 3.2, z: -77.35, w: 6, h: 1.4 },
    { text: 'PLAZA DE CONTENEDORES', x: -9, y: 3.2, z: -133.35, w: 7, h: 1.4 },
    { text: 'PASILLO FINAL', x: -9, y: 2.4, z: -195.4, w: 5, h: 1.2 },
    { text: 'ZONA DE EXTRACCIÓN', x: 0, y: 4.5, z: -249.9, w: 12, h: 2.4 },
  ],
};
