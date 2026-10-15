'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { Rarity } from '@/lib/types';
import { INITIAL_SPECIES } from '@/lib/speciesData';
import {
  Award,
  X,
  TrendingUp,
  Filter,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function CollectionModal() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const collection = useGameStore((state) => state.collection);

  const [rarityFilter, setRarityFilter] = useState<string>('All');

  if (activeView !== 'collection') return null;

  const discoveredList = Object.values(collection);

  const filteredList = discoveredList.filter((entry) => {
    if (rarityFilter !== 'All' && entry.rarity !== rarityFilter) return false;
    return true;
  });

  const rarities: (Rarity | 'All')[] = ['All', 'Common', 'Uncommon', 'Rare', 'Exotic', 'Legendary'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-none select-none">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Compendium of Species</h2>
              <p className="text-xs text-slate-500">
                Discovered: <span className="text-blue-600 font-bold">{discoveredList.length}</span> unique genetic variants
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('aquarium')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Compendium"
            aria-label="Close Compendium"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {rarities.map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                rarityFilter === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Collection Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 bg-slate-50/40">
          {filteredList.map((entry) => (
            <div
              key={entry.geneticHash}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm"
            >
              <div>
                {/* Visual Swatch & Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                    style={{
                      backgroundColor: `${entry.traits.baseColor}15`,
                      borderColor: entry.traits.baseColor,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: entry.traits.baseColor,
                      }}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      entry.rarity === 'Legendary'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : entry.rarity === 'Exotic'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : entry.rarity === 'Rare'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : entry.rarity === 'Uncommon'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {entry.rarity}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 truncate">{entry.name}</h3>

                {/* Trait breakdown */}
                <div className="mt-2 text-[11px] text-slate-500 space-y-1 font-mono">
                  <p>
                    Body: <span className="text-slate-800 capitalize font-medium">{entry.traits.bodyShape}</span>
                  </p>
                  <p>
                    Pattern: <span className="text-slate-800 capitalize font-medium">{entry.traits.pattern}</span>
                  </p>
                  <p>
                    Fin: <span className="text-slate-800 capitalize font-medium">{entry.traits.finShape}</span> · Tail:{' '}
                    <span className="text-slate-800 capitalize font-medium">{entry.traits.tailShape}</span>
                  </p>
                  {entry.traits.specialTrait !== 'none' && (
                    <p className="text-blue-600 font-semibold flex items-center gap-1 font-sans">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      Trait: {entry.traits.specialTrait.replace('_', ' ')}
                    </p>
                  )}
                  {entry.parentSpeciesNames && (
                    <p className="text-slate-400 text-[10px] truncate">
                      Parents: {entry.parentSpeciesNames[0]} x {entry.parentSpeciesNames[1]}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer specs */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-mono font-bold">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  +{entry.incomeRate}/m
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  Gen {entry.generation}
                </span>
              </div>
            </div>
          ))}

          {/* Undiscovered Mystery Templates */}
          {INITIAL_SPECIES.filter(
            (s) => !discoveredList.some((d) => d.name.toLowerCase().includes(s.name.toLowerCase()))
          ).map((s) => (
            <div
              key={s.id}
              className="bg-white border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center opacity-70"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-600">Undiscovered Specimen</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Breed or buy to register traits</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
