import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_REWARD_COINS,
  SHIELD_PRICE,
  applyRunCompletion,
  buyOrEquipPipeTheme,
  buyOrEquipSkin,
  buyOrEquipTrail,
  buyUpgrade,
  canClaimDailyReward,
  claimDailyReward,
  claimMission,
  computeRunModifiers,
  countUnclaimedRewards,
  createDefaultProfile,
  isMissionClaimable,
} from './shop';

test('daily chest grants coins once per 24h cooldown', () => {
  const p0 = createDefaultProfile(0);
  const now = 1_700_000_000_000;
  assert.equal(canClaimDailyReward(p0, now), true);

  const r1 = claimDailyReward(p0, now);
  assert.equal(r1.ok, true);
  assert.equal(r1.reward, DAILY_REWARD_COINS);
  assert.equal(r1.profile.coins, p0.coins + DAILY_REWARD_COINS);

  // Immediately claiming again must be rejected
  const r2 = claimDailyReward(r1.profile, now + 1000);
  assert.equal(r2.ok, false);
  assert.equal(r2.profile.coins, r1.profile.coins);

  // After 24h it becomes available again
  const r3 = claimDailyReward(r1.profile, now + 24 * 60 * 60 * 1000 + 1);
  assert.equal(r3.ok, true);
});

test('buying and equipping bird skins, pipe themes, and trails deducts coins accurately', () => {
  let profile = { ...createDefaultProfile(0), coins: 500 };

  // Buy kingfisher skin (90)
  const skinRes = buyOrEquipSkin(profile, 'kingfisher');
  assert.equal(skinRes.ok, true);
  assert.equal(skinRes.bought, true);
  assert.equal(skinRes.profile.coins, 410);
  assert.equal(skinRes.profile.equippedSkin, 'kingfisher');
  assert.equal(skinRes.profile.stats.totalPurchases, 1);
  profile = skinRes.profile;

  // Re-equipping owned canary is free
  const equipFree = buyOrEquipSkin(profile, 'canary');
  assert.equal(equipFree.ok, true);
  assert.equal(equipFree.bought, false);
  assert.equal(equipFree.profile.coins, 410);
  assert.equal(equipFree.profile.equippedSkin, 'canary');

  // Buy copper pipe theme (140) and stardust trail (110)
  const pipeRes = buyOrEquipPipeTheme(profile, 'copper');
  assert.equal(pipeRes.ok, true);
  assert.equal(pipeRes.profile.coins, 270);
  assert.equal(pipeRes.profile.equippedPipeTheme, 'copper');

  const trailRes = buyOrEquipTrail(pipeRes.profile, 'stardust');
  assert.equal(trailRes.ok, true);
  assert.equal(trailRes.profile.coins, 160);
  assert.equal(trailRes.profile.equippedTrail, 'stardust');

  // Cannot buy phoenix (550) when coins are 160
  const unaffordable = buyOrEquipSkin(trailRes.profile, 'phoenix');
  assert.equal(unaffordable.ok, false);
  assert.equal(unaffordable.profile.coins, 160);
});

test('upgrades scale modifiers and shield stock caps cleanly', () => {
  let profile = { ...createDefaultProfile(0), coins: 1000 };

  const u1 = buyUpgrade(profile, 'magnet');
  assert.equal(u1.ok, true);
  assert.equal(u1.profile.upgrades.magnet, 1);

  const u2 = buyUpgrade(u1.profile, 'multiplier');
  assert.equal(u2.ok, true);
  assert.equal(u2.profile.upgrades.multiplier, 1);

  const u3 = buyUpgrade(u2.profile, 'wings');
  assert.equal(u3.ok, true);
  assert.equal(u3.profile.upgrades.wings, 1);

  const u4 = buyUpgrade(u3.profile, 'shield');
  assert.equal(u4.ok, true);
  assert.equal(u4.profile.shields, 1);
  assert.equal(u4.profile.coins, u3.profile.coins - SHIELD_PRICE);

  const mods = computeRunModifiers(u4.profile);
  assert.ok(mods.magnetRadius > 2.5);
  assert.equal(mods.coinMultiplier, 1.25);
  assert.ok(mods.gapBonus > 0);
  assert.equal(mods.hasShield, true);
});

test('missions track completion from purchases and runs and can only be claimed once', () => {
  let profile = createDefaultProfile(0);
  assert.equal(isMissionClaimable(profile, 'first_purchase'), false);

  const buyRes = buyOrEquipSkin(profile, 'kingfisher');
  profile = buyRes.profile;
  assert.equal(isMissionClaimable(profile, 'first_purchase'), true);

  const claimRes = claimMission(profile, 'first_purchase');
  assert.equal(claimRes.ok, true);
  assert.equal(claimRes.reward, 80);
  profile = claimRes.profile;

  // Duplicate claim prevented
  const dup = claimMission(profile, 'first_purchase');
  assert.equal(dup.ok, false);

  // Applying a run updates stats and unlocks pipe mission
  profile = applyRunCompletion(
    profile,
    {
      score: 6,
      bestScore: 6,
      pipesCleared: 4,
      ringsCollected: 1,
      coinsEarned: 22,
      bestStreak: 2,
      distanceMeters: 95,
      medal: 'bronze',
      isNewRecord: true,
      cause: 'pipe',
    },
    false
  );
  assert.equal(isMissionClaimable(profile, 'first_pipes'), true);
  assert.ok(countUnclaimedRewards(profile) >= 1);
});
