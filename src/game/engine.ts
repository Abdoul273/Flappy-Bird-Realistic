import type {
  BirdState,
  GameEventType,
  GamePhase,
  MedalTier,
  PipeData,
  RunModifiers,
  RunSummary,
} from './types';

export const WORLD = {
  GROUND_Y: 0.25,
  CEILING_Y: 12.2,
  BIRD_X: 0,
  BIRD_START_Y: 6.4,
  BIRD_RADIUS: 0.44,
  PIPE_RADIUS: 1.05,
  PIPE_COLLAR_RADIUS: 1.24,
  PIPE_COLLAR_HEIGHT: 0.72,
  PIPE_SPACING: 10.6,
  FIRST_PIPE_X: 16.2,
  PIPE_DESPAWN_X: -18.0,
  PIPE_COUNT: 8,
  GRAVITY: -26.5,
  FLAP_VELOCITY: 9.6,
  MAX_FALL_SPEED: -14.8,
  BASE_SPEED: 7.4,
  MAX_SPEED: 11.6,
  BASE_GAP: 4.55,
  MIN_GAP: 3.35,
  GAP_MIN_Y: 3.3,
  GAP_MAX_Y: 8.8,
  UPDRAFT_GRACE_DURATION: 2.25,
  FLAP_BUFFER_WINDOW: 0.12,
  HITSTOP_DURATION: 0.058,
  DYING_DURATION: 0.62,
} as const;

export const DEFAULT_MODIFIERS: RunModifiers = {
  magnetRadius: 0,
  coinMultiplier: 1,
  gapBonus: 0,
  hasShield: false,
};

export interface EngineState {
  phase: GamePhase;
  elapsed: number;
  runTime: number;
  distance: number;
  speed: number;
  score: number;
  bestScore: number;
  runCoins: number;
  pipesCleared: number;
  ringsCollected: number;
  streak: number;
  bestStreak: number;
  hasFlapped: boolean;
  flapBufferTimer: number;
  hitstopTimer: number;
  dyingTimer: number;
  trauma: number;
  fovKick: number;
  crashCause: 'pipe' | 'water' | 'none';
  shieldConsumed: boolean;
  modifiers: RunModifiers;
  nextPipeId: number;
  bird: BirdState;
  pipes: PipeData[];
  summary: RunSummary | null;
}

export interface DifficultyProfile {
  speed: number;
  gapHeight: number;
  verticalSpan: number;
  movingChance: number;
  moveAmplitude: number;
}

export function computeDifficulty(pipesCleared: number, gapBonus = 0): DifficultyProfile {
  const t = Math.min(1, pipesCleared / 36);
  const speed = WORLD.BASE_SPEED + (WORLD.MAX_SPEED - WORLD.BASE_SPEED) * (1 - Math.pow(1 - t, 1.45));
  const baseGap = WORLD.BASE_GAP - (WORLD.BASE_GAP - WORLD.MIN_GAP) * Math.min(1, pipesCleared / 32);
  const gapHeight = Math.min(5.3, baseGap + gapBonus);
  const verticalSpan = 1.8 + 2.6 * Math.min(1, pipesCleared / 16);
  const movingChance = pipesCleared >= 6 ? Math.min(0.55, 0.18 + (pipesCleared - 6) * 0.022) : 0;
  const moveAmplitude = pipesCleared >= 6 ? Math.min(1.15, 0.45 + (pipesCleared - 6) * 0.03) : 0;
  return { speed, gapHeight, verticalSpan, movingChance, moveAmplitude };
}

export function computeMedal(score: number): MedalTier {
  if (score >= 40) return 'platinum';
  if (score >= 22) return 'gold';
  if (score >= 10) return 'silver';
  if (score >= 4) return 'bronze';
  return 'none';
}

