import React, { useState } from 'react';
import {
  BIRD_SKINS,
  DAILY_REWARD_COINS,
  MAX_SHIELD_STOCK,
  MISSIONS,
  PIPE_THEMES,
  SHIELD_PRICE,
  TRAIL_FX,
  UPGRADES,
  canClaimDailyReward,
  isMissionClaimable,
} from '../game/shop';
import type {
  BirdSkinId,
  PipeThemeId,
  PlayerProfile,
  TrailFxId,
  UpgradeId,
} from '../game/types';

export type ShopTab = 'birds' | 'pipes' | 'trails' | 'upgrades' | 'missions';

interface ShopDrawerProps {
  open: boolean;
  initialTab: ShopTab;
  profile: PlayerProfile;
  feedbackToast: string | null;
  onClose: () => void;
  onBuyOrEquipSkin: (id: BirdSkinId) => void;
  onBuyOrEquipPipe: (id: PipeThemeId) => void;
  onBuyOrEquipTrail: (id: TrailFxId) => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onClaimDaily: () => void;
  onClaimMission: (missionId: string) => void;
}

export function PlumeCoinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#eab308" stroke="#713f12" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#fef08a" strokeWidth="1.1" opacity="0.7" />
      <path
        d="M8.2 15.8 C9.2 11.4, 12.2 8.2, 16.5 7.6 C15.2 11.2, 13 13.8, 9.6 15.2 Z"
        fill="#713f12"
      />
    </svg>
  );
}

function ShieldBadgeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const TABS: Array<{ id: ShopTab; label: string }> = [
  { id: 'birds', label: 'Oiseaux' },
  { id: 'pipes', label: 'Conduits' },
  { id: 'trails', label: 'Traînées' },
  { id: 'upgrades', label: 'Améliorations' },
  { id: 'missions', label: 'Missions' },
];

