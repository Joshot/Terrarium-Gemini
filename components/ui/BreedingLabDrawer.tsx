'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { checkBreedingCompatibility } from '@/lib/genetics';
import {
  FlaskConical,
  X,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Dna,
} from 'lucide-react';

export default function BreedingLabDrawer() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const fishList = useGameStore((state) => state.fish);
  const breedingJarParents = useGameStore((state) => state.breedingJarParents);
  const assignBreedingJarParent = useGameStore((state) => state.assignBreedingJarParent);
  const breedingJob = useGameStore((state) => state.breedingJob);
  const startBreedingJob = useGameStore((state) => state.startBreedingJob);
  const cancelBreedingJob = useGameStore((state) => state.cancelBreedingJob);
  const collectBreedingOffspring = useGameStore((state) => state.collectBreedingOffspring);

  const [now, setNow] = useState(() => Date.now());

  // Breeding countdown calculation
  useEffect(() => {
    if (!breedingJob || breedingJob.completed) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(interval);
  }, [breedingJob]);

  const elapsed = breedingJob ? (now - breedingJob.startTime) / 1000 : 0;
  const progressPct = !breedingJob
    ? 0
    : breedingJob.completed
    ? 100
    : Math.min(100, Math.round((elapsed / breedingJob.durationSeconds) * 100));
  const secondsLeft = !breedingJob || breedingJob.completed
    ? 0
    : Math.max(0, Math.ceil(breedingJob.durationSeconds - elapsed));

  if (activeView !== 'breeding') return null;

  const [pAId, pBId] = breedingJarParents;
  const parentA = fishList.find((f) => f.id === pAId);
  const parentB = fishList.find((f) => f.id === pBId);

  // Available adult fish that are not currently breeding
  const availableAdults = fishList.filter((f) => f.stage === 'adult' && !f.isBreeding);

  // Compatibility assessment
  const compat = parentA && parentB ? checkBreedingCompatibility(parentA, parentB) : null;

  return (
    <div className="fixed top-16 right-3 sm:right-6 bottom-20 z-40 w-full max-w-sm pointer-events-auto select-none">
      <div className="h-full bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Lab Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Breeding Lab</h2>
              <p className="text-[11px] text-slate-500">Glass Jar Incubator</p>
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

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
          {/* Active Job State */}
          {breedingJob ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {breedingJob.completed ? 'Breeding Complete' : 'Breeding in Progress'}
                </span>
                {!breedingJob.completed && (
                  <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {secondsLeft}s left
                  </span>
                )}
              </div>

              {/* Progress bar (Solid minimal) */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Parent 1: <span className="font-semibold text-slate-900">{breedingJob.parentAName}</span>
                </p>
                <p>
                  Parent 2: <span className="font-semibold text-slate-900">{breedingJob.parentBName}</span>
                </p>
              </div>

              {/* Action buttons */}
              {breedingJob.completed ? (
                <button
                  onClick={() => collectBreedingOffspring()}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Collect Offspring
                </button>
              ) : (
                <button
                  onClick={() => cancelBreedingJob()}
                  className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  Cancel Incubation
                </button>
              )}
            </div>
          ) : (
            /* Setup Breeding Parents */
            <>
              {/* Parent A Selection Slot */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Parent 1 (Specimen A)
                </label>
                {parentA ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${parentA.traits.baseColor}15`,
                          borderColor: parentA.traits.baseColor,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: parentA.traits.baseColor }}
                        />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 truncate">{parentA.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">
                          {parentA.traits.bodyShape} · {parentA.traits.pattern}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => assignBreedingJarParent(0, null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove Parent"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <select
                    onChange={(e) => assignBreedingJarParent(0, e.target.value || null)}
                    defaultValue=""
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 outline-none cursor-pointer hover:bg-white"
                  >
                    <option value="">Select an adult fish...</option>
                    {availableAdults
                      .filter((f) => f.id !== pBId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.rarity})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Parent B Selection Slot */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Parent 2 (Specimen B)
                </label>
                {parentB ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${parentB.traits.baseColor}15`,
                          borderColor: parentB.traits.baseColor,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: parentB.traits.baseColor }}
                        />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 truncate">{parentB.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">
                          {parentB.traits.bodyShape} · {parentB.traits.pattern}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => assignBreedingJarParent(1, null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove Parent"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <select
                    onChange={(e) => assignBreedingJarParent(1, e.target.value || null)}
                    defaultValue=""
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2 outline-none cursor-pointer hover:bg-white"
                  >
                    <option value="">Select second adult fish...</option>
                    {availableAdults
                      .filter((f) => f.id !== pAId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.rarity})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Compatibility Assessment */}
              {compat && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    compat.compatible
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {compat.compatible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Genetic Compatibility: Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Incompatible
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {compat.compatible
                      ? 'Traits will blend with dominant alleles. Chance of rare hybrid color mutation.'
                      : compat.reason}
                  </p>
                </div>
              )}

              {/* Start Breeding Button */}
              <button
                onClick={() => startBreedingJob()}
                disabled={!compat?.compatible}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                  compat?.compatible
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Start Incubation
              </button>
            </>
          )}

          {/* Genetic Lab Instructions */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <Dna className="w-3.5 h-3.5 text-blue-600" />
              Genetics Guide
            </div>
            <p>1. Only mature adult fish can breed.</p>
            <p>2. Cross distinct body shapes to discover new hybrid variants.</p>
            <p>3. First discoveries earn bonus coin bounties in the Compendium.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