export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createInitialBird(shieldActive = false): BirdState {
  return {
    x: WORLD.BIRD_X,
    y: WORLD.BIRD_START_Y,
    vy: 0,
    pitch: 0,
    roll: 0,
    wingPhase: 0,
    wingBoost: 0,
    squashX: 1,
    squashY: 1,
    hitFlash: 0,
    tumbleVel: 0,
    shieldActive,
    invulnTimer: 0,
  };
}

export function createPipe(
  id: number,
  x: number,
  prevGapY: number,
  pipesIndex: number,
  rng: () => number,
  gapBonus = 0
): PipeData {
  const diff = computeDifficulty(pipesIndex, gapBonus);
  const halfGap = diff.gapHeight * 0.5;
  const minY = Math.max(WORLD.GAP_MIN_Y, WORLD.GROUND_Y + halfGap + 1.35);
  const maxY = Math.min(WORLD.GAP_MAX_Y, WORLD.CEILING_Y - halfGap - 1.25);

  const maxStep = Math.min(diff.verticalSpan, 3.3);
  const rawTarget = prevGapY + (rng() * 2 - 1) * maxStep;
  const baseGapY = clamp(rawTarget, minY, maxY);

  const moving = pipesIndex >= 6 && rng() < diff.movingChance;
  const safeAmp = Math.min(
    diff.moveAmplitude,
    Math.max(0, baseGapY - minY - 0.15),
    Math.max(0, maxY - baseGapY - 0.15)
  );
  const actualMoving = moving && safeAmp >= 0.35;

  const hasRing = pipesIndex >= 1 && (pipesIndex % 2 === 1 || rng() < 0.38);
  const ringOffset = hasRing ? (rng() * 2 - 1) * Math.min(0.7, diff.gapHeight * 0.18) : 0;

  return {
    id,
    x,
    gapY: baseGapY,
    baseGapY,
    gapHeight: diff.gapHeight,
    passed: false,
    moving: actualMoving,
    moveAmplitude: actualMoving ? safeAmp : 0,
    moveSpeed: actualMoving ? 1.15 + rng() * 0.55 : 0,
    movePhase: rng() * Math.PI * 2,
    ring: {
      active: hasRing,
      collected: false,
      offsetX: 0,
      offsetY: ringOffset,
      spin: rng() * Math.PI * 2,
    },
  };
}

export function createInitialState(bestScore = 0, rng: () => number = Math.random): EngineState {
  const pipes: PipeData[] = [];
  let prevY: number = WORLD.BIRD_START_Y;
  for (let i = 0; i < WORLD.PIPE_COUNT; i++) {
    const pipe = createPipe(i + 1, WORLD.FIRST_PIPE_X + i * WORLD.PIPE_SPACING, prevY, i, rng);
    pipes.push(pipe);
    prevY = pipe.baseGapY;
  }

  return {
    phase: 'title',
    elapsed: 0,
    runTime: 0,
    distance: 0,
    speed: WORLD.BASE_SPEED,
    score: 0,
    bestScore,
    runCoins: 0,
    pipesCleared: 0,
    ringsCollected: 0,
    streak: 0,
    bestStreak: 0,
    hasFlapped: false,
    flapBufferTimer: 0,
    hitstopTimer: 0,
    dyingTimer: 0,
    trauma: 0,
    fovKick: 0,
    crashCause: 'none',
    shieldConsumed: false,
    modifiers: { ...DEFAULT_MODIFIERS },
    nextPipeId: WORLD.PIPE_COUNT + 1,
    bird: createInitialBird(false),
    pipes,
    summary: null,
  };
}

