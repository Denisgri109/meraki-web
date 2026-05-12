'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Gift, Star, Trophy, Sparkles, ArrowRight, QrCode, Crown, Zap, Award, X, Loader2, History, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
}

interface LoyaltyTransaction {
  id: string;
  description: string | null;
  type: string;
  points: number;
  created_at: string | null;
}

export default function LoyaltyPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Code modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const { showToast } = useToast();

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

  const handleShowQr = useCallback(async () => {
    setShowQrModal(true);
    setQrLoading(true);
    setQrError(null);
    setQrToken(null);

    try {
      const { data, error } = await supabase.rpc('get_my_qr_code');

      if (error) {
        console.error('[Loyalty] QR code error:', error);
        setQrError(error.message || 'Failed to load QR code');
        return;
      }

      if (!data) {
        setQrError('No QR code available. Please try again later.');
        return;
      }

      setQrToken(data as string);
    } catch (err) {
      console.error('[Loyalty] QR code unexpected error:', err);
      setQrError('Something went wrong. Please try again.');
    } finally {
      setQrLoading(false);
    }
  }, [supabase]);

  const handleRedeem = async (reward: LoyaltyReward) => {
    if (points < reward.points_cost) { showToast('Not enough points', 'error'); return; }
    if (!confirm(`Redeem "${reward.name}" for ${reward.points_cost} points?`)) return;
    setRedeeming(reward.id);
    try {
      const { error } = await supabase.rpc('redeem_reward', { p_reward_id: reward.id } as any);
      if (error) throw error;
      setPoints((prev) => prev - reward.points_cost);
      showToast(`"${reward.name}" redeemed! 🎉`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Redemption failed', 'error');
    } finally {
      setRedeeming(null);
    }
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) console.error('[Loyalty] history error:', error);
      setTransactions((data as LoyaltyTransaction[]) || []);
    } catch (err) {
      console.error('[Loyalty] history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

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
      {/* QR Code Modal */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))',
              borderRadius: '28px',
              padding: '40px',
              maxWidth: '380px',
              width: '90%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.3s ease-out',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
            >
              <X size={18} color="#666" />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                }}
              >
                <QrCode size={28} color="white" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Your Loyalty QR
              </h3>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
                Show this to earn points on your next visit
              </p>
            </div>

            {/* QR Content */}
            {qrLoading ? (
              <div style={{ padding: '50px 0' }}>
                <Loader2
                  size={40}
                  color="#f59e0b"
                  style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}
                />
                <p style={{ fontSize: '14px', color: '#888', marginTop: '16px' }}>Loading your QR code…</p>
              </div>
            ) : qrError ? (
              <div style={{ padding: '30px 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <X size={24} color="#ef4444" />
                </div>
                <p style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>{qrError}</p>
                <button
                  onClick={handleShowQr}
                  style={{
                    marginTop: '16px',
                    padding: '10px 24px',
                    borderRadius: '100px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : qrToken ? (
              <div>
                <div
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'inline-block',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <QRCodeSVG
                    value={qrToken}
                    size={200}
                    level="H"
                    bgColor="white"
                    fgColor="#1a1a1a"
                    style={{ display: 'block' }}
                  />
                </div>
                <p style={{
                  fontSize: '11px',
                  color: '#aaa',
                  marginTop: '16px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  wordBreak: 'break-all',
                  padding: '0 20px',
                }}>
                  {qrToken.substring(0, 8)}…{qrToken.substring(qrToken.length - 8)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

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
            <button
              onClick={handleShowQr}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              <QrCode size={16} />
              Show QR
            </button>
            <button
              onClick={handleShowHistory}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm"
            >
              <History size={14} /> History
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
                isActive ? 'shadow-lg gradient-border-glow' : 'opacity-60'
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
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || redeeming === reward.id}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 cursor-pointer ${
                    canRedeem
                      ? 'btn-pink hover:scale-105'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {redeeming === reward.id ? <Loader2 size={14} className="animate-spin" /> : canRedeem ? 'Redeem' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={() => setShowHistory(false)}>
          <div className="p-6 w-full max-w-lg min-w-[340px] max-h-[70vh] overflow-y-auto animate-scale-in rounded-2xl shadow-2xl" style={{ background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2"><History size={20} /> Points History</h2>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] cursor-pointer"><X size={18} /></button>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
                <p className="text-sm text-[var(--color-text-muted)]">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-light)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{tx.description || tx.type}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{new Date(tx.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-sm font-bold ${tx.points > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS animations for the modal */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
