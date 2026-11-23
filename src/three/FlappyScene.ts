import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  WORLD,
  createInitialState,
  damp,
  queueFlap,
  returnToTitle,
  setPaused,
  startNewRun,
  stepEngine,
  type EngineState,
} from '../game/engine';
import { ProceduralAudio } from '../game/audio';
import {
  computeRunModifiers,
  getPipeThemeDef,
  getSkinDef,
  getTrailFxDef,
} from '../game/shop';
import type {
  AtmospherePreset,
  CameraMode,
  HudSnapshot,
  PlayerProfile,
  RunSummary,
} from '../game/types';
import { createBirdRig } from './birdModel';
import { createEnvironment } from './environment';
import { createParticleSystem } from './particles';
import { createPipePool } from './pipeModel';
import { createProceduralTextures } from './textures';

function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface FlappyController {
  start: (profile: PlayerProfile) => void;
  flap: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  goTitle: () => void;
  setAtmosphere: (preset: AtmospherePreset) => void;
  cycleAtmosphere: () => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  toggleMute: () => void;
  syncProfileAppearance: (profile: PlayerProfile) => void;
  setShopPreviewMode: (active: boolean) => void;
  playShopSound: (kind: 'purchase' | 'equip') => void;
  getPhase: () => EngineState['phase'];
  dispose: () => void;
}

const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(2.4, 6.2, 0);

