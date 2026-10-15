'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { DECORATIONS_CATALOG } from '@/lib/speciesData';
import {
  Sparkles,
  X,
  Coins,
  Check,
  Heart,
} from 'lucide-react';

export default function DecorationsModal() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const coins = useGameStore((state) => state.coins);
  const aquariums = useGameStore((state) => state.aquariums);
  const activeAquariumId = useGameStore((state) => state.activeAquariumId);
  const buyDecoration = useGameStore((state) => state.buyDecoration);
  const toggleDecoration = useGameStore((state) => state.toggleDecoration);
  const buyAquarium = useGameStore((state) => state.buyAquarium);

  const [tab, setTab] = useState<'decorations' | 'aquariums'>('decorations');

  if (activeView !== 'decorations') return null;

  const currentTank = aquariums.find((a) => a.id === activeAquariumId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-none select-none">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aquarium & Decor Studio</h2>
              <p className="text-xs text-slate-500">
                Customizing: <span className="text-blue-600 font-semibold">{currentTank?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-900 font-mono">{coins.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setActiveView('aquarium')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Customizer"
              aria-label="Close Customizer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex gap-2 bg-slate-50/50">
          <button
            onClick={() => setTab('decorations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'decorations'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Aquarium Ornaments
          </button>
          <button
            onClick={() => setTab('aquariums')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'aquariums'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Sanctuary Expansion Tanks
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/40">
          {tab === 'decorations' ? (
            DECORATIONS_CATALOG.map((dec) => {
              const installed = currentTank?.decorations.includes(dec.id);
              const canAfford = coins >= dec.cost;

              return (
                <div
                  key={dec.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{dec.name}</h3>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {dec.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{dec.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1 text-rose-600 font-medium font-sans">
                        <Heart className="w-3.5 h-3.5" />
                        +{dec.happinessBonus} Fish Happiness
                      </span>
                      {dec.capacityBonus && (
                        <span className="text-blue-600 font-medium font-sans">+{dec.capacityBonus} Population Cap</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-900 text-sm">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {dec.cost}
                    </span>

                    {installed ? (
                      <button
                        onClick={() => toggleDecoration(activeAquariumId, dec.id)}
                        className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Installed
                      </button>
                    ) : (
                      <button
                        onClick={() => buyDecoration(dec.id)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          canAfford
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        Install Decor
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            aquariums.map((tank) => {
              const canAfford = coins >= tank.cost;
              const isCurrent = tank.id === activeAquariumId;

              return (
                <div
                  key={tank.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{tank.name}</h3>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {tank.theme}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Base Capacity: <span className="text-slate-900 font-bold">{tank.capacity} fish</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {tank.unlocked ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-900 text-sm">
                        <Coins className="w-4 h-4 text-amber-500" />
                        {tank.cost.toLocaleString()}
                      </span>
                    )}

                    {!tank.unlocked ? (
                      <button
                        onClick={() => buyAquarium(tank.id)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          canAfford
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        Unlock Habitat
                      </button>
                    ) : (
                      <button
                        disabled={isCurrent}
                        onClick={() => useGameStore.getState().setActiveAquariumId(tank.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isCurrent ? 'Active Tank' : 'Switch To'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
