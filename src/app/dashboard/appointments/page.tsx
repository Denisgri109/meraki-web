'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSection } from '@/contexts/SectionContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, Clock, User, ChevronRight, ArrowRight, X,
  Shield, ShieldAlert, Sparkles, MessageSquare, Check, AlertTriangle,
  HelpCircle, CheckCircle, Info, DollarSign, CalendarDays,
  UserCheck, AlertCircle, CalendarRange, Clock3, Loader2, Trash2,
  ChevronLeft, ArrowLeft, Settings
} from 'lucide-react';
import Link from 'next/link';

type TabValue = 'upcoming' | 'past' | 'cancelled';

interface MasterAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlockedSlot {
  start_time: string;
  end_time: string;
}

interface PilatesHost {
  id: string;
  display_name: string;
  profile_id: string | null;
}

interface PilatesBooking {
  id: string;
  status: string;
}

interface PilatesSession {
  id: string;
  service_id: string;
  owner_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: string;
  level: string;
  host: PilatesHost | null;
  pilates_session_bookings: PilatesBooking[] | null;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_AVAILABILITY_START = '09:00';
const DEFAULT_AVAILABILITY_END = '19:00';

const normalizeTimeString = (value: string | null | undefined) => {
  if (!value) return '';
  const trimmed = value.slice(0, 5);
  return TIME_PATTERN.test(trimmed) ? trimmed : '';
};

const generateTimeSlotsForRange = (start: string, end: string) => {
  const startNorm = normalizeTimeString(start) || DEFAULT_AVAILABILITY_START;
  const endNorm = normalizeTimeString(end) || DEFAULT_AVAILABILITY_END;
  const [startHour, startMin] = startNorm.split(':').map(Number);
  const [endHour, endMin] = endNorm.split(':').map(Number);
  const slots: string[] = [];
  let hour = startHour;
  let minute = startMin;
  while (hour < endHour || (hour === endHour && minute <= endMin)) {
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    minute += 30;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
};

const getStartOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateFromKey = (dateKey: string) => {
  if (!DATE_KEY_PATTERN.test(dateKey)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const isSelectableDateKey = (dateKey: string) => {
  const date = getDateFromKey(dateKey);
  return Boolean(date && date >= getStartOfToday());
};

const getAppointmentDateTime = (dateKey: string, time: string) => {
  if (!isSelectableDateKey(dateKey) || !TIME_PATTERN.test(time)) return null;
  const date = getDateFromKey(dateKey);
  if (!date) return null;
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return date;
};

const buildCalendarWeeks = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDay = new Date(firstDay);
  startDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + weekIndex * 7 + dayIndex);
      return date;
    })
  );
};

const formatDateLabel = (dateKey: string) => {
  const date = getDateFromKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
};

interface Appointment {
  id: string;
  client_id: string;
  master_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  service_name: string | null;
  service_category: string | null;
  price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  client_confirmed: boolean;
  confirmation_deadline: string | null;
  requires_confirmation: boolean;
  proposed_start_time: string | null;
  proposed_end_time: string | null;
  reschedule_initiated_by: string | null;
  cancellation_fee_amount: number;
  cancellation_reason: string | null;
  no_show_charge_amount: number | null;
  no_show_processed_at: string | null;
  stripe_payment_intent_id: string | null;
  service_duration_minutes: number | null;
  payment_hold_amount: number | null;
  service?: { name: string; base_price?: number; duration_minutes?: number; description?: string; category?: string } | null;
  master?: { id: string; full_name: string; avatar_url: string | null; specialties: string[] | null; push_token: string | null } | null;
  client?: { id: string; full_name: string; avatar_url: string | null; email: string; phone: string | null } | null;
}

interface AppointmentConfirmation {
  id: string;
  appointment_id: string;
  confirmed: boolean | null;
  confirmed_at: string | null;
  reminder_sent_at: string | null;
  responded_at: string | null;
  response_type: string | null;
  no_show_charge_captured: boolean | null;
  no_show_charge_receipt_url: string | null;
  grace_period_ends_at: string | null;
  client_arrived_at: string | null;
  client_arrived_late: boolean | null;
}

interface MasterSettings {
  id: string;
  master_id: string;
  confirmation_timing_hours: number | null;
  cancellation_charge_percent: number | null;
  late_cancellation_window_hours: number | null;
  no_show_charge_percent: number | null;
  late_arrival_minutes: number | null;
  grace_period_multiplier: number | null;
  auto_charge_after_grace_period: boolean | null;
  require_tc_acceptance: boolean | null;
}

const tabs: { label: string; value: TabValue; color: string }[] = [
  { label: 'Upcoming', value: 'upcoming', color: 'from-emerald-400 to-teal-400' },
  { label: 'Past', value: 'past', color: 'from-blue-400 to-indigo-400' },
  { label: 'Cancelled', value: 'cancelled', color: 'from-red-400 to-rose-400' },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'completed': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'cancelled': return 'bg-red-50 text-red-500 border-red-200';
    case 'no_show': return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'reschedule_pending': return 'bg-violet-50 text-violet-600 border-violet-200';
    default: return 'bg-gray-50 text-gray-500 border-gray-200';
  }
}

