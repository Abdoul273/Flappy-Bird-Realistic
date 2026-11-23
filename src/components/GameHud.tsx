import React from 'react';
import { countUnclaimedRewards } from '../game/shop';
import type { AtmospherePreset, CameraMode, HudSnapshot, MedalTier, PlayerProfile } from '../game/types';
import { PlumeCoinIcon, type ShopTab } from './ShopDrawer';

interface GameHudProps {
  hud: HudSnapshot;
  profile: PlayerProfile;
  shopOpen: boolean;
  onStart: () => void;
  onOpenShop: (tab: ShopTab) => void;
  onTogglePause: () => void;
  onReturnTitle: () => void;
  onSetAtmosphere: (preset: AtmospherePreset) => void;
  onCycleAtmosphere: () => void;
  onSetCameraMode: (mode: CameraMode) => void;
  onToggleCameraMode: () => void;
  onToggleMute: () => void;
}

const ATMOSPHERE_LABELS: Record<AtmospherePreset, string> = {
  golden: 'Aube Dorée',
  daylight: 'Midi Azur',
  dusk: 'Crépuscule',
};

const MEDAL_META: Record<MedalTier, { label: string; fill: string; stroke: string; text: string }> = {
  none: { label: 'Apprenti', fill: '#334155', stroke: '#64748b', text: '#cbd5e1' },
  bronze: { label: 'Médaille de Bronze', fill: '#a96234', stroke: '#e6a26d', text: '#fde2c8' },
  silver: { label: 'Médaille d’Argent', fill: '#8e9cad', stroke: '#e2e8f0', text: '#f8fafc' },
  gold: { label: 'Médaille d’Or', fill: '#d69e2e', stroke: '#fde047', text: '#fef9c3' },
  platinum: { label: 'Médaille de Platine', fill: '#38bdf8', stroke: '#e0f2fe', text: '#f0f9ff' },
};