export function startNewRun(
  state: EngineState,
  rng: () => number = Math.random,
  modifiers: RunModifiers = DEFAULT_MODIFIERS
): void {
  state.phase = 'playing';
  state.runTime = 0;
  state.distance = 0;
  state.speed = WORLD.BASE_SPEED;
  state.score = 0;
  state.runCoins = 0;
  state.pipesCleared = 0;
  state.ringsCollected = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.hasFlapped = false;
  state.flapBufferTimer = 0;
  state.hitstopTimer = 0;
  state.dyingTimer = 0;
  state.trauma = 0;
  state.fovKick = 0;
  state.crashCause = 'none';
  state.shieldConsumed = false;
  state.modifiers = { ...modifiers };
  state.summary = null;
  state.bird = createInitialBird(modifiers.hasShield);

  state.pipes = [];
  let prevY: number = WORLD.BIRD_START_Y;
  for (let i = 0; i < WORLD.PIPE_COUNT; i++) {
    const pipe = createPipe(
      state.nextPipeId++,
      WORLD.FIRST_PIPE_X + i * WORLD.PIPE_SPACING,
      prevY,
      i,
      rng,
      modifiers.gapBonus
    );
    state.pipes.push(pipe);
    prevY = pipe.baseGapY;
  }
}

export function queueFlap(state: EngineState): void {
  if (state.phase !== 'playing') return;
  state.flapBufferTimer = WORLD.FLAP_BUFFER_WINDOW;
}

export function setPaused(state: EngineState, paused: boolean): void {
  if (paused && state.phase === 'playing') {
    state.phase = 'paused';
  } else if (!paused && state.phase === 'paused') {
    state.phase = 'playing';
  }
}

export function returnToTitle(state: EngineState, rng: () => number = Math.random): void {
  const best = state.bestScore;
  const fresh = createInitialState(best, rng);
  Object.assign(state, fresh);
}

export function checkPipeCollision(bird: BirdState, pipe: PipeData): boolean {
  const halfGap = pipe.gapHeight * 0.5;
  const topLipY = pipe.gapY + halfGap;
  const bottomLipY = pipe.gapY - halfGap;
  const dx = Math.abs(bird.x - pipe.x);
  const r = WORLD.BIRD_RADIUS;

  if (dx > WORLD.PIPE_COLLAR_RADIUS + r) {
    return false;
  }

  const collarHalfX = WORLD.PIPE_COLLAR_RADIUS;
  const shaftHalfX = WORLD.PIPE_RADIUS;

  if (
    circleIntersectsRect(
      bird.x,
      bird.y,
      r,
      pipe.x - collarHalfX,
      bottomLipY - WORLD.PIPE_COLLAR_HEIGHT,
      pipe.x + collarHalfX,
      bottomLipY
    )
  ) {
    return true;
  }
  if (
    circleIntersectsRect(
      bird.x,
      bird.y,
      r,
      pipe.x - shaftHalfX,
      -5,
      pipe.x + shaftHalfX,
      bottomLipY - WORLD.PIPE_COLLAR_HEIGHT
    )
  ) {
    return true;
  }
  if (
    circleIntersectsRect(
      bird.x,
      bird.y,
      r,
      pipe.x - collarHalfX,
      topLipY,
      pipe.x + collarHalfX,
      topLipY + WORLD.PIPE_COLLAR_HEIGHT
    )
  ) {
    return true;
  }
  if (
    circleIntersectsRect(
      bird.x,
      bird.y,
      r,
      pipe.x - shaftHalfX,
      topLipY + WORLD.PIPE_COLLAR_HEIGHT,
      pipe.x + shaftHalfX,
      24
    )
  ) {
    return true;
  }

  return false;
}

