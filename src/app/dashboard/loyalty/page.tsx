'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Gift, Star, Trophy, Sparkles, ArrowRight, QrCode, Crown, Zap, Award } from 'lucide-react';
import Link from 'next/link';

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
}

export default function LoyaltyPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        // Get points from profile context if available
        if (profile) {
          setPoints((profile as any)?.loyalty_points || 0);
        } else if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('loyalty_points')
            .eq('id', user.id)
            .single();
          if (error) console.error('[Loyalty] profile error:', error);
          setPoints((data as any)?.loyalty_points || 0);
        }

        // Fetch available rewards
        const { data: rewardsData, error: rErr } = await supabase
          .from('loyalty_rewards')
          .select('*')
          .eq('is_active', true)
          .order('points_cost', { ascending: true });

        if (rErr) console.error('[Loyalty] rewards error:', rErr);
        console.log('[Loyalty] rewards:', rewardsData?.length || 0);
        setRewards((rewardsData as unknown as LoyaltyReward[]) || []);
      } catch (err) {
        console.error('[Loyalty] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoyalty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const tiers = [
    { name: 'Bronze', min: 0, gradient: 'from-amber-600 to-amber-400', bgGradient: 'from-amber-50 to-orange-50', icon: Star, emoji: '🥉' },
    { name: 'Silver', min: 500, gradient: 'from-gray-400 to-gray-300', bgGradient: 'from-gray-50 to-slate-50', icon: Crown, emoji: '🥈' },
    { name: 'Gold', min: 1500, gradient: 'from-yellow-500 to-amber-300', bgGradient: 'from-yellow-50 to-amber-50', icon: Sparkles, emoji: '🥇' },
  ];

  const currentTier = tiers.reduce((acc, tier) => (points >= tier.min ? tier : acc), tiers[0]);
  const nextTier = tiers.find((t) => t.min > points);
  const progressToNext = nextTier ? Math.min(((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100) : 100;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
        <img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1600&q=80&auto=format&fit=crop" alt="Rewards" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Gift size={18} style={{ color: '#FCD34D' }} />
            <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#FCD34D', fontWeight: 700 }}>Rewards</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Earn & Redeem</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px', maxWidth: '400px' }}>Collect points with every visit and unlock exclusive rewards</p>
        </div>
      </div>

      {/* Points Card — Vibrant gradient */}
      <div className="rounded-[var(--radius-2xl)] p-8 mb-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <div className="absolute left-1/2 bottom-0 w-32 h-32 bg-gradient-to-t from-purple-500/15 to-transparent rounded-full -mb-12" />
        <div className="absolute left-0 top-1/2 w-24 h-24 bg-gradient-to-r from-amber-500/10 to-transparent rounded-full -ml-8 -mt-12" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">Your Points</p>
              <p className="text-6xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text">
                {loading ? '—' : points.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{currentTier.emoji}</span>
                <span className="text-sm font-semibold text-amber-300">{currentTier.name} Member</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-pink-400 flex items-center justify-center shadow-lg animate-float">
              <Trophy size={36} className="text-white" />
            </div>
          </div>

          {/* Progress to next tier */}
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

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-lg cursor-pointer">
              <QrCode size={16} />
              Show QR
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm">
              History <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tiers — Colorful cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {tiers.map((tier, idx) => {
          const isActive = points >= tier.min;
          const Icon = tier.icon;
          return (
            <div
              key={tier.name}
              className={`glass-card p-5 text-center transition-all duration-300 hover:-translate-y-1 animate-scale-in stagger-${idx + 1} ${
                isActive ? 'shadow-lg' : 'opacity-60'
              }`}
              style={{
                animationFillMode: 'both',
                background: isActive ? `linear-gradient(135deg, var(--tw-gradient-stops))` : undefined,
              }}
            >
              <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-md ${isActive ? 'animate-float' : ''}`}
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

      {/* Available Rewards */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
          <Award size={14} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Available Rewards</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 shimmer rounded-2xl" />
                <div className="flex-1">
                  <div className="h-4 shimmer rounded w-1/3 mb-2" />
                  <div className="h-3 shimmer rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <div className="glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-bl-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center mx-auto mb-4 animate-float">
            <Zap size={32} className="text-amber-500" />
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">No rewards available yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Keep visiting to unlock exclusive rewards!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((reward, idx) => {
            const canRedeem = points >= reward.points_cost;
            return (
              <div
                key={reward.id}
                className={`glass-card p-6 flex items-center gap-5 hover:shadow-lg transition-all duration-300 animate-slide-up stagger-${Math.min(idx + 1, 6)}`}
                style={{ animationFillMode: 'both' }}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
                  canRedeem ? 'bg-gradient-to-br from-amber-400 to-pink-400' : 'bg-gray-100'
                }`}>
                  <Gift size={24} className={canRedeem ? 'text-white' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--color-text-primary)]">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">{reward.description}</p>
                  )}
                  <p className="text-xs text-amber-500 font-bold mt-1">{reward.points_cost} points</p>
                </div>
                <button
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 ${
                    canRedeem
                      ? 'btn-pink hover:scale-105'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!canRedeem}
                >
                  {canRedeem ? 'Redeem' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
