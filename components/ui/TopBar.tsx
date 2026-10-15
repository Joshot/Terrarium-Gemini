'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { calculateFishIncome } from '@/lib/genetics';
import { sound } from '@/lib/audio';
import {
  Coins,
  TrendingUp,
  Fish,
  Volume2,
  VolumeX,
  Sliders,
  X,
  Home,
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
  const muted = useGameStore((state) => state.muted);
  const setMuted = useGameStore((state) => state.setMuted);
  const setActiveAquariumId = useGameStore((state) => state.setActiveAquariumId);

  // Passive income calculation across all fish and habitats
  const revUpg = upgrades.find((u) => u.id === 'upg_revenue');
  const incomeMult = 1.0 + (revUpg?.level || 0) * (revUpg?.multiplierPerLevel || 0);

  const totalIncomePerMin = Math.round(
    fish.reduce((sum, f) => {
      return sum + calculateFishIncome(f, incomeMult);
    }, 0) + aquariums.filter((a) => a.unlocked).length * 9
  );

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
          <p className="text-[10px] text-blue-600 font-medium">Desktop Sanctuary</p>
        </div>
      </div>

      {/* Tycoon Stats (Coins, Income, Active Habitat) */}
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-4 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-sm">
        {/* Coins */}
        <div className="flex items-center gap-1.5" title="Available Balance">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
            {coins.toLocaleString()}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-200" />

        {/* Automatic Passive Income Rate */}
        <div className="flex items-center gap-1.5" title="Passive Income per Minute (All Habitats)">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs sm:text-sm font-semibold text-emerald-700 font-mono">
            +{totalIncomePerMin}/m
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-200 hidden sm:block" />

        {/* Habitat Selector */}
        <div className="hidden sm:flex items-center gap-1.5" title="Current Habitat on Desk">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={activeAquariumId}
            onChange={(e) => setActiveAquariumId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:text-slate-900"
            aria-label="Active Habitat"
          >
            {aquariums
              .filter((a) => a.unlocked)
              .map((a) => (
                <option key={a.id} value={a.id} className="bg-white text-slate-800">
                  {a.name} {!a.isTerrarium ? `(${currentFishCount}/${maxCap})` : '(Biotope)'}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Audio Controls (No speed buttons!) */}
      <div className="relative pointer-events-auto flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
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

        {/* Audio Mixing Popover Panel */}
        {showAudioSettings && (
          <div className="absolute right-0 top-12 w-64 p-3.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 text-slate-800">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Relaxing Audio
              </span>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close Audio Settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600 font-medium">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="Master Volume"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600 font-medium">
                  <span>Aquarium Ambience</span>
                  <span className="font-mono">{Math.round(ambienceVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambienceVol}
                  onChange={(e) => handleAmbienceChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="Ambience Volume"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600 font-medium">
                  <span>Sound Effects</span>
                  <span className="font-mono">{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="SFX Volume"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
