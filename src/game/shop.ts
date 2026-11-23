import type {
  BirdSkinId,
  PipeThemeId,
  PlayerProfile,
  RunModifiers,
  RunSummary,
  TrailFxId,
  UpgradeId,
} from './types';

export const PROFILE_STORAGE_KEY = 'flappy3d_profile_v1';
export const DAILY_REWARD_COINS = 100;
export const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const MAX_SHIELD_STOCK = 5;
export const SHIELD_PRICE = 60;

export interface BirdSkinDef {
  id: BirdSkinId;
  name: string;
  subtitle: string;
  price: number;
  swatchPrimary: string;
  swatchAccent: string;
  dorsalTop: string;
  dorsalMid: string;
  dorsalDeep: string;
  breastHex: number;
  wingTipHex: number;
  beakHex: number;
  emissiveHex: number;
  emissiveIntensity: number;
}

export interface PipeThemeDef {
  id: PipeThemeId;
  name: string;
  subtitle: string;
  price: number;
  swatchPrimary: string;
  swatchAccent: string;
  enamelDark: string;
  enamelMid: string;
  enamelBright: string;
  flangeHex: number;
  brassHex: number;
  metalness: number;
  roughness: number;
}

export interface TrailFxDef {
  id: TrailFxId;
  name: string;
  subtitle: string;
  price: number;
  swatchPrimary: string;
  swatchAccent: string;
  colors: [number, number, number, number];
  emissiveHex: number;
  emissiveIntensity: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  prices: number[];
  effectSummary: (level: number) => string;
}

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  progress: (profile: PlayerProfile) => number;
}

export const BIRD_SKINS: BirdSkinDef[] = [
  {
    id: 'canary',
    name: 'Canari Doré',
    subtitle: 'Plumage ambre naturel et rémiges turquoise',
    price: 0,
    swatchPrimary: '#f2b138',
    swatchAccent: '#1c5b78',
    dorsalTop: '#f7c547',
    dorsalMid: '#e89624',
    dorsalDeep: '#9e4510',
    breastHex: 0xf6e6c2,
    wingTipHex: 0x17445e,
    beakHex: 0xd95816,
    emissiveHex: 0x000000,
    emissiveIntensity: 0,
  },
  {
    id: 'kingfisher',
    name: 'Martin-Pêcheur Azur',
    subtitle: 'Bleu saphir irisé et poitrail cuivre brûlé',
    price: 90,
    swatchPrimary: '#1d74b8',
    swatchAccent: '#d96b27',
    dorsalTop: '#2ea8e0',
    dorsalMid: '#1562a8',
    dorsalDeep: '#0a2d5c',
    breastHex: 0xe38142,
    wingTipHex: 0x0e2a47,
    beakHex: 0x1f2630,
    emissiveHex: 0x062038,
    emissiveIntensity: 0.14,
  },
  {
    id: 'cardinal',
    name: 'Cardinal Écarlate',
    subtitle: 'Plumes pourpres profondes et masque anthracite',
    price: 160,
    swatchPrimary: '#d62f39',
    swatchAccent: '#22262e',
    dorsalTop: '#eb444e',
    dorsalMid: '#bf1f2c',
    dorsalDeep: '#690d16',
    breastHex: 0xf2d3c4,
    wingTipHex: 0x20232b,
    beakHex: 0xf08c2b,
    emissiveHex: 0x290406,
    emissiveIntensity: 0.1,
  },
  {
    id: 'obsidian',
    name: 'Faucon d’Obsidienne',
    subtitle: 'Plumage graphite furtif et pointes or brossé',
    price: 260,
    swatchPrimary: '#2a303a',
    swatchAccent: '#eab308',
    dorsalTop: '#4a5363',
    dorsalMid: '#262c36',
    dorsalDeep: '#11151c',
    breastHex: 0x5c6473,
    wingTipHex: 0xdba42c,
    beakHex: 0xe8b235,
    emissiveHex: 0x12151c,
    emissiveIntensity: 0.12,
  },
  {
    id: 'snowowl',
    name: 'Harfang des Neiges',
    subtitle: 'Blanc polaire nacré et reflets givrés',
    price: 380,
    swatchPrimary: '#edf2f7',
    swatchAccent: '#6ea8c9',
    dorsalTop: '#ffffff',
    dorsalMid: '#dce5f0',
    dorsalDeep: '#8fa4ba',
    breastHex: 0xffffff,
    wingTipHex: 0x4f7c99,
    beakHex: 0xd99b26,
    emissiveHex: 0x182633,
    emissiveIntensity: 0.12,
  },
  {
    id: 'phoenix',
    name: 'Phénix Solaire',
    subtitle: 'Or incandescent et rémiges de braise vive',
    price: 550,
    swatchPrimary: '#ff8a1f',
    swatchAccent: '#ffe066',
    dorsalTop: '#ffe36e',
    dorsalMid: '#ff771c',
    dorsalDeep: '#a61c0f',
    breastHex: 0xffe9a6,
    wingTipHex: 0xff4514,
    beakHex: 0xffd147,
    emissiveHex: 0xff6212,
    emissiveIntensity: 0.34,
  },
];

