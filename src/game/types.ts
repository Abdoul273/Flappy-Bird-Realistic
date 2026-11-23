export type GamePhase = 'title' | 'playing' | 'paused' | 'dying' | 'gameover';

export type AtmospherePreset = 'golden' | 'daylight' | 'dusk';

export type CameraMode = 'cinematic' | 'chase';

export type MedalTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export type BirdSkinId = 'canary' | 'kingfisher' | 'cardinal' | 'obsidian' | 'snowowl' | 'phoenix';
export type PipeThemeId = 'emerald' | 'copper' | 'marble' | 'titanium';
export type TrailFxId = 'feathers' | 'stardust' | 'embers' | 'frost';
export type UpgradeId = 'magnet' | 'multiplier' | 'wings' | 'shield';

export interface UpgradeLevels {
  magnet: number;     // 0..3
  multiplier: number; // 0..3
  wings: number;      // 0..3
}

export interface PlayerStats {
  totalRuns: number;
  totalPipes: number;
  totalRings: number;
  totalDistance: number;
  bestStreak: number;
  totalPurchases: number;
}

export interface PlayerProfile {
  coins: number;
  bestScore: number;
  ownedSkins: BirdSkinId[];
  equippedSkin: BirdSkinId;
  ownedPipeThemes: PipeThemeId[];
  equippedPipeTheme: PipeThemeId;
  ownedTrails: TrailFxId[];
  equippedTrail: TrailFxId;
  upgrades: UpgradeLevels;
  shields: number; // consumable stock 0..5
  claimedMissions: string[];
  lastDailyClaimMs: number;
  stats: PlayerStats;
}

export interface RunModifiers {
  magnetRadius: number;
  coinMultiplier: number;
  gapBonus: number;
  hasShield: boolean;
}

export interface RingData {
  active: boolean;
  collected: boolean;
  offsetX: number;
  offsetY: number;
  spin: number;
}

export interface PipeData {
  id: number;
  x: number;
  gapY: number;
  baseGapY: number;
  gapHeight: number;
  passed: boolean;
  moving: boolean;
  moveAmplitude: number;
  moveSpeed: number;
  movePhase: number;
  ring: RingData;
}

export interface BirdState {
  x: number;
  y: number;
  vy: number;
  pitch: number;
  roll: number;
  wingPhase: number;
  wingBoost: number;
  squashX: number;
  squashY: number;
  hitFlash: number;
  tumbleVel: number;
  shieldActive: boolean;
  invulnTimer: number;
}

export interface RunSummary {
  score: number;
  bestScore: number;
  pipesCleared: number;
  ringsCollected: number;
  coinsEarned: number;
  bestStreak: number;
  distanceMeters: number;
  medal: MedalTier;
  isNewRecord: boolean;
  cause: 'pipe' | 'water' | 'none';
}

export interface HudSnapshot {
  phase: GamePhase;
  score: number;
  bestScore: number;
  runCoins: number;
  streak: number;
  ringsCollected: number;
  speedKmh: number;
  altitudeMeters: number;
  shieldActive: boolean;
  atmosphere: AtmospherePreset;
  cameraMode: CameraMode;
  muted: boolean;
  awaitingFirstFlap: boolean;
  summary: RunSummary | null;
}

export type GameEventType =
  | { type: 'flap'; y: number }
  | { type: 'score'; score: number; streak: number; perfect: boolean; coins: number; x: number; y: number }
  | { type: 'ring'; x: number; y: number; bonus: number; coins: number }
  | { type: 'shieldBreak'; x: number; y: number }
  | { type: 'crash'; x: number; y: number; cause: 'pipe' | 'water' }
  | { type: 'gameover'; summary: RunSummary };
