'use client';

import React from 'react';
import { useGameStore } from '@/lib/gameStore';
import { INITIAL_SPECIES } from '@/lib/speciesData';
import {
  X,
  Coins,
  TrendingUp,
  Clock,
  Thermometer,
  ShoppingBag,
} from 'lucide-react';

export default function ShopModal() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const coins = useGameStore((state) => state.coins);
  const buyFish = useGameStore((state) => state.buyFish);
  const aquariums = useGameStore((state) => state.aquariums);
  const activeAquariumId = useGameStore((state) => state.activeAquariumId);
  const upgrades = useGameStore((state) => state.upgrades);
  const fishList = useGameStore((state) => state.fish);

  if (activeView !== 'shop') return null;

  const currentTank = aquariums.find((a) => a.id === activeAquariumId);
  const capUpgrade = upgrades.find((u) => u.id === 'upg_capacity');
  const extraCap = (capUpgrade?.level || 0) * (capUpgrade?.multiplierPerLevel || 0);
  const totalCap = (currentTank?.capacity || 6) + extraCap;
  const currentFishCount = fishList.filter((f) => f.aquariumId === activeAquariumId && !f.isBreeding).length;
  const isTankFull = currentFishCount >= totalCap;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-none select-none">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aquatic Fish Catalog</h2>
              <p className="text-xs text-slate-500">
                Target Aquarium: <span className="text-blue-600 font-semibold">{currentTank?.name}</span> ({currentFishCount}/{totalCap} Capacity)
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
              title="Close Catalog"
              aria-label="Close Catalog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Species List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {INITIAL_SPECIES.map((species) => {
            const canAfford = coins >= species.cost;
            const disabled = !canAfford || isTankFull;

            return (
              <div
                key={species.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors shadow-sm"
              >
                {/* Visual Swatch & Info */}
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                    style={{
                      backgroundColor: `${species.defaultTraits.baseColor}15`,
                      borderColor: species.defaultTraits.baseColor,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{
                        backgroundColor: species.defaultTraits.baseColor,
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{species.name}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          species.rarity === 'Legendary'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : species.rarity === 'Exotic'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : species.rarity === 'Rare'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : species.rarity === 'Uncommon'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {species.rarity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 max-w-md">{species.description}</p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-mono">
                      <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+{species.baseIncome}/min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{species.breedingDurationSec}s breed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                        <span>{species.preferredTemp} deg C</span>
                      </div>
                      <div className="text-slate-400 font-sans">
                        Body: <span className="text-slate-700 capitalize font-medium">{species.defaultTraits.bodyShape}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-sm">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>{species.cost.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => buyFish(species.id)}
                    disabled={disabled}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      disabled
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {isTankFull
                      ? 'Aquarium Full'
                      : !canAfford
                      ? 'Insufficient Coins'
                      : 'Purchase Fish'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
