import React from 'react';
import Link from 'next/link';
import { Trophy, Camera, History } from 'lucide-react';
import { TIERS } from '../../page';

interface PointsAndTierCardProps {
  points: number;
  currentTier: typeof TIERS[number];
  nextTier: typeof TIERS[number] | undefined;
  progressToNext: number;
  onShowHistory: () => void;
}

export function PointsAndTierCard({
  points,
  currentTier,
  nextTier,
  progressToNext,
  onShowHistory,
}: PointsAndTierCardProps) {
  return (
    <>
      {/* Points + Tier Card */}
      <div className="rounded-[var(--radius-2xl)] p-8 mb-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <div className="absolute left-1/2 bottom-0 w-32 h-32 bg-gradient-to-t from-purple-500/15 to-transparent rounded-full -mb-12" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">Your Points</p>
              <p className="text-6xl font-bold">{points.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{currentTier.emoji}</span>
                <span className="text-sm font-semibold text-amber-300">{currentTier.name} Member</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-pink-400 flex items-center justify-center shadow-lg animate-float">
              <Trophy size={36} className="text-white" />
            </div>
          </div>

          {nextTier && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} — {nextTier.min - points} pts to go</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/loyalty/scan"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all cursor-pointer shadow-lg"
            >
              <Camera size={14} /> Scan to earn
            </Link>
            <button
              onClick={onShowHistory}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm"
            >
              <History size={14} /> History
            </button>
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {TIERS.map((tier, idx) => {
          const isActive = points >= tier.min;
          const Icon = tier.icon;
          return (
            <div
              key={tier.name}
              className={`glass-card p-5 text-center transition-all duration-300 hover:-translate-y-1 ${
                isActive ? 'shadow-lg' : 'opacity-60'
              }`}
            >
              <div
                className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-md ${
                  isActive ? 'animate-float' : ''
                }`}
                style={{ animationDelay: `${idx * 0.3}s` }}
              >
                <Icon size={24} className="text-white" />
              </div>
              <p className="font-bold text-sm text-[var(--color-text-primary)]">{tier.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{tier.min}+ pts</p>
              {isActive && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600">
                  ✓ Unlocked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