export default function AppointmentsPage() {
  const { user, role } = useAuth();
  const supabase = createClient();
  const { buildPath } = useSection();
  const [activeTab, setActiveTab] = useState<TabValue>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Dynamic secondary details inside drawer
  const [confirmationData, setConfirmationData] = useState<AppointmentConfirmation | null>(null);
  const [settingsData, setSettingsData] = useState<MasterSettings | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sub-modal states inside drawer
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);

  // Reschedule Form Fields
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Late arrival input
  const [lateMinutesInput, setLateMinutesInput] = useState('15');
  const [showLateInputForm, setShowLateInputForm] = useState(false);

  // Client Rescheduling States
  const [showClientReschedule, setShowClientReschedule] = useState(false);
  const [clientRescheduleDate, setClientRescheduleDate] = useState<string>('');
  const [clientRescheduleTime, setClientRescheduleTime] = useState<string>('');
  const [clientRescheduleCalendarMonth, setClientRescheduleCalendarMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [clientRescheduleMasterAvailability, setClientRescheduleMasterAvailability] = useState<MasterAvailability[]>([]);
  const [clientRescheduleBlockedSlots, setClientRescheduleBlockedSlots] = useState<BlockedSlot[]>([]);
  const [clientRescheduleBookedSlotKeys, setClientRescheduleBookedSlotKeys] = useState<string[]>([]);
  const [clientIsFetchingSlots, setClientIsFetchingSlots] = useState(false);
  const [clientReschedulePilatesSessions, setClientReschedulePilatesSessions] = useState<PilatesSession[]>([]);
  const [clientLoadingPilates, setClientLoadingPilates] = useState(false);
  const [clientSelectedPilatesSessionId, setClientSelectedPilatesSessionId] = useState<string | null>(null);
  const [clientSubmittingReschedule, setClientSubmittingReschedule] = useState(false);

  const fetchAppointments = async () => {
    if (!user) { setLoading(false); return; }
    try {
      let query = supabase
        .from('appointments')
        .select(`
          id, client_id, master_id, service_id, start_time, end_time, status, notes, service_name, service_category,
          price, deposit_amount, deposit_paid, client_confirmed, confirmation_deadline,
          requires_confirmation, proposed_start_time, proposed_end_time, reschedule_initiated_by,
          cancellation_fee_amount, cancellation_reason, no_show_charge_amount, no_show_processed_at,
          stripe_payment_intent_id, service_duration_minutes, payment_hold_amount,
          service:services(name, base_price, duration_minutes, description, category),
          master:profiles!appointments_master_id_fkey(id, full_name, avatar_url, specialties, push_token),
          client:profiles!appointments_client_id_fkey(id, full_name, avatar_url, email, phone)
        `);

      if (role === 'master') {
        query = query.eq('master_id', user.id);
      } else if (role !== 'owner') {
        query = query.eq('client_id', user.id);
      }

      const { data, error } = await query
        .order('start_time', { ascending: activeTab === 'upcoming' });

      if (error) console.error('[Appointments] fetch error:', error);
      setAppointments((data as unknown as Appointment[]) || []);
    } catch (err) {
      console.error('[Appointments] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, activeTab]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectAppointment = async (apt: Appointment) => {
    setSelectedAppointment(apt);
    setLoadingDetails(true);
    setConfirmationData(null);
    setSettingsData(null);
    setShowCancelConfirm(false);
    setShowNoShowModal(false);
    setShowRescheduleForm(false);
    setShowLateInputForm(false);
    setShowClientReschedule(false);
    setClientRescheduleDate('');
    setClientRescheduleTime('');
    setClientSelectedPilatesSessionId(null);

    try {
      // 1. Fetch confirmations
      const { data: confirmVal } = await supabase
        .from('appointment_confirmations')
        .select('*')
        .eq('appointment_id', apt.id)
        .maybeSingle();
      if (confirmVal) setConfirmationData(confirmVal);

      // 2. Fetch master settings
      const { data: settingsVal } = await supabase
        .from('master_settings')
        .select('*')
        .eq('master_id', apt.master_id)
        .maybeSingle();
      if (settingsVal) setSettingsData(settingsVal);
    } catch (err) {
      console.error('[Appointments] error loading details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Check if late cancellation warning is required (within configured window)
  const isLateCancellation = (startTimeStr: string) => {
    const start = new Date(startTimeStr).getTime();
    const now = new Date().getTime();
    const diffHours = (start - now) / (1000 * 60 * 60);
    const windowHours = settingsData?.late_cancellation_window_hours ?? 24;
    return diffHours < windowHours && diffHours > 0;
  };

  // Perform client cancellation
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      const isLate = isLateCancellation(selectedAppointment.start_time);
      const chargePercent = settingsData?.cancellation_charge_percent ?? 50;
      const penaltyAmount = isLate ? Number(((selectedAppointment.price * chargePercent) / 100).toFixed(2)) : 0;

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_fee_amount: Math.round(penaltyAmount), // in pounds (matches price column)
          cancellation_reason: isLate ? 'Late cancellation under policy window' : 'Cancelled by Client',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      showToast(
        isLate 
          ? `Appointment cancelled. Late fee of €${penaltyAmount.toFixed(2)} recorded.`
          : 'Appointment cancelled successfully.',
        'success'
      );
      
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel appointment', 'error');
    }
  };

  // Attendance confirmations (Client)
  const handleClientConfirmation = async (confirmed: boolean) => {
    if (!selectedAppointment) return;
    try {
      const statusUpdate = confirmed ? 'confirmed' : 'cancelled';
      const { error } = await supabase
        .from('appointments')
        .update({
          client_confirmed: confirmed,
          status: statusUpdate,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      // Update confirmations table
      await supabase
        .from('appointment_confirmations')
        .upsert({
          appointment_id: selectedAppointment.id,
          confirmed: confirmed,
          responded_at: new Date().toISOString(),
          response_type: confirmed ? 'yes' : 'no'
        }, { onConflict: 'appointment_id' });

      showToast(confirmed ? 'Attendance confirmed!' : 'Attendance declined & booking cancelled.', 'success');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to submit confirmation', 'error');
    }
  };

  // Completion (Master) — also captures held payment if pre-authorized
  const handleMarkAsCompleted = async () => {
    if (!selectedAppointment) return;
    try {
      // If there's a held payment (pre-authorization), capture it via Stripe
      if (selectedAppointment.stripe_payment_intent_id) {
        const { data: captureData, error: captureError } = await supabase.functions.invoke('capture-payment', {
          body: {
            payment_intent_id: selectedAppointment.stripe_payment_intent_id,
          },
        });
        if (captureError) console.error('Payment capture error:', captureError);
        else if (captureData?.error) console.error('Stripe capture error:', captureData.error);
        // Continue even if capture fails — mark completed regardless
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      const msg = selectedAppointment.stripe_payment_intent_id
        ? 'Service completed & payment captured.'
        : 'Appointment marked as completed.';
      showToast(msg, 'success');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update appointment', 'error');
    }
  };

  // Direct Chat Navigation
  const handleDirectChat = async () => {
    if (!selectedAppointment || !user) return;
    const otherUserId = role === 'master' ? selectedAppointment.client_id : selectedAppointment.master_id;
    if (!otherUserId) return;

    try {
      // Look up existing conversation
      let { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},master_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},master_id.eq.${user.id})`)
        .maybeSingle();

      if (!convo) {
        // Create new conversation
        const clientId = role === 'master' ? otherUserId : user.id;
        const masterId = role === 'master' ? user.id : otherUserId;
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert({ client_id: clientId, master_id: masterId })
          .select('id')
          .single();
        if (error) throw error;
        convo = newConvo;
      }

      // Store in localStorage to trigger auto-activation on the messages page
      localStorage.setItem('meraki_active_chat_convo_id', convo.id);
      window.location.href = buildPath('chat');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to initiate chat', 'error');
    }
  };

  // Propose Reschedule (Master)
  const handleProposeReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      showToast('Please pick both date and time', 'error');
      return;
    }
    try {
      const propStart = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const duration = selectedAppointment.service?.duration_minutes ?? selectedAppointment.service_duration_minutes ?? 60;
      const propEnd = new Date(propStart.getTime() + duration * 60 * 1000);

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'reschedule_pending',
          proposed_start_time: propStart.toISOString(),
          proposed_end_time: propEnd.toISOString(),
          reschedule_initiated_by: user?.id,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;
      showToast('Reschedule proposal sent to client.', 'success');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to submit proposal', 'error');
    }
  };

  // Client Approval/Decline of Reschedule Proposal
  const handleRescheduleResponse = async (approve: boolean) => {
    if (!selectedAppointment) return;
    try {
      const isPilates = selectedAppointment.service_category === 'Pilates' || selectedAppointment.service?.category === 'Pilates';
      
      const updatePayload: any = {
        status: 'confirmed',
        proposed_start_time: null,
        proposed_end_time: null,
        reschedule_initiated_by: null,
        status_updated_at: new Date().toISOString()
      };

      let isApproved = false;
      let newSessionId = null;

      if (approve && selectedAppointment.proposed_start_time && selectedAppointment.proposed_end_time) {
        if (isPilates) {
          const { data: sessionData, error: sessionError } = await supabase
            .from('pilates_class_sessions')
            .select('id')
            .eq('starts_at', selectedAppointment.proposed_start_time)
            .eq('ends_at', selectedAppointment.proposed_end_time)
            .eq('service_id', selectedAppointment.service_id)
            .eq('status', 'scheduled')
            .maybeSingle();

          if (sessionError || !sessionData) {
            showToast('No matching scheduled Pilates session found for the proposed time.', 'error');
            return;
          }
          newSessionId = sessionData.id;
        }

        // Approve: commit proposed times
        updatePayload.start_time = selectedAppointment.proposed_start_time;
        updatePayload.end_time = selectedAppointment.proposed_end_time;
        isApproved = true;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      if (isApproved && isPilates && newSessionId) {
        const { error: bookingError } = await supabase
          .from('pilates_session_bookings')
          .update({ session_id: newSessionId })
          .eq('appointment_id', selectedAppointment.id);
        if (bookingError) throw bookingError;
      }

      showToast(isApproved ? 'Reschedule request approved.' : 'Reschedule request declined.', 'success');

      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to submit response', 'error');
    }
  };

  const clientSelectedDayAvailability = useMemo(() => {
    if (!clientRescheduleDate) return null;
    const date = getDateFromKey(clientRescheduleDate);
    if (!date) return null;
    const dayOfWeek = date.getDay();
    return (
      clientRescheduleMasterAvailability.find((a) => a.day_of_week === dayOfWeek && a.is_available) || null
    );
  }, [clientRescheduleDate, clientRescheduleMasterAvailability]);

  const clientTimeSlots = useMemo(() => {
    const isPilates = selectedAppointment?.service_category === 'Pilates';
    if (isPilates) return [];
    if (!clientSelectedDayAvailability) return [];
    return generateTimeSlotsForRange(
      clientSelectedDayAvailability.start_time,
      clientSelectedDayAvailability.end_time
    );
  }, [selectedAppointment, clientSelectedDayAvailability]);

  const parsedClientBlockedSlots = useMemo(() => {
    return clientRescheduleBlockedSlots.map(blocked => ({
      start: new Date(blocked.start_time).getTime(),
      end: new Date(blocked.end_time).getTime()
    }));
  }, [clientRescheduleBlockedSlots]);

  const isClientTimeSlotDisabled = (time: string) => {
    if (!clientRescheduleDate || clientIsFetchingSlots) return true;
    const appointmentDate = getAppointmentDateTime(clientRescheduleDate, time);
    if (!appointmentDate) return true;
    if (clientRescheduleBookedSlotKeys.includes(time)) return true;

    const appointmentTime = appointmentDate.getTime();
    for (const blocked of parsedClientBlockedSlots) {
      if (appointmentTime >= blocked.start && appointmentTime < blocked.end) return true;
    }
    return false;
  };

  // Fetch booked slots when date selection changes
  useEffect(() => {
    if (!showClientReschedule || !selectedAppointment || !clientRescheduleDate || selectedAppointment.service_category === 'Pilates') {
      setClientRescheduleBookedSlotKeys([]);
      return;
    }
    let cancelled = false;
    const fetchBookedForReschedule = async () => {
      setClientIsFetchingSlots(true);
      try {
        const { data } = await supabase
          .from('appointments')
          .select('start_time')
          .eq('master_id', selectedAppointment.master_id)
          .neq('id', selectedAppointment.id)
          .gte('start_time', `${clientRescheduleDate}T00:00:00`)
          .lt('start_time', `${clientRescheduleDate}T23:59:59`)
          .in('status', ['pending', 'confirmed']);
        if (cancelled) return;
        
        const keys = ((data as { start_time: string }[]) || []).map((apt) => {
          const d = new Date(apt.start_time);
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        });
        setClientRescheduleBookedSlotKeys(keys);
      } catch (err) {
        if (!cancelled) console.error('Error fetching reschedule booked slots:', err);
      } finally {
        if (!cancelled) setClientIsFetchingSlots(false);
      }
    };
    fetchBookedForReschedule();
    return () => {
      cancelled = true;
    };
  }, [showClientReschedule, selectedAppointment, clientRescheduleDate, supabase]);

  const handleInitClientReschedule = async (apt: Appointment) => {
    setShowClientReschedule(true);
    setClientRescheduleDate('');
    setClientRescheduleTime('');
    setClientSelectedPilatesSessionId(null);
    setClientRescheduleMasterAvailability([]);
    setClientRescheduleBlockedSlots([]);
    setClientRescheduleBookedSlotKeys([]);
    setClientReschedulePilatesSessions([]);

    const isPilates = apt.service_category === 'Pilates';
    
    if (isPilates) {
      setClientLoadingPilates(true);
      try {
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        
        await supabase.rpc('ensure_pilates_sessions', {
          p_service_id: apt.service_id,
          p_start_date: startDate,
          p_end_date: endDate,
        });

        const { data, error } = await supabase
          .from('pilates_class_sessions')
          .select('*, host:pilates_hosts(*), pilates_session_bookings(id, status)')
          .eq('service_id', apt.service_id)
          .gte('starts_at', new Date().toISOString())
          .lt('starts_at', new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString())
          .eq('status', 'scheduled')
          .order('starts_at');

        if (error) throw error;
        setClientReschedulePilatesSessions((data as unknown as PilatesSession[]) || []);
      } catch (err) {
        console.error('Error loading Pilates reschedule sessions:', err);
      } finally {
        setClientLoadingPilates(false);
      }
    } else {
      try {
        const [availabilityRes, blockedRes] = await Promise.all([
          supabase
            .from('master_availability')
            .select('day_of_week, start_time, end_time, is_available')
            .eq('master_id', apt.master_id),
          supabase
            .from('blocked_slots')
            .select('start_time, end_time')
            .eq('master_id', apt.master_id),
        ]);
        setClientRescheduleMasterAvailability((availabilityRes.data as MasterAvailability[]) || []);
        setClientRescheduleBlockedSlots((blockedRes.data as BlockedSlot[]) || []);
      } catch (err) {
        console.error('Error loading master reschedule schedule:', err);
      }
    }
  };

  const clientSelectedReschedulePilatesSession = useMemo(
    () => clientReschedulePilatesSessions.find((session) => session.id === clientSelectedPilatesSessionId) ?? null,
    [clientReschedulePilatesSessions, clientSelectedPilatesSessionId]
  );

  const getClientRescheduleSpotsLeft = (session: PilatesSession) => {
    const bookedCount = session.pilates_session_bookings?.filter((booking) => booking.status === 'booked').length || 0;
    return Math.max(0, session.capacity - bookedCount);
  };

  const clientGroupedPilatesSessions = useMemo(() => {
    return clientReschedulePilatesSessions.reduce<Record<string, PilatesSession[]>>((acc, session) => {
      const key = new Date(session.starts_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      acc[key] = [...(acc[key] || []), session];
      return acc;
    }, {});
  }, [clientReschedulePilatesSessions]);

  const confirmClientReschedule = async () => {
    if (!selectedAppointment) return;
    const isPilates = selectedAppointment.service_category === 'Pilates';

    if (isPilates) {
      if (!clientSelectedPilatesSessionId) {
        showToast('Please select a Pilates class session', 'error');
        return;
      }
    } else {
      if (!clientRescheduleDate || !clientRescheduleTime) {
        showToast('Please select a new date and time', 'error');
        return;
      }
    }

    setClientSubmittingReschedule(true);
    try {
      let newStartTime: Date;
      let newEndTime: Date;

      if (isPilates && clientSelectedReschedulePilatesSession) {
        newStartTime = new Date(clientSelectedReschedulePilatesSession.starts_at);
        newEndTime = new Date(clientSelectedReschedulePilatesSession.ends_at);
      } else {
        const [hours, minutes] = clientRescheduleTime.split(':').map(Number);
        const parsedDate = getDateFromKey(clientRescheduleDate);
        if (!parsedDate) throw new Error('Invalid date selected');
        newStartTime = parsedDate;
        newStartTime.setHours(hours, minutes, 0, 0);
        
        const duration = selectedAppointment.service_duration_minutes ?? selectedAppointment.service?.duration_minutes ?? 60;
        newEndTime = new Date(newStartTime.getTime() + duration * 60000);
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          status: 'confirmed',
          proposed_start_time: null,
          proposed_end_time: null,
          reschedule_initiated_by: null,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      if (isPilates && clientSelectedPilatesSessionId) {
        const { error: bookingError } = await supabase
          .from('pilates_session_bookings')
          .update({ session_id: clientSelectedPilatesSessionId })
          .eq('appointment_id', selectedAppointment.id);
        if (bookingError) throw bookingError;
      }

      // Push notification
      const masterPushToken = selectedAppointment.master?.push_token;
      if (masterPushToken) {
        const oldTime = new Date(selectedAppointment.start_time);
        const formatStrStr = (d: Date) => d.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        const message = `${user?.user_metadata?.full_name || 'Client'} rescheduled their appointment from ${formatStrStr(oldTime)} to ${formatStrStr(newStartTime)}.`;
        
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              to: masterPushToken,
              sound: 'default',
              title: 'Appointment Rescheduled',
              body: message,
              data: { appointmentId: selectedAppointment.id },
            }
          });
        } catch (e) {
          console.error('Failed to send reschedule notification:', e);
        }
      }

      showToast('Your appointment has been successfully rescheduled.', 'success');
      setShowClientReschedule(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      showToast(error.message || 'Failed to reschedule appointment', 'error');
    } finally {
      setClientSubmittingReschedule(false);
    }
  };

  const handleClientNoShowClick = async () => {
    if (!selectedAppointment) return;
    const balanceDue = selectedAppointment.price - (selectedAppointment.deposit_paid ? selectedAppointment.deposit_amount : 0);
    if (balanceDue <= 0) {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({
            status: 'no_show',
            no_show_charge_amount: 0,
            no_show_processed_at: new Date().toISOString(),
            status_updated_at: new Date().toISOString()
          })
          .eq('id', selectedAppointment.id);

        if (error) throw error;

        await supabase
          .from('appointment_confirmations')
          .upsert({
            appointment_id: selectedAppointment.id,
            no_show_charge_captured: false,
          }, { onConflict: 'appointment_id' });

        showToast('Client recorded as No-Show. Booking completed.', 'success');
        setSelectedAppointment(null);
        fetchAppointments();
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to record no-show', 'error');
      }
    } else {
      setShowNoShowModal(true);
      setShowRescheduleForm(false);
    }
  };

  // No-Show action: Capture immediate charge via Stripe (Master)
  const handleNoShowChargeNow = async () => {
    if (!selectedAppointment) return;
    try {
      const chargeAmount = Number(((selectedAppointment.price * 100) / 100).toFixed(2));

      // Call Stripe handle-no-show edge function if payment intent exists
      if (selectedAppointment.stripe_payment_intent_id) {
        const noShowPercent = settingsData?.no_show_charge_percent ?? 100;
        const { data: noShowData, error: noShowError } = await supabase.functions.invoke('handle-no-show', {
          body: {
            appointment_id: selectedAppointment.id,
            payment_intent_id: selectedAppointment.stripe_payment_intent_id,
            no_show_fee_percentage: noShowPercent,
          },
        });
        if (noShowError) throw noShowError;
        if (noShowData?.error) throw new Error(noShowData.error);
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'no_show',
          no_show_charge_amount: chargeAmount,
          no_show_processed_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      await supabase
        .from('appointment_confirmations')
        .upsert({
          appointment_id: selectedAppointment.id,
          no_show_charge_captured: true,
        }, { onConflict: 'appointment_id' });

      showToast(
        selectedAppointment.stripe_payment_intent_id
          ? `No-Show fee captured via Stripe. Charged €${chargeAmount.toFixed(2)}.`
          : `No-Show recorded. Fee of €${chargeAmount.toFixed(2)} logged.`,
        'success'
      );
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to capture no-show fee', 'error');
    }
  };

  // No-Show action: Setup grace window (Master)
  const handleNoShowWaitGrace = async () => {
    if (!selectedAppointment) return;
    try {
      const mult = settingsData?.grace_period_multiplier ?? 0.5;
      const duration = selectedAppointment.service?.duration_minutes ?? selectedAppointment.service_duration_minutes ?? 60;
      const graceMinutes = Math.max(10, Math.round(duration * mult));

      const graceEnd = new Date(Date.now() + graceMinutes * 60 * 1000);

      const { error } = await supabase
        .from('appointment_confirmations')
        .upsert({
          appointment_id: selectedAppointment.id,
          grace_period_ends_at: graceEnd.toISOString(),
        }, { onConflict: 'appointment_id' });

      if (error) throw error;
      showToast(`Grace period set. Client has ${graceMinutes} minutes to arrive.`, 'success');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to initialize grace period', 'error');
    }
  };

  // No-Show action: Mark client arrived but late (Master)
  const handleNoShowClientLate = async () => {
    if (!selectedAppointment) return;
    try {
      const minutesLate = parseInt(lateMinutesInput) || 15;
      const arrivedTime = new Date(Date.now());
      const thresh = settingsData?.late_arrival_minutes ?? 15;

      const { error } = await supabase
        .from('appointment_confirmations')
        .upsert({
          appointment_id: selectedAppointment.id,
          client_arrived_late: minutesLate > thresh,
          client_arrived_at: arrivedTime.toISOString(),
        }, { onConflict: 'appointment_id' });

      if (error) throw error;

      showToast(
        minutesLate > thresh 
          ? `Logged late arrival. Client arrived ${minutesLate}m late (Exceeds ${thresh}m threshold).`
          : `Logged late arrival of ${minutesLate}m within threshold.`,
        'success'
      );
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to log arrival', 'error');
    }
  };

  const nowISO = new Date().toISOString();
  
  const filtered = appointments.filter((a) => {
    if (activeTab === 'upcoming') {
      return a.start_time >= nowISO && !['cancelled', 'completed', 'no_show'].includes(a.status);
    }
    if (activeTab === 'past') {
      return a.start_time < nowISO || ['completed', 'no_show'].includes(a.status);
    }
    return ['cancelled', 'cancelled_free', 'cancelled_charge'].includes(a.status);
  });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in relative">
      
      {/* Toast Alert Box */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl transition-all duration-300 transform translate-y-0 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50/95 backdrop-blur-md text-emerald-800 border-emerald-200' 
            : 'bg-rose-50/95 backdrop-blur-md text-rose-800 border-rose-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertCircle className="text-rose-500" size={20} />}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-10 h-52 shadow-lg">
        <img 
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop" 
          alt="Appointments" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center color-white p-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {role === 'master' || role === 'owner' ? 'Professional Bookings' : 'Your Appointments'}
          </h1>
          <p className="text-white/80 text-sm mt-2 max-w-md font-medium">
            {role === 'master' || role === 'owner'
              ? 'Manage client attendance, reschedule proposals, and track late arrivals'
              : 'Track upcoming sessions, confirm attendance, or request reschedules'}
          </p>
        </div>
      </div>

      {/* Tabs — Colorful glass pills */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[var(--color-surface-light)] mb-8 w-fit mx-auto border border-[var(--color-border-light)]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
              activeTab === tab.value
                ? `bg-gradient-to-r ${tab.color} text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]`
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl shimmer" />
                <div className="flex-1">
                  <div className="h-4 shimmer rounded w-1/3 mb-2" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-bl-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-200 to-teal-200 flex items-center justify-center mx-auto mb-4 animate-float">
            <Calendar size={32} className="text-emerald-500" />
          </div>
          <p className="text-lg font-extrabold text-[var(--color-text-primary)]">
            {activeTab === 'upcoming' ? 'No upcoming appointments' : activeTab === 'past' ? 'No past appointments' : 'No cancelled appointments'}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-6">
            {activeTab === 'upcoming' ? 'Book a service with our specialists today!' : 'Your history will appear here'}
          </p>
          {activeTab === 'upcoming' && role !== 'master' && (
            <Link href={buildPath('booking')} className="btn-pink px-8 py-3 text-sm inline-flex items-center gap-2">
              Book Now <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt, idx) => {
            const dateObj = new Date(apt.start_time);
            return (
              <div
                key={apt.id}
                data-row-id={apt.id}
                onClick={() => handleSelectAppointment(apt)}
                className="glass-card p-5 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group flex items-center gap-4 border border-[var(--color-border-light)] bg-white/70 backdrop-blur-md"
              >
                {/* Date Badge */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <span className="text-[10px] font-black text-[var(--color-brand-pink-dark)] uppercase tracking-wider">
                    {dateObj.toLocaleDateString('en-GB', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-black text-[var(--color-primary)] leading-tight">
                    {dateObj.getDate()}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <p className="font-extrabold text-sm text-[var(--color-text-primary)] truncate max-w-[200px]">
                      {apt.service?.name || apt.service_name || 'Appointment'}
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(apt.status)}`}>
                      {apt.status === 'reschedule_pending' ? 'Reschedule Pending' : apt.status}
                    </span>
                    {apt.client_confirmed && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Shield size={9} className="fill-emerald-500 text-emerald-500" /> Confirmed
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-violet-400" />
                      {dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-pink-400" />
                      {role === 'master' ? apt.client?.full_name || 'Client' : apt.master?.full_name || 'Professional'}
                    </span>
                  </div>
                </div>

                {/* Price + Arrow */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <p className="font-extrabold text-base text-gradient-pink">€{apt.price ? Number(apt.price).toFixed(2) : '0.00'}</p>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {apt.deposit_paid ? 'Deposit Paid' : 'No Deposit'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Details Side-Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs animate-fade-in">
          {/* Backdrop Overlay Click to Close */}
          <div className="absolute inset-0 cursor-default" onClick={() => setSelectedAppointment(null)} />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 animate-slide-in-right z-10">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 shrink-0">
              <div>
                <h3 className="text-lg font-black text-[var(--color-text-primary)]">Appointment Details</h3>
                <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">Reference ID: {selectedAppointment.id.slice(0, 8)}</p>
              </div>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Loader2 className="animate-spin text-pink-500 mb-2" size={32} />
                <p className="text-sm text-gray-500 font-semibold">Retrieving policy settings...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {showClientReschedule ? (
                  <div className="flex-1 flex flex-col space-y-4">
                    <button 
                      onClick={() => setShowClientReschedule(false)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-bold mb-2 cursor-pointer transition-colors"
                    >
                      <ArrowLeft size={14} /> Back to Details
                    </button>

                    <div className="flex-1 space-y-4">
                      {selectedAppointment.service_category === 'Pilates' ? (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
                          <h4 className="text-sm font-black text-gray-800">Select Pilates Session</h4>
                          {clientLoadingPilates ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                              <Loader2 size={18} className="animate-spin" /> Loading classes...
                            </div>
                          ) : clientReschedulePilatesSessions.length === 0 ? (
                            <p className="text-center text-gray-400 py-12 text-xs font-semibold">No Pilates classes are available.</p>
                          ) : (
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                              {Object.entries(clientGroupedPilatesSessions).map(([dateLabel, sessions]) => (
                                <div key={dateLabel} className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dateLabel}</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {sessions.map((session) => {
                                      const spotsLeft = getClientRescheduleSpotsLeft(session);
                                      const isCurrentDate = selectedAppointment ? toDateKey(new Date(session.starts_at)) === toDateKey(new Date(selectedAppointment.start_time)) : false;
                                      const isFull = spotsLeft <= 0;
                                      const isSelected = clientSelectedPilatesSessionId === session.id;
                                      const isDisabled = isFull || isCurrentDate;
                                      return (
                                        <button
                                          key={session.id}
                                          disabled={isDisabled}
                                          onClick={() => {
                                            setClientSelectedPilatesSessionId(session.id);
                                            const startsAt = new Date(session.starts_at);
                                            setClientRescheduleDate(toDateKey(startsAt));
                                            setClientRescheduleTime(startsAt.toTimeString().slice(0, 5));
                                          }}
                                          className={`text-left rounded-xl border p-3 transition-all w-full ${
                                            isSelected 
                                              ? 'border-emerald-500 bg-emerald-50 shadow-xs scale-[1.01]' 
                                              : isCurrentDate
                                                ? 'border-violet-300 bg-violet-50/50 opacity-60 cursor-not-allowed'
                                                : isFull 
                                                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                                                  : 'border-violet-100 bg-white hover:-translate-y-0.5 hover:shadow-sm'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-bold text-gray-800">{new Date(session.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isCurrentDate ? 'bg-violet-100 text-violet-700' : isFull ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                              {isCurrentDate ? 'Current' : isFull ? 'Full' : `${spotsLeft} spots`}
                                            </span>
                                          </div>
                                          <p className="mt-1 text-xs font-semibold text-violet-700">{session.host?.display_name || 'Pilates host'}</p>
                                          <p className="text-[10px] text-gray-400">{session.level} · {Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000)} min</p>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Standard Reschedule Calendar
                        <div className="space-y-4">
                          {/* Selected Info */}
                          <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">New Date & Time</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">
                                {clientRescheduleDate ? formatDateLabel(clientRescheduleDate) : 'Select a date'}
                                {clientRescheduleTime ? ` at ${clientRescheduleTime}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Calendar Container */}
                          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-xs">
                            <div className="flex items-center justify-between mb-3 px-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const newMonth = new Date(clientRescheduleCalendarMonth.getFullYear(), clientRescheduleCalendarMonth.getMonth() - 1, 1);
                                  const today = new Date();
                                  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                  if (newMonth.getTime() >= minMonth.getTime()) {
                                    setClientRescheduleCalendarMonth(newMonth);
                                  }
                                }}
                                disabled={(() => {
                                  const today = new Date();
                                  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                  return clientRescheduleCalendarMonth.getTime() <= minMonth.getTime();
                                })()}
                                className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 shadow-xs hover:bg-pink-50 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <div className="text-center">
                                <p className="text-sm font-extrabold text-gray-800">
                                  {clientRescheduleCalendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setClientRescheduleCalendarMonth(new Date(clientRescheduleCalendarMonth.getFullYear(), clientRescheduleCalendarMonth.getMonth() + 1, 1));
                                }}
                                className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 shadow-xs hover:bg-violet-50 hover:text-violet-600 flex items-center justify-center transition-colors"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>

                            <table className="w-full table-fixed border-separate border-spacing-0.5">
                              <thead>
                                <tr>
                                  {WEEKDAY_LABELS.map((day) => (
                                    <th key={day} className="pb-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                      {day}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {buildCalendarWeeks(clientRescheduleCalendarMonth).map((week, weekIndex) => (
                                  <tr key={weekIndex}>
                                    {week.map((date) => {
                                      const dateKey = toDateKey(date);
                                      const isCurrentMonth = date.getMonth() === clientRescheduleCalendarMonth.getMonth();
                                      const isToday = dateKey === toDateKey(new Date());
                                      const isSelected = clientRescheduleDate === dateKey;
                                      const isCurrentDate = selectedAppointment ? dateKey === toDateKey(new Date(selectedAppointment.start_time)) : false;
                                      const isSelectable = isCurrentMonth && isSelectableDateKey(dateKey) && !isCurrentDate;

                                      return (
                                        <td key={dateKey} className="p-0.5 align-middle">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isSelectable) {
                                                setClientRescheduleDate(dateKey);
                                                setClientRescheduleTime('');
                                              }
                                            }}
                                            disabled={!isSelectable}
                                            className={`relative w-full aspect-square rounded-xl text-xs font-bold transition-all ${
                                              isSelected
                                                ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-xs scale-105'
                                                : isCurrentDate
                                                  ? 'border border-violet-500 bg-violet-50/50 text-violet-600 cursor-not-allowed opacity-50'
                                                  : isSelectable
                                                    ? 'bg-white text-gray-800 hover:bg-pink-50/50 hover:text-pink-600'
                                                    : 'bg-transparent text-gray-300 cursor-not-allowed'
                                            }`}
                                          >
                                            <span>{date.getDate()}</span>
                                            {isToday && (
                                              <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-500'}`} />
                                            )}
                                            {isCurrentDate && (
                                              <span className="absolute top-0.5 right-1 text-[8px] font-black uppercase text-violet-700">Curr</span>
                                            )}
                                          </button>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Time Slots */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Available Times</p>
                            {!clientRescheduleDate ? (
                              <div className="py-6 flex items-center justify-center border border-dashed border-gray-200 bg-gray-50/50 rounded-xl">
                                <p className="text-xs text-gray-400 font-medium">Select a date from the calendar first.</p>
                              </div>
                            ) : clientIsFetchingSlots ? (
                              <div className="py-6 flex items-center justify-center gap-2 text-gray-400">
                                <Loader2 size={16} className="animate-spin" /> Loading times...
                              </div>
                            ) : clientTimeSlots.length === 0 ? (
                              <div className="py-6 flex items-center justify-center border border-dashed border-amber-200 bg-amber-50/30 rounded-xl">
                                <p className="text-xs text-amber-800/80 font-semibold">Specialist has no working hours on this day.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {clientTimeSlots.map((time) => {
                                  const isSelected = clientRescheduleTime === time;
                                  const isDisabled = isClientTimeSlotDisabled(time);
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => {
                                        if (!isDisabled) setClientRescheduleTime(time);
                                      }}
                                      disabled={isDisabled}
                                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                        isSelected
                                          ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-xs border-transparent'
                                          : isDisabled
                                            ? 'bg-gray-100/60 text-gray-300 border-transparent cursor-not-allowed'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex gap-3">
                      <button 
                        onClick={() => setShowClientReschedule(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 text-sm cursor-pointer transition-all text-center"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmClientReschedule}
                        disabled={clientSubmittingReschedule || (selectedAppointment.service_category === 'Pilates' ? !clientSelectedPilatesSessionId : (!clientRescheduleDate || !clientRescheduleTime))}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-bold text-sm cursor-pointer shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {clientSubmittingReschedule ? (
                          <>
                            <Loader2 className="animate-spin" size={16} /> Rescheduling...
                          </>
                        ) : (
                          <>Confirm Reschedule</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 space-y-6">
                
                {/* Visual Card details */}
                <div className="bg-gradient-to-br from-pink-50/50 to-violet-50/50 rounded-2xl p-5 border border-pink-100/50 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">
                        {selectedAppointment.service_category || 'Service'}
                      </span>
                      <h4 className="text-base font-black text-gray-800 mt-2">
                        {selectedAppointment.service?.name || selectedAppointment.service_name || 'Appointment'}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        {selectedAppointment.service?.description || 'No detailed description available.'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-pink-100/30">
                    <div className="flex gap-2 items-center">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-pink-400 shrink-0">
                        <CalendarDays size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase leading-none">Date</p>
                        <p className="text-xs text-gray-700 font-bold mt-1">
                          {new Date(selectedAppointment.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-violet-400 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase leading-none">Time & Length</p>
                        <p className="text-xs text-gray-700 font-bold mt-1">
                          {new Date(selectedAppointment.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ({selectedAppointment.service?.duration_minutes ?? selectedAppointment.service_duration_minutes ?? 60}m)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-violet-200 overflow-hidden flex items-center justify-center font-bold text-white shadow-sm">
                      {role === 'master' || role === 'owner' 
                        ? (selectedAppointment.client?.avatar_url ? <img src={selectedAppointment.client.avatar_url} className="object-cover w-full h-full" alt="avatar" /> : selectedAppointment.client?.full_name.charAt(0))
                        : (selectedAppointment.master?.avatar_url ? <img src={selectedAppointment.master.avatar_url} className="object-cover w-full h-full" alt="avatar" /> : selectedAppointment.master?.full_name.charAt(0))
                      }
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase leading-none">{role === 'master' || role === 'owner' ? 'Client' : 'Specialist'}</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        {role === 'master' || role === 'owner' ? selectedAppointment.client?.full_name : selectedAppointment.master?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {role === 'master' || role === 'owner' ? selectedAppointment.client?.email : selectedAppointment.master?.specialties?.join(', ') || 'Beauty Professional'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDirectChat}
                    className="p-2.5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 text-[var(--color-brand-pink-dark)] hover:scale-105 transition-all cursor-pointer"
                    title="Send Direct Message"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>

                {/* Reschedule Proposal Display for Client */}
                {role !== 'master' && role !== 'owner' && selectedAppointment.status === 'reschedule_pending' && selectedAppointment.proposed_start_time && (
                  <div className="p-4 rounded-2xl border border-violet-200 bg-violet-50/60 space-y-3 shadow-xs">
                    <div className="flex items-start gap-2.5 text-violet-800">
                      <CalendarRange className="shrink-0 text-violet-500" size={20} />
                      <div>
                        <p className="text-sm font-extrabold leading-tight">Reschedule Propose Received</p>
                        <p className="text-xs text-violet-700/80 font-medium mt-1">
                          Our specialist proposed to move this appointment to:
                        </p>
                        <p className="text-sm font-bold mt-2 text-violet-900 bg-white/95 px-3 py-1.5 rounded-xl shadow-xs inline-block">
                          📅 {new Date(selectedAppointment.proposed_start_time).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })} at {new Date(selectedAppointment.proposed_start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => handleRescheduleResponse(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-violet-300 text-violet-800 hover:bg-violet-100 cursor-pointer"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleRescheduleResponse(true)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white cursor-pointer shadow-sm"
                      >
                        Accept New Time
                      </button>
                    </div>
                  </div>
                )}

                {/* Reschedule Proposal Display for Master (Status View Only) */}
                {(role === 'master' || role === 'owner') && selectedAppointment.status === 'reschedule_pending' && selectedAppointment.proposed_start_time && (
                  <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50/30">
                    <div className="flex gap-2.5 items-center text-violet-700">
                      <Loader2 className="animate-spin text-violet-500 shrink-0" size={16} />
                      <div className="text-xs font-medium">
                        <span className="font-bold">Reschedule Proposal Pending Client Approval:</span> Proposed for{' '}
                        {new Date(selectedAppointment.proposed_start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at{' '}
                        {new Date(selectedAppointment.proposed_start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider">Payment Breakdown</h5>
                  <div className="rounded-2xl border border-gray-100 p-4 space-y-2 bg-white shadow-xs">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Base Service Total</span>
                      <span className="font-bold text-gray-800">€{Number(selectedAppointment.price).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Deposit Pre-Paid</span>
                      <span className="font-bold text-emerald-600">
                        {selectedAppointment.deposit_paid ? `-€${Number(selectedAppointment.deposit_amount).toFixed(2)}` : '€0.00'}
                      </span>
                    </div>

                    <div className="my-2 border-t border-gray-50" />

                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-800 font-extrabold">Balance Due at Salon</span>
                      <span className="font-black text-gradient-pink text-lg">
                        €{Number(selectedAppointment.price - (selectedAppointment.deposit_paid ? selectedAppointment.deposit_amount : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Late Arrival Tracking Display */}
                {confirmationData && confirmationData.client_arrived_at && (
                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40">
                    <div className="flex gap-2 items-center text-amber-800">
                      <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                      <p className="text-xs font-semibold">
                        Client arrived at {new Date(confirmationData.client_arrived_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}{' '}
                        {confirmationData.client_arrived_late ? (
                          <span className="text-rose-600 font-bold uppercase text-[10px] ml-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            LATE ARRIVAL
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold uppercase text-[10px] ml-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ON-TIME
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Grace Period Countdown */}
                {confirmationData && confirmationData.grace_period_ends_at && !confirmationData.client_arrived_at && (
                  <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40">
                    <div className="flex gap-2.5 items-center text-rose-800">
                      <Clock3 className="text-rose-500 animate-pulse shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold leading-tight">No-Show Grace Period Active</p>
                        <p className="text-[11px] text-rose-700/80 font-semibold mt-1">
                          Client must arrive before {new Date(confirmationData.grace_period_ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} or the booking is subject to auto-charge.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance Confirmation Actions for Client */}
                {role !== 'master' && role !== 'owner' && selectedAppointment.requires_confirmation && !selectedAppointment.client_confirmed && !['cancelled', 'completed', 'no_show'].includes(selectedAppointment.status) && (
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                    <div className="flex items-start gap-2.5 text-amber-800">
                      <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">Action Required: Attendance Confirmation</p>
                        <p className="text-xs text-amber-700 font-medium mt-1">
                          Please confirm you will attend this booking.
                          {selectedAppointment.confirmation_deadline && (
                            <span> Respond before <span className="font-extrabold">{new Date(selectedAppointment.confirmation_deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at {new Date(selectedAppointment.confirmation_deadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>.</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => handleClientConfirmation(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer"
                      >
                        I Can't Attend
                      </button>
                      <button 
                        onClick={() => handleClientConfirmation(true)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm"
                      >
                        Confirm Attendance
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed & Protected Badge */}
                {selectedAppointment.client_confirmed && !['cancelled', 'completed', 'no_show'].includes(selectedAppointment.status) && (
                  <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                    <Shield className="text-emerald-500 fill-emerald-100 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider leading-none">Confirmed & Protected</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1">Attendance is locked. Penalty protections active under professional policies.</p>
                    </div>
                  </div>
                )}

                {/* Cancellation Policy Display */}
                <div className="space-y-2">
                  <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider">Cancellation Policy</h5>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 leading-relaxed font-medium">
                    Cancel for free up to <span className="font-bold text-gray-700">24 hours</span> before your session. Cancellations within this window are subject to a <span className="font-bold text-gray-700">50% fee</span>. No-Shows are billed at <span className="font-bold text-gray-700">100%</span>.
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-6 border-t border-gray-100 space-y-3 shrink-0">
                  
                  {/* Master Propose Reschedule Actions */}
                  {(role === 'master' || role === 'owner') && !['cancelled', 'completed', 'no_show'].includes(selectedAppointment.status) && (
                    <div className="space-y-3">
                      {selectedAppointment.service_category === 'Pilates' ? (
                        <Link
                          href={buildPath(`services/pilates/${selectedAppointment.service_id}`)}
                          className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <Settings size={16} /> Studio Configuration
                        </Link>
                      ) : new Date(selectedAppointment.start_time).getTime() > new Date().getTime() ? (
                        !showRescheduleForm ? (
                          <button 
                            onClick={() => { setShowRescheduleForm(true); setShowLateInputForm(false); }}
                            className="w-full py-3 rounded-xl border border-violet-200 text-violet-700 font-bold hover:bg-violet-50 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                          >
                            <CalendarRange size={16} /> Propose Reschedule
                          </button>
                        ) : (
                          <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50/20 space-y-3">
                            <h6 className="text-xs font-black text-violet-800 uppercase tracking-wider">Propose New Date/Time</h6>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-gray-400 font-black uppercase mb-1">New Date</label>
                                <input 
                                  type="date" 
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 font-black uppercase mb-1">Start Time</label>
                                <input 
                                  type="time" 
                                  value={rescheduleTime}
                                  onChange={(e) => setRescheduleTime(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setShowRescheduleForm(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-violet-200 text-violet-800 hover:bg-violet-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleProposeReschedule}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white cursor-pointer shadow-sm"
                              >
                                Submit Proposal
                              </button>
                            </div>
                          </div>
                        )
                      ) : null}

                      {/* No-Show modal buttons */}
                      {!showNoShowModal && !showLateInputForm ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={handleClientNoShowClick}
                            className="py-3 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShieldAlert size={16} /> Client No-Show
                          </button>
                          <button 
                            onClick={() => { setShowLateInputForm(true); setShowRescheduleForm(false); }}
                            className="py-3 rounded-xl border border-amber-200 text-amber-700 font-bold hover:bg-amber-50 text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <UserCheck size={16} /> Client Late Arrival
                          </button>
                        </div>
                      ) : showNoShowModal ? (
                        <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-black text-rose-800 uppercase tracking-wider">No-Show Action Panel</h6>
                            <button onClick={() => setShowNoShowModal(false)} className="text-rose-400 hover:text-rose-700"><X size={16} /></button>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">Select penalty response type for this no-show booking:</p>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button 
                              onClick={handleNoShowWaitGrace}
                              className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs bg-white hover:bg-rose-50 cursor-pointer text-center"
                            >
                              ⌛ Wait Grace Period
                            </button>
                            <button 
                              onClick={handleNoShowChargeNow}
                              className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer text-center shadow-xs"
                            >
                              💸 Charge Fee Now
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-black text-amber-800 uppercase tracking-wider">Arrived Late Tracker</h6>
                            <button onClick={() => setShowLateInputForm(false)} className="text-amber-400 hover:text-amber-700"><X size={16} /></button>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-400 font-black uppercase mb-1">Minutes Late</label>
                              <input 
                                type="number"
                                min="1"
                                value={lateMinutesInput}
                                onChange={(e) => setLateMinutesInput(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                              />
                            </div>
                            <button 
                              onClick={handleNoShowClientLate}
                              className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                            >
                              Log Attendance
                            </button>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={handleMarkAsCompleted}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={16} /> Mark as Completed
                      </button>
                    </div>
                  )}

                  {/* Client Cancel / Reschedule Booking Trigger */}
                  {role !== 'master' && !['cancelled', 'completed', 'no_show'].includes(selectedAppointment.status) && new Date(selectedAppointment.start_time).getTime() > new Date().getTime() && (
                    <div className="space-y-3">
                      {!showCancelConfirm ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleInitClientReschedule(selectedAppointment)}
                            className="py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CalendarRange size={16} /> Reschedule
                          </button>
                          <button 
                            onClick={() => setShowCancelConfirm(true)}
                            className="py-3 rounded-xl border border-rose-200 text-rose-500 font-bold hover:bg-rose-50 text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={16} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3 animate-slide-up">
                          <div className="flex gap-2 items-start text-rose-800">
                            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">Confirm Cancellation</p>
                              {isLateCancellation(selectedAppointment.start_time) ? (
                                <p className="text-xs text-rose-700 font-semibold mt-1">
                                  ⚠️ <span className="font-extrabold">Late Cancellation Alert:</span> This booking is under {settingsData?.late_cancellation_window_hours ?? 24}h away. Cancelling now will incur a <span className="font-extrabold">{settingsData?.cancellation_charge_percent ?? 50}% fee (€{((selectedAppointment.price * (settingsData?.cancellation_charge_percent ?? 50)) / 100).toFixed(2)})</span>.
                                </p>
                              ) : (
                                <p className="text-xs text-rose-600 font-medium mt-1">
                                  This cancellation is outside the late penalty window. You can cancel this session for free.
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => setShowCancelConfirm(false)}
                              className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-800 hover:bg-rose-100 cursor-pointer"
                            >
                              Keep Appointment
                            </button>
                            <button 
                              onClick={handleCancelAppointment}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm"
                            >
                              Cancel Booking anyway
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

          </div>
        </div>
      )}

    </div>
  );
}
