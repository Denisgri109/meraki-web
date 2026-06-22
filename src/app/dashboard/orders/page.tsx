/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import {
  Package, Search, ChevronDown, X,
  Truck, Clock, CheckCircle2, XCircle, AlertTriangle,
  ShoppingBag, MapPin, CreditCard, Loader2, Eye,
  Send, MessageSquare, ExternalLink, RotateCcw,
} from 'lucide-react';

/* ─── types ─────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  is_read: boolean;
}

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  shipping_status: string | null;
  total: number;
  shipping_cost: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  customer?: { full_name: string | null; email: string | null } | null;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
const SHIPPING_STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'returned'] as const;

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending:    { color: 'text-amber-700',   bg: 'bg-amber-50',   icon: Clock },
  confirmed:  { color: 'text-blue-700',    bg: 'bg-blue-50',    icon: CheckCircle2 },
  processing: { color: 'text-blue-700',    bg: 'bg-blue-50',    icon: Package },
  shipped:    { color: 'text-purple-700',  bg: 'bg-purple-50',  icon: Truck },
  delivered:  { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  cancelled:  { color: 'text-red-700',     bg: 'bg-red-50',     icon: XCircle },
  refunded:   { color: 'text-gray-700',    bg: 'bg-gray-100',   icon: AlertTriangle },
  packed:     { color: 'text-indigo-700',  bg: 'bg-indigo-50',  icon: Package },
  in_transit: { color: 'text-sky-700',     bg: 'bg-sky-50',     icon: Truck },
  returned:   { color: 'text-rose-700',    bg: 'bg-rose-50',    icon: RotateCcw },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg}`}>
      <Icon size={12} /> {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── main component ───────────────────────────────────── */