function WingCrestEmblem() {
  return (
    <svg viewBox="0 0 88 54" className="w-16 h-10 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="wingGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde073" />
          <stop offset="55%" stopColor="#e59a28" />
          <stop offset="100%" stopColor="#b96314" />
        </linearGradient>
      </defs>
      <path
        d="M8 38 C16 18, 38 6, 80 8 C68 18, 56 22, 46 24 C58 24, 68 23, 74 21 C62 30, 50 33, 38 34 C48 35, 56 35, 62 33 C48 43, 30 47, 14 45 Z"
        fill="url(#wingGold)"
        stroke="#161b22"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M22 39 C34 34, 52 29, 72 23 C62 31, 46 37, 26 42 Z"
        fill="#1e627e"
        opacity="0.88"
      />
      <path
        d="M16 34 C28 22, 48 14, 72 11"
        fill="none"
        stroke="#fff6d6"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

function MedalEmblem({ tier }: { tier: MedalTier }) {
  const m = MEDAL_META[tier];
  return (
    <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0" aria-hidden="true">
      <polygon points="15,4 22,16 14,18 9,6" fill="#1e627e" stroke="#0d131a" strokeWidth="1.5" />
      <polygon points="29,4 22,16 30,18 35,6" fill="#237a4e" stroke="#0d131a" strokeWidth="1.5" />
      <circle cx="22" cy="26" r="14" fill={m.fill} stroke={m.stroke} strokeWidth="2.4" />
      <circle cx="22" cy="26" r="10.2" fill="none" stroke="rgba(10,15,22,0.45)" strokeWidth="1.4" />
      <polygon
        points="22,18.5 24.3,23.2 29.5,24 25.7,27.6 26.6,32.7 22,30.2 17.4,32.7 18.3,27.6 14.5,24 19.7,23.2"
        fill={m.stroke}
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <line x1="8" y1="5" x2="8" y2="19" />
      <line x1="16" y1="5" x2="16" y2="19" />
    </svg>
  );
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  profile,
  shopOpen,
  onStart,
  onOpenShop,
  onTogglePause,
  onReturnTitle,
  onSetAtmosphere,
  onCycleAtmosphere,
  onSetCameraMode,
  onToggleCameraMode,
  onToggleMute,
}) => {
  const isPlaying = hud.phase === 'playing' || hud.phase === 'dying';
  const unclaimedCount = countUnclaimedRewards(profile);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
      {/* TITLE SCREEN OVERLAY — Hidden when ShopDrawer is open so live 3D bird preview is clean */}
      {hud.phase === 'title' && !shopOpen && (
        <div
          className="fixed inset-0 flex flex-col justify-between p-8 md:p-12 pointer-events-none"
          style={{
            background:
              'linear-gradient(95deg, rgba(9, 14, 22, 0.78) 0%, rgba(9, 14, 22, 0.44) 38%, rgba(9, 14, 22, 0.0) 68%)',
          }}
        >
          {/* Top-left record & Plumes d'Or balance */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-stone-100/95 tracking-wide hud-title-shadow flex items-center gap-3">
              <span>Vol Réaliste 3D</span>
              <span aria-hidden="true" className="text-amber-300/80">·</span>
              <span className="font-mono-tabular">Record {profile.bestScore}</span>
              <span aria-hidden="true" className="text-amber-300/80">·</span>
              <span className="inline-flex items-center gap-1.5 font-mono-tabular text-amber-300 font-bold" data-testid="title-coins">
                <PlumeCoinIcon className="w-4 h-4" />
                {profile.coins} Plumes
              </span>
              {profile.shields > 0 && (
                <>
                  <span aria-hidden="true" className="text-amber-300/80">·</span>
                  <span className="font-mono-tabular text-sky-300">Boucliers {profile.shields}</span>
                </>
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={hud.muted ? 'Activer le son' : 'Couper le son'}
                className="w-10 h-10 rounded-lg bg-[#0e151f]/80 border border-amber-200/20 text-stone-100 hover:bg-[#192434] hover:border-amber-300/45 transition-colors flex items-center justify-center cursor-pointer"
              >
                <SoundIcon muted={hud.muted} />
              </button>
            </div>
          </div>

          {/* Left-third Title Lockup & Menu Actions */}
          <div className="max-w-lg pointer-events-auto">
            <div className="flex items-center gap-3.5 mb-3">
              <WingCrestEmblem />
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-amber-200 hud-title-shadow">
                Édition PC
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.02] hud-title-shadow">
              FLAPPY 3D
            </h1>
            <p className="mt-3 text-base text-stone-100/90 leading-relaxed max-w-sm hud-title-shadow">
              Traversez la vallée alpine entre les conduits émaillés, récoltez des Plumes d’Or et débloquez oiseaux, améliorations et boucliers.
            </p>

            {/* Primary CTA + Boutique + Missions (3 clean menu actions) */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-start="true"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStart();
                }}
                className="px-8 py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-display font-bold text-lg tracking-wide shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Jouer
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenShop('birds');
                }}
                className="px-5 py-3.5 rounded-lg bg-[#0e151f]/86 hover:bg-[#182435] border border-amber-300/35 text-amber-200 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
              >
                <span>Boutique</span>
                {unclaimedCount > 0 && (
                  <span className="font-mono-tabular text-xs text-amber-300">+{unclaimedCount}</span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenShop('missions');
                }}
                className="px-4 py-3.5 rounded-lg bg-[#0e151f]/82 hover:bg-[#182332] border border-white/16 text-stone-100 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Missions
              </button>
            </div>

            {/* Atmosphere & Camera quick selectors */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#0d141e]/82 border border-white/12">
                {(['golden', 'daylight', 'dusk'] as AtmospherePreset[]).map((preset) => {
                  const active = hud.atmosphere === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSetAtmosphere(preset);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-amber-400/95 text-slate-950'
                          : 'text-stone-200/85 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {ATMOSPHERE_LABELS[preset]}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleCameraMode();
                }}
                className="px-3.5 py-2 rounded-lg bg-[#0d141e]/82 hover:bg-[#182332] border border-white/12 text-stone-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Caméra : {hud.cameraMode === 'cinematic' ? '3/4 Cinématique' : 'Poursuite 3D'}
              </button>
            </div>
          </div>

          {/* Flat borderless bottom control hint */}
          <div className="text-xs font-medium text-stone-100/85 tracking-wide hud-title-shadow">
            Espace ou Clic : Battre des ailes · B : Boutique · C : Caméra · T : Météo · P : Pause · M : Son
          </div>
        </div>
      )}

      {/* ACTIVE PLAYING HUD — >= 88% unobstructed viewport */}
      {isPlaying && (
        <>
          <div className="w-full px-6 pt-5 flex items-start justify-between">
            {/* Top-left compact live flight telemetry + Plumes + Shield */}
            <div className="bg-[#0d141e]/74 border border-amber-200/18 rounded-lg px-4 py-2.5 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3 text-xs text-stone-200/95 font-medium">
                <span>Record <strong className="font-mono-tabular text-amber-300">{hud.bestScore}</strong></span>
                <span aria-hidden="true" className="text-stone-400">·</span>
                <span className="inline-flex items-center gap-1 font-mono-tabular text-amber-300 font-bold">
                  <PlumeCoinIcon className="w-3.5 h-3.5" />
                  {profile.coins + hud.runCoins}
                </span>
                <span aria-hidden="true" className="text-stone-400">·</span>
                <span className="font-mono-tabular">{hud.speedKmh} km/h</span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-stone-300 font-medium">
                <span className="font-mono-tabular">Alt. {hud.altitudeMeters} m</span>
                {hud.shieldActive && (
                  <>
                    <span aria-hidden="true" className="text-stone-500">·</span>
                    <span className="text-sky-300 font-semibold">Bouclier actif</span>
                  </>
                )}
                {hud.runCoins > 0 && (
                  <>
                    <span aria-hidden="true" className="text-stone-500">·</span>
                    <span className="font-mono-tabular text-amber-200">+{hud.runCoins} vol</span>
                  </>
                )}
              </div>
            </div>

            {/* Top-center heroic score display */}
            <div className="flex flex-col items-center">
              <div
                aria-label={`Score ${hud.score}`}
                data-testid="hud-score"
                className="font-display text-6xl font-extrabold text-white tabular-nums leading-none hud-score-stroke"
              >
                {hud.score}
              </div>
              {hud.streak >= 2 && (
                <div className="mt-1 text-xs font-bold tracking-wider uppercase text-amber-300 hud-title-shadow">
                  Série parfaite ×{hud.streak}
                </div>
              )}
            </div>

            {/* Top-right compact square utility icon buttons */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleCameraMode();
                }}
                aria-label="Changer de caméra"
                title="Caméra (C)"
                className="w-10 h-10 rounded-lg bg-[#0d141e]/78 border border-white/16 text-stone-100 hover:bg-[#192636] hover:border-amber-300/45 transition-colors flex items-center justify-center cursor-pointer"
              >
                <CameraIcon />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onCycleAtmosphere();
                }}
                aria-label="Changer l’ambiance lumineuse"
                title="Météo (T)"
                className="w-10 h-10 rounded-lg bg-[#0d141e]/78 border border-white/16 text-stone-100 hover:bg-[#192636] hover:border-amber-300/45 transition-colors flex items-center justify-center cursor-pointer"
              >
                <SunIcon />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={hud.muted ? 'Activer le son' : 'Couper le son'}
                title="Son (M)"
                className="w-10 h-10 rounded-lg bg-[#0d141e]/78 border border-white/16 text-stone-100 hover:bg-[#192636] hover:border-amber-300/45 transition-colors flex items-center justify-center cursor-pointer"
              >
                <SoundIcon muted={hud.muted} />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTogglePause();
                }}
                aria-label="Mettre en pause"
                title="Pause (P)"
                className="w-10 h-10 rounded-lg bg-[#0d141e]/78 border border-white/16 text-stone-100 hover:bg-[#192636] hover:border-amber-300/45 transition-colors flex items-center justify-center cursor-pointer"
              >
                <PauseIcon />
              </button>
            </div>
          </div>

          <div className="pb-6 flex justify-center">
            {hud.awaitingFirstFlap && (
              <div className="px-5 py-2 rounded-lg bg-[#0d141e]/78 border border-amber-300/30 text-sm font-semibold text-amber-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                Appuyez sur Espace ou cliquez pour battre des ailes
              </div>
            )}
          </div>
        </>
      )}

      {/* PAUSE MODAL */}
      {hud.phase === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="fixed inset-0 bg-[#080d14]/65 flex items-center justify-center p-6 pointer-events-auto"
        >
          <div className="w-full max-w-sm rounded-xl bg-[#101823] border border-amber-200/20 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
            <h2 id="pause-title" className="font-display text-3xl font-bold text-white tracking-tight">
              Pause
            </h2>
            <p className="mt-1 text-sm text-stone-300">
              Score : <span className="font-mono-tabular font-bold text-amber-300">{hud.score}</span> · Record : <span className="font-mono-tabular text-stone-100">{hud.bestScore}</span>
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <div className="text-xs font-semibold text-stone-400 mb-1.5">Ambiance</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['golden', 'daylight', 'dusk'] as AtmospherePreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onSetAtmosphere(preset)}
                      className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        hud.atmosphere === preset
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-[#1a2534] text-stone-200 hover:bg-[#233145]'
                      }`}
                    >
                      {ATMOSPHERE_LABELS[preset]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-stone-400 mb-1.5">Caméra</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSetCameraMode('cinematic')}
                    className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      hud.cameraMode === 'cinematic'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#1a2534] text-stone-200 hover:bg-[#233145]'
                    }`}
                  >
                    3/4 Cinématique
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetCameraMode('chase')}
                    className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      hud.cameraMode === 'chase'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#1a2534] text-stone-200 hover:bg-[#233145]'
                    }`}
                  >
                    Poursuite 3D
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer"
              >
                Reprendre
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onStart}
                  className="py-2.5 rounded-lg bg-[#1a2534] hover:bg-[#243347] border border-white/10 text-stone-100 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Recommencer
                </button>
                <button
                  type="button"
                  onClick={onReturnTitle}
                  className="py-2.5 rounded-lg bg-[#1a2534] hover:bg-[#243347] border border-white/10 text-stone-100 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL — Hidden when ShopDrawer is opened from Game Over */}
      {hud.phase === 'gameover' && hud.summary && !shopOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-title"
          className="fixed inset-0 bg-[#080d14]/68 flex items-center justify-center p-6 pointer-events-auto"
        >
          <div className="w-full max-w-md rounded-xl bg-[#101823] border border-amber-200/22 p-7 shadow-[0_28px_70px_rgba(0,0,0,0.72)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="gameover-title" className="font-display text-3xl font-extrabold text-white tracking-tight">
                  Fin du Vol
                </h2>
                <p className="mt-1 text-sm text-stone-300">
                  {hud.summary.isNewRecord
                    ? 'Nouveau record personnel établi.'
                    : hud.summary.cause === 'water'
                      ? 'Amerrissage dans la rivière alpine.'
                      : 'Collision avec un conduit émaillé.'}
                </p>
              </div>
              <MedalEmblem tier={hud.summary.medal} />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-200/95">{MEDAL_META[hud.summary.medal].label}</span>
              <span className="inline-flex items-center gap-1.5 font-mono-tabular text-amber-300">
                <PlumeCoinIcon className="w-4 h-4" />
                +{hud.summary.coinsEarned} Plumes gagnées
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-y border-white/10 py-4">
              <div>
                <div className="text-xs text-stone-400">Score</div>
                <div className="mt-1 font-display text-3xl font-extrabold text-white tabular-nums">
                  {hud.summary.score}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Record</div>
                <div className="mt-1 font-display text-3xl font-extrabold text-amber-300 tabular-nums">
                  {hud.summary.bestScore}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Distance</div>
                <div className="mt-1 font-display text-2xl font-bold text-stone-100 tabular-nums pt-1">
                  {hud.summary.distanceMeters} m
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-stone-300">
              <span>Conduits : <strong className="font-mono-tabular text-white">{hud.summary.pipesCleared}</strong> · Anneaux : <strong className="font-mono-tabular text-amber-300">{hud.summary.ringsCollected}</strong></span>
              <span className="font-mono-tabular text-amber-300 font-semibold">Solde : {profile.coins}</span>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStart();
                }}
                className="flex-1 py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
              >
                Rejouer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenShop('birds');
                }}
                className="px-4 py-3.5 rounded-lg bg-[#1a2534] hover:bg-[#243347] border border-amber-300/30 text-amber-200 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Boutique
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onReturnTitle();
                }}
                className="px-4 py-3.5 rounded-lg bg-[#1a2534] hover:bg-[#243347] border border-white/10 text-stone-100 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
