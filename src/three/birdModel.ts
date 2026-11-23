import * as THREE from 'three';
import type { BirdSkinDef } from '../game/shop';
import type { BirdState } from '../game/types';
import type { ProceduralTextureSet } from './textures';

export interface BirdRig {
  group: THREE.Group;
  contactShadow: THREE.Mesh;
  applySkin: (skin: BirdSkinDef) => void;
  update: (bird: BirdState, elapsed: number, groundY: number) => void;
  dispose: () => void;
}

function createWingShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.18, 0.24, 0.56, 0.34, 0.96, 0.24);
  s.bezierCurveTo(1.06, 0.16, 1.02, 0.04, 0.88, -0.02);
  // Scalloped primary feather tips
  s.lineTo(0.92, -0.1);
  s.lineTo(0.74, -0.13);
  s.lineTo(0.76, -0.22);
  s.lineTo(0.52, -0.22);
  s.bezierCurveTo(0.32, -0.24, 0.12, -0.14, 0, 0);
  return s;
}

function createFeatherBladeShape(length: number, width: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(length * 0.32, width, length * 0.78, width * 0.75, length, 0);
  s.bezierCurveTo(length * 0.78, -width * 0.75, length * 0.32, -width, 0, 0);
  return s;
}

export function createBirdRig(textures: ProceduralTextureSet): BirdRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Calibrated PBR materials with strong roughness/metalness contrast across adjacent parts
  const dorsalPlumageMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.featherMap,
    bumpMap: textures.featherBump,
    bumpScale: 0.036,
    roughness: 0.72,
    metalness: 0.04,
    envMapIntensity: 0.35,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
  });
  materials.push(dorsalPlumageMat);

  const breastPlumageMat = new THREE.MeshStandardMaterial({
    color: 0xf6e6c2,
    bumpMap: textures.featherBump,
    bumpScale: 0.022,
    roughness: 0.84,
    metalness: 0.01,
    envMapIntensity: 0.28,
  });
  materials.push(breastPlumageMat);

  const wingTipMat = new THREE.MeshStandardMaterial({
    color: 0x17445e, // Rich iridescent kingfisher-teal accent on primary flight tips
    bumpMap: textures.featherBump,
    bumpScale: 0.028,
    roughness: 0.36,
    metalness: 0.32,
    envMapIntensity: 0.75,
  });
  materials.push(wingTipMat);

  const beakMat = new THREE.MeshPhysicalMaterial({
    color: 0xd95816,
    roughness: 0.2,
    metalness: 0.08,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.0,
  });
  materials.push(beakMat);

  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    roughness: 0.32,
    metalness: 0.0,
    envMapIntensity: 0.45,
  });
  materials.push(scleraMat);

  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: 0x070b12,
    roughness: 0.03,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.35,
  });
  materials.push(corneaMat);

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x7a3f1d,
    roughness: 0.78,
    metalness: 0.04,
    envMapIntensity: 0.3,
  });
  materials.push(footMat);

  // 1. Primary silhouette: Sculpted aerodynamic teardrop torso (LatheGeometry oriented along +X)
  const torsoProfile = [
    new THREE.Vector2(0.001, -0.68),
    new THREE.Vector2(0.14, -0.58),
    new THREE.Vector2(0.32, -0.34),
    new THREE.Vector2(0.45, -0.04),
    new THREE.Vector2(0.44, 0.26),
    new THREE.Vector2(0.34, 0.48),
    new THREE.Vector2(0.16, 0.60),
    new THREE.Vector2(0.001, 0.64),
  ];
  const torsoGeo = new THREE.LatheGeometry(torsoProfile, 24);
  torsoGeo.rotateZ(-Math.PI / 2);
  torsoGeo.scale(1.06, 0.94, 0.88);
  geometries.push(torsoGeo);
  const torsoMesh = new THREE.Mesh(torsoGeo, dorsalPlumageMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyPivot.add(torsoMesh);

  // 2. Cream breast plumage contour shell
  const breastGeo = new THREE.SphereGeometry(0.40, 20, 16);
  breastGeo.scale(1.18, 0.76, 0.78);
  geometries.push(breastGeo);
  const breastMesh = new THREE.Mesh(breastGeo, breastPlumageMat);
  breastMesh.position.set(0.08, -0.14, 0);
  breastMesh.castShadow = true;
  bodyPivot.add(breastMesh);

  // 3. Sculpted head + cheek contour
  const headGeo = new THREE.SphereGeometry(0.30, 20, 16);
  headGeo.scale(1.08, 0.98, 0.92);
  geometries.push(headGeo);
  const headMesh = new THREE.Mesh(headGeo, dorsalPlumageMat);
  headMesh.position.set(0.44, 0.25, 0);
  headMesh.castShadow = true;
  bodyPivot.add(headMesh);

  // 4. Sculpted crown crest feathers (3 beveled extruded blades)
  const crestShape = createFeatherBladeShape(0.32, 0.065);
  const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  crestGeo.center();
  geometries.push(crestGeo);

  const crestGroup = new THREE.Group();
  crestGroup.position.set(0.34, 0.51, 0);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(crestGeo, i === 1 ? wingTipMat : dorsalPlumageMat);
    blade.position.set(-i * 0.07, -i * 0.02, 0);
    blade.rotation.z = 2.55 + i * 0.24;
    blade.scale.setScalar(1 - i * 0.14);
    blade.castShadow = true;
    crestGroup.add(blade);
  }
  bodyPivot.add(crestGroup);

  // 5. Two-part articulated keratin beak (curved upper + lower mandible)
  const upperBeakGeo = new THREE.ConeGeometry(0.115, 0.42, 16);
  upperBeakGeo.rotateZ(-Math.PI / 2);
  upperBeakGeo.scale(1.0, 0.72, 0.85);
  geometries.push(upperBeakGeo);
  const upperBeak = new THREE.Mesh(upperBeakGeo, beakMat);
  upperBeak.position.set(0.84, 0.22, 0);
  upperBeak.rotation.z = -0.06;
  upperBeak.castShadow = true;
  bodyPivot.add(upperBeak);

  const lowerBeakGeo = new THREE.ConeGeometry(0.088, 0.30, 14);
  lowerBeakGeo.rotateZ(-Math.PI / 2);
  lowerBeakGeo.scale(1.0, 0.55, 0.78);
  geometries.push(lowerBeakGeo);
  const lowerBeak = new THREE.Mesh(lowerBeakGeo, beakMat);
  lowerBeak.position.set(0.77, 0.145, 0);
  lowerBeak.rotation.z = 0.08;
  bodyPivot.add(lowerBeak);

  // 6. Multi-layered expressive eyes (sclera ring + dark glossy cornea + brow ridge)
  const scleraGeo = new THREE.SphereGeometry(0.105, 16, 14);
  const corneaGeo = new THREE.SphereGeometry(0.072, 16, 14);
  const browGeo = new THREE.TorusGeometry(0.102, 0.024, 8, 16, Math.PI);
  geometries.push(scleraGeo, corneaGeo, browGeo);

  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(0.56, 0.31, side * 0.21);

    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.scale.set(0.95, 1.0, 0.72);
    eyeGroup.add(sclera);

    const cornea = new THREE.Mesh(corneaGeo, corneaMat);
    cornea.position.set(0.036, 0.005, side * 0.042);
    eyeGroup.add(cornea);

    const brow = new THREE.Mesh(browGeo, dorsalPlumageMat);
    brow.position.set(0.0, 0.02, side * 0.015);
    brow.rotation.y = side > 0 ? 0.28 : Math.PI - 0.28;
    brow.rotation.z = -0.18;
    eyeGroup.add(brow);

    bodyPivot.add(eyeGroup);
  }

  // 7. Articulated 2-segment Left & Right Wings with beveled primary feathers
  const wingShape = createWingShape();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 2,
  });
  wingGeo.rotateX(Math.PI / 2);
  geometries.push(wingGeo);

  const primaryTipGeo = new THREE.ExtrudeGeometry(createFeatherBladeShape(0.62, 0.10), {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  primaryTipGeo.rotateX(Math.PI / 2);
  geometries.push(primaryTipGeo);

  const leftWingPivot = new THREE.Group();
  leftWingPivot.position.set(0.04, 0.14, 0.32);
  const rightWingPivot = new THREE.Group();
  rightWingPivot.position.set(0.04, 0.14, -0.32);

  const buildWingAssembly = (side: 1 | -1): THREE.Group => {
    const pivot = new THREE.Group();
    const covert = new THREE.Mesh(wingGeo, dorsalPlumageMat);
    covert.rotation.y = side > 0 ? -Math.PI / 2 - 0.15 : Math.PI / 2 + 0.15;
    covert.scale.set(1.0, 1.0, side);
    covert.castShadow = true;
    pivot.add(covert);

    // 3 splayed iridescent primary flight feathers at outer edge
    for (let f = 0; f < 3; f++) {
      const feather = new THREE.Mesh(primaryTipGeo, wingTipMat);
      feather.position.set(-0.08 - f * 0.11, 0.01, side * (0.48 + f * 0.04));
      feather.rotation.y = side > 0 ? -Math.PI / 2 - 0.25 - f * 0.18 : Math.PI / 2 + 0.25 + f * 0.18;
      feather.castShadow = true;
      pivot.add(feather);
    }
    return pivot;
  };

  const leftWing = buildWingAssembly(1);
  const rightWing = buildWingAssembly(-1);
  leftWingPivot.add(leftWing);
  rightWingPivot.add(rightWing);
  bodyPivot.add(leftWingPivot, rightWingPivot);

  // 8. Fanned multi-blade tail assembly
  const tailPivot = new THREE.Group();
  tailPivot.position.set(-0.56, 0.05, 0);
  const tailGeo = new THREE.ExtrudeGeometry(createFeatherBladeShape(0.58, 0.10), {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  tailGeo.rotateX(Math.PI / 2);
  geometries.push(tailGeo);

  for (let i = -2; i <= 2; i++) {
    const blade = new THREE.Mesh(tailGeo, Math.abs(i) === 2 ? wingTipMat : dorsalPlumageMat);
    blade.rotation.y = Math.PI + i * 0.16;
    blade.rotation.z = 0.08;
    blade.scale.set(1 - Math.abs(i) * 0.08, 1, 1);
    blade.castShadow = true;
    tailPivot.add(blade);
  }
  bodyPivot.add(tailPivot);

  // 9. Tucked aerodynamic legs/feet beneath belly
  const legGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.22, 8);
  geometries.push(legGeo);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, footMat);
    leg.position.set(-0.18, -0.36, side * 0.11);
    leg.rotation.z = 0.82;
    bodyPivot.add(leg);
  }

  // 10. Dynamic radial contact shadow disc projected on river/ground surface
  const shadowGeo = new THREE.CircleGeometry(1.15, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  geometries.push(shadowGeo);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  materials.push(shadowMat);
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.renderOrder = 2;

  // 11. Protective Shield Energy Aura (visible when Bouclier Aérien is active!)
  const shieldGeo = new THREE.IcosahedronGeometry(0.95, 2);
  geometries.push(shieldGeo);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const shieldRingGeo = new THREE.TorusGeometry(0.98, 0.032, 8, 32);
  geometries.push(shieldRingGeo);
  const shieldRingMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  materials.push(shieldMat, shieldRingMat);

  const shieldGroup = new THREE.Group();
  const shieldSphere = new THREE.Mesh(shieldGeo, shieldMat);
  const shieldRing = new THREE.Mesh(shieldRingGeo, shieldRingMat);
  shieldGroup.add(shieldSphere, shieldRing);
  shieldGroup.visible = false;
  shieldGroup.renderOrder = 4;
  root.add(shieldGroup);

  let baseEmissiveHex = 0x000000;
  let baseEmissiveIntensity = 0;

  const applySkin = (skin: BirdSkinDef) => {
    textures.repaintBirdSkin(skin);
    breastPlumageMat.color.setHex(skin.breastHex);
    wingTipMat.color.setHex(skin.wingTipHex);
    beakMat.color.setHex(skin.beakHex);
    baseEmissiveHex = skin.emissiveHex;
    baseEmissiveIntensity = skin.emissiveIntensity;
    dorsalPlumageMat.emissive.setHex(baseEmissiveHex);
    dorsalPlumageMat.emissiveIntensity = baseEmissiveIntensity;
  };

  const update = (bird: BirdState, elapsed: number, groundY: number) => {
    root.position.set(bird.x, bird.y, 0);
    bodyPivot.rotation.set(bird.roll, 0, bird.pitch);
    bodyPivot.scale.set(bird.squashX, bird.squashY, bird.squashX);

    // Realistic figure-8 aerodynamic wingbeat
    const flapSin = Math.sin(bird.wingPhase);
    const flapCos = Math.cos(bird.wingPhase);
    const amp = 0.68 + bird.wingBoost * 0.42;
    const flapAngle = flapSin * amp + 0.12;
    const sweepAngle = flapCos * 0.16;

    leftWingPivot.rotation.x = -flapAngle;
    leftWingPivot.rotation.z = sweepAngle;
    rightWingPivot.rotation.x = flapAngle;
    rightWingPivot.rotation.z = sweepAngle;

    tailPivot.rotation.z = -bird.pitch * 0.35 + Math.sin(elapsed * 4.0) * 0.04;
    crestGroup.rotation.z = -bird.vy * 0.015;

    // Protective shield aura & post-hit invulnerability shimmer
    shieldGroup.visible = bird.shieldActive;
    if (bird.shieldActive) {
      shieldRing.rotation.y = elapsed * 2.4;
      shieldRing.rotation.x = Math.sin(elapsed * 1.6) * 0.45;
      shieldSphere.rotation.y = -elapsed * 0.8;
    }

    if (bird.hitFlash > 0.01) {
      dorsalPlumageMat.emissive.setRGB(0.95, 0.85, 0.7);
      dorsalPlumageMat.emissiveIntensity = bird.hitFlash * 0.85;
    } else if (bird.invulnTimer > 0) {
      const pulse = 0.3 + Math.sin(elapsed * 26) * 0.25;
      dorsalPlumageMat.emissive.setHex(0x38bdf8);
      dorsalPlumageMat.emissiveIntensity = pulse;
    } else {
      dorsalPlumageMat.emissive.setHex(baseEmissiveHex);
      dorsalPlumageMat.emissiveIntensity = baseEmissiveIntensity;
    }

    const altitude = Math.max(0, bird.y - groundY);
    const shadowFactor = Math.max(0.18, 1 - altitude / 13.5);
    contactShadow.position.set(bird.x, groundY + 0.04, 0);
    contactShadow.scale.setScalar(0.65 + (1 - shadowFactor) * 1.15);
    shadowMat.opacity = 0.44 * shadowFactor;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group: root, contactShadow, applySkin, update, dispose };
}
