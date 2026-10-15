'use client';

import React from 'react';
import { useGameStore } from '@/lib/gameStore';
import {
  X,
  CloudRain,
  Sun,
  Moon,
  Sparkles,
  Home,
  Check,
  Lock,
} from 'lucide-react';

export default function TerrariumDrawer() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const aquariums = useGameStore((state) => state.aquariums);
  const activeAquariumId = useGameStore((state) => state.activeAquariumId);
  const setActiveAquariumId = useGameStore((state) => state.setActiveAquariumId);
  const buyAquarium = useGameStore((state) => state.buyAquarium);
  const coins = useGameStore((state) => state.coins);
  const fish = useGameStore((state) => state.fish);
  const terrariumMistActive = useGameStore((state) => state.terrariumMistActive);
  const toggleTerrariumMist = useGameStore((state) => state.toggleTerrariumMist);
  const terrariumDayNight = useGameStore((state) => state.terrariumDayNight);

  if (activeView !== 'terrarium') return null;

  const activeHabitat = aquariums.find((a) => a.id === activeAquariumId);
  const isNight = Math.sin(terrariumDayNight * Math.PI * 2) < 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col pointer-events-auto select-none">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Desktop Habitats & Biotopes</h2>
            <p className="text-[11px] text-slate-500">Aquariums and Terrariums Collection</p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('aquarium')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close Habitats Menu"
          aria-label="Close Habitats Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Active Terrarium Microclimate Controls (if active habitat is a terrarium) */}
        {activeHabitat?.isTerrarium && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Terrarium Atmosphere
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-500 uppercase">Live Controls</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={toggleTerrariumMist}
                className={`py-2 px-3 rounded-lg border flex items-center justify-between transition-colors ${
                  terrariumMistActive
                    ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  Mist
                </span>
                <span className="text-[10px] uppercase font-mono">{terrariumMistActive ? 'On' : 'Off'}</span>
              </button>

              <div className="py-2 px-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  Cycle
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">{isNight ? 'Night' : 'Day'}</span>
              </div>
            </div>
          </div>
        )}

        {/* List of All 6 Habitat Types */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Available Desktop Habitats
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {aquariums.filter((a) => a.unlocked).length} / {aquariums.length} Owned
            </span>
          </div>

          <div className="space-y-3">
            {aquariums.map((hab) => {
              const isSelected = hab.id === activeAquariumId;
              const habFishCount = fish.filter((f) => f.aquariumId === hab.id && !f.isBreeding).length;
              const canAfford = coins >= hab.cost;

              return (
                <div
                  key={hab.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{hab.name}</h4>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                          {hab.isTerrarium ? 'Terrarium' : 'Aquarium'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {hab.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="text-[11px] text-slate-500 font-mono">
                      {!hab.isTerrarium ? (
                        <span>Capacity: {habFishCount} / {hab.capacity} fish</span>
                      ) : (
                        <span>Enclosed Botanical Biotope</span>
                      )}
                    </div>

                    <div>
                      {hab.unlocked ? (
                        isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                            <Check className="w-3.5 h-3.5" /> Active on Desk
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveAquariumId(hab.id)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Place on Desk
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => buyAquarium(hab.id)}
                          disabled={!canAfford}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            canAfford
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          Unlock {hab.cost.toLocaleString()} Coins
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
        <span className="text-slate-500 font-medium">All owned habitats produce passive income.</span>
        <button
          onClick={() => setActiveView('aquarium')}
          className="px-4 py-1.5 bg-white border border-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
