import * as THREE from 'three';
import { CONFIG } from './config.js';
import { LEVEL } from './level.js';
import { makeBox } from './collision.js';

const SKY = 0x0b1018;

function makeSign(text, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.round(1024 * (h / w));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(10,14,10,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#7CFC00';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = '#7CFC00';
  ctx.font = `bold ${Math.round(canvas.height * 0.36)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 60);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, fog: false })
  );
  return mesh;
}

export function createWorld(textures) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 300);
  camera.position.set(LEVEL.start.x, CONFIG.PLAYER_HEIGHT, LEVEL.start.z);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x7a8fb5, 0x2a2a30, 1.5));
  const moon = new THREE.DirectionalLight(0x9bb0e0, 1.0);
  moon.position.set(-20, 40, 10);
  scene.add(moon);

  const flashlight = new THREE.SpotLight(0xfff1cc, 60, 45, 0.5, 0.45, 1.5);
  flashlight.position.set(0.15, -0.1, 0);
  flashlight.target.position.set(0, 0, -10);
  camera.add(flashlight, flashlight.target);

  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 500; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.random() * 1.2 + 0.15;
    const r = 250;
    starPos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r - 120);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, fog: false })));

  const colliders = [];
  const solids = [];

  function concreteMaterial(w, h, d, tint = 0xbbbbbb) {
    if (!textures.concreto) return new THREE.MeshStandardMaterial({ color: 0x6f737a, roughness: 1 });
    const tex = textures.concreto.clone();
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(Math.max(w, d) / 4, Math.max(h / 4, 0.5));
    return new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: 1 });
  }

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x141c26, roughness: 0.2, metalness: 0.5 });

  function addBlock(item) {
    let material;
    if (item.kind === 'auto') material = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.5, metalness: 0.4 });
    else if (item.kind === 'contenedor') material = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.7, metalness: 0.3 });
    else if (item.kind === 'caja') material = woodMat;
    else material = concreteMaterial(item.w, item.h, item.d);

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(item.w, item.h, item.d), material);
    mesh.position.set(item.x, item.h / 2, item.z);
    scene.add(mesh);
    solids.push(mesh);
    colliders.push(makeBox(item.x, item.z, item.w, item.d));

    if (item.kind === 'auto') {
      const alongX = item.w > item.d;
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? item.w * 0.5 : item.w * 0.85, 0.7, alongX ? item.d * 0.85 : item.d * 0.5),
        glassMat
      );
      cabin.position.set(item.x, item.h + 0.35, item.z);
      scene.add(cabin);
      solids.push(cabin);
    }
  }
  LEVEL.walls.forEach(addBlock);

  for (const r of LEVEL.roofs) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.3, r.d), concreteMaterial(r.w, 1, r.d, 0x888888));
    roof.position.set(r.x, r.y, r.z);
    scene.add(roof);
  }

  const groundLength = 275;
  const groundTex = textures.asfalto;
  let groundMat;
  if (groundTex) {
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(34 / 5, groundLength / 5);
    groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 });
  } else {
    groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 1 });
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, groundLength), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -120);
  scene.add(ground);
  solids.push(ground);

  const startPad = new THREE.Mesh(
    new THREE.CircleGeometry(3, 32),
    new THREE.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.3 })
  );
  startPad.rotation.x = -Math.PI / 2;
  startPad.position.set(LEVEL.start.x, 0.02, LEVEL.start.z);
  scene.add(startPad);

  const E = LEVEL.extraction;
  const padMat = new THREE.MeshBasicMaterial({ color: 0x35ff6a, transparent: true, opacity: 0.35 });
  const pad = new THREE.Mesh(new THREE.CircleGeometry(6, 40), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(E.x, 0.03, E.z);
  scene.add(pad);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x35ff6a, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 40, 24, 1, true), beamMat);
  beam.position.set(E.x, 20, E.z);
  scene.add(beam);
  const extractionLight = new THREE.PointLight(0x35ff6a, 60, 30, 1.5);
  extractionLight.position.set(E.x, 3, E.z);
  scene.add(extractionLight);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  for (const lamp of LEVEL.lamps) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), bulbMat);
    bulb.position.set(lamp.x, 4.2, lamp.z);
    scene.add(bulb);
    if (lamp.pole) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8), poleMat);
      pole.position.set(lamp.x, 2.1, lamp.z);
      scene.add(pole);
    }
    const light = new THREE.PointLight(0xffc27a, 45, 28, 1.6);
    light.position.set(lamp.x, 4, lamp.z);
    scene.add(light);
  }

  for (const s of LEVEL.signs) {
    const sign = makeSign(s.text, s.w, s.h);
    sign.position.set(s.x, s.y, s.z);
    scene.add(sign);
  }

  function update(time) {
    padMat.opacity = 0.3 + Math.sin(time * 2.5) * 0.12;
    beam.rotation.y = time * 0.4;
    beamMat.opacity = 0.16 + Math.sin(time * 2) * 0.05;
  }

  function setFlashlight(on) {
    flashlight.visible = on;
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, colliders, solids, update, setFlashlight };
}
