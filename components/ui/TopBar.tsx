'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { calculateFishIncome } from '@/lib/genetics';
import { sound } from '@/lib/audio';
import {
  Coins,
  TrendingUp,
  Fish,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sliders,
  X,
} from 'lucide-react';

export default function TopBar() {
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [masterVol, setMasterVol] = useState(sound.getMasterVolume());
  const [ambienceVol, setAmbienceVol] = useState(sound.getAmbienceVolume());
  const [sfxVol, setSfxVol] = useState(sound.getSfxVolume());

  const coins = useGameStore((state) => state.coins);
  const fish = useGameStore((state) => state.fish);
  const aquariums = useGameStore((state) => state.aquariums);
  const activeAquariumId = useGameStore((state) => state.activeAquariumId);
  const upgrades = useGameStore((state) => state.upgrades);
  const timeSpeed = useGameStore((state) => state.timeSpeed);
  const setTimeSpeed = useGameStore((state) => state.setTimeSpeed);
  const muted = useGameStore((state) => state.muted);
  const setMuted = useGameStore((state) => state.setMuted);
  const activeView = useGameStore((state) => state.activeView);
  const setActiveAquariumId = useGameStore((state) => state.setActiveAquariumId);

  // Passive income calculation
  const revUpg = upgrades.find((u) => u.id === 'upg_revenue');
  const incomeMult = 1.0 + (revUpg?.level || 0) * (revUpg?.multiplierPerLevel || 0);

  const totalIncomePerMin = fish.reduce((sum, f) => {
    return sum + calculateFishIncome(f, incomeMult);
  }, 0);

  // Capacity calculation
  const currentTank = aquariums.find((a) => a.id === activeAquariumId);
  const capUpgrade = upgrades.find((u) => u.id === 'upg_capacity');
  const extraCap = (capUpgrade?.level || 0) * (capUpgrade?.multiplierPerLevel || 0);
  const maxCap = (currentTank?.capacity || 6) + extraCap;
  const currentFishCount = fish.filter((f) => f.aquariumId === activeAquariumId && !f.isBreeding).length;

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    sound.setMasterVolume(val);
  };

  const handleAmbienceChange = (val: number) => {
    setAmbienceVol(val);
    sound.setAmbienceVolume(val);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    sound.setSfxVolume(val);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-2.5 flex items-center justify-between pointer-events-none select-none">
      {/* Brand Title (Pure Minimalist White) */}
      <div className="pointer-events-auto flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Fish className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-wider text-slate-800 uppercase">Aquaria</h1>
          <p className="text-[10px] text-blue-600 font-medium">Breeding Tycoon</p>
        </div>
      </div>

      {/* Tycoon Stats (Coins, Income, Capacity) */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-sm">
        {/* Coins */}
        <div className="flex items-center gap-1.5" title="Available Coins">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
            {coins.toLocaleString()}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-200" />

        {/* Income Rate */}
        <div className="flex items-center gap-1.5" title="Passive Income per Minute">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs sm:text-sm font-semibold text-emerald-700 font-mono">
            +{totalIncomePerMin}/m
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-200 hidden sm:block" />

        {/* Active Tank Population */}
        {activeView !== 'terrarium' && (
          <div className="hidden sm:flex items-center gap-1.5" title="Aquarium Population Capacity">
            <span className="text-xs text-slate-400 font-medium">Tank:</span>
            <select
              value={activeAquariumId}
              onChange={(e) => setActiveAquariumId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:text-slate-900"
              aria-label="Active Aquarium"
            >
              {aquariums
                .filter((a) => a.unlocked)
                .map((a) => (
                  <option key={a.id} value={a.id} className="bg-white text-slate-800">
                    {a.name} ({currentFishCount}/{maxCap})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Clock Controls & Audio Settings */}
      <div className="relative pointer-events-auto flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
        {/* Pause / Play */}
        <button
          onClick={() => setTimeSpeed(timeSpeed === 0 ? 1 : 0)}
          className={`p-1.5 rounded-lg transition-colors ${
            timeSpeed === 0
              ? 'bg-amber-100 text-amber-800'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title={timeSpeed === 0 ? 'Resume Simulation' : 'Pause Simulation'}
          aria-label={timeSpeed === 0 ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {timeSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* 1x Normal Speed */}
        <button
          onClick={() => setTimeSpeed(1)}
          className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
            timeSpeed === 1
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Normal Speed (1x)"
          aria-label="Normal Speed"
        >
          1x
        </button>

        {/* 2x Fast Speed */}
        <button
          onClick={() => setTimeSpeed(2)}
          className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
            timeSpeed === 2
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Fast Speed (2x)"
          aria-label="Fast Speed"
        >
          2x
        </button>

        {/* 5x Ultra Speed */}
        <button
          onClick={() => setTimeSpeed(5)}
          className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
            timeSpeed === 5
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Ultra Speed (5x)"
          aria-label="Ultra Speed"
        >
          5x
        </button>

        <div className="w-px h-3.5 bg-slate-200" />

        {/* Audio Mute Quick Toggle */}
        <button
          onClick={() => setMuted(!muted)}
          className={`p-1.5 rounded-lg transition-colors ${
            muted ? 'bg-rose-50 text-rose-600' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Audio Mixing Settings Button */}
        <button
          onClick={() => setShowAudioSettings(!showAudioSettings)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          title="Audio Soundscape Controls"
          aria-label="Audio Soundscape Controls"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Relaxing Audio Soundscape Controls Popover */}
        {showAudioSettings && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 space-y-3 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Soundscape Controls</span>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Close sound settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Master Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Master Volume</span>
                <span className="font-mono">{Math.round(masterVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVol}
                onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                aria-label="Master volume"
              />
            </div>

            {/* Ambience Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Ambient Water Flow</span>
                <span className="font-mono">{Math.round(ambienceVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambienceVol}
                onChange={(e) => handleAmbienceChange(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                aria-label="Ambient volume"
              />
            </div>

            {/* SFX Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Interactions & Chimes</span>
                <span className="font-mono">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                aria-label="Interaction SFX volume"
              />
            </div>

            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              100% procedural Web Audio frequencies designed for relaxation.
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