export function stepEngine(
  state: EngineState,
  rawDt: number,
  rng: () => number = Math.random
): GameEventType[] {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const events: GameEventType[] = [];

  state.trauma = Math.max(0, state.trauma - dt * 1.9);
  state.fovKick = damp(state.fovKick, 0, 7.5, dt);
  state.bird.hitFlash = Math.max(0, state.bird.hitFlash - dt * 6.5);
  state.bird.squashX = damp(state.bird.squashX, 1, 12, dt);
  state.bird.squashY = damp(state.bird.squashY, 1, 12, dt);

  if (state.phase === 'paused' || state.phase === 'gameover') {
    return events;
  }

  state.elapsed += dt;

  if (state.phase === 'title') {
    stepTitleAutopilot(state, dt, rng);
    return events;
  }

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  if (state.phase === 'dying') {
    state.dyingTimer -= dt;
    state.bird.vy = Math.max(WORLD.MAX_FALL_SPEED, state.bird.vy + WORLD.GRAVITY * dt);
    state.bird.y = Math.max(WORLD.GROUND_Y + WORLD.BIRD_RADIUS * 0.4, state.bird.y + state.bird.vy * dt);
    state.bird.pitch = damp(state.bird.pitch, -1.35, 6, dt);
    state.bird.roll += state.bird.tumbleVel * dt;
    state.bird.wingPhase += dt * 4.0;

    if (state.dyingTimer <= 0) {
      finalizeGameOver(state, events);
    }
    return events;
  }

  // Active playing state
  state.runTime += dt;
  if (state.bird.invulnTimer > 0) {
    state.bird.invulnTimer = Math.max(0, state.bird.invulnTimer - dt);
  }

  const diff = computeDifficulty(state.pipesCleared, state.modifiers.gapBonus);
  state.speed = damp(state.speed, diff.speed, 3.2, dt);
  state.distance += state.speed * dt;

  // Input buffer flap execution
  if (state.flapBufferTimer > 0) {
    state.flapBufferTimer = 0;
    state.hasFlapped = true;
    state.bird.vy = WORLD.FLAP_VELOCITY;
    state.bird.wingBoost = 1.0;
    state.bird.squashX = 0.86;
    state.bird.squashY = 1.18;
    state.fovKick = Math.min(4.2, state.fovKick + 1.45);
    events.push({ type: 'flap', y: state.bird.y });
  }

  // Opening aerodynamic updraft grace period
  if (!state.hasFlapped && state.runTime < WORLD.UPDRAFT_GRACE_DURATION) {
    const hoverTarget = WORLD.BIRD_START_Y + Math.sin(state.runTime * 3.1) * 0.28;
    const hoverVy = (hoverTarget - state.bird.y) * 5.5;
    state.bird.vy = damp(state.bird.vy, hoverVy, 8, dt);
    state.bird.y += state.bird.vy * dt;
    state.bird.wingPhase += dt * 11.5;
  } else {
    state.bird.vy = Math.max(WORLD.MAX_FALL_SPEED, state.bird.vy + WORLD.GRAVITY * dt);
    state.bird.y += state.bird.vy * dt;
    const wingRate = state.bird.vy > 0 ? 18.5 : 8.5;
    state.bird.wingPhase += dt * (wingRate + state.bird.wingBoost * 10);
  }

  state.bird.wingBoost = Math.max(0, state.bird.wingBoost - dt * 3.6);

  if (state.bird.y > WORLD.CEILING_Y - WORLD.BIRD_RADIUS) {
    state.bird.y = WORLD.CEILING_Y - WORLD.BIRD_RADIUS;
    if (state.bird.vy > 0) state.bird.vy = 0;
  }

  const targetPitch = clamp(state.bird.vy * 0.088, -1.18, 0.52);
  state.bird.pitch = damp(state.bird.pitch, targetPitch, state.bird.vy > 0 ? 14 : 6.5, dt);
  state.bird.roll = damp(state.bird.roll, Math.sin(state.runTime * 2.2) * 0.06, 5, dt);

  let rightmostX = -Infinity;
  let rightmostGapY: number = WORLD.BIRD_START_Y;
  for (let i = 0; i < state.pipes.length; i++) {
    const p = state.pipes[i];
    p.x -= state.speed * dt;
    if (p.moving) {
      p.gapY = p.baseGapY + Math.sin(state.elapsed * p.moveSpeed + p.movePhase) * p.moveAmplitude;
    }
    if (p.ring.active && !p.ring.collected) {
      p.ring.spin += dt * 2.6;
      // Magnetic ring pull when Magnet upgrade is active
      if (state.modifiers.magnetRadius > 0) {
        const ringWorldX = p.x + p.ring.offsetX;
        const ringWorldY = p.gapY + p.ring.offsetY;
        const dx = state.bird.x - ringWorldX;
        const dy = state.bird.y - ringWorldY;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01 && dist < state.modifiers.magnetRadius) {
          const pull = 12.5 * dt;
          p.ring.offsetX += (dx / dist) * pull;
          p.ring.offsetY += (dy / dist) * pull;
        }
      }
    }
    if (p.x > rightmostX) {
      rightmostX = p.x;
      rightmostGapY = p.baseGapY;
    }
  }

  for (let i = 0; i < state.pipes.length; i++) {
    const p = state.pipes[i];
    if (p.x < WORLD.PIPE_DESPAWN_X) {
      const spawnIndex = state.pipesCleared + state.pipes.length;
      const recycled = createPipe(
        state.nextPipeId++,
        rightmostX + WORLD.PIPE_SPACING,
        rightmostGapY,
        spawnIndex,
        rng,
        state.modifiers.gapBonus
      );
      state.pipes[i] = recycled;
      rightmostX = recycled.x;
      rightmostGapY = recycled.baseGapY;
    }
  }

  for (let i = 0; i < state.pipes.length; i++) {
    const p = state.pipes[i];

    // Golden Wind-Ring collection
    if (p.ring.active && !p.ring.collected) {
      const ringWorldX = p.x + p.ring.offsetX;
      const ringWorldY = p.gapY + p.ring.offsetY;
      const dx = state.bird.x - ringWorldX;
      const dy = state.bird.y - ringWorldY;
      if (dx * dx + dy * dy <= 1.28 * 1.28) {
        p.ring.collected = true;
        state.ringsCollected += 1;
        state.score += 2;
        const earned = Math.round(12 * state.modifiers.coinMultiplier);
        state.runCoins += earned;
        if (state.score > state.bestScore) state.bestScore = state.score;
        state.fovKick = Math.min(5.0, state.fovKick + 2.2);
        events.push({ type: 'ring', x: ringWorldX, y: ringWorldY, bonus: 2, coins: earned });
      }
    }

    // Pipe pass scoring
    if (!p.passed && p.x < state.bird.x - WORLD.PIPE_RADIUS * 0.45) {
      p.passed = true;
      state.pipesCleared += 1;
      const centerOffset = Math.abs(state.bird.y - p.gapY);
      const perfect = centerOffset <= p.gapHeight * 0.24;
      if (perfect) {
        state.streak += 1;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      } else {
        state.streak = 0;
      }
      state.score += 1;
      const earned = Math.round((perfect ? 4 : 2) * state.modifiers.coinMultiplier);
      state.runCoins += earned;
      if (state.score > state.bestScore) state.bestScore = state.score;
      events.push({
        type: 'score',
        score: state.score,
        streak: state.streak,
        perfect,
        coins: earned,
        x: p.x,
        y: p.gapY,
      });
    }

    // Pipe collision (with Shield absorption!)
    if (state.bird.invulnTimer <= 0 && checkPipeCollision(state.bird, p)) {
      if (state.bird.shieldActive) {
        state.bird.shieldActive = false;
        state.shieldConsumed = true;
        state.bird.invulnTimer = 1.45;
        state.bird.vy = Math.max(state.bird.vy, 5.4);
        state.bird.hitFlash = 0.85;
        state.hitstopTimer = 0.04;
        state.trauma = 0.72;
        events.push({ type: 'shieldBreak', x: state.bird.x, y: state.bird.y });
      } else {
        triggerCrash(state, 'pipe', events);
        return events;
      }
    }
  }

  // Water / ground collision
  if (state.bird.y <= WORLD.GROUND_Y + WORLD.BIRD_RADIUS) {
    state.bird.y = WORLD.GROUND_Y + WORLD.BIRD_RADIUS;
    if (state.bird.shieldActive && state.bird.invulnTimer <= 0) {
      state.bird.shieldActive = false;
      state.shieldConsumed = true;
      state.bird.invulnTimer = 1.45;
      state.bird.vy = WORLD.FLAP_VELOCITY * 0.95;
      state.bird.hitFlash = 0.85;
      state.trauma = 0.68;
      events.push({ type: 'shieldBreak', x: state.bird.x, y: state.bird.y });
    } else if (state.bird.invulnTimer <= 0) {
      triggerCrash(state, 'water', events);
    }
  }

  return events;
}