export const PIPE_THEMES: PipeThemeDef[] = [
  {
    id: 'emerald',
    name: 'Émeraude Classique',
    subtitle: 'Acier émaillé vert profond et collerettes laiton',
    price: 0,
    swatchPrimary: '#237a4e',
    swatchAccent: '#d8a84e',
    enamelDark: '#165336',
    enamelMid: '#237a4e',
    enamelBright: '#2b935d',
    flangeHex: 0x1e7d4b,
    brassHex: 0xd8a84e,
    metalness: 0.34,
    roughness: 0.36,
  },
  {
    id: 'copper',
    name: 'Cuivre Industriel',
    subtitle: 'Cuivre martelé chaud et boulons bronze patiné',
    price: 140,
    swatchPrimary: '#b55d34',
    swatchAccent: '#e2b07e',
    enamelDark: '#692f17',
    enamelMid: '#a8512b',
    enamelBright: '#cf7446',
    flangeHex: 0x8f4322,
    brassHex: 0xe6bf8a,
    metalness: 0.72,
    roughness: 0.26,
  },
  {
    id: 'marble',
    name: 'Marbre Impérial',
    subtitle: 'Colonnes travertin ivoire et bagues dorées',
    price: 240,
    swatchPrimary: '#e3ddd0',
    swatchAccent: '#eab847',
    enamelDark: '#a89f91',
    enamelMid: '#d6cfc0',
    enamelBright: '#f0ebe0',
    flangeHex: 0xc9bfa9,
    brassHex: 0xf2c14e,
    metalness: 0.16,
    roughness: 0.28,
  },
  {
    id: 'titanium',
    name: 'Titane Carbone',
    subtitle: 'Alliage anthracite satiné et cerclages ambre',
    price: 360,
    swatchPrimary: '#2f3845',
    swatchAccent: '#f59e0b',
    enamelDark: '#151a22',
    enamelMid: '#28313d',
    enamelBright: '#3d4a5c',
    flangeHex: 0x202733,
    brassHex: 0xf59e0b,
    metalness: 0.78,
    roughness: 0.24,
  },
];

