'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-500 font-mono text-xs">
      <div className="flex flex-col items-center gap-2.5">
        <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="tracking-wide text-slate-600">Initializing Aquatic Environment...</p>
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
  const [showControlsHint, setShowControlsHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsHint(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <main className="w-screen h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p>Loading Sanctuary...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* 3D WebGL Scene Viewport */}
      <AquariumViewport />

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

      {/* Controls Guidance Badge */}
      {showControlsHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-1000">
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-medium text-slate-600 shadow-sm text-center whitespace-nowrap">
            Left Click Drag: Orbit Camera · Scroll: Zoom · Click Water: Drop Flakes · Click Fish: Inspect
          </div>
        </div>
      )}
    </main>
  );
}
