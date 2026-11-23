import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { ShopDrawer, type ShopTab } from './components/ShopDrawer';
import {
  applyRunCompletion,
  buyOrEquipPipeTheme,
  buyOrEquipSkin,
  buyOrEquipTrail,
  buyUpgrade,
  claimDailyReward,
  claimMission,
  getPipeThemeDef,
  getSkinDef,
  getTrailFxDef,
  loadProfile,
  saveProfile,
} from './game/shop';
import type {
  AtmospherePreset,
  BirdSkinId,
  CameraMode,
  HudSnapshot,
  PipeThemeId,
  PlayerProfile,
  RunSummary,
  TrailFxId,
  UpgradeId,
} from './game/types';
import { mountFlappyScene, type FlappyController } from './three/FlappyScene';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  score: 0,
  bestScore: 0,
  runCoins: 0,
  streak: 0,
  ringsCollected: 0,
  speedKmh: 38,
  altitudeMeters: 15,
  shieldActive: false,
  atmosphere: 'golden',
  cameraMode: 'cinematic',
  muted: false,
  awaitingFirstFlap: false,
  summary: null,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<FlappyController | null>(null);

  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const profileRef = useRef<PlayerProfile>(profile);
  profileRef.current = profile;

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    bestScore: profile.bestScore,
  }));
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<ShopTab>('birds');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const shopOpenRef = useRef(shopOpen);
  shopOpenRef.current = shopOpen;

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setFeedbackToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setFeedbackToast(null), 3200);
  }, []);

  const commitProfile = useCallback((next: PlayerProfile) => {
    profileRef.current = next;
    setProfile(next);
    saveProfile(next);
    controllerRef.current?.syncProfileAppearance(next);
  }, []);

  const handleRunComplete = useCallback(
    (summary: RunSummary, shieldConsumed: boolean) => {
      const updated = applyRunCompletion(profileRef.current, summary, shieldConsumed);
      commitProfile(updated);
    },
    [commitProfile]
  );

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    let ctrl: FlappyController | null = null;
    try {
      ctrl = mountFlappyScene(container, profileRef.current, setHud, handleRunComplete, autostart);
      controllerRef.current = ctrl;
    } catch {
      setWebglError('WebGL2 est requis pour afficher le rendu 3D ultra-réaliste.');
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const activeCtrl = controllerRef.current;
      if (!activeCtrl) return;

      const phase = activeCtrl.getPhase();

      if (shopOpenRef.current) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setShopOpen(false);
          activeCtrl.setShopPreviewMode(false);
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (phase === 'title' || phase === 'gameover') {
          activeCtrl.start(profileRef.current);
        } else if (phase === 'playing') {
          activeCtrl.flap();
        }
        return;
      }

      if (e.code === 'Enter') {
        if (phase === 'title' || phase === 'gameover') {
          e.preventDefault();
          activeCtrl.start(profileRef.current);
        }
        return;
      }

      if (e.code === 'KeyB') {
        if (phase === 'title' || phase === 'gameover') {
          e.preventDefault();
          setShopTab('birds');
          setShopOpen(true);
          activeCtrl.setShopPreviewMode(true);
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (phase === 'playing' || phase === 'paused') {
          e.preventDefault();
          activeCtrl.togglePause();
        }
        return;
      }

      if (e.code === 'KeyR') {
        if (phase === 'playing' || phase === 'paused' || phase === 'gameover') {
          e.preventDefault();
          activeCtrl.start(profileRef.current);
        }
        return;
      }

      if (e.code === 'KeyC') {
        activeCtrl.toggleCameraMode();
        return;
      }

      if (e.code === 'KeyT') {
        activeCtrl.cycleAtmosphere();
        return;
      }

      if (e.code === 'KeyM') {
        activeCtrl.toggleMute();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (shopOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, [role="dialog"], aside')) return;
      if (e.button !== 0) return;
      const activeCtrl = controllerRef.current;
      if (!activeCtrl) return;
      if (activeCtrl.getPhase() === 'playing') {
        activeCtrl.flap();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    container.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('pointerdown', onPointerDown);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      ctrl?.dispose();
      controllerRef.current = null;
    };
  }, [handleRunComplete]);

  const handleStart = useCallback(() => {
    setShopOpen(false);
    controllerRef.current?.setShopPreviewMode(false);
    controllerRef.current?.start(profileRef.current);
  }, []);

  const handleOpenShop = useCallback((tab: ShopTab) => {
    setShopTab(tab);
    setShopOpen(true);
    controllerRef.current?.setShopPreviewMode(true);
  }, []);

  const handleCloseShop = useCallback(() => {
    setShopOpen(false);
    controllerRef.current?.setShopPreviewMode(false);
  }, []);

  const handleBuyOrEquipSkin = useCallback(
    (id: BirdSkinId) => {
      const res = buyOrEquipSkin(profileRef.current, id);
      if (!res.ok) return;
      commitProfile(res.profile);
      const skin = getSkinDef(id);
      if (res.bought) {
        controllerRef.current?.playShopSound('purchase');
        showToast(`${skin.name} débloqué et équipé.`);
      } else {
        controllerRef.current?.playShopSound('equip');
        showToast(`${skin.name} équipé.`);
      }
    },
    [commitProfile, showToast]
  );

  const handleBuyOrEquipPipe = useCallback(
    (id: PipeThemeId) => {
      const res = buyOrEquipPipeTheme(profileRef.current, id);
      if (!res.ok) return;
      commitProfile(res.profile);
      const theme = getPipeThemeDef(id);
      if (res.bought) {
        controllerRef.current?.playShopSound('purchase');
        showToast(`Conduits ${theme.name} débloqués et appliqués.`);
      } else {
        controllerRef.current?.playShopSound('equip');
        showToast(`Conduits ${theme.name} appliqués.`);
      }
    },
    [commitProfile, showToast]
  );

  const handleBuyOrEquipTrail = useCallback(
    (id: TrailFxId) => {
      const res = buyOrEquipTrail(profileRef.current, id);
      if (!res.ok) return;
      commitProfile(res.profile);
      const fx = getTrailFxDef(id);
      if (res.bought) {
        controllerRef.current?.playShopSound('purchase');
        showToast(`Traînée ${fx.name} débloquée et activée.`);
      } else {
        controllerRef.current?.playShopSound('equip');
        showToast(`Traînée ${fx.name} activée.`);
      }
    },
    [commitProfile, showToast]
  );

  const handleBuyUpgrade = useCallback(
    (id: UpgradeId) => {
      const res = buyUpgrade(profileRef.current, id);
      if (!res.ok) return;
      commitProfile(res.profile);
      controllerRef.current?.playShopSound('purchase');
      if (id === 'shield') {
        showToast(`Bouclier Aérien ajouté au stock (${res.profile.shields} prêt).`);
      } else {
        showToast('Amélioration de vol installée.');
      }
    },
    [commitProfile, showToast]
  );

  const handleClaimDaily = useCallback(() => {
    const res = claimDailyReward(profileRef.current);
    if (!res.ok) return;
    commitProfile(res.profile);
    controllerRef.current?.playShopSound('purchase');
    showToast(`Coffre quotidien ouvert : +${res.reward} Plumes d’Or.`);
  }, [commitProfile, showToast]);

  const handleClaimMission = useCallback(
    (missionId: string) => {
      const res = claimMission(profileRef.current, missionId);
      if (!res.ok) return;
      commitProfile(res.profile);
      controllerRef.current?.playShopSound('purchase');
      showToast(`Mission validée : +${res.reward} Plumes d’Or.`);
    },
    [commitProfile, showToast]
  );

  const handleTogglePause = useCallback(() => controllerRef.current?.togglePause(), []);
  const handleReturnTitle = useCallback(() => {
    setShopOpen(false);
    controllerRef.current?.setShopPreviewMode(false);
    controllerRef.current?.goTitle();
  }, []);
  const handleSetAtmosphere = useCallback(
    (preset: AtmospherePreset) => controllerRef.current?.setAtmosphere(preset),
    []
  );
  const handleCycleAtmosphere = useCallback(() => controllerRef.current?.cycleAtmosphere(), []);
  const handleSetCameraMode = useCallback(
    (mode: CameraMode) => controllerRef.current?.setCameraMode(mode),
    []
  );
  const handleToggleCameraMode = useCallback(() => controllerRef.current?.toggleCameraMode(), []);
  const handleToggleMute = useCallback(() => controllerRef.current?.toggleMute(), []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0d131a]">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={canvasMountRef}
        className="w-full h-full cursor-pointer"
        aria-label="Scène 3D Flappy Bird"
      />

      {webglError ? (
        <div className="fixed inset-0 flex items-center justify-center p-8 bg-[#0d131a] text-stone-100">
          <div className="max-w-md rounded-xl bg-[#15202e] border border-white/15 p-6 text-center">
            <h1 className="font-display text-2xl font-bold">Rendu 3D indisponible</h1>
            <p className="mt-2 text-sm text-stone-300">{webglError}</p>
          </div>
        </div>
      ) : (
        <>
          <GameHud
            hud={hud}
            profile={profile}
            shopOpen={shopOpen}
            onStart={handleStart}
            onOpenShop={handleOpenShop}
            onTogglePause={handleTogglePause}
            onReturnTitle={handleReturnTitle}
            onSetAtmosphere={handleSetAtmosphere}
            onCycleAtmosphere={handleCycleAtmosphere}
            onSetCameraMode={handleSetCameraMode}
            onToggleCameraMode={handleToggleCameraMode}
            onToggleMute={handleToggleMute}
          />
          <ShopDrawer
            open={shopOpen}
            initialTab={shopTab}
            profile={profile}
            feedbackToast={feedbackToast}
            onClose={handleCloseShop}
            onBuyOrEquipSkin={handleBuyOrEquipSkin}
            onBuyOrEquipPipe={handleBuyOrEquipPipe}
            onBuyOrEquipTrail={handleBuyOrEquipTrail}
            onBuyUpgrade={handleBuyUpgrade}
            onClaimDaily={handleClaimDaily}
            onClaimMission={handleClaimMission}
          />
        </>
      )}
    </main>
  );
}