export const ShopDrawer: React.FC<ShopDrawerProps> = ({
  open,
  initialTab,
  profile,
  feedbackToast,
  onClose,
  onBuyOrEquipSkin,
  onBuyOrEquipPipe,
  onBuyOrEquipTrail,
  onBuyUpgrade,
  onClaimDaily,
  onClaimMission,
}) => {
  const [activeTab, setActiveTab] = useState<ShopTab>(initialTab);

  // Sync tab when opened with a specific destination (e.g. Missions button vs Boutique button)
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const dailyReady = canClaimDailyReward(profile);
  const claimableMissionsCount = MISSIONS.filter((m) => isMissionClaimable(profile, m.id)).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-drawer-title"
      className="fixed inset-0 z-20 pointer-events-none flex justify-end"
    >
      {/* Subtle click-outside backdrop on the left preview area */}
      <div
        className="flex-1 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-anchored Atelier & Boutique panel leaving the live 3D bird unobstructed on the left */}
      <aside className="pointer-events-auto w-full max-w-[540px] h-full bg-[#0e1520] border-l border-amber-200/18 shadow-[-20px_0_60px_rgba(0,0,0,0.65)] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2 id="shop-drawer-title" className="font-display text-2xl font-extrabold text-white tracking-tight">
              Atelier & Boutique
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Aperçu 3D en direct · Personnalisez votre vol
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              data-testid="shop-coins-balance"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#172131] border border-amber-300/25"
            >
              <PlumeCoinIcon className="w-4 h-4" />
              <span className="font-mono-tabular text-sm font-bold text-amber-300">
                {profile.coins}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la boutique"
              className="px-3.5 py-2 rounded-lg bg-[#192434] hover:bg-[#233247] border border-white/12 text-stone-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Daily Reward Chest Banner */}
        {dailyReady && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-[#1a2433] border border-amber-400/35 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-amber-200">Coffre Quotidien disponible</div>
              <div className="text-xs text-stone-300">
                Récupérez votre bonus de <strong className="font-mono-tabular text-amber-300">+{DAILY_REWARD_COINS} Plumes d’Or</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={onClaimDaily}
              className="px-4 py-2 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Ouvrir le coffre
            </button>
          </div>
        )}

        {/* Inline action feedback bar */}
        {feedbackToast && (
          <div
            role="status"
            className="mx-6 mt-3 px-3.5 py-2 rounded-md bg-emerald-950/85 border border-emerald-400/35 text-xs font-medium text-emerald-200"
          >
            {feedbackToast}
          </div>
        )}

        {/* Segmented Tab Bar */}
        <div role="tablist" aria-label="Catégories de la boutique" className="px-6 pt-4 pb-3 border-b border-white/8 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const showDotCount = tab.id === 'missions' && claimableMissionsCount > 0;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-stone-300 hover:text-white hover:bg-white/6'
                }`}
              >
                <span>{tab.label}</span>
                {showDotCount && (
                  <span className={`font-mono-tabular text-[11px] font-bold ${active ? 'text-slate-900' : 'text-amber-300'}`}>
                    ({claimableMissionsCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Catalog Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {/* TAB 1: 3D BIRD SKINS */}
          {activeTab === 'birds' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BIRD_SKINS.map((skin) => {
                const owned = profile.ownedSkins.includes(skin.id);
                const equipped = profile.equippedSkin === skin.id;
                const affordable = profile.coins >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`rounded-lg p-4 border transition-colors flex flex-col justify-between gap-3 ${
                      equipped
                        ? 'bg-[#172334] border-amber-400/60'
                        : 'bg-[#131c29] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-white/25 shrink-0"
                            style={{ backgroundColor: skin.swatchPrimary }}
                            aria-hidden="true"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-white/20 shrink-0 -ml-3"
                            style={{ backgroundColor: skin.swatchAccent }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-stone-400">
                          {equipped ? 'Équipé' : owned ? 'Possédé' : `${skin.price} Plumes`}
                        </span>
                      </div>
                      <h3 className="mt-2.5 font-display text-base font-bold text-white leading-snug">
                        {skin.name}
                      </h3>
                      <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                        {skin.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!owned && !affordable}
                      onClick={() => onBuyOrEquipSkin(skin.id)}
                      className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        equipped
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 cursor-default'
                          : owned
                            ? 'bg-[#1e2d42] hover:bg-[#293c57] text-white cursor-pointer'
                            : affordable
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold cursor-pointer'
                              : 'bg-[#18212e] text-stone-500 border border-white/8 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        'Équipé'
                      ) : owned ? (
                        'Équiper'
                      ) : (
                        <>
                          <span>Acheter</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{skin.price}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: 3D PIPE ARCHITECTURAL THEMES */}
          {activeTab === 'pipes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIPE_THEMES.map((theme) => {
                const owned = profile.ownedPipeThemes.includes(theme.id);
                const equipped = profile.equippedPipeTheme === theme.id;
                const affordable = profile.coins >= theme.price;

                return (
                  <div
                    key={theme.id}
                    className={`rounded-lg p-4 border transition-colors flex flex-col justify-between gap-3 ${
                      equipped
                        ? 'bg-[#172334] border-amber-400/60'
                        : 'bg-[#131c29] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-6 h-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: theme.swatchPrimary }}
                            aria-hidden="true"
                          />
                          <span
                            className="w-2.5 h-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: theme.swatchAccent }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-stone-400">
                          {equipped ? 'Actif' : owned ? 'Possédé' : `${theme.price} Plumes`}
                        </span>
                      </div>
                      <h3 className="mt-2.5 font-display text-base font-bold text-white">
                        {theme.name}
                      </h3>
                      <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                        {theme.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!owned && !affordable}
                      onClick={() => onBuyOrEquipPipe(theme.id)}
                      className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        equipped
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 cursor-default'
                          : owned
                            ? 'bg-[#1e2d42] hover:bg-[#293c57] text-white cursor-pointer'
                            : affordable
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold cursor-pointer'
                              : 'bg-[#18212e] text-stone-500 border border-white/8 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        'Équipé'
                      ) : owned ? (
                        'Équiper'
                      ) : (
                        <>
                          <span>Acheter</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{theme.price}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: LIVE PARTICLE TRAILS */}
          {activeTab === 'trails' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRAIL_FX.map((fx) => {
                const owned = profile.ownedTrails.includes(fx.id);
                const equipped = profile.equippedTrail === fx.id;
                const affordable = profile.coins >= fx.price;

                return (
                  <div
                    key={fx.id}
                    className={`rounded-lg p-4 border transition-colors flex flex-col justify-between gap-3 ${
                      equipped
                        ? 'bg-[#172334] border-amber-400/60'
                        : 'bg-[#131c29] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/25"
                            style={{ backgroundColor: fx.swatchPrimary }}
                            aria-hidden="true"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-white/25"
                            style={{ backgroundColor: fx.swatchAccent }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-stone-400">
                          {equipped ? 'Actif' : owned ? 'Possédé' : `${fx.price} Plumes`}
                        </span>
                      </div>
                      <h3 className="mt-2.5 font-display text-base font-bold text-white">
                        {fx.name}
                      </h3>
                      <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                        {fx.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!owned && !affordable}
                      onClick={() => onBuyOrEquipTrail(fx.id)}
                      className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        equipped
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 cursor-default'
                          : owned
                            ? 'bg-[#1e2d42] hover:bg-[#293c57] text-white cursor-pointer'
                            : affordable
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold cursor-pointer'
                              : 'bg-[#18212e] text-stone-500 border border-white/8 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        'Équipé'
                      ) : owned ? (
                        'Équiper'
                      ) : (
                        <>
                          <span>Acheter</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{fx.price}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: FLIGHT UPGRADES & CONSUMABLE SHIELD */}
          {activeTab === 'upgrades' && (
            <div className="space-y-3">
              {UPGRADES.map((up) => {
                const isShield = up.id === 'shield';
                const currentLevel = up.id === 'shield' ? profile.shields : profile.upgrades[up.id];
                const isMax = currentLevel >= up.maxLevel;
                const price = isMax ? 0 : isShield ? SHIELD_PRICE : up.prices[currentLevel];
                const affordable = !isMax && profile.coins >= price;

                return (
                  <div
                    key={up.id}
                    className="rounded-lg p-4 bg-[#131c29] border border-white/10 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {isShield && <ShieldBadgeIcon className="w-4 h-4 text-sky-400" />}
                          <h3 className="font-display text-base font-bold text-white">
                            {up.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                          {up.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!affordable}
                        onClick={() => onBuyUpgrade(up.id)}
                        className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isMax
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 cursor-default'
                            : affordable
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold cursor-pointer'
                              : 'bg-[#18212e] text-stone-500 border border-white/8 cursor-not-allowed'
                        }`}
                      >
                        {isMax
                          ? isShield
                            ? 'Stock max'
                            : 'Niveau max'
                          : `${isShield ? 'Acheter' : 'Améliorer'} · ${price}`}
                      </button>
                    </div>

                    {/* Level segments & live effect readout */}
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex items-center gap-1.5 flex-1">
                        {Array.from({ length: up.maxLevel }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 flex-1 rounded-full ${
                              idx < currentLevel
                                ? isShield
                                  ? 'bg-sky-400'
                                  : 'bg-amber-400'
                                : 'bg-white/12'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono-tabular text-stone-300 shrink-0">
                        {up.effectSummary(currentLevel)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: MISSIONS & CAREER STATS */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {MISSIONS.map((m) => {
                  const raw = m.progress(profile);
                  const current = Math.min(raw, m.target);
                  const pct = Math.round((current / m.target) * 100);
                  const claimed = profile.claimedMissions.includes(m.id);
                  const ready = !claimed && current >= m.target;

                  return (
                    <div
                      key={m.id}
                      className={`rounded-lg p-4 border ${
                        ready
                          ? 'bg-[#182536] border-amber-400/50'
                          : 'bg-[#131c29] border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-sm font-bold text-white">
                            {m.title}
                          </h3>
                          <p className="text-xs text-stone-400 mt-0.5">{m.description}</p>
                        </div>

                        {claimed ? (
                          <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">
                            Récupérée
                          </span>
                        ) : ready ? (
                          <button
                            type="button"
                            onClick={() => onClaimMission(m.id)}
                            className="px-3.5 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Réclamer +{m.reward}
                          </button>
                        ) : (
                          <span className="text-xs font-mono-tabular text-amber-300/90 whitespace-nowrap">
                            +{m.reward} Plumes
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              claimed || ready ? 'bg-emerald-400' : 'bg-amber-400/80'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono-tabular text-stone-300 shrink-0">
                          {current} / {m.target}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Career Statistics Summary */}
              <div className="pt-3 border-t border-white/10">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Statistiques de Carrière
                </h3>
                <div className="grid grid-cols-3 gap-3 text-left">
                  <div className="rounded-lg bg-[#131c29] border border-white/8 p-3">
                    <div className="text-[11px] text-stone-400">Vols joués</div>
                    <div className="mt-1 font-display text-xl font-bold text-white tabular-nums">
                      {profile.stats.totalRuns}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#131c29] border border-white/8 p-3">
                    <div className="text-[11px] text-stone-400">Conduits</div>
                    <div className="mt-1 font-display text-xl font-bold text-white tabular-nums">
                      {profile.stats.totalPipes}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#131c29] border border-white/8 p-3">
                    <div className="text-[11px] text-stone-400">Distance</div>
                    <div className="mt-1 font-display text-xl font-bold text-white tabular-nums">
                      {profile.stats.totalDistance} m
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-stone-400">
                  <span>Boucliers en réserve : <strong className="font-mono-tabular text-sky-300">{profile.shields} / {MAX_SHIELD_STOCK}</strong></span>
                  <span>Skins débloqués : <strong className="font-mono-tabular text-stone-200">{profile.ownedSkins.length} / {BIRD_SKINS.length}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
