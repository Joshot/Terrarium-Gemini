'use client';

import React from 'react';
import { useGameStore } from '@/lib/gameStore';
import { Coins } from 'lucide-react';
import { sound } from '@/lib/audio';

export default function OfflineReportModal() {
  const offlineEarningsReport = useGameStore((state) => state.offlineEarningsReport);
  const dismissOfflineReport = useGameStore((state) => state.dismissOfflineReport);

  if (!offlineEarningsReport) return null;

  const handleClaim = () => {
    sound.playCoin();
    dismissOfflineReport();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-none select-none">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
          <Coins className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">Welcome Back to Your Sanctuary</h2>
          <p className="text-xs text-slate-500 mt-1">
            While you were away for{' '}
            <span className="text-slate-800 font-semibold">{offlineEarningsReport.elapsedMinutes} minutes</span>,
            your fish continued swimming peacefully and generating passive income.
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center gap-2">
          <span className="text-xs text-amber-800 font-medium">Earned:</span>
          <span className="text-base font-bold font-mono text-amber-900 flex items-center gap-1">
            <Coins className="w-4 h-4 text-amber-600" />
            +{offlineEarningsReport.coins.toLocaleString()} Coins
          </span>
        </div>

        <button
          onClick={handleClaim}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          Collect Earnings
        </button>
      </div>
    </div>
  );
}
