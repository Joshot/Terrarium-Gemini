'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import {
  Utensils,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Heart,
  Battery,
} from 'lucide-react';

export default function BottomActionBar() {
  const [collapsed, setCollapsed] = useState(false);

  const activeAquariumId = useGameStore((state) => state.activeAquariumId);
  const aquariums = useGameStore((state) => state.aquariums);
  const selectedFishId = useGameStore((state) => state.selectedFishId);
  const setSelectedFishId = useGameStore((state) => state.setSelectedFishId);
  const fishList = useGameStore((state) => state.fish);
  const feedFishInAquarium = useGameStore((state) => state.feedFishInAquarium);
  const sellFish = useGameStore((state) => state.sellFish);
  const moveFishToAquarium = useGameStore((state) => state.moveFishToAquarium);
  const breedingJob = useGameStore((state) => state.breedingJob);
  const collectBreedingOffspring = useGameStore((state) => state.collectBreedingOffspring);
  const setActiveView = useGameStore((state) => state.setActiveView);

  const selectedFish = fishList.find((f) => f.id === selectedFishId);
  const isBreedingReady = breedingJob?.completed;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none select-none">
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          title={collapsed ? 'Show Action Dock' : 'Hide Action Dock'}
          aria-label={collapsed ? 'Show Action Dock' : 'Hide Action Dock'}
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show Controls
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Hide Controls
            </>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="pointer-events-auto bg-white border border-slate-200 rounded-2xl p-3 shadow-md">
          {/* 1. Context: Offspring Ready to Collect */}
          {isBreedingReady && (
            <div className="mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Breeding Complete!</p>
                  <p className="text-[11px] text-amber-700">New offspring awaits in the incubation jar.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveView('breeding');
                  collectBreedingOffspring();
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                Collect Offspring
              </button>
            </div>
          )}

          {/* 2. Context: Selected Fish Details */}
          {selectedFish ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Fish Identity & Stats */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0"
                  style={{
                    backgroundColor: `${selectedFish.traits.baseColor}15`,
                    borderColor: selectedFish.traits.baseColor,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedFish.traits.baseColor }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{selectedFish.name}</h3>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedFish.rarity}
                    </span>
                  </div>

                  {/* Status Gauges: Hunger, Happiness, Health */}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1" title="Hunger Level">
                      <Battery className="w-3 h-3 text-amber-500" />
                      <span>{Math.round(selectedFish.hunger)}%</span>
                    </div>
                    <div className="flex items-center gap-1" title="Happiness Level">
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>{Math.round(selectedFish.happiness)}%</span>
                    </div>
                    <div className="flex items-center gap-1" title="Life Stage">
                      <span className="text-slate-700 font-sans capitalize font-medium">{selectedFish.stage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Selected Fish */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Move to another aquarium */}
                {aquariums.filter((a) => a.unlocked && a.id !== selectedFish.aquariumId).length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        moveFishToAquarium(selectedFish.id, e.target.value);
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
                    aria-label="Transfer Fish to Another Aquarium"
                  >
                    <option value="" disabled>
                      Move Tank...
                    </option>
                    {aquariums
                      .filter((a) => a.unlocked && a.id !== selectedFish.aquariumId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          To: {a.name}
                        </option>
                      ))}
                  </select>
                )}

                {/* Sell Fish */}
                <button
                  onClick={() => sellFish(selectedFish.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors"
                  title="Sell Fish for Coins"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Sell
                </button>

                {/* Close Fish Card */}
                <button
                  onClick={() => setSelectedFishId(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                  title="Deselect Fish"
                  aria-label="Deselect Fish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* 3. General Aquarium Action Dock */
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => feedFishInAquarium(activeAquariumId)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-sm"
                >
                  <Utensils className="w-4 h-4" />
                  Feed Tank
                </button>

                <p className="hidden sm:block text-xs text-slate-500">
                  Tip: Click anywhere in the water to drop flakes directly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('shop')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-sm"
                >
                  Buy Fish
                </button>
                <button
                  onClick={() => setActiveView('breeding')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-sm"
                >
                  Breeding Lab
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
