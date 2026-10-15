'use client';

import React from 'react';
import { useGameStore } from '@/lib/gameStore';
import {
  Zap,
  X,
  Coins,
  TrendingUp,
  Clock,
  BatteryCharging,
  Maximize2,
  Check,
} from 'lucide-react';

export default function UpgradesModal() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const coins = useGameStore((state) => state.coins);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);

  if (activeView !== 'upgrades') return null;

  const getUpgradeIcon = (type: string) => {
    switch (type) {
      case 'income_multiplier': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'auto_feeder': return <BatteryCharging className="w-5 h-5 text-blue-600" />;
      case 'growth_speed': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'breeding_speed': return <Clock className="w-5 h-5 text-purple-600" />;
      case 'tank_capacity': return <Maximize2 className="w-5 h-5 text-indigo-600" />;
      default: return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-none select-none">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tycoon Facilities & Research</h2>
              <p className="text-xs text-slate-500">Invest profits into automated sanctuary efficiency</p>
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
              title="Close Research"
              aria-label="Close Research"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upgrade List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/40">
          {upgrades.map((upg) => {
            const isMax = upg.level >= upg.maxLevel;
            const currentCost = Math.round(upg.cost * Math.pow(1.6, upg.level));
            const canAfford = coins >= currentCost;

            return (
              <div
                key={upg.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {getUpgradeIcon(upg.effectType)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{upg.name}</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Rank {upg.level}/{upg.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{upg.description}</p>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  {!isMax && (
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-900 text-sm">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {currentCost.toLocaleString()}
                    </span>
                  )}

                  {isMax ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Max Rank
                    </span>
                  ) : (
                    <button
                      onClick={() => buyUpgrade(upg.id)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        canAfford
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