export function mountFlappyScene(
  container: HTMLElement,
  initialProfile: PlayerProfile,
  onHudUpdate: (snapshot: HudSnapshot) => void,
  onRunComplete: (summary: RunSummary, shieldConsumed: boolean) => void,
  initialAutostart: boolean
): FlappyController {
  const isSoftwareGl = detectSoftwareWebGL();
  const audio = new ProceduralAudio();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.setAttribute('data-testid', 'flappy-webgl-canvas');

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();

  const camera = new THREE.PerspectiveCamera(
    46,
    Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
    0.2,
    460
  );

  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const textures = createProceduralTextures(maxAniso);
  const birdRig = createBirdRig(textures);
  scene.add(birdRig.group);
  scene.add(birdRig.contactShadow);

  const pipePool = createPipePool(WORLD.PIPE_COUNT, textures);
  scene.add(pipePool.group);

  const envRig = createEnvironment(scene, renderer, textures, isSoftwareGl, (glow) => {
    pipePool.setDuskGlow(glow);
  });
  const particles = createParticleSystem(scene);

  let atmosphere: AtmospherePreset = 'golden';
  let cameraMode: CameraMode = 'cinematic';
  let shopPreviewActive = false;

  const engineState = createInitialState(initialProfile.bestScore);
  birdRig.applySkin(getSkinDef(initialProfile.equippedSkin));
  pipePool.applyTheme(getPipeThemeDef(initialProfile.equippedPipeTheme));
  particles.applyTrailFx(getTrailFxDef(initialProfile.equippedTrail));

  if (initialAutostart) {
    startNewRun(engineState, Math.random, computeRunModifiers(initialProfile));
  }

  birdRig.update(engineState.bird, engineState.elapsed, WORLD.GROUND_Y);
  pipePool.syncAll(engineState.pipes, engineState.elapsed);
  if (engineState.phase === 'title') {
    camera.position.set(1.2, 7.2, 13.2);
    _currentLookAt.set(2.4, 6.2, 0);
    camera.lookAt(_currentLookAt);
  } else {
    camera.position.set(2.35, 7.0, 15.2);
    _currentLookAt.set(3.45, 6.2, 0);
    camera.lookAt(_currentLookAt);
  }

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  let contextLost = false;
  let pendingResize = false;
  const applyViewportSize = () => {
    const w = Math.max(1, container.clientWidth || window.innerWidth);
    const h = Math.max(1, container.clientHeight || window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    pendingResize = false;
  };
  applyViewportSize();

  const resizeObserver = new ResizeObserver(() => {
    pendingResize = true;
  });
  resizeObserver.observe(container);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    contextLost = true;
  };
  const onContextRestored = () => {
    contextLost = false;
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);

  let lastHudEmit = 0;
  let lastPhase = '';
  let lastScore = -1;
  let lastRunCoins = -1;
  let lastMuted = false;
  let lastShield = false;
  let lastAtmo: AtmospherePreset = atmosphere;
  let lastCam: CameraMode = cameraMode;
  let lastAwaiting = true;

  const emitHud = (force = false) => {
    const now = performance.now();
    const awaiting = engineState.phase === 'playing' && !engineState.hasFlapped;
    const changed =
      force ||
      engineState.phase !== lastPhase ||
      engineState.score !== lastScore ||
      engineState.runCoins !== lastRunCoins ||
      engineState.bird.shieldActive !== lastShield ||
      audio.isMuted() !== lastMuted ||
      atmosphere !== lastAtmo ||
      cameraMode !== lastCam ||
      awaiting !== lastAwaiting;

    if (!changed && now - lastHudEmit < 140) return;

    lastHudEmit = now;
    lastPhase = engineState.phase;
    lastScore = engineState.score;
    lastRunCoins = engineState.runCoins;
    lastShield = engineState.bird.shieldActive;
    lastMuted = audio.isMuted();
    lastAtmo = atmosphere;
    lastCam = cameraMode;
    lastAwaiting = awaiting;

    const bodyState = engineState.phase === 'dying' ? 'playing' : engineState.phase;
    document.body.dataset.state = bodyState;

    onHudUpdate({
      phase: engineState.phase,
      score: engineState.score,
      bestScore: engineState.bestScore,
      runCoins: engineState.runCoins,
      streak: engineState.streak,
      ringsCollected: engineState.ringsCollected,
      speedKmh: Math.round(engineState.speed * 5.2),
      altitudeMeters: Math.max(0, Math.round((engineState.bird.y - WORLD.GROUND_Y) * 2.4)),
      shieldActive: engineState.bird.shieldActive,
      atmosphere,
      cameraMode,
      muted: audio.isMuted(),
      awaitingFirstFlap: awaiting,
      summary: engineState.summary,
    });
  };

  emitHud(true);

  let frameId = 0;
  let disposed = false;
  let lastTime = performance.now();
  let trailPreviewTimer = 0;

  const afterDraw = (cb: () => void) => {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (status === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 8);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 90);
      }
    };
    frameId = window.setTimeout(poll, 8);
  };

  const updateCamera = (dt: number) => {
    const b = engineState.bird;
    const shakeMag = engineState.trauma * engineState.trauma * 0.48;
    const shakeX =
      shakeMag > 0.001
        ? (Math.sin(engineState.elapsed * 57) * 0.7 + Math.cos(engineState.elapsed * 43) * 0.3) * shakeMag
        : 0;
    const shakeY =
      shakeMag > 0.001
        ? (Math.cos(engineState.elapsed * 61) * 0.7 + Math.sin(engineState.elapsed * 37) * 0.3) * shakeMag
        : 0;

    if (engineState.phase === 'title') {
      if (shopPreviewActive) {
        // Closer heroic showcase framing bird on the left third while Shop Drawer sits cleanly on the right
        _camTargetPos.set(1.6, b.y + 0.45, 7.6);
        _camLookAt.set(2.3, b.y - 0.1, 0);
        camera.fov = damp(camera.fov, 40, 5, dt);
      } else {
        const orbitAngle = Math.sin(engineState.elapsed * 0.28) * 0.16;
        _camTargetPos.set(
          0.9 + Math.sin(orbitAngle) * 2.2,
          b.y + 0.85 + Math.cos(engineState.elapsed * 0.35) * 0.35,
          12.4 + Math.cos(orbitAngle) * 1.1
        );
        _camLookAt.set(2.3, b.y - 0.15, 0);
        camera.fov = damp(camera.fov, 46, 4, dt);
      }
    } else if (cameraMode === 'chase') {
      _camTargetPos.set(b.x - 5.8, THREE.MathUtils.clamp(b.y + 1.35, 2.3, 12.4), 1.25);
      _camLookAt.set(b.x + 14.5, THREE.MathUtils.clamp(b.y - 0.25, 1.8, 11.0), 0);
      camera.fov = damp(camera.fov, 54 + engineState.fovKick, 7, dt);
    } else {
      const lookY = THREE.MathUtils.clamp(b.y * 0.45 + 3.45, 3.8, 8.6);
      _camTargetPos.set(2.35 + shakeX, lookY + 0.7 + shakeY, 15.2);
      _camLookAt.set(3.85 + shakeX * 0.5, lookY - 0.1 + shakeY * 0.5, 0);
      camera.fov = damp(camera.fov, 46 + engineState.fovKick * 0.65, 7, dt);
    }

    const dampK = engineState.phase === 'title' ? 4.8 : 9.5;
    camera.position.x = damp(camera.position.x, _camTargetPos.x, dampK, dt);
    camera.position.y = damp(camera.position.y, _camTargetPos.y, dampK, dt);
    camera.position.z = damp(camera.position.z, _camTargetPos.z, dampK, dt);

    _currentLookAt.x = damp(_currentLookAt.x, _camLookAt.x, dampK + 2.0, dt);
    _currentLookAt.y = damp(_currentLookAt.y, _camLookAt.y, dampK + 2.0, dt);
    _currentLookAt.z = damp(_currentLookAt.z, _camLookAt.z, dampK + 2.0, dt);

    camera.lookAt(_currentLookAt);
    camera.updateProjectionMatrix();
  };

  const tick = () => {
    if (disposed) return;

    const now = performance.now();
    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    const prevDist = engineState.distance;
    const events = stepEngine(engineState, dt);
    const scrollDelta = Math.max(0, engineState.distance - prevDist);

    // Subtle trail preview emissions while inspecting items in the Shop on Title Screen
    if (engineState.phase === 'title' && shopPreviewActive) {
      trailPreviewTimer += dt;
      if (trailPreviewTimer >= 0.45) {
        trailPreviewTimer = 0;
        particles.spawnFlapFeathers(engineState.bird.x, engineState.bird.y);
      }
    }

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.type === 'flap') {
        audio.playFlap();
        particles.spawnFlapFeathers(WORLD.BIRD_X, ev.y);
      } else if (ev.type === 'score') {
        audio.playScore(ev.streak, ev.perfect);
        particles.spawnScoreSparkles(WORLD.BIRD_X + 0.6, engineState.bird.y, ev.perfect);
      } else if (ev.type === 'ring') {
        audio.playRingPickup();
        particles.spawnScoreSparkles(ev.x, ev.y, true);
      } else if (ev.type === 'shieldBreak') {
        audio.playShieldBreak();
        particles.spawnShieldShatter(ev.x, ev.y);
      } else if (ev.type === 'crash') {
        audio.playCrash(ev.cause);
        particles.spawnCrashBurst(ev.x, ev.y);
      } else if (ev.type === 'gameover') {
        onRunComplete(ev.summary, engineState.shieldConsumed);
      }
    }

    birdRig.update(engineState.bird, engineState.elapsed, WORLD.GROUND_Y);
    pipePool.syncAll(engineState.pipes, engineState.elapsed);
    envRig.update(
      engineState.phase === 'paused' ? 0 : dt,
      engineState.elapsed,
      engineState.phase === 'paused' ? 0 : scrollDelta
    );
    particles.update(
      engineState.phase === 'paused' ? 0 : dt,
      engineState.phase === 'paused' ? 0 : scrollDelta
    );
    updateCamera(dt);

    if (!contextLost) {
      if (pendingResize) {
        applyViewportSize();
      }
      renderer.render(scene, camera);
    }

    emitHud(events.length > 0);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  if (isSoftwareGl) {
    tick();
  } else {
    frameId = window.requestAnimationFrame(tick);
  }

  const start = (profile: PlayerProfile) => {
    shopPreviewActive = false;
    engineState.bestScore = Math.max(engineState.bestScore, profile.bestScore);
    birdRig.applySkin(getSkinDef(profile.equippedSkin));
    pipePool.applyTheme(getPipeThemeDef(profile.equippedPipeTheme));
    particles.applyTrailFx(getTrailFxDef(profile.equippedTrail));
    startNewRun(engineState, Math.random, computeRunModifiers(profile));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    emitHud(true);
  };

  const flap = () => {
    if (engineState.phase === 'playing') {
      queueFlap(engineState);
    }
  };

  const togglePause = () => {
    if (engineState.phase === 'playing') {
      setPaused(engineState, true);
      emitHud(true);
    } else if (engineState.phase === 'paused') {
      setPaused(engineState, false);
      emitHud(true);
    }
  };

  const setPausedFn = (paused: boolean) => {
    setPaused(engineState, paused);
    emitHud(true);
  };

  const goTitle = () => {
    returnToTitle(engineState);
    emitHud(true);
  };

  const setAtmosphere = (preset: AtmospherePreset) => {
    atmosphere = preset;
    envRig.applyAtmosphere(preset);
    emitHud(true);
  };

  const cycleAtmosphere = () => {
    const order: AtmospherePreset[] = ['golden', 'daylight', 'dusk'];
    const next = order[(order.indexOf(atmosphere) + 1) % order.length];
    setAtmosphere(next);
  };

  const setCameraMode = (mode: CameraMode) => {
    cameraMode = mode;
    emitHud(true);
  };

  const toggleCameraMode = () => {
    setCameraMode(cameraMode === 'cinematic' ? 'chase' : 'cinematic');
  };

  const toggleMute = () => {
    audio.toggleMute();
    emitHud(true);
  };

  const syncProfileAppearance = (profile: PlayerProfile) => {
    engineState.bestScore = Math.max(engineState.bestScore, profile.bestScore);
    birdRig.applySkin(getSkinDef(profile.equippedSkin));
    pipePool.applyTheme(getPipeThemeDef(profile.equippedPipeTheme));
    particles.applyTrailFx(getTrailFxDef(profile.equippedTrail));
    if (engineState.phase === 'title') {
      engineState.bird.shieldActive = profile.shields > 0;
      particles.spawnFlapFeathers(engineState.bird.x, engineState.bird.y);
    }
  };

  const setShopPreviewMode = (active: boolean) => {
    shopPreviewActive = active;
  };

  const playShopSound = (kind: 'purchase' | 'equip') => {
    if (kind === 'purchase') audio.playPurchase();
    else audio.playEquip();
  };

  const dispose = () => {
    disposed = true;
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(frameId);
    resizeObserver.disconnect();
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
    birdRig.dispose();
    pipePool.dispose();
    envRig.dispose();
    particles.dispose();
    textures.dispose();
    envTarget.dispose();
    audio.dispose();
    renderer.dispose();
  };

  return {
    start,
    flap,
    togglePause,
    setPaused: setPausedFn,
    goTitle,
    setAtmosphere,
    cycleAtmosphere,
    setCameraMode,
    toggleCameraMode,
    toggleMute,
    syncProfileAppearance,
    setShopPreviewMode,
    playShopSound,
    getPhase: () => engineState.phase,
    dispose,
  };
}
