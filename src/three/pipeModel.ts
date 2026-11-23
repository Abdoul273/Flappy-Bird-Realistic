import * as THREE from 'three';
import { WORLD } from '../game/engine';
import type { PipeThemeDef } from '../game/shop';
import type { PipeData } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface PipeVisual {
  group: THREE.Group;
  sync: (pipe: PipeData, elapsed: number) => void;
}

export interface PipePool {
  group: THREE.Group;
  syncAll: (pipes: PipeData[], elapsed: number) => void;
  applyTheme: (theme: PipeThemeDef) => void;
  setDuskGlow: (intensity: number) => void;
  dispose: () => void;
}

export function createPipePool(count: number, textures: ProceduralTextureSet): PipePool {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Shared high-craft PBR materials (distinct roughness/metalness contrast)
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pipeAlbedo,
    bumpMap: textures.pipeBump,
    bumpScale: 0.032,
    roughnessMap: textures.pipeRoughness,
    roughness: 0.36,
    metalness: 0.34,
  });

  const flangeMat = new THREE.MeshStandardMaterial({
    color: 0x1e7d4b,
    bumpMap: textures.pipeBump,
    bumpScale: 0.025,
    roughness: 0.22,
    metalness: 0.58,
  });

  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8a84e,
    bumpMap: textures.brassBump,
    bumpScale: 0.015,
    roughness: 0.2,
    metalness: 0.88,
    clearcoat: 0.35,
  });

  const interiorBoreMat = new THREE.MeshStandardMaterial({
    color: 0x06120c,
    roughness: 0.92,
    metalness: 0.05,
  });

  const basePlinthMat = new THREE.MeshStandardMaterial({
    color: 0x3b4844,
    bumpMap: textures.terrainBump,
    bumpScale: 0.05,
    roughness: 0.84,
    metalness: 0.14,
  });

  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xffc456,
    emissive: new THREE.Color(0xff9a28),
    emissiveIntensity: 0.95,
    roughness: 0.18,
    metalness: 0.1,
  });

  const movingBeaconMat = new THREE.MeshStandardMaterial({
    color: 0x72f0ff,
    emissive: new THREE.Color(0x28d7ff),
    emissiveIntensity: 1.55,
    roughness: 0.15,
    metalness: 0.15,
  });

  const goldRingMat = new THREE.MeshPhysicalMaterial({
    color: 0xffce45,
    emissive: new THREE.Color(0xc27700),
    emissiveIntensity: 0.42,
    roughness: 0.14,
    metalness: 0.92,
    clearcoat: 0.8,
  });

  materials.push(
    shaftMat,
    flangeMat,
    brassMat,
    interiorBoreMat,
    basePlinthMat,
    beaconMat,
    movingBeaconMat,
    goldRingMat
  );

  // Shared procedural geometries (Lathe flange collar, cylinder shaft, hex bolt, recessed bore, gold ring)
  const SHAFT_HEIGHT = 16;
  const shaftGeo = new THREE.CylinderGeometry(WORLD.PIPE_RADIUS, WORLD.PIPE_RADIUS, SHAFT_HEIGHT, 28, 1, false);

  // Sculpted beveled hydraulic flange collar via LatheGeometry
  const collarPoints = [
    new THREE.Vector2(WORLD.PIPE_RADIUS * 0.96, 0),
    new THREE.Vector2(WORLD.PIPE_COLLAR_RADIUS * 0.94, 0.04),
    new THREE.Vector2(WORLD.PIPE_COLLAR_RADIUS, 0.14),
    new THREE.Vector2(WORLD.PIPE_COLLAR_RADIUS, 0.56),
    new THREE.Vector2(WORLD.PIPE_COLLAR_RADIUS * 0.95, 0.68),
    new THREE.Vector2(WORLD.PIPE_RADIUS * 0.86, 0.72),
    new THREE.Vector2(WORLD.PIPE_RADIUS * 0.82, 0.48),
  ];
  const collarGeo = new THREE.LatheGeometry(collarPoints, 28);

  const brassBandGeo = new THREE.TorusGeometry(WORLD.PIPE_COLLAR_RADIUS + 0.015, 0.045, 10, 28);
  brassBandGeo.rotateX(Math.PI / 2);

  const boltGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.12, 6);
  boltGeo.rotateZ(Math.PI / 2);

  const boreGeo = new THREE.CylinderGeometry(WORLD.PIPE_RADIUS * 0.82, WORLD.PIPE_RADIUS * 0.82, 0.4, 24);
  const beaconGeo = new THREE.SphereGeometry(0.085, 12, 10);
  const plinthGeo = new THREE.CylinderGeometry(WORLD.PIPE_RADIUS * 1.18, WORLD.PIPE_RADIUS * 1.38, 0.9, 24);

  const ringTorusGeo = new THREE.TorusGeometry(0.68, 0.075, 12, 28);
  const ringGemGeo = new THREE.OctahedronGeometry(0.22, 0);

  geometries.push(
    shaftGeo,
    collarGeo,
    brassBandGeo,
    boltGeo,
    boreGeo,
    beaconGeo,
    plinthGeo,
    ringTorusGeo,
    ringGemGeo
  );

  const buildPipeHalf = (isTop: boolean): { group: THREE.Group; beacons: THREE.Mesh[] } => {
    const g = new THREE.Group();
    const dir = isTop ? 1 : -1;

    // 1. Main enameled shaft
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = dir * (WORLD.PIPE_COLLAR_HEIGHT + SHAFT_HEIGHT * 0.5 - 0.05);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    g.add(shaft);

    // 2. Sculpted flared collar at opening lip
    const collar = new THREE.Mesh(collarGeo, flangeMat);
    if (isTop) {
      collar.rotation.x = Math.PI;
      collar.position.y = WORLD.PIPE_COLLAR_HEIGHT;
    } else {
      collar.position.y = -WORLD.PIPE_COLLAR_HEIGHT;
    }
    collar.castShadow = true;
    collar.receiveShadow = true;
    g.add(collar);

    // 3. Machined brass accent trim ring
    const brassBand = new THREE.Mesh(brassBandGeo, brassMat);
    brassBand.position.y = dir * 0.34;
    g.add(brassBand);

    // 4. Recessed dark hollow bore
    const bore = new THREE.Mesh(boreGeo, interiorBoreMat);
    bore.position.y = dir * 0.22;
    g.add(bore);

    // 5. Ring of 8 hex bolts around collar
    for (let b = 0; b < 8; b++) {
      const angle = (b / 8) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, brassMat);
      bolt.position.set(
        Math.cos(angle) * (WORLD.PIPE_COLLAR_RADIUS + 0.01),
        dir * 0.52,
        Math.sin(angle) * (WORLD.PIPE_COLLAR_RADIUS + 0.01)
      );
      bolt.rotation.y = -angle;
      g.add(bolt);
    }

    // 6. Twin aviation warning beacon diodes on front & back lip
    const beacons: THREE.Mesh[] = [];
    for (const zSign of [-1, 1]) {
      const diode = new THREE.Mesh(beaconGeo, beaconMat);
      diode.position.set(0, dir * 0.16, zSign * (WORLD.PIPE_COLLAR_RADIUS + 0.02));
      g.add(diode);
      beacons.push(diode);
    }

    return { group: g, beacons };
  };

  const visuals: PipeVisual[] = [];

  for (let i = 0; i < count; i++) {
    const pairGroup = new THREE.Group();
    const bottom = buildPipeHalf(false);
    const top = buildPipeHalf(true);
    pairGroup.add(bottom.group, top.group);

    // River-level stone/iron foundation plinth for grounding
    const plinth = new THREE.Mesh(plinthGeo, basePlinthMat);
    plinth.position.y = WORLD.GROUND_Y + 0.12;
    plinth.receiveShadow = true;
    pairGroup.add(plinth);

    // Optional Golden Wind-Ring collectible suspended in gap
    const ringGroup = new THREE.Group();
    const ringTorus = new THREE.Mesh(ringTorusGeo, goldRingMat);
    const ringGem = new THREE.Mesh(ringGemGeo, goldRingMat);
    ringGroup.add(ringTorus, ringGem);
    pairGroup.add(ringGroup);

    root.add(pairGroup);

    const allBeacons = [...bottom.beacons, ...top.beacons];

    visuals.push({
      group: pairGroup,
      sync: (pipe: PipeData, elapsed: number) => {
        pairGroup.position.x = pipe.x;
        const halfGap = pipe.gapHeight * 0.5;
        top.group.position.y = pipe.gapY + halfGap;
        bottom.group.position.y = pipe.gapY - halfGap;

        // Hydraulic moving pipes display cyan-blue telegraph beacons
        const targetMat = pipe.moving ? movingBeaconMat : beaconMat;
        for (let b = 0; b < allBeacons.length; b++) {
          if (allBeacons[b].material !== targetMat) {
            allBeacons[b].material = targetMat;
          }
        }

        const showRing = pipe.ring.active && !pipe.ring.collected;
        ringGroup.visible = showRing;
        if (showRing) {
          ringGroup.position.x = pipe.ring.offsetX;
          ringGroup.position.y = pipe.gapY + pipe.ring.offsetY + Math.sin(elapsed * 3.5 + pipe.id) * 0.12;
          ringTorus.rotation.y = pipe.ring.spin;
          ringGem.rotation.y = -pipe.ring.spin * 1.4;
          ringGem.rotation.x = elapsed * 1.8;
        }
      },
    });
  }

  return {
    group: root,
    syncAll: (pipes: PipeData[], elapsed: number) => {
      const len = Math.min(visuals.length, pipes.length);
      for (let i = 0; i < len; i++) {
        visuals[i].sync(pipes[i], elapsed);
      }
    },
    applyTheme: (theme: PipeThemeDef) => {
      textures.repaintPipeTheme(theme);
      shaftMat.metalness = theme.metalness;
      shaftMat.roughness = theme.roughness;
      flangeMat.color.setHex(theme.flangeHex);
      flangeMat.metalness = Math.min(0.92, theme.metalness + 0.18);
      brassMat.color.setHex(theme.brassHex);
    },
    setDuskGlow: (intensity: number) => {
      beaconMat.emissiveIntensity = intensity;
      movingBeaconMat.emissiveIntensity = intensity * 1.5;
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
