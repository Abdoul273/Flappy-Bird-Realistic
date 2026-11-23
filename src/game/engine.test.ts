import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD,
  checkPipeCollision,
  computeDifficulty,
  computeMedal,
  createInitialState,
  createSeededRng,
  queueFlap,
  returnToTitle,
  setPaused,
  startNewRun,
  stepEngine,
} from './engine';

test('opening grace period survives >2s without input and eventually hits water when idle', () => {
  const rng = createSeededRng(42);
  const state = createInitialState(0, rng);
  startNewRun(state, rng);

  // Simulate 2.05 seconds with zero input
  for (let i = 0; i < 41; i++) {
    stepEngine(state, 0.05, rng);
  }
  assert.equal(state.phase, 'playing', 'Bird should survive first 2s without input');
  assert.ok(state.bird.y > WORLD.GROUND_Y + 2, 'Bird stays aloft during opening updraft');

  // Continue without input for another 3.5 seconds — gravity must bring bird down to water
  let crashed = false;
  for (let i = 0; i < 80; i++) {
    const events = stepEngine(state, 0.05, rng);
    if (events.some((e) => e.type === 'crash')) crashed = true;
    if ((state.phase as string) === 'gameover') break;
  }
  assert.equal(crashed, true, 'Idle player must eventually crash after grace period');
  assert.equal(state.phase as string, 'gameover', 'Dying transition must settle into gameover');
  assert.ok(state.summary !== null, 'Frozen run summary must be populated on gameover');
});

test('flap impulse launches bird upward and sets squash/stretch', () => {
  const rng = createSeededRng(7);
  const state = createInitialState(0, rng);
  startNewRun(state, rng);

  queueFlap(state);
  const events = stepEngine(state, 0.016, rng);

  assert.equal(events.some((e) => e.type === 'flap'), true);
  assert.equal(state.hasFlapped, true);
  assert.ok(state.bird.vy > WORLD.FLAP_VELOCITY * 0.85);
  assert.ok(state.bird.squashY > 1.0);
});

test('pipe collision detects collar and shaft hits accurately while leaving gap clear', () => {
  const rng = createSeededRng(99);
  const state = createInitialState(0, rng);
  startNewRun(state, rng);

  const pipe = state.pipes[0];
  pipe.x = WORLD.BIRD_X;
  pipe.gapY = 6.0;
  pipe.gapHeight = 4.2;

  // Center of gap: safe
  state.bird.y = 6.0;
  assert.equal(checkPipeCollision(state.bird, pipe), false);

  // Touching top collar lip: collision
  state.bird.y = 6.0 + 2.1 - WORLD.BIRD_RADIUS * 0.5;
  assert.equal(checkPipeCollision(state.bird, pipe), true);

  // Touching bottom shaft: collision
  state.bird.y = 1.5;
  assert.equal(checkPipeCollision(state.bird, pipe), true);
});

test('passing a pipe awards score, updates bestScore, and collects golden ring bonus', () => {
  const rng = createSeededRng(123);
  const state = createInitialState(0, rng);
  startNewRun(state, rng);

  const pipe = state.pipes[0];
  pipe.x = 0.2;
  pipe.gapY = 6.4;
  pipe.ring.active = true;
  pipe.ring.collected = false;
  pipe.ring.offsetY = 0;

  state.bird.y = 6.4;
  state.hasFlapped = true;
  state.bird.vy = 0;

  let scored = false;
  let ringPicked = false;
  for (let i = 0; i < 12; i++) {
    state.bird.vy = 0;
    state.bird.y = 6.4;
    const events = stepEngine(state, 0.03, rng);
    if (events.some((e) => e.type === 'score')) scored = true;
    if (events.some((e) => e.type === 'ring')) ringPicked = true;
  }

  assert.equal(ringPicked, true, 'Golden ring inside gap should be collected');
  assert.equal(scored, true, 'Passing pipe center should award score');
  assert.equal(state.score, 3, '1 point for pipe + 2 bonus for golden ring');
  assert.equal(state.bestScore, 3);
  assert.equal(state.pipesCleared, 1);
});

test('difficulty ramp scales speed up and gap down monotonically', () => {
  const early = computeDifficulty(0);
  const mid = computeDifficulty(12);
  const late = computeDifficulty(36);

  assert.ok(mid.speed > early.speed);
  assert.ok(late.speed > mid.speed);
  assert.ok(mid.gapHeight < early.gapHeight);
  assert.ok(late.gapHeight < mid.gapHeight);
  assert.equal(early.movingChance, 0);
  assert.ok(mid.movingChance > 0);
});

test('pause freezes simulation and medal tiers match thresholds', () => {
  const rng = createSeededRng(55);
  const state = createInitialState(0, rng);
  startNewRun(state, rng);

  setPaused(state, true);
  assert.equal(state.phase, 'paused');
  const distBefore = state.distance;
  stepEngine(state, 0.05, rng);
  assert.equal(state.distance, distBefore, 'Paused engine must not advance distance');

  setPaused(state, false);
  assert.equal(state.phase, 'playing');

  returnToTitle(state, rng);
  assert.equal(state.phase, 'title');

  assert.equal(computeMedal(0), 'none');
  assert.equal(computeMedal(4), 'bronze');
  assert.equal(computeMedal(12), 'silver');
  assert.equal(computeMedal(24), 'gold');
  assert.equal(computeMedal(42), 'platinum');
});

test('active shield absorbs a pipe hit and grants brief invulnerability', () => {
  const rng = createSeededRng(33);
  const state = createInitialState(0, rng);
  startNewRun(state, rng, {
    magnetRadius: 0,
    coinMultiplier: 1,
    gapBonus: 0,
    hasShield: true,
  });

  assert.equal(state.bird.shieldActive, true);
  const pipe = state.pipes[0];
  pipe.x = WORLD.BIRD_X;
  pipe.gapY = 6.0;
  pipe.gapHeight = 4.0;
  state.hasFlapped = true;
  state.bird.y = 1.6; // Directly inside bottom pipe shaft

  const events = stepEngine(state, 0.016, rng);
  assert.equal(events.some((e) => e.type === 'shieldBreak'), true);
  assert.equal(state.phase, 'playing', 'Shield must save bird from crashing');
  assert.equal(state.bird.shieldActive, false);
  assert.equal(state.shieldConsumed, true);
  assert.ok(state.bird.invulnTimer > 1.0);
});

test('magnet upgrade pulls nearby golden ring and coin multiplier boosts earnings', () => {
  const rng = createSeededRng(17);
  const state = createInitialState(0, rng);
  startNewRun(state, rng, {
    magnetRadius: 4.4,
    coinMultiplier: 2,
    gapBonus: 0.36,
    hasShield: false,
  });

  const pipe = state.pipes[0];
  pipe.x = 2.6;
  pipe.gapY = 6.4;
  pipe.ring.active = true;
  pipe.ring.collected = false;
  pipe.ring.offsetX = 0;
  pipe.ring.offsetY = 1.4; // Above bird, out of normal touch range without magnet

  state.hasFlapped = true;
  state.bird.y = 6.4;

  let collected = false;
  for (let i = 0; i < 14; i++) {
    state.bird.y = 6.4;
    state.bird.vy = 0;
    const events = stepEngine(state, 0.03, rng);
    if (events.some((e) => e.type === 'ring')) collected = true;
  }

  assert.equal(collected, true, 'Magnet should pull ring into bird capture radius');
  assert.ok(state.runCoins >= 24, '2x coin multiplier should award at least 24 coins for ring');
});
