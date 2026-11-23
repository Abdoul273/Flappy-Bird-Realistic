import * as THREE from 'three';
import type { TrailFxDef } from '../game/shop';

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  spin: number;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
}

export interface ParticleSystem {
  applyTrailFx: (fx: TrailFxDef) => void;
  spawnFlapFeathers: (x: number, y: number) => void;
  spawnScoreSparkles: (x: number, y: number, golden: boolean) => void;
  spawnShieldShatter: (x: number, y: number) => void;
  spawnCrashBurst: (x: number, y: number) => void;
  update: (dt: number, scrollDelta: number) => void;
  dispose: () => void;
}

const POOL_SIZE = 160;
const AMBIENT_COUNT = 48;

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export function createParticleSystem(scene: THREE.Scene): ParticleSystem {
  const slots: ParticleSlot[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    slots.push({
      active: false,
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      spin: 0,
      size: 0.1,
      life: 0,
      maxLife: 1,
      gravity: 0,
    });
  }

  let cursor = 0;

  // Dynamic gameplay particle pool (feathers, wind wisps, golden bursts)
  const pGeo = new THREE.OctahedronGeometry(0.14, 0);
  pGeo.scale(1.6, 0.38, 0.75);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.25,
    emissive: new THREE.Color(0x3a2608),
    emissiveIntensity: 0.35,
  });
  const inst = new THREE.InstancedMesh(pGeo, pMat, POOL_SIZE);
  inst.frustumCulled = false;
  scene.add(inst);

  // Ambient floating golden sun-pollen motes
  const moteGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0xffe8a3,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const motes = new THREE.InstancedMesh(moteGeo, moteMat, AMBIENT_COUNT);
  motes.frustumCulled = false;
  scene.add(motes);

  const motePositions: Array<{ x: number; y: number; z: number; phase: number }> = [];
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    motePositions.push({
      x: -14 + ((i * 19.7) % 44),
      y: 1.5 + ((i * 7.3) % 10.5),
      z: -7 + ((i * 4.9) % 14),
      phase: i * 1.7,
    });
  }

  // Hide all dynamic slots initially
  _dummy.scale.setScalar(0);
  _dummy.updateMatrix();
  for (let i = 0; i < POOL_SIZE; i++) {
    inst.setMatrixAt(i, _dummy.matrix);
    inst.setColorAt(i, _color.setHex(0xf6c453));
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

  const emitOne = (
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    size: number,
    maxLife: number,
    gravity: number,
    hexColor: number
  ) => {
    const idx = cursor;
    cursor = (cursor + 1) % POOL_SIZE;
    const s = slots[idx];
    s.active = true;
    s.x = x;
    s.y = y;
    s.z = z;
    s.vx = vx;
    s.vy = vy;
    s.vz = vz;
    s.rotX = Math.random() * Math.PI * 2;
    s.rotY = Math.random() * Math.PI * 2;
    s.rotZ = Math.random() * Math.PI * 2;
    s.spin = (Math.random() - 0.5) * 9;
    s.size = size;
    s.life = maxLife;
    s.maxLife = maxLife;
    s.gravity = gravity;

    inst.setColorAt(idx, _color.setHex(hexColor));
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  };

  let activeTrailColors: [number, number, number, number] = [0xf7c547, 0xfff3d4, 0xd8f1ff, 0xe89624];

  const applyTrailFx = (fx: TrailFxDef) => {
    activeTrailColors = fx.colors;
    pMat.emissive.setHex(fx.emissiveHex);
    pMat.emissiveIntensity = fx.emissiveIntensity;
  };

  const spawnFlapFeathers = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      emitOne(
        x - 0.25 + (Math.random() - 0.5) * 0.35,
        y - 0.08 + (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.55,
        -2.6 - Math.random() * 2.4,
        -1.2 - Math.random() * 1.8,
        (Math.random() - 0.5) * 1.6,
        0.58 + Math.random() * 0.45,
        0.48 + Math.random() * 0.34,
        -1.8,
        activeTrailColors[i % activeTrailColors.length]
      );
    }
  };

  const spawnShieldShatter = (x: number, y: number) => {
    const palette = [0x38bdf8, 0x7dd3fc, 0xe0f2fe, 0xfde047];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.random() * 0.2;
      const spd = 3.2 + Math.random() * 4.5;
      emitOne(
        x,
        y,
        (Math.random() - 0.5) * 0.6,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        (Math.random() - 0.5) * 3.8,
        0.85 + Math.random() * 0.5,
        0.55 + Math.random() * 0.35,
        -2.4,
        palette[i % palette.length]
      );
    }
  };

  const spawnScoreSparkles = (x: number, y: number, golden: boolean) => {
    const count = golden ? 20 : 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const spd = (golden ? 3.8 : 2.5) + Math.random() * 2.2;
      emitOne(
        x,
        y,
        (Math.random() - 0.5) * 0.6,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        (Math.random() - 0.5) * 2.6,
        golden ? 0.9 : 0.65,
        0.55 + Math.random() * 0.35,
        -3.2,
        golden ? (i % 2 === 0 ? 0xffdf6b : 0xffaa2b) : 0x7ef2c2
      );
    }
  };

  const spawnCrashBurst = (x: number, y: number) => {
    const palette = [0xf7c547, 0xe89624, 0x1d4e6b, 0xfff3d4];
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2.0 + Math.random() * 5.8;
      emitOne(
        x + (Math.random() - 0.5) * 0.4,
        y + (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.5,
        Math.cos(a) * spd,
        Math.sin(a) * spd + 1.8,
        (Math.random() - 0.5) * 4.5,
        0.75 + Math.random() * 0.65,
        0.75 + Math.random() * 0.55,
        -7.2,
        palette[i % palette.length]
      );
    }
  };

  let moteClock = 0;

  const update = (dt: number, scrollDelta: number) => {
    moteClock += dt;

    for (let i = 0; i < POOL_SIZE; i++) {
      const s = slots[i];
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        inst.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      s.vy += s.gravity * dt;
      s.x += s.vx * dt - scrollDelta * 0.35;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.rotX += s.spin * dt;
      s.rotZ += s.spin * 0.7 * dt;

      const t = s.life / s.maxLife;
      const scale = s.size * Math.min(1, t * 2.2);
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.rotation.set(s.rotX, s.rotY, s.rotZ);
      _dummy.scale.setScalar(scale);
      _dummy.updateMatrix();
      inst.setMatrixAt(i, _dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const m = motePositions[i];
      m.x -= scrollDelta * 0.45 + dt * 0.4;
      if (m.x < -16) m.x += 44;
      const floatY = m.y + Math.sin(moteClock * 1.4 + m.phase) * 0.35;
      _dummy.position.set(m.x, floatY, m.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(0.85 + Math.sin(moteClock * 2.6 + m.phase) * 0.25);
      _dummy.updateMatrix();
      motes.setMatrixAt(i, _dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;
  };

  const dispose = () => {
    pGeo.dispose();
    pMat.dispose();
    inst.dispose();
    moteGeo.dispose();
    moteMat.dispose();
    motes.dispose();
  };

  return {
    applyTrailFx,
    spawnFlapFeathers,
    spawnScoreSparkles,
    spawnShieldShatter,
    spawnCrashBurst,
    update,
    dispose,
  };
}