function stepTitleAutopilot(state: EngineState, dt: number, rng: () => number): void {
  const cruiseSpeed = WORLD.BASE_SPEED * 0.72;
  state.distance += cruiseSpeed * dt;

  let targetY = WORLD.BIRD_START_Y + Math.sin(state.elapsed * 1.8) * 0.5;
  let nearestX = Infinity;
  for (let i = 0; i < state.pipes.length; i++) {
    const p = state.pipes[i];
    p.x -= cruiseSpeed * dt;
    if (p.ring.active) p.ring.spin += dt * 2.2;
    if (p.x > state.bird.x - 1.5 && p.x < nearestX) {
      nearestX = p.x;
      targetY = p.gapY + Math.sin(state.elapsed * 2.4) * 0.22;
    }
  }

  let rightmostX = -Infinity;
  let rightmostGapY: number = WORLD.BIRD_START_Y;
  for (const p of state.pipes) {
    if (p.x > rightmostX) {
      rightmostX = p.x;
      rightmostGapY = p.baseGapY;
    }
  }
  for (let i = 0; i < state.pipes.length; i++) {
    if (state.pipes[i].x < WORLD.PIPE_DESPAWN_X) {
      const next = createPipe(
        state.nextPipeId++,
        rightmostX + WORLD.PIPE_SPACING,
        rightmostGapY,
        0,
        rng
      );
      state.pipes[i] = next;
      rightmostX = next.x;
      rightmostGapY = next.baseGapY;
    }
  }

  const prevY = state.bird.y;
  state.bird.y = damp(state.bird.y, targetY, 3.2, dt);
  state.bird.vy = (state.bird.y - prevY) / Math.max(dt, 0.001);
  state.bird.pitch = damp(state.bird.pitch, clamp(state.bird.vy * 0.09, -0.35, 0.35), 6, dt);
  state.bird.roll = damp(state.bird.roll, Math.sin(state.elapsed * 1.4) * 0.12, 4, dt);
  state.bird.wingPhase += dt * 11.2;
}

