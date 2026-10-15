'use client';

import React from 'react';
import { useGameStore } from '@/lib/gameStore';
import { ActiveView } from '@/lib/types';
import {
  Fish,
  ShoppingBag,
  FlaskConical,
  Award,
  Sparkles,
  TreeDeciduous,
  Zap,
} from 'lucide-react';

export default function RightNav() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const breedingJob = useGameStore((state) => state.breedingJob);
  const collection = useGameStore((state) => state.collection);

  const discoveredCount = Object.keys(collection).length;
  const isBreedingReady = breedingJob?.completed;

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'aquarium', label: 'Aquarium', icon: <Fish className="w-4 h-4" /> },
    { id: 'shop', label: 'Fish Shop', icon: <ShoppingBag className="w-4 h-4" /> },
    {
      id: 'breeding',
      label: 'Breeding Lab',
      icon: <FlaskConical className="w-4 h-4" />,
      badge: isBreedingReady ? 'Ready' : breedingJob ? 'Active' : undefined,
    },
    {
      id: 'collection',
      label: 'Collection',
      icon: <Award className="w-4 h-4" />,
      badge: discoveredCount > 0 ? discoveredCount : undefined,
    },
    { id: 'decorations', label: 'Decorations', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'terrarium', label: 'Terrarium', icon: <TreeDeciduous className="w-4 h-4" /> },
    { id: 'upgrades', label: 'Upgrades', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <aside className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-auto select-none">
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`relative group flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              {item.icon}

              {/* Label for medium/large desktop */}
              <span className="hidden md:inline pr-1">
                {item.label}
              </span>

              {/* Badge for notifications or count */}
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                    item.badge === 'Ready'
                      ? 'bg-amber-500 text-white'
                      : isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on mobile/small screens */}
              <span className="md:hidden absolute right-full mr-2.5 px-2 py-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
