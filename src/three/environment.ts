import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import type { AtmospherePreset } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface EnvironmentRig {
  applyAtmosphere: (preset: AtmospherePreset) => void;
  update: (dt: number, elapsed: number, scrollDelta: number) => void;
  dispose: () => void;
}

interface PresetConfig {
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  elevation: number;
  azimuth: number;
  sunColor: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  rimColor: number;
  rimIntensity: number;
  fogColor: number;
  fogDensity: number;
  waterColor: number;
  cloudColor: number;
  exposure: number;
  beaconGlow: number;
}

const PRESETS: Record<AtmospherePreset, PresetConfig> = {
  golden: {
    turbidity: 4.8,
    rayleigh: 1.95,
    mieCoefficient: 0.0042,
    mieDirectionalG: 0.84,
    elevation: 8.2,
    azimuth: 148,
    sunColor: 0xffc982,
    sunIntensity: 2.65,
    hemiSky: 0x6292c4,
    hemiGround: 0x26351f,
    hemiIntensity: 0.72,
    rimColor: 0xff9a44,
    rimIntensity: 0.85,
    fogColor: 0xc29876,
    fogDensity: 0.0074,
    waterColor: 0x0d3d4f,
    cloudColor: 0xf4dcc2,
    exposure: 0.86,
    beaconGlow: 1.25,
  },
  daylight: {
    turbidity: 2.4,
    rayleigh: 1.05,
    mieCoefficient: 0.0026,
    mieDirectionalG: 0.78,
    elevation: 32,
    azimuth: 138,
    sunColor: 0xfff0d4,
    sunIntensity: 2.8,
    hemiSky: 0x6caee6,
    hemiGround: 0x2b4223,
    hemiIntensity: 0.78,
    rimColor: 0xaad8ff,
    rimIntensity: 0.62,
    fogColor: 0x99c2e0,
    fogDensity: 0.0064,
    waterColor: 0x0b4b63,
    cloudColor: 0xf4f8fc,
    exposure: 0.84,
    beaconGlow: 0.6,
  },
  dusk: {
    turbidity: 7.4,
    rayleigh: 2.9,
    mieCoefficient: 0.0075,
    mieDirectionalG: 0.88,
    elevation: 2.6,
    azimuth: 158,
    sunColor: 0xff8247,
    sunIntensity: 2.15,
    hemiSky: 0x454778,
    hemiGround: 0x1a1e29,
    hemiIntensity: 0.68,
    rimColor: 0xff7038,
    rimIntensity: 1.15,
    fogColor: 0x5c475c,
    fogDensity: 0.0092,
    waterColor: 0x11243d,
    cloudColor: 0xde9e8e,
    exposure: 0.92,
    beaconGlow: 2.5,
  },
};

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function ridgedNoise(x: number, z: number): number {
  const n1 = 1 - Math.abs(Math.sin(x * 0.042 + z * 0.021) * Math.cos(x * 0.029 - z * 0.037));
  const n2 = 1 - Math.abs(Math.sin(x * 0.095 - z * 0.068 + 1.4));
  const n3 = Math.sin(x * 0.19 + z * 0.15) * 0.5 + 0.5;
  return n1 * n1 * 0.62 + n2 * n2 * 0.28 + n3 * 0.1;
}

