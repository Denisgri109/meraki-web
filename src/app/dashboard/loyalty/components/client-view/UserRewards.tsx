import React from 'react';
import { Award, Gift } from 'lucide-react';
import { UserCredit } from '../../page';

interface UserRewardsProps {
  activeCreditsTab: 'active' | 'expired';
  setActiveCreditsTab: (t: 'active' | 'expired') => void;
  displayedCredits: UserCredit[];
  formatRewardValue: (c: UserCredit) => string;
}

export function UserRewards({
  activeCreditsTab,
  setActiveCreditsTab,
  displayedCredits,
  formatRewardValue,
}: UserRewardsProps) {
  return (
    <>
      {/* My Rewards (user credits) with tabs */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
          <Award size={14} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">My Rewards</h2>
      </div>

      <div className="flex p-1 mb-4 rounded-xl bg-[var(--color-surface-light)]">
        {(['active', 'expired'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveCreditsTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeCreditsTab === t
                ? 'bg-white shadow-sm text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {t === 'active' ? 'Active' : 'History'}
          </button>
        ))}
      </div>

      {displayedCredits.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] italic mb-10">
          {activeCreditsTab === 'active'
            ? 'No active rewards yet. Redeem points or complete stamp cards to earn rewards!'
            : 'No expired or used rewards.'}
        </p>
      ) : (
        <div className="space-y-3 mb-10">
          {displayedCredits.map((credit) => {
            const isExpired = activeCreditsTab === 'expired';
            return (
              <div
                key={credit.id}
                className={`glass-card p-5 ${isExpired ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Gift size={20} className={isExpired ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-brand-pink-dark)]'} />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isExpired
                        ? 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {isExpired ? (credit.is_used ? 'Used' : 'Expired') : 'Active'}
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--color-brand-pink-dark)] mb-1">{formatRewardValue(credit)}</p>
                {credit.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">{credit.description}</p>
                )}
                {credit.expires_at && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {isExpired ? (credit.is_used ? 'Used' : 'Expired') : 'Expires'}{' '}
                    {new Date(credit.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
