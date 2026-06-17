'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useModal } from '@/contexts/ModalContext';

import { StampCardsList } from './components/client-view/StampCardsList';
import { UserRewards } from './components/client-view/UserRewards';
import {
  Gift, QrCode, Loader2, Camera, Layers,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export interface StampCard {
  stamp_id: string;
  card_id: string;
  card_name: string;
  card_description: string | null;
  master_id: string;
  master_name: string;
  master_avatar: string | null;
  stamps_collected: number;
  stamps_required: number;
  stamps_redeemed: number;
  reward_type: string;
  reward_value: number | null;
  reward_available: boolean;
  last_stamp_at: string | null;
}

export interface UserCredit {
  id: string;
  credit_type: string;
  amount: number;
  description: string | null;
  is_used: boolean | null;
  expires_at: string | null;
  created_at: string | null;
}

function formatRewardValue(credit: UserCredit) {
  if (credit.credit_type === 'discount' || credit.credit_type === 'discount_amount') {
    return `€${credit.amount} Off`;
  }
  if (credit.credit_type === 'discount_percent') {
    return `${credit.amount}% Off`;
  }
  return credit.description || 'Reward';
}

function partitionCredits(credits: UserCredit[]) {
  const now = Date.now();
  return credits.reduce(
    (acc, c) => {
      const isExpired = c.is_used || (c.expires_at != null && Date.parse(c.expires_at) <= now);
      if (isExpired) acc.expiredCredits.push(c);
      else acc.activeCredits.push(c);
      return acc;
    },
    { activeCredits: [] as UserCredit[], expiredCredits: [] as UserCredit[] }
  );
}

function stampCardRewardText(card: StampCard) {
  switch (card.reward_type) {
    case 'free_service':
      return 'Free Service';
    case 'discount_percent':
      return `${card.reward_value ?? ''}% Off`;
    case 'discount_amount':
      return `€${card.reward_value ?? ''} Off`;
    default:
      return 'Reward';
  }
}

export default function LoyaltyPage() {
  const { user, role } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const { showConfirm } = useModal();

  const isMasterOrOwner = role === 'master' || role === 'owner';

  // Shared
  const [loading, setLoading] = useState(true);

  // Client state
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredit[]>([]);
  const [activeCreditsTab, setActiveCreditsTab] = useState<'active' | 'expired'>('active');

  // Master/Owner state
  const [stampsToday, setStampsToday] = useState(0);

  // ── Fetch data based on role ───────────────────────────────────────────
  const fetchClientData = useCallback(async () => {
    if (!user) return;
    try {
      // Stamp cards
      const { data: cardsData, error: cardsError } = await supabase.rpc('get_client_stamp_cards', {
        p_client_id: user.id,
      });
      if (cardsError) console.error('[Loyalty] stamp cards error:', cardsError);
      setStampCards((cardsData as unknown as StampCard[]) || []);

      // User credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setUserCredits((creditsData as unknown as UserCredit[]) || []);
    } catch (err) {
      console.error('[Loyalty] client fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const fetchMasterData = useCallback(async () => {
    if (!user) return;
    try {
      // Stamps given today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: stamps, error: stampsErr } = await supabase
        .from('stamp_history')
        .select('id, client_stamps!inner(master_id)')
        .eq('action', 'earned')
        .eq('client_stamps.master_id', user.id)
        .gte('created_at', today.toISOString());
      if (stampsErr) console.error('[Loyalty] stamps today error:', stampsErr);
      setStampsToday((stamps as unknown as unknown[])?.length || 0);
    } catch (err) {
      console.error('[Loyalty] master fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    if (isMasterOrOwner) {
      void fetchMasterData();
    } else {
      void fetchClientData();
    }
  }, [user, isMasterOrOwner, fetchClientData, fetchMasterData]);

  // ── Client actions ─────────────────────────────────────────────────────
  const handleRedeemStampCard = async (card: StampCard) => {
    if (!user || !card.reward_available) return;
    if (!(await showConfirm(`Redeem your reward from ${card.master_name}?`, 'Redeem Stamp Card Reward', 'Redeem', 'Cancel', 'info'))) return;
    try {
      const { data, error } = await supabase.rpc('redeem_stamp_card', {
        p_client_stamp_id: card.stamp_id,
        p_client_id: user.id,
      });
      if (error) throw error;
      const result = data as { success?: boolean; message?: string } | null;
      if (result?.success) {
        showToast(result.message || 'Reward redeemed!', 'success');
        fetchClientData();
      } else {
        showToast(result?.message || 'Failed to redeem', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to redeem', 'error');
    }
  };

  const { activeCredits, expiredCredits } = useMemo(
    () => partitionCredits(userCredits),
    [userCredits],
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="glass-card p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-brand-pink-dark)]" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-[var(--radius-2xl)] overflow-hidden mb-10 h-[220px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1600&q=80&auto=format&fit=crop"
          alt="Rewards"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={18} className="text-amber-300" />
            <span className="text-xs tracking-[0.2em] uppercase text-amber-300 font-bold">Rewards</span>
          </div>
          <h1 className="text-4xl font-bold drop-shadow-lg">
            {isMasterOrOwner ? 'Reward Your Clients' : 'Earn & Redeem'}
          </h1>
          <p className="text-white/80 text-sm mt-2 max-w-md">
            {isMasterOrOwner
              ? 'Show your QR for clients to collect stamps and manage your stamp cards'
              : 'Collect stamps with every visit and unlock exclusive rewards'}
          </p>
        </div>
      </div>

      {isMasterOrOwner ? (
        <MasterView
          stampsToday={stampsToday}
        />
      ) : (
        <ClientView
          stampCards={stampCards}
          activeCreditsTab={activeCreditsTab}
          setActiveCreditsTab={setActiveCreditsTab}
          activeCredits={activeCredits}
          expiredCredits={expiredCredits}
          onRedeemStampCard={handleRedeemStampCard}
        />
      )}
    </div>
  );
}

// ─── Client View ───────────────────────────────────────────────────────────
function ClientView({
  stampCards,
  activeCreditsTab,
  setActiveCreditsTab,
  activeCredits,
  expiredCredits,
  onRedeemStampCard,
}: {
  stampCards: StampCard[];
  activeCreditsTab: 'active' | 'expired';
  setActiveCreditsTab: (t: 'active' | 'expired') => void;
  activeCredits: UserCredit[];
  expiredCredits: UserCredit[];
  onRedeemStampCard: (c: StampCard) => void;
}) {
  const displayedCredits = activeCreditsTab === 'active' ? activeCredits : expiredCredits;

  const activeStampCardsCount = stampCards.filter(c => c.stamps_collected < c.stamps_required).length;

  return (
    <>
      {/* Client Quick Action & Status Card */}
      <div className="rounded-[var(--radius-2xl)] p-8 mb-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">My Active Stamp Cards</p>
            <p className="text-6xl font-bold">{activeStampCardsCount}</p>
            <p className="text-sm text-white/70 mt-1">Cards currently in progress</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard/loyalty/scan"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              <Camera size={16} />
              Scan QR / NFC Tag
            </Link>
          </div>
        </div>
      </div>

      <StampCardsList
        stampCards={stampCards}
        onRedeemStampCard={onRedeemStampCard}
        stampCardRewardText={stampCardRewardText}
      />

      <UserRewards
        activeCreditsTab={activeCreditsTab}
        setActiveCreditsTab={setActiveCreditsTab}
        displayedCredits={displayedCredits}
        formatRewardValue={formatRewardValue}
      />
    </>
  );
}

// ─── Master / Owner View ────────────────────────────────────────
function MasterView({
  stampsToday,
}: {
  stampsToday: number;
}) {
  return (
    <>
      {/* QR + Stats Card */}
      <div className="rounded-[var(--radius-2xl)] p-8 mb-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">Stamps Given Today</p>
            <p className="text-6xl font-bold">{stampsToday}</p>
            <p className="text-sm text-white/70 mt-1">+1 stamp per completed appointment</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard/loyalty/qr"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              <QrCode size={16} />
              Show my QR
            </Link>
            <Link
              href="/dashboard/loyalty/cards"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all backdrop-blur-sm cursor-pointer"
            >
              <Layers size={14} />
              Loyalty cards
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