export function createEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
  onBeaconGlow: (glow: number) => void
): EnvironmentRig {
  const disposables: Array<{ dispose: () => void }> = [];

  // 1. Atmospheric Sky dome (three/addons/objects/Sky.js)
  const sky = new Sky();
  sky.scale.setScalar(440);
  scene.add(sky);
  disposables.push(sky.geometry, sky.material);

  const fog = new THREE.FogExp2(PRESETS.golden.fogColor, PRESETS.golden.fogDensity);
  scene.fog = fog;

  // 2. Three-Point Outdoor PBR Lighting Rig (1 shadow caster with tight frustum)
  const sunLight = new THREE.DirectionalLight(PRESETS.golden.sunColor, PRESETS.golden.sunIntensity);
  sunLight.position.set(18, 22, 16);
  sunLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 75;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 28;
    sunLight.shadow.camera.top = 18;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.025;
  }
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(
    PRESETS.golden.hemiSky,
    PRESETS.golden.hemiGround,
    PRESETS.golden.hemiIntensity
  );
  scene.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(PRESETS.golden.rimColor, PRESETS.golden.rimIntensity);
  rimLight.position.set(-22, 14, -20);
  scene.add(rimLight);

  // 3. Deep Reflective Alpine River Corridor
  const waterGeo = new THREE.PlaneGeometry(260, 26, 1, 1);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: PRESETS.golden.waterColor,
    bumpMap: textures.waterBump,
    bumpScale: 0.22,
    roughness: 0.16,
    metalness: 0.24,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.72,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(22, 0.25, 0);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);
  disposables.push(waterGeo, waterMat);

  // 4. Sculpted Lush Riverbanks & Rolling Foothills (low envMapIntensity keeps matte grass deep & photorealistic)
  const bankMat = new THREE.MeshStandardMaterial({
    color: 0xdbe5d2,
    map: textures.terrainAlbedo,
    bumpMap: textures.terrainBump,
    bumpScale: 0.16,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.2,
  });
  disposables.push(bankMat);

  const buildBankGeometry = (width: number, depth: number, slopeDir: 1 | -1): THREE.BufferGeometry => {
    const geo = new THREE.PlaneGeometry(width, depth, 36, 10);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromShore = slopeDir < 0 ? Math.max(0, -z + depth * 0.5) : Math.max(0, z + depth * 0.5);
      const normalized = distFromShore / depth;
      const rolling =
        Math.sin(x * 0.075) * 1.25 +
        Math.cos(x * 0.17 + z * 0.11) * 0.65 +
        Math.sin(x * 0.036) * 2.1;
      const elevation = Math.pow(normalized, 1.32) * 10.5 + rolling * Math.min(1, normalized * 2.2) - 0.18;
      pos.setY(i, elevation);
    }
    geo.computeVertexNormals();
    return geo;
  };

  const farBankGeo = buildBankGeometry(260, 56, -1);
  const farBank = new THREE.Mesh(farBankGeo, bankMat);
  farBank.position.set(22, 0.28, -38);
  farBank.receiveShadow = true;
  scene.add(farBank);
  disposables.push(farBankGeo);

  const nearBankGeo = buildBankGeometry(260, 32, 1);
  const nearBank = new THREE.Mesh(nearBankGeo, bankMat);
  nearBank.position.set(22, 0.28, 26);
  scene.add(nearBank);
  disposables.push(nearBankGeo);

  // 5. Continuous Sculpted Ridged Alpine Mountain Range (2 tiled seamless segments for infinite parallax!)
  const RANGE_WIDTH = 220;
  const RANGE_DEPTH = 64;
  const buildMountainRangeGeo = (): THREE.BufferGeometry => {
    const geo = new THREE.PlaneGeometry(RANGE_WIDTH, RANGE_DEPTH, 44, 12);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Periodic X angle so left/right edges tile seamlessly
      const periodX = (x / RANGE_WIDTH) * Math.PI * 2;
      const zNorm = 1 - Math.abs(z) / (RANGE_DEPTH * 0.5);
      const ridgeEnvelope = Math.pow(Math.max(0, zNorm), 1.15);

      const macro =
        Math.sin(periodX * 2 + 0.5) * 0.35 +
        Math.cos(periodX * 3 - 0.9) * 0.35 +
        Math.sin(periodX * 5 + 1.3) * 0.22 +
        0.55;
      const crag = ridgedNoise(Math.cos(periodX) * 35 + Math.sin(periodX) * 28, z * 0.85);
      const h = Math.max(0, (macro * 18 + crag * 28) * ridgeEnvelope - 2.2);
      pos.setY(i, h);

      // Realistic alpine elevation shading: dark pine foothills -> slate crags -> snow-dusted summits
      if (h > 25.5 + Math.sin(periodX * 7) * 2.5) {
        cols[i * 3] = 0.86;
        cols[i * 3 + 1] = 0.88;
        cols[i * 3 + 2] = 0.92;
      } else if (h > 14.5) {
        const t = (h - 14.5) / 11;
        cols[i * 3] = 0.27 + t * 0.16;
        cols[i * 3 + 1] = 0.31 + t * 0.15;
        cols[i * 3 + 2] = 0.35 + t * 0.17;
      } else {
        const t = Math.min(1, h / 14.5);
        cols[i * 3] = 0.16 + t * 0.11;
        cols[i * 3 + 1] = 0.24 + t * 0.07;
        cols[i * 3 + 2] = 0.18 + t * 0.15;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    return geo;
  };

  const rangeGeo = buildMountainRangeGeo();
  const rangeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    bumpMap: textures.terrainBump,
    bumpScale: 0.25,
    roughness: 0.94,
    metalness: 0.03,
    envMapIntensity: 0.16,
  });
  const rangeA = new THREE.Mesh(rangeGeo, rangeMat);
  rangeA.position.set(0, -0.5, -88);
  const rangeB = new THREE.Mesh(rangeGeo, rangeMat);
  rangeB.position.set(RANGE_WIDTH, -0.5, -88);
  scene.add(rangeA, rangeB);
  disposables.push(rangeGeo, rangeMat);

  // 6. Instanced Multi-Tier Rich Alpine Spruce/Pine Forest (calibrated low envMapIntensity for deep forest greens)
  const TREE_COUNT = 104;
  const TREE_SPAN = 186;
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.26, 1.55, 8);
  trunkGeo.translate(0, 0.78, 0);
  const tier1Geo = new THREE.ConeGeometry(1.22, 2.55, 9);
  tier1Geo.translate(0, 2.15, 0);
  const tier2Geo = new THREE.ConeGeometry(0.94, 2.25, 9);
  tier2Geo.translate(0, 3.35, 0);
  const tier3Geo = new THREE.ConeGeometry(0.66, 1.95, 9);
  tier3Geo.translate(0, 4.45, 0);
  const tier4Geo = new THREE.ConeGeometry(0.38, 1.45, 8);
  tier4Geo.translate(0, 5.42, 0);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2718,
    roughness: 0.95,
    metalness: 0.02,
    envMapIntensity: 0.15,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02,
    envMapIntensity: 0.18,
  });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_COUNT);
  const tier1Inst = new THREE.InstancedMesh(tier1Geo, foliageMat, TREE_COUNT);
  const tier2Inst = new THREE.InstancedMesh(tier2Geo, foliageMat, TREE_COUNT);
  const tier3Inst = new THREE.InstancedMesh(tier3Geo, foliageMat, TREE_COUNT);
  const tier4Inst = new THREE.InstancedMesh(tier4Geo, foliageMat, TREE_COUNT);
  [trunkInst, tier1Inst, tier2Inst, tier3Inst, tier4Inst].forEach((inst) => {
    inst.frustumCulled = false;
    scene.add(inst);
  });
  disposables.push(trunkGeo, tier1Geo, tier2Geo, tier3Geo, tier4Geo, trunkMat, foliageMat);

  interface TreeData {
    x: number;
    y: number;
    z: number;
    scale: number;
    rotY: number;
  }
  const trees: TreeData[] = [];
  for (let i = 0; i < TREE_COUNT; i++) {
    const isFar = i < 86;
    const x = -56 + (i / TREE_COUNT) * TREE_SPAN + Math.sin(i * 13.7) * 3.1;
    const z = isFar ? -12.2 - ((i * 7.3) % 30) : 13.8 + ((i * 4.7) % 10);
    const bankDist = isFar ? Math.max(0, -z - 10) : Math.max(0, z - 10);
    const y = 0.25 + Math.pow(bankDist / 56, 1.3) * 9.2;
    const scale = 0.82 + ((i * 29) % 100) / 140;
    const rotY = (i * 2.13) % (Math.PI * 2);
    trees.push({ x, y, z, scale, rotY });

    // Rich dark alpine spruce/cypress foliage tones
    const hue = 0.30 + ((i * 17) % 10) * 0.007;
    const sat = 0.38 + ((i * 7) % 8) * 0.025;
    const lit = 0.12 + ((i * 11) % 8) * 0.011;
    _color.setHSL(hue, sat, lit);
    tier1Inst.setColorAt(i, _color);
    _color.setHSL(hue + 0.008, sat + 0.02, lit + 0.025);
    tier2Inst.setColorAt(i, _color);
    _color.setHSL(hue + 0.014, sat + 0.03, lit + 0.045);
    tier3Inst.setColorAt(i, _color);
    _color.setHSL(hue + 0.018, sat + 0.03, lit + 0.062);
    tier4Inst.setColorAt(i, _color);
  }
  [tier1Inst, tier2Inst, tier3Inst, tier4Inst].forEach((inst) => {
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  });

  // 7. Instanced Wet Granite River Boulders (deep slate-granite tones, realistic low envMapIntensity)
  const ROCK_COUNT = 56;
  const rockGeo = new THREE.DodecahedronGeometry(0.95, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    bumpMap: textures.terrainBump,
    bumpScale: 0.12,
    roughness: 0.76,
    metalness: 0.08,
    envMapIntensity: 0.24,
    flatShading: true,
  });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT);
  rockInst.frustumCulled = false;
  scene.add(rockInst);
  disposables.push(rockGeo, rockMat);

  interface RockData {
    x: number;
    y: number;
    z: number;
    sx: number;
    sy: number;
    sz: number;
    rot: number;
  }
  const rocks: RockData[] = [];
  for (let i = 0; i < ROCK_COUNT; i++) {
    const side = i % 3 === 0 ? 1 : -1;
    const x = -56 + (i / ROCK_COUNT) * TREE_SPAN;
    const z = side * (9.2 + ((i * 3.1) % 6.2));
    const sx = 0.68 + ((i * 19) % 10) * 0.12;
    const sy = 0.38 + ((i * 13) % 7) * 0.09;
    const sz = 0.74 + ((i * 23) % 9) * 0.11;
    rocks.push({ x, y: 0.22, z, sx, sy, sz, rot: i * 1.1 });

    const shade = 0.16 + ((i * 11) % 9) * 0.018;
    _color.setRGB(shade * 0.96, shade * 1.02, shade * 0.98);
    rockInst.setColorAt(i, _color);
  }
  if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;

  // 8. Soft Sunlit Cumulus Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: PRESETS.golden.cloudColor,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.18,
    transparent: true,
    opacity: 0.84,
  });
  const cloudPuffGeo = new THREE.IcosahedronGeometry(1, 2);
  disposables.push(cloudMat, cloudPuffGeo);

  interface CloudCluster {
    group: THREE.Group;
    speedFactor: number;
  }
  const clouds: CloudCluster[] = [];
  const CLOUD_SPAN = 210;
  for (let i = 0; i < 15; i++) {
    const cg = new THREE.Group();
    const puffs = 4 + (i % 3);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
      const px = (p - (puffs - 1) * 0.5) * 2.2;
      const py = Math.sin((p / Math.max(1, puffs - 1)) * Math.PI) * 0.85;
      const pz = ((p * 7) % 3 - 1) * 0.65;
      const s = 1.4 + Math.sin((p / Math.max(1, puffs - 1)) * Math.PI) * 1.1;
      puff.position.set(px, py, pz);
      puff.scale.set(s * 1.42, s * 0.62, s * 0.88);
      cg.add(puff);
    }
    cg.position.set(
      -65 + (i / 15) * CLOUD_SPAN,
      16.2 + ((i * 5.3) % 9.0),
      -30 - ((i * 11.7) % 46)
    );
    scene.add(cg);
    clouds.push({ group: cg, speedFactor: 0.14 + (i % 4) * 0.04 });
  }

  const syncInstances = () => {
    for (let i = 0; i < TREE_COUNT; i++) {
      const t = trees[i];
      _dummy.position.set(t.x, t.y, t.z);
      _dummy.rotation.set(0, t.rotY, 0);
      _dummy.scale.setScalar(t.scale);
      _dummy.updateMatrix();
      trunkInst.setMatrixAt(i, _dummy.matrix);
      tier1Inst.setMatrixAt(i, _dummy.matrix);
      tier2Inst.setMatrixAt(i, _dummy.matrix);
      tier3Inst.setMatrixAt(i, _dummy.matrix);
      tier4Inst.setMatrixAt(i, _dummy.matrix);
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    tier1Inst.instanceMatrix.needsUpdate = true;
    tier2Inst.instanceMatrix.needsUpdate = true;
    tier3Inst.instanceMatrix.needsUpdate = true;
    tier4Inst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < ROCK_COUNT; i++) {
      const r = rocks[i];
      _dummy.position.set(r.x, r.y, r.z);
      _dummy.rotation.set(0.1, r.rot, 0.05);
      _dummy.scale.set(r.sx, r.sy, r.sz);
      _dummy.updateMatrix();
      rockInst.setMatrixAt(i, _dummy.matrix);
    }
    rockInst.instanceMatrix.needsUpdate = true;
  };
  syncInstances();

  const sunVec = new THREE.Vector3();

  const applyAtmosphere = (preset: AtmospherePreset) => {
    const cfg = PRESETS[preset];
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = cfg.turbidity;
    uniforms['rayleigh'].value = cfg.rayleigh;
    uniforms['mieCoefficient'].value = cfg.mieCoefficient;
    uniforms['mieDirectionalG'].value = cfg.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - cfg.elevation);
    const theta = THREE.MathUtils.degToRad(cfg.azimuth);
    sunVec.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sunVec);

    sunLight.position.copy(sunVec).multiplyScalar(36);
    sunLight.position.y = Math.max(sunLight.position.y, 8);
    sunLight.color.setHex(cfg.sunColor);
    sunLight.intensity = cfg.sunIntensity;

    hemiLight.color.setHex(cfg.hemiSky);
    hemiLight.groundColor.setHex(cfg.hemiGround);
    hemiLight.intensity = cfg.hemiIntensity;

    rimLight.color.setHex(cfg.rimColor);
    rimLight.intensity = cfg.rimIntensity;

    fog.color.setHex(cfg.fogColor);
    fog.density = cfg.fogDensity;

    waterMat.color.setHex(cfg.waterColor);
    cloudMat.color.setHex(cfg.cloudColor);
    renderer.toneMappingExposure = cfg.exposure;
    onBeaconGlow(cfg.beaconGlow);
  };

  applyAtmosphere('golden');

  const update = (dt: number, elapsed: number, scrollDelta: number) => {
    textures.waterBump.offset.x += scrollDelta * 0.09 + dt * 0.2;
    textures.waterBump.offset.y = Math.sin(elapsed * 0.55) * 0.08;
    textures.terrainAlbedo.offset.x += scrollDelta * 0.03;
    textures.terrainBump.offset.x += scrollDelta * 0.03;

    if (scrollDelta > 0) {
      for (let i = 0; i < TREE_COUNT; i++) {
        trees[i].x -= scrollDelta;
        if (trees[i].x < -64) trees[i].x += TREE_SPAN;
      }
      for (let i = 0; i < ROCK_COUNT; i++) {
        rocks[i].x -= scrollDelta;
        if (rocks[i].x < -64) rocks[i].x += TREE_SPAN;
      }
      syncInstances();

      // Seamless parallax alpine mountain range scrolling
      const mShift = scrollDelta * 0.14;
      rangeA.position.x -= mShift;
      rangeB.position.x -= mShift;
      if (rangeA.position.x <= -RANGE_WIDTH) rangeA.position.x += RANGE_WIDTH * 2;
      if (rangeB.position.x <= -RANGE_WIDTH) rangeB.position.x += RANGE_WIDTH * 2;
    }

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.group.position.x -= scrollDelta * c.speedFactor + dt * 0.45;
      if (c.group.position.x < -82) c.group.position.x += CLOUD_SPAN;
    }
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
    trunkInst.dispose();
    tier1Inst.dispose();
    tier2Inst.dispose();
    tier3Inst.dispose();
    tier4Inst.dispose();
    rockInst.dispose();
  };

  return { applyAtmosphere, update, dispose };
}