export const TRAIL_FX: TrailFxDef[] = [
  {
    id: 'feathers',
    name: 'Plumes Naturelles',
    subtitle: 'Duvet doré et éclats d’air légers',
    price: 0,
    swatchPrimary: '#f7c547',
    swatchAccent: '#fff3d4',
    colors: [0xf7c547, 0xfff3d4, 0xd8f1ff, 0xe89624],
    emissiveHex: 0x3a2608,
    emissiveIntensity: 0.3,
  },
  {
    id: 'stardust',
    name: 'Poussière d’Étoiles',
    subtitle: 'Étincelles cyan et éclats d’or céleste',
    price: 110,
    swatchPrimary: '#38bdf8',
    swatchAccent: '#fde047',
    colors: [0x38bdf8, 0xfde047, 0xe0f2fe, 0x67e8f9],
    emissiveHex: 0x165e8a,
    emissiveIntensity: 0.75,
  },
  {
    id: 'embers',
    name: 'Braise Ardente',
    subtitle: 'Flammèches incandescentes et cendres dorées',
    price: 210,
    swatchPrimary: '#f97316',
    swatchAccent: '#fef08a',
    colors: [0xff5514, 0xff9b21, 0xffe478, 0xd92616],
    emissiveHex: 0x9c2e04,
    emissiveIntensity: 0.9,
  },
  {
    id: 'frost',
    name: 'Givre Alpin',
    subtitle: 'Cristaux de glace polaire et reflets argentés',
    price: 300,
    swatchPrimary: '#bae6fd',
    swatchAccent: '#ffffff',
    colors: [0xe0f2fe, 0x7dd3fc, 0xffffff, 0x38bdf8],
    emissiveHex: 0x296a8f,
    emissiveIntensity: 0.65,
  },
];

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'magnet',
    name: 'Aimant à Anneaux',
    description: 'Attire automatiquement les anneaux dorés à proximité pendant le vol.',
    maxLevel: 3,
    prices: [80, 160, 280],
    effectSummary: (lvl) => (lvl === 0 ? 'Inactif' : `Portée ${(2.2 + lvl * 1.1).toFixed(1)} m`),
  },
  {
    id: 'multiplier',
    name: 'Plumes d’Or ×',
    description: 'Augmente les Plumes d’Or gagnées à chaque conduit et anneau doré.',
    maxLevel: 3,
    prices: [100, 200, 340],
    effectSummary: (lvl) => {
      const mult = [1, 1.25, 1.5, 2.0][lvl] ?? 1;
      return `Gain ×${mult.toFixed(2).replace(/\.00$/, '')}`;
    },
  },
  {
    id: 'wings',
    name: 'Ailes Aérodynamiques',
    description: 'Élargit légèrement les brèches entre les conduits pour un pilotage plus fluide.',
    maxLevel: 3,
    prices: [120, 240, 380],
    effectSummary: (lvl) => (lvl === 0 ? 'Standard' : `+${Math.round(lvl * 5)}% d’ouverture`),
  },
  {
    id: 'shield',
    name: 'Bouclier Aérien',
    description: 'Consommable : absorbe 1 collision avec un conduit lors du prochain vol (max 5 en stock).',
    maxLevel: MAX_SHIELD_STOCK,
    prices: [SHIELD_PRICE, SHIELD_PRICE, SHIELD_PRICE, SHIELD_PRICE, SHIELD_PRICE],
    effectSummary: (stock) => `Stock : ${stock} / ${MAX_SHIELD_STOCK}`,
  },
];

export const MISSIONS: MissionDef[] = [
  {
    id: 'first_pipes',
    title: 'Premier Envol',
    description: 'Franchir 3 conduits au total',
    reward: 60,
    target: 3,
    progress: (p) => p.stats.totalPipes,
  },
  {
    id: 'first_purchase',
    title: 'Collectionneur',
    description: 'Effectuer 1 achat dans la Boutique',
    reward: 80,
    target: 1,
    progress: (p) => p.stats.totalPurchases,
  },
  {
    id: 'ring_hunter',
    title: 'Chasseur d’Anneaux',
    description: 'Collecter 3 anneaux dorés',
    reward: 95,
    target: 3,
    progress: (p) => p.stats.totalRings,
  },
  {
    id: 'alpine_explorer',
    title: 'Explorateur Alpin',
    description: 'Parcourir 250 mètres de vol cumulés',
    reward: 110,
    target: 250,
    progress: (p) => p.stats.totalDistance,
  },
  {
    id: 'perfect_streak',
    title: 'Trajectoire Parfaite',
    description: 'Réussir une série parfaite ×3',
    reward: 130,
    target: 3,
    progress: (p) => p.stats.bestStreak,
  },
  {
    id: 'canyon_ace',
    title: 'As du Canyon',
    description: 'Atteindre un score de 15 en un seul vol',
    reward: 200,
    target: 15,
    progress: (p) => p.bestScore,
  },
];

export function createDefaultProfile(legacyBestScore = 0): PlayerProfile {
  return {
    coins: 120,
    bestScore: Math.max(0, legacyBestScore),
    ownedSkins: ['canary'],
    equippedSkin: 'canary',
    ownedPipeThemes: ['emerald'],
    equippedPipeTheme: 'emerald',
    ownedTrails: ['feathers'],
    equippedTrail: 'feathers',
    upgrades: {
      magnet: 0,
      multiplier: 0,
      wings: 0,
    },
    shields: 0,
    claimedMissions: [],
    lastDailyClaimMs: 0,
    stats: {
      totalRuns: 0,
      totalPipes: 0,
      totalRings: 0,
      totalDistance: 0,
      bestStreak: 0,
      totalPurchases: 0,
    },
  };
}