function triggerCrash(
  state: EngineState,
  cause: 'pipe' | 'water',
  events: GameEventType[]
): void {
  state.phase = 'dying';
  state.crashCause = cause;
  state.hitstopTimer = WORLD.HITSTOP_DURATION;
  state.dyingTimer = WORLD.DYING_DURATION;
  state.trauma = 1.0;
  state.bird.hitFlash = 1.0;
  state.bird.vy = cause === 'water' ? 4.2 : 3.4;
  state.bird.tumbleVel = cause === 'pipe' ? 7.5 : 4.2;
  state.bird.squashX = 1.24;
  state.bird.squashY = 0.76;
  events.push({ type: 'crash', x: state.bird.x, y: state.bird.y, cause });
}

function finalizeGameOver(state: EngineState, events: GameEventType[]): void {
  const isNewRecord = state.score > 0 && state.score >= state.bestScore;
  const summary: RunSummary = {
    score: state.score,
    bestScore: state.bestScore,
    pipesCleared: state.pipesCleared,
    ringsCollected: state.ringsCollected,
    coinsEarned: state.runCoins,
    bestStreak: state.bestStreak,
    distanceMeters: Math.round(state.distance * 1.8),
    medal: computeMedal(state.score),
    isNewRecord,
    cause: state.crashCause,
  };
  state.summary = summary;
  state.phase = 'gameover';
  events.push({ type: 'gameover', summary });
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function circleIntersectsRect(
  cx: number,
  cy: number,
  r: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  const nearestX = clamp(cx, minX, maxX);
  const nearestY = clamp(cy, minY, maxY);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}
