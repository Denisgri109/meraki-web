import React from 'react';
import { Ticket, Gift, Star } from 'lucide-react';
import { StampCard } from '../../page';

interface StampCardsListProps {
  stampCards: StampCard[];
  onRedeemStampCard: (c: StampCard) => void;
  stampCardRewardText: (c: StampCard) => string;
}

export function StampCardsList({
  stampCards,
  onRedeemStampCard,
  stampCardRewardText,
}: StampCardsListProps) {
  return (
    <>
      {/* Stamp Cards Section */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
          <Ticket size={14} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Stamp Cards</h2>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Collect stamps at every visit on the mobile app and unlock rewards from your favourite masters.
      </p>

      {stampCards.length === 0 ? (
        <div className="glass-card p-8 text-center mb-10 border border-dashed border-[var(--color-border-light)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-light)] flex items-center justify-center mx-auto mb-3">
            <Ticket size={24} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">No active stamp cards</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Use the mobile app to scan a master&apos;s QR code at the salon to start your first card.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-10">
          {stampCards.map((card) => (
            <div key={card.stamp_id} className="glass-card p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-violet-300 to-pink-300 flex items-center justify-center text-white font-bold shrink-0">
                  {card.master_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.master_avatar} alt={card.master_name} className="w-full h-full object-cover" />
                  ) : (
                    card.master_name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text-primary)] truncate">{card.master_name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{card.card_name}</p>
                </div>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    card.reward_available
                      ? 'bg-gradient-to-br from-amber-400 to-pink-400'
                      : 'bg-[var(--color-surface-light)]'
                  }`}
                >
                  <Gift size={16} className={card.reward_available ? 'text-white' : 'text-[var(--color-text-muted)]'} />
                </div>
              </div>

              {/* Slots */}
              <div className="bg-[var(--color-surface-light)] rounded-2xl p-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: card.stamps_required }).map((_, i) => {
                    const collected = i < card.stamps_collected;
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          collected
                            ? 'bg-gradient-to-br from-amber-400 to-pink-400 border-transparent shadow-sm'
                            : 'bg-white/40 border-black/5'
                        }`}
                      >
                        <Star size={14} className={collected ? 'text-white' : 'text-black/10'} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-[var(--color-text-secondary)] font-semibold">
                    {card.stamps_collected} of {card.stamps_required} collected
                  </span>
                  {card.stamps_redeemed > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)] font-bold">
                      {card.stamps_redeemed} redeemed
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)]/60">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Reward</p>
                  <p className="font-bold text-[var(--color-text-primary)]">{stampCardRewardText(card)}</p>
                </div>
                {card.reward_available ? (
                  <button
                    onClick={() => onRedeemStampCard(card)}
                    className="btn-pink px-5 py-2 rounded-full text-sm font-bold cursor-pointer hover:scale-105 transition-transform"
                  >
                    Redeem Now
                  </button>
                ) : (
                  <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-light)] px-3 py-1.5 rounded-lg">
                    {card.last_stamp_at
                      ? `Last: ${new Date(card.last_stamp_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                      : 'No stamps yet'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