export function getSkinDef(id: BirdSkinId): BirdSkinDef {
  return BIRD_SKINS.find((s) => s.id === id) ?? BIRD_SKINS[0];
}

export function getPipeThemeDef(id: PipeThemeId): PipeThemeDef {
  return PIPE_THEMES.find((t) => t.id === id) ?? PIPE_THEMES[0];
}

export function getTrailFxDef(id: TrailFxId): TrailFxDef {
  return TRAIL_FX.find((f) => f.id === id) ?? TRAIL_FX[0];
}

export function computeRunModifiers(profile: PlayerProfile): RunModifiers {
  const multTable = [1, 1.25, 1.5, 2.0];
  return {
    magnetRadius: profile.upgrades.magnet > 0 ? 2.2 + profile.upgrades.magnet * 1.1 : 0,
    coinMultiplier: multTable[profile.upgrades.multiplier] ?? 1,
    gapBonus: profile.upgrades.wings * 0.18,
    hasShield: profile.shields > 0,
  };
}

export function buyOrEquipSkin(profile: PlayerProfile, id: BirdSkinId): { ok: boolean; bought: boolean; profile: PlayerProfile } {
  const def = BIRD_SKINS.find((s) => s.id === id);
  if (!def) return { ok: false, bought: false, profile };

  if (profile.ownedSkins.includes(id)) {
    return { ok: true, bought: false, profile: { ...profile, equippedSkin: id } };
  }
  if (profile.coins < def.price) {
    return { ok: false, bought: false, profile };
  }
  return {
    ok: true,
    bought: true,
    profile: {
      ...profile,
      coins: profile.coins - def.price,
      ownedSkins: [...profile.ownedSkins, id],
      equippedSkin: id,
      stats: { ...profile.stats, totalPurchases: profile.stats.totalPurchases + 1 },
    },
  };
}

export function buyOrEquipPipeTheme(
  profile: PlayerProfile,
  id: PipeThemeId
): { ok: boolean; bought: boolean; profile: PlayerProfile } {
  const def = PIPE_THEMES.find((t) => t.id === id);
  if (!def) return { ok: false, bought: false, profile };

  if (profile.ownedPipeThemes.includes(id)) {
    return { ok: true, bought: false, profile: { ...profile, equippedPipeTheme: id } };
  }
  if (profile.coins < def.price) {
    return { ok: false, bought: false, profile };
  }
  return {
    ok: true,
    bought: true,
    profile: {
      ...profile,
      coins: profile.coins - def.price,
      ownedPipeThemes: [...profile.ownedPipeThemes, id],
      equippedPipeTheme: id,
      stats: { ...profile.stats, totalPurchases: profile.stats.totalPurchases + 1 },
    },
  };
}

export function buyOrEquipTrail(
  profile: PlayerProfile,
  id: TrailFxId
): { ok: boolean; bought: boolean; profile: PlayerProfile } {
  const def = TRAIL_FX.find((t) => t.id === id);
  if (!def) return { ok: false, bought: false, profile };

  if (profile.ownedTrails.includes(id)) {
    return { ok: true, bought: false, profile: { ...profile, equippedTrail: id } };
  }
  if (profile.coins < def.price) {
    return { ok: false, bought: false, profile };
  }
  return {
    ok: true,
    bought: true,
    profile: {
      ...profile,
      coins: profile.coins - def.price,
      ownedTrails: [...profile.ownedTrails, id],
      equippedTrail: id,
      stats: { ...profile.stats, totalPurchases: profile.stats.totalPurchases + 1 },
    },
  };
}

export function buyUpgrade(profile: PlayerProfile, id: UpgradeId): { ok: boolean; profile: PlayerProfile } {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return { ok: false, profile };

  if (id === 'shield') {
    if (profile.shields >= MAX_SHIELD_STOCK || profile.coins < SHIELD_PRICE) {
      return { ok: false, profile };
    }
    return {
      ok: true,
      profile: {
        ...profile,
        coins: profile.coins - SHIELD_PRICE,
        shields: profile.shields + 1,
        stats: { ...profile.stats, totalPurchases: profile.stats.totalPurchases + 1 },
      },
    };
  }

  const currentLvl = profile.upgrades[id];
  if (currentLvl >= def.maxLevel) return { ok: false, profile };
  const cost = def.prices[currentLvl];
  if (profile.coins < cost) return { ok: false, profile };

  return {
    ok: true,
    profile: {
      ...profile,
      coins: profile.coins - cost,
      upgrades: {
        ...profile.upgrades,
        [id]: currentLvl + 1,
      },
      stats: { ...profile.stats, totalPurchases: profile.stats.totalPurchases + 1 },
    },
  };
}

