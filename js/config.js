export const CONFIG = {
  PLAYER_HEIGHT: 1.7,
  PLAYER_RADIUS: 0.45,
  WALK_SPEED: 6,

  FOG_NEAR: 10,
  FOG_FAR: 70,

  WEAPONS: [
    {
      id: 'pistola',
      name: 'PISTOLA',
      model: './models/arma1.glb',
      ammoStart: 12,
      ammoPerCrate: 10,
      cooldown: 0.28,
      pellets: 1,
      spread: 0,
      range: 70,
      scale: 1,
      position: [0.2, -0.2, -0.45],
      muzzle: [0, 0.03, -0.3],
      kick: 0.05,
    },
    {
      id: 'escopeta',
      name: 'ESCOPETA',
      model: './models/arma2.glb',
      ammoStart: 6,
      ammoPerCrate: 4,
      cooldown: 0.85,
      pellets: 6,
      spread: 0.05,
      range: 40,
      scale: 0.7,
      position: [0.22, -0.24, -0.5],
      muzzle: [0, 0.03, -1.0],
      kick: 0.1,
    },
  ],

  ZOMBIE: {
    model: './models/zombie.glb',
    hp: 2,
    radius: 0.45,
    attackDistance: 0.9,
    types: {
      caminante: { speed: 2.2, detect: 14, scale: 1.0, tint: 0xffffff },
      normal: { speed: 3.4, detect: 16, scale: 1.0, tint: 0xe8e8d8 },
      corredor: { speed: 5.2, detect: 20, scale: 0.95, tint: 0xffb0a0 },
    },
  },

  PICKUP_RADIUS: 1.2,
};
