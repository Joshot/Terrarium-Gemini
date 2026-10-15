'use client';

import React from 'react';
import { useGameStore } from '@/lib/gameStore';
import {
  TreeDeciduous,
  X,
  CloudRain,
  Sun,
  Moon,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export default function TerrariumDrawer() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const terrariumMistActive = useGameStore((state) => state.terrariumMistActive);
  const toggleTerrariumMist = useGameStore((state) => state.toggleTerrariumMist);
  const terrariumDayNight = useGameStore((state) => state.terrariumDayNight);

  if (activeView !== 'terrarium') return null;

  const isNight = Math.sin(terrariumDayNight * Math.PI * 2) < 0;

  return (
    <div className="fixed top-16 left-3 sm:left-6 z-40 w-full max-w-xs pointer-events-auto select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TreeDeciduous className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cozy Glass Terrarium</h2>
              <p className="text-[11px] text-slate-500">Botanical Sanctuary</p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('aquarium')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Return to Aquarium"
            aria-label="Return to Aquarium"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient atmosphere controls */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Atmospheric Conditions
          </p>

          {/* Rain / Mist Toggle */}
          <button
            onClick={toggleTerrariumMist}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-colors ${
              terrariumMistActive
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              Gentle Rain & Mist
            </span>
            <span className="text-[10px] font-mono uppercase font-bold">
              {terrariumMistActive ? 'Active' : 'Off'}
            </span>
          </button>

          {/* Day / Night indicator */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-700 font-medium">
              {isNight ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              Lighting Cycle
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              {isNight ? 'Tranquil Night' : 'Gentle Daylight'}
            </span>
          </div>
        </div>

        {/* Terrarium description */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Sanctuary Ecology
          </p>
          <p>
            Features procedural moss cushions, miniature capped mushrooms, river stones, and a humid glass microclimate.
          </p>
        </div>

        {/* Return Button */}
        <button
          onClick={() => setActiveView('aquarium')}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Aquarium
        </button>
      </div>
    </div>
  );
}