export function canClaimDailyReward(profile: PlayerProfile, nowMs = Date.now()): boolean {
  return profile.lastDailyClaimMs === 0 || nowMs - profile.lastDailyClaimMs >= DAILY_COOLDOWN_MS;
}

export function claimDailyReward(
  profile: PlayerProfile,
  nowMs = Date.now()
): { ok: boolean; reward: number; profile: PlayerProfile } {
  if (!canClaimDailyReward(profile, nowMs)) {
    return { ok: false, reward: 0, profile };
  }
  return {
    ok: true,
    reward: DAILY_REWARD_COINS,
    profile: {
      ...profile,
      coins: profile.coins + DAILY_REWARD_COINS,
      lastDailyClaimMs: nowMs,
    },
  };
}

export function isMissionClaimable(profile: PlayerProfile, missionId: string): boolean {
  if (profile.claimedMissions.includes(missionId)) return false;
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def) return false;
  return def.progress(profile) >= def.target;
}

export function claimMission(
  profile: PlayerProfile,
  missionId: string
): { ok: boolean; reward: number; profile: PlayerProfile } {
  if (!isMissionClaimable(profile, missionId)) {
    return { ok: false, reward: 0, profile };
  }
  const def = MISSIONS.find((m) => m.id === missionId)!;
  return {
    ok: true,
    reward: def.reward,
    profile: {
      ...profile,
      coins: profile.coins + def.reward,
      claimedMissions: [...profile.claimedMissions, missionId],
    },
  };
}

export function countUnclaimedRewards(profile: PlayerProfile, nowMs = Date.now()): number {
  let count = canClaimDailyReward(profile, nowMs) ? 1 : 0;
  for (const m of MISSIONS) {
    if (isMissionClaimable(profile, m.id)) count += 1;
  }
  return count;
}

export function applyRunCompletion(
  profile: PlayerProfile,
  summary: RunSummary,
  consumedShield: boolean
): PlayerProfile {
  return {
    ...profile,
    coins: profile.coins + summary.coinsEarned,
    bestScore: Math.max(profile.bestScore, summary.score),
    shields: consumedShield ? Math.max(0, profile.shields - 1) : profile.shields,
    stats: {
      ...profile.stats,
      totalRuns: profile.stats.totalRuns + 1,
      totalPipes: profile.stats.totalPipes + summary.pipesCleared,
      totalRings: profile.stats.totalRings + summary.ringsCollected,
      totalDistance: profile.stats.totalDistance + summary.distanceMeters,
      bestStreak: Math.max(profile.stats.bestStreak, summary.bestStreak),
    },
  };
}

export function loadProfile(): PlayerProfile {
  const defaults = createDefaultProfile(0);
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      const legacyBest = Number.parseInt(window.localStorage.getItem('flappy3d_best_score_v1') || '0', 10);
      return createDefaultProfile(Number.isFinite(legacyBest) ? legacyBest : 0);
    }
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      ...defaults,
      ...parsed,
      ownedSkins: Array.isArray(parsed.ownedSkins) && parsed.ownedSkins.length > 0 ? parsed.ownedSkins : defaults.ownedSkins,
      ownedPipeThemes:
        Array.isArray(parsed.ownedPipeThemes) && parsed.ownedPipeThemes.length > 0
          ? parsed.ownedPipeThemes
          : defaults.ownedPipeThemes,
      ownedTrails:
        Array.isArray(parsed.ownedTrails) && parsed.ownedTrails.length > 0
          ? parsed.ownedTrails
          : defaults.ownedTrails,
      upgrades: {
        ...defaults.upgrades,
        ...(parsed.upgrades ?? {}),
      },
      stats: {
        ...defaults.stats,
        ...(parsed.stats ?? {}),
      },
      claimedMissions: Array.isArray(parsed.claimedMissions) ? parsed.claimedMissions : [],
    };
  } catch {
    return defaults;
  }
}

export function saveProfile(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.localStorage.setItem('flappy3d_best_score_v1', String(profile.bestScore));
  } catch {
    // Ignore storage errors
  }
}