export default function OrdersPage() {
  const { role, user } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const isOwner = role === 'owner';
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Undo states
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Confirmation states
  const [pendingShippingStatus, setPendingShippingStatus] = useState<string | null>(null);

  // Chat states
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
    };
  }, [undoTimeoutId]);

  // Load conversation when selectedOrder changes (Owner only)
  useEffect(() => {
    if (!selectedOrder || !isOwner || !user) {
      setConversationId(null);
      setChatMessages([]);
      return;
    }

    const initChat = async () => {
      setLoadingChat(true);
      try {
        const { data: convo } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', selectedOrder.user_id)
          .eq('master_id', user.id)
          .maybeSingle();

        if (convo) {
          setConversationId(convo.id);
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: true });
          
          setChatMessages((msgs as unknown as ChatMessage[]) || []);
        } else {
          setConversationId(null);
          setChatMessages([]);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
      } finally {
        setLoadingChat(false);
      }
    };

    initChat();
  }, [selectedOrder, isOwner, user, supabase]);

  // Realtime subscription for inline chat
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`inline_chat_${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMsg = payload.new as unknown as ChatMessage;
        setChatMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Scroll inline chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*), customer:profiles!orders_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      // Clients only see their own orders
      if (!isOwner) {
        query = query.eq('user_id', user?.id ?? '');
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch (err) {
      console.error('[Orders] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOrderStatus = async (orderId: string, field: 'status' | 'shipping_status', value: string) => {
    if (field === 'shipping_status') {
      setPendingShippingStatus(value);
      return;
    }
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [field]: value, updated_at: new Date().toISOString() } as never)
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, [field]: value } : null);
      }
      showToast(`Order status updated`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateShippingStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setPendingShippingStatus(null);
    
    const oldStatus = selectedOrder.shipping_status || 'pending';
    setPreviousStatus(oldStatus);
    
    setUpdatingId(selectedOrder.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq('id', selectedOrder.id);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, shipping_status: newStatus } : o));
      setSelectedOrder(prev => prev ? { ...prev, shipping_status: newStatus } : null);
      
      setShowUndoBanner(true);
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
      const timeout = setTimeout(() => {
        setShowUndoBanner(false);
        setPreviousStatus(null);
      }, 8000);
      setUndoTimeoutId(timeout);
      
      showToast(`Shipping status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update shipping status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUndoShippingStatus = async () => {
    if (!previousStatus || !selectedOrder) return;
    setShowUndoBanner(false);
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    
    setUpdatingId(selectedOrder.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_status: previousStatus, updated_at: new Date().toISOString() } as never)
        .eq('id', selectedOrder.id);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, shipping_status: previousStatus } : o));
      setSelectedOrder(prev => prev ? { ...prev, shipping_status: previousStatus } : null);
      setPreviousStatus(null);
      showToast('Shipping status change undone', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to undo shipping status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedOrder || !user) return;
    setSendingMessage(true);
    try {
      let currentConvoId = conversationId;

      if (!currentConvoId) {
        const { data: newConvo, error: convoErr } = await supabase
          .from('conversations')
          .insert({ client_id: selectedOrder.user_id, master_id: user.id })
          .select()
          .single();

        if (convoErr) throw convoErr;
        currentConvoId = newConvo.id;
        setConversationId(newConvo.id);
      }

      const { data: newMsg, error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConvoId,
          sender_id: user.id,
          content: chatInput.trim()
        })
        .select()
        .single();

      if (msgErr) throw msgErr;

      setChatMessages(prev => {
        const typedMsg = newMsg as unknown as ChatMessage;
        if (prev.some(m => m.id === typedMsg.id)) return prev;
        return [...prev, typedMsg];
      });
      setChatInput('');

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', currentConvoId);

    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const redirectToFullChat = () => {
    if (!conversationId) return;
    localStorage.setItem('meraki_active_chat_convo_id', conversationId);
    router.push('/dashboard/chat');
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.filter(o => !['cancelled', 'refunded'].includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const shippedCount = orders.filter(o => o.status === 'shipped' || o.shipping_status === 'shipped').length;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={22} className="text-[var(--color-brand-pink-dark)]" />
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
              {isOwner ? 'All Orders' : 'My Orders'}
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            {isOwner ? 'Platform-wide order management' : 'Track your order status'}
          </p>
        </div>
      </div>

      {/* Stats (owner only) */}
      {isOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ShoppingBag size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{orders.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Orders</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Pending</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
              <Truck size={20} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-cyan-600">{shippedCount}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Shipped</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CreditCard size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">£{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Revenue</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text" placeholder="Search by order ID or customer..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-glass pl-11 w-full"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-glass pr-8 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="glass-card overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-[var(--color-border-light)] animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-light)]" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--color-surface-light)] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[var(--color-surface-light)] rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Package size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">No orders found</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Orders will appear here once placed</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface-light)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            <div className="col-span-3">Order</div>
            <div className="col-span-2">{isOwner ? 'Customer' : 'Items'}</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Shipping</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1 text-right">Details</div>
          </div>

          {filtered.map(order => (
            <div
              key={order.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-light)]/50 transition-colors items-center cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="col-span-3">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatDate(order.created_at)}</p>
              </div>
              <div className="col-span-2 text-sm text-[var(--color-text-secondary)] truncate">
                {isOwner
                  ? (order.customer?.full_name || order.shipping_name || 'Unknown')
                  : `${order.order_items?.length || 0} item${(order.order_items?.length || 0) !== 1 ? 's' : ''}`}
              </div>
              <div className="col-span-2">
                <StatusBadge status={order.status} />
              </div>
              <div className="col-span-2">
                <StatusBadge status={order.shipping_status || 'pending'} />
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-[var(--color-text-primary)]">
                £{Number(order.total).toFixed(2)}
              </div>
              <div className="col-span-1 text-right">
                <button className="w-8 h-8 rounded-full hover:bg-[var(--color-surface-light)] flex items-center justify-center cursor-pointer">
                  <Eye size={16} className="text-[var(--color-text-muted)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Order Detail Drawer ──────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-white w-full max-w-lg h-full overflow-y-auto animate-fade-in shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[var(--color-border-light)] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Order Details</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 rounded-full hover:bg-[var(--color-surface-light)] flex items-center justify-center cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Undo Banner */}
            {showUndoBanner && previousStatus && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between animate-fade-in shrink-0">
                <div className="flex items-center gap-2 text-emerald-800 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Status updated to <span className="font-semibold capitalize">{(selectedOrder.shipping_status || '').replace('_', ' ')}</span></span>
                </div>
                <button 
                  onClick={handleUndoShippingStatus}
                  disabled={updatingId === selectedOrder.id}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase px-2.5 py-1 bg-emerald-100/50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                >
                  Undo
                </button>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Status cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[var(--color-surface-light)] p-4">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Order Status</p>
                  {isOwner ? (
                    <select
                      value={selectedOrder.status}
                      onChange={e => updateOrderStatus(selectedOrder.id, 'status', e.target.value)}
                      disabled={updatingId === selectedOrder.id}
                      className="input-glass text-sm w-full cursor-pointer"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  ) : (
                    <StatusBadge status={selectedOrder.status} />
                  )}
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-light)] p-4">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Shipping Status</p>
                  {isOwner ? (
                    <select
                      value={selectedOrder.shipping_status || 'pending'}
                      onChange={e => updateOrderStatus(selectedOrder.id, 'shipping_status', e.target.value)}
                      disabled={updatingId === selectedOrder.id}
                      className="input-glass text-sm w-full cursor-pointer"
                    >
                      {SHIPPING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
                    </select>
                  ) : (
                    <StatusBadge status={selectedOrder.shipping_status || 'pending'} />
                  )}
                </div>
              </div>

              {/* Visual Shipping Timeline & Action Button */}
              <div className="rounded-2xl bg-[var(--color-surface-light)] p-5 border border-[var(--color-border-light)]/50">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 text-center">Fulfillment Progress</p>
                <div className="flex justify-between items-center relative px-2 mb-6">
                  {/* Progress Line */}
                  <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0" />
                  {(() => {
                    const flow = ['pending', 'processing', 'shipped', 'delivered'];
                    const currentIdx = flow.indexOf(selectedOrder.shipping_status || 'pending');
                    const percentage = currentIdx <= 0 ? 0 : (currentIdx / (flow.length - 1)) * 80;
                    return (
                      <div 
                        className="absolute top-[18px] left-[10%] h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 -z-0"
                        style={{ width: `${percentage}%` }}
                      />
                    );
                  })()}

                  {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                    const flow = ['pending', 'processing', 'shipped', 'delivered'];
                    const currentIdx = flow.indexOf(selectedOrder.shipping_status || 'pending');
                    const isActive = idx <= currentIdx;
                    const isCurrent = step === (selectedOrder.shipping_status || 'pending');
                    
                    const cfg = statusConfig[step] || statusConfig.pending;
                    const Icon = cfg.icon;

                    return (
                      <div key={step} className="flex flex-col items-center z-10 flex-1 relative">
                        <button
                          onClick={() => {
                            if (isOwner && updatingId !== selectedOrder.id) {
                              setPendingShippingStatus(step);
                            }
                          }}
                          disabled={!isOwner || updatingId === selectedOrder.id}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isCurrent ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : ''
                          } ${
                            isActive 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' 
                              : 'bg-white text-gray-400 border border-gray-200'
                          }`}
                        >
                          <Icon size={14} />
                        </button>
                        <span className={`text-[10px] font-bold mt-2 text-center capitalize ${
                          isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isOwner && (() => {
                  const flow = ['pending', 'processing', 'shipped', 'delivered'];
                  const currentIdx = flow.indexOf(selectedOrder.shipping_status || 'pending');
                  const nextStatus = currentIdx >= 0 && currentIdx < flow.length - 1 ? flow[currentIdx + 1] : null;
                  if (!nextStatus) return null;
                  
                  return (
                    <button
                      onClick={() => setPendingShippingStatus(nextStatus)}
                      disabled={updatingId === selectedOrder.id}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-95"
                    >
                      <Truck size={16} />
                      Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </button>
                  );
                })()}
              </div>

              {updatingId === selectedOrder.id && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Loader2 size={14} className="animate-spin" /> Updating…
                </div>
              )}

              {/* Order progress (client view) */}
              {!isOwner && (
                <div className="rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Order Progress</p>
                  <div className="space-y-3">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, i, arr) => {
                      const currentIdx = arr.indexOf(selectedOrder.status);
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            done ? 'bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-sm' :
                            active ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-sm animate-pulse' :
                            'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]'
                          }`}>
                            {done && !active ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                          </div>
                          <span className={`text-sm font-medium capitalize ${done ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                            {step.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                  Items ({selectedOrder.order_items?.length || 0})
                </p>
                <div className="space-y-2">
                  {(selectedOrder.order_items || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-light)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                          <Package size={16} className="text-[var(--color-brand-pink-dark)]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.product_name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">£{Number(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Info */}
              {(selectedOrder.shipping_name || selectedOrder.shipping_address) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Shipping</p>
                  <div className="rounded-2xl bg-[var(--color-surface-light)] p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-[var(--color-text-muted)] mt-0.5 shrink-0" />
                      <div className="text-sm text-[var(--color-text-primary)]">
                        <p className="font-medium">{selectedOrder.shipping_name}</p>
                        {selectedOrder.shipping_address && <p>{selectedOrder.shipping_address}</p>}
                        <p>{[selectedOrder.shipping_city, selectedOrder.shipping_postal_code, selectedOrder.shipping_country].filter(Boolean).join(', ')}</p>
                        {selectedOrder.shipping_phone && <p className="text-[var(--color-text-muted)]">{selectedOrder.shipping_phone}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-[var(--color-border-light)] pt-4 space-y-2">
                {Number(selectedOrder.shipping_cost) > 0 && (
                  <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                    <span>Shipping</span>
                    <span>£{Number(selectedOrder.shipping_cost).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-[var(--color-text-primary)]">
                  <span>Total</span>
                  <span>£{Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Notes</p>
                  <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-light)] rounded-xl p-3">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Payment ref */}
              {isOwner && selectedOrder.stripe_payment_intent_id && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Payment Reference</p>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-surface-light)] rounded-xl p-3 break-all">
                    {selectedOrder.stripe_payment_intent_id}
                  </p>
                </div>
              )}

              {/* Message Consumer (Owner only) */}
              {isOwner && (
                <div className="border-t border-[var(--color-border-light)] pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-[var(--color-brand-pink-dark)]" />
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Message Customer
                      </p>
                    </div>
                    {conversationId && (
                      <button
                        onClick={redirectToFullChat}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        Open in Full Chat <ExternalLink size={12} />
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border-light)] bg-gray-50/50 overflow-hidden flex flex-col">
                    {/* Chat Messages List */}
                    <div 
                      ref={chatContainerRef}
                      className="p-4 max-h-60 overflow-y-auto space-y-2 flex flex-col bg-white/50 min-h-[120px]"
                    >
                      {loadingChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] py-8">
                          <Loader2 size={18} className="animate-spin mb-2" />
                          Loading conversation...
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] py-8 text-center px-4">
                          <MessageSquare size={24} className="opacity-30 mb-2 mx-auto" />
                          <p className="font-semibold">No messages yet</p>
                          <p className="text-[11px] mt-0.5">Send a message to start the conversation.</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[80%] ${
                                isMine ? 'self-end items-end' : 'self-start items-start'
                              }`}
                            >
                              <div
                                className={`px-3 py-2 rounded-2xl text-xs ${
                                  isMine
                                    ? 'bg-gradient-to-br from-[var(--color-brand-pink)] to-purple-500 text-white rounded-tr-none'
                                    : 'bg-gray-100 text-[var(--color-text-primary)] rounded-tl-none border border-gray-200/50'
                                }`}
                              >
                                {msg.content}
                              </div>
                              <span className="text-[9px] text-[var(--color-text-muted)] mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input Field */}
                    <div className="border-t border-[var(--color-border-light)] p-2 bg-white flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Type a message regarding this order..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                        disabled={sendingMessage || loadingChat}
                        className="flex-1 text-xs bg-gray-50 rounded-xl px-3 py-2 outline-none border border-gray-100 focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || sendingMessage || loadingChat}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-brand-pink)] to-purple-500 text-white flex items-center justify-center transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                      >
                        {sendingMessage ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingShippingStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[var(--color-border-light)] shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <Truck size={28} />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Update Shipping Status</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to mark this order as <span className="font-bold text-indigo-600 capitalize">{pendingShippingStatus}</span>?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setPendingShippingStatus(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-[var(--color-text-primary)] rounded-xl font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateShippingStatus(pendingShippingStatus)}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
