'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Eye, EyeOff } from 'lucide-react';
import { useGameStore } from '@/lib/gameStore';
import TopBar from '@/components/ui/TopBar';
import RightNav from '@/components/ui/RightNav';
import BottomActionBar from '@/components/ui/BottomActionBar';
import ShopModal from '@/components/ui/ShopModal';
import BreedingLabDrawer from '@/components/ui/BreedingLabDrawer';
import CollectionModal from '@/components/ui/CollectionModal';
import DecorationsModal from '@/components/ui/DecorationsModal';
import TerrariumDrawer from '@/components/ui/TerrariumDrawer';
import UpgradesModal from '@/components/ui/UpgradesModal';
import OfflineReportModal from '@/components/ui/OfflineReportModal';
import NotificationToast from '@/components/ui/NotificationToast';

// Dynamically import 3D viewport to ensure pure client-side WebGL lifecycle
const AquariumViewport = dynamic(() => import('@/components/3d/AquariumViewport'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-600 font-mono text-xs">
      <div className="flex flex-col items-center gap-2.5">
        <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="tracking-wide text-stone-600">Initializing Desktop Sanctuary...</p>
      </div>
    </div>
  ),
});

const emptySubscribe = () => () => {};

export default function HomePage() {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const immersiveMode = useGameStore((state) => state.immersiveMode);
  const toggleImmersiveMode = useGameStore((state) => state.toggleImmersiveMode);
  const [showControlsHint, setShowControlsHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsHint(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <main className="w-screen h-screen bg-stone-50 flex items-center justify-center text-stone-600 font-mono text-xs">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p>Loading Sanctuary...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-50 text-slate-900 select-none">
      {/* 3D WebGL Scene Viewport: Cozy Office Desk & Aquarium */}
      <AquariumViewport />

      {/* Discreet Eye Button: Immersive View Mode Toggle (Always Visible in Corner) */}
      <div className="fixed top-3.5 right-3.5 sm:top-4 sm:right-5 z-50 pointer-events-auto">
        <button
          onClick={toggleImmersiveMode}
          className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
            immersiveMode
              ? 'bg-white/90 hover:bg-white text-slate-800 border-slate-300 ring-2 ring-blue-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
          title={immersiveMode ? 'Exit Immersive View' : 'Enter Immersive View'}
          aria-label={immersiveMode ? 'Exit Immersive View' : 'Enter Immersive View'}
        >
          {immersiveMode ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Normal Management UI (Completely Hidden During Immersive Mode) */}
      {!immersiveMode && (
        <>
          {/* Top Minimalist HUD */}
          <TopBar />

          {/* Right Navigation Dock */}
          <RightNav />

          {/* Bottom Contextual Action Bar */}
          <BottomActionBar />

          {/* Systems Modals & Drawers */}
          <ShopModal />
          <BreedingLabDrawer />
          <CollectionModal />
          <DecorationsModal />
          <TerrariumDrawer />
          <UpgradesModal />
          <OfflineReportModal />
          <NotificationToast />

          {/* Subtle Initial Comfort Hint */}
          {showControlsHint && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-1000">
              <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-medium text-slate-600 shadow-sm text-center whitespace-nowrap">
                Stationary Camera · Automatic Feeding · Passive Income · Click Fish to Inspect
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
