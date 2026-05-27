import React from 'react';
import { Zap, Gift, Loader2 } from 'lucide-react';
import { LoyaltyReward } from '../../page';

interface AvailableRewardsProps {
  rewards: LoyaltyReward[];
  points: number;
  redeeming: string | null;
  onRedeem: (r: LoyaltyReward) => void;
  rewardTypeLabel: (r: LoyaltyReward) => string | null;
}

export function AvailableRewards({
  rewards,
  points,
  redeeming,
  onRedeem,
  rewardTypeLabel,
}: AvailableRewardsProps) {
  return (
    <>
      {/* Available Rewards catalog */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Available Rewards</h2>
      </div>

      {rewards.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center mx-auto mb-3">
            <Zap size={28} className="text-amber-500" />
          </div>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">No rewards available yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Keep visiting to unlock exclusive rewards!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => {
            const canRedeem = points >= reward.points_cost;
            return (
              <div key={reward.id} className="glass-card p-5 flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
                    canRedeem ? 'bg-gradient-to-br from-amber-400 to-pink-400' : 'bg-gray-100'
                  }`}
                >
                  <Gift size={24} className={canRedeem ? 'text-white' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--color-text-primary)] truncate">{reward.name}</h3>
                  {rewardTypeLabel(reward) && (
                    <p className="text-xs text-[var(--color-brand-pink-dark)] font-semibold">{rewardTypeLabel(reward)}</p>
                  )}
                  {reward.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">{reward.description}</p>
                  )}
                  <p className="text-xs text-amber-500 font-bold mt-1">{reward.points_cost} points</p>
                </div>
                <button
                  onClick={() => onRedeem(reward)}
                  disabled={!canRedeem || redeeming === reward.id}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 cursor-pointer ${
                    canRedeem ? 'btn-pink hover:scale-105' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {redeeming === reward.id ? <Loader2 size={14} className="animate-spin" /> : canRedeem ? 'Redeem' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
