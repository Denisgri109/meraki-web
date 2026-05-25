'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

import {
  Camera, Upload, Clock, CheckCircle2, XCircle, MessageCircle,
  ChevronRight, Eye, Send, Star, Loader2, X, Image as ImageIcon,
  FileText, ClipboardList, ArrowLeft, AlertCircle, ThumbsUp, ThumbsDown,
  DollarSign, Timer, StickyNote, CalendarPlus, Sparkles, Check, Info
} from 'lucide-react';

// ─── Error helper ───────────────────────────────────────────────────
function describeError(err: unknown): { message: string; details: Record<string, unknown> } {
  if (!err) return { message: 'Unknown error', details: {} };
  if (err instanceof Error) {
    return {
      message: err.message || err.name || 'Error',
      details: {
        name: err.name,
        message: err.message,
        code: (err as { code?: string }).code,
        details: (err as { details?: string }).details,
        hint: (err as { hint?: string }).hint,
        stack: err.stack,
      },
    };
  }
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    return {
      message: (e.message as string) || (e.error as string) || JSON.stringify(e),
      details: e,
    };
  }
  return { message: String(err), details: {} };
}

// ─── Types ──────────────────────────────────────────────────────────
interface PhotoConsultation {
  id: string;
  client_id: string;
  master_id: string | null;
  photo_url: string;
  photo_urls: string[] | null;
  client_message: string | null;
  master_reply: string | null;
  status: string;
  title: string | null;
  description: string | null;
  service_type: string | null;
  is_doable: boolean | null;
  professional_notes: string | null;
  recommendations: string | null;
  estimated_price_range: string | null;
  estimated_duration: string | null;
  responded_by: string | null;
  converted_to_booking: boolean | null;
  booking_id: string | null;
  created_at: string;
  replied_at: string | null;
  updated_at: string | null;
  client_profile?: { full_name: string | null; avatar_url: string | null };
  service?: { name: string | null; category: string | null };
}

interface BookingConsultation {
  id: string;
  client_id: string;
  service_id: string;
  master_id: string | null;
  had_before: boolean;
  how_long_ago: string | null;
  was_my_work: boolean | null;
  photo_urls: string[] | null;
  additional_notes: string | null;
  status: string;
  booking_link_token: string | null;
  approval_expires_at: string | null;
  master_notes: string | null;
  responded_at: string | null;
  converted_to_booking: boolean | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string | null;
  client_profile?: { full_name: string | null; avatar_url: string | null };
  service?: { name: string | null; category: string | null };
}

interface ConsultationResponse {
  id: string;
  client_id: string;
  master_id: string | null;
  service_id: string | null;
  appointment_id: string | null;
  has_had_before: boolean | null;
  was_with_this_master: boolean | null;
  time_since_last: string | null;
  additional_answers: Record<string, string> | null;
  consultation_notes: string | null;
  consultation_completed: boolean | null;
  consultation_required: boolean | null;
  created_at: string;
  updated_at: string | null;
  client_profile?: { full_name: string | null; avatar_url: string | null };
  service?: { name: string | null; category: string | null };
  appointment?: { service_name: string | null; start_time: string | null; status: string | null };
}

interface ServiceOption {
  id: string;
  name: string;
  category: string | null;
  requires_consultation: boolean;
  consultation_questions: Record<string, string>[] | null;
}

// ─── Helpers ────────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    pending: { bg: 'bg-amber-50/90 border-amber-200/50 backdrop-blur-md', text: 'text-amber-700', icon: <Clock size={12} />, label: 'Pending' },
    approved: { bg: 'bg-emerald-50/90 border-emerald-200/50 backdrop-blur-md', text: 'text-emerald-700', icon: <CheckCircle2 size={12} />, label: 'Approved' },
    declined: { bg: 'bg-red-50/90 border-red-200/50 backdrop-blur-md', text: 'text-red-600', icon: <XCircle size={12} />, label: 'Declined' },
    chat_requested: { bg: 'bg-blue-50/90 border-blue-200/50 backdrop-blur-md', text: 'text-blue-600', icon: <MessageCircle size={12} />, label: 'Chat Requested' },
    in_review: { bg: 'bg-blue-50/90 border-blue-200/50 backdrop-blur-md', text: 'text-blue-600', icon: <Clock size={12} />, label: 'In review' },
    responded: { bg: 'bg-emerald-50/90 border-emerald-200/50 backdrop-blur-md', text: 'text-emerald-700', icon: <CheckCircle2 size={12} />, label: 'Responded' },
    closed: { bg: 'bg-gray-100/95 border-gray-200/50 backdrop-blur-md', text: 'text-gray-600', icon: <XCircle size={12} />, label: 'Closed' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} shadow-sm transition-all duration-300`}>
      {s.icon} {s.label}
    </span>
  );
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ConsultationsPage() {
  const { user, profile, role } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();


  const isMasterOrOwner = role === 'master' || role === 'owner';

  // Tabs
  const clientTabs = ['My Requests', 'Pre-Service Forms'] as const;
  const masterTabs = ['Photo Reviews', 'Booking Reviews', 'Assessments'] as const;
  const tabs = isMasterOrOwner ? masterTabs : clientTabs;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);

  // Data
  const [photoConsultations, setPhotoConsultations] = useState<PhotoConsultation[]>([]);
  const [bookingConsultations, setBookingConsultations] = useState<BookingConsultation[]>([]);
  const [consultationResponses, setConsultationResponses] = useState<ConsultationResponse[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);



  // Detail view
  const [selectedConsultation, setSelectedConsultation] = useState<PhotoConsultation | BookingConsultation | null>(null);
  const [detailType, setDetailType] = useState<'photo' | 'booking' | null>(null);

  // Master review form
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDoable, setReviewDoable] = useState<boolean | null>(null);
  const [reviewRecommendations, setReviewRecommendations] = useState('');
  const [reviewPriceRange, setReviewPriceRange] = useState('');
  const [reviewDuration, setReviewDuration] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Pre-service questionnaire (client)
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: string; service_id: string; service_name: string; master_id: string; start_time: string } | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [hadBefore, setHadBefore] = useState(false);
  const [wasWithMaster, setWasWithMaster] = useState(false);
  const [timeSinceLast, setTimeSinceLast] = useState('');
  const [questionnaireNotes, setQuestionnaireNotes] = useState('');
  const [questionnaireSubmitting, setQuestionnaireSubmitting] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<{ id: string; service_id: string; service_name: string; master_id: string; start_time: string; has_response: boolean }[]>([]);

  // Lightbox overlay state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: svcData } = await supabase
        .from('services')
        .select('id, name, category, requires_consultation, consultation_questions')
        .eq('is_active', true);
      if (svcData) setServices(svcData as ServiceOption[]);

      if (isMasterOrOwner) {
        const { data: pcData } = await supabase
          .from('photo_consultations')
          .select('*, client_profile:client_id(full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (pcData) setPhotoConsultations(pcData as unknown as PhotoConsultation[]);

        const { data: bcData } = await supabase
          .from('booking_consultations')
          .select('*, client_profile:client_id(full_name, avatar_url), service:service_id(name, category)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (bcData) setBookingConsultations(bcData as unknown as BookingConsultation[]);

        const { data: crData } = await supabase
          .from('consultation_responses')
          .select('*, client_profile:client_id(full_name, avatar_url), service:service_id(name, category), appointment:appointment_id(service_name, start_time, status)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (crData) setConsultationResponses(crData as unknown as ConsultationResponse[]);
      } else {
        const { data: pcData } = await supabase
          .from('photo_consultations')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        if (pcData) setPhotoConsultations(pcData as unknown as PhotoConsultation[]);

        const { data: bcData } = await supabase
          .from('booking_consultations')
          .select('*, service:service_id(name, category)')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        if (bcData) setBookingConsultations(bcData as unknown as BookingConsultation[]);

        const { data: apptData } = await supabase
          .from('appointments')
          .select('id, service_id, service_name, master_id, start_time')
          .eq('client_id', user.id)
          .in('status', ['confirmed', 'pending'])
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(20);

        if (apptData && apptData.length > 0) {
          const { data: existingResponses } = await supabase
            .from('consultation_responses')
            .select('appointment_id')
            .eq('client_id', user.id)
            .in('appointment_id', apptData.map(a => a.id));
          const answeredIds = new Set((existingResponses || []).map(r => r.appointment_id));

          const consultServices = new Set(
            (svcData || []).filter(s => s.requires_consultation).map(s => s.id)
          );

          setUpcomingAppointments(
            apptData
              .filter(a => a.service_id && consultServices.has(a.service_id))
              .map(a => ({
                id: a.id,
                service_id: a.service_id!,
                service_name: a.service_name || 'Service',
                master_id: a.master_id,
                start_time: a.start_time,
                has_response: answeredIds.has(a.id),
              }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isMasterOrOwner, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Master review photo consultation ─────────────────────────────
  const handleReviewSubmit = async (consultationId: string, action: 'approved' | 'declined') => {
    if (!user) return;
    setReviewSubmitting(true);
    try {
      const { error } = await supabase
        .from('photo_consultations')
        .update({
          status: 'responded',
          master_reply: reviewNotes.trim() || null,
          master_id: user.id,
          responded_by: user.id,
          replied_at: new Date().toISOString(),
          is_doable: reviewDoable,
          professional_notes: reviewNotes.trim() || null,
          recommendations: reviewRecommendations.trim() || null,
          estimated_price_range: reviewPriceRange.trim() || null,
          estimated_duration: reviewDuration.trim() || null,
        })
        .eq('id', consultationId);
      if (error) throw error;

      showToast(`Consultation ${action}!`, 'success');
      setSelectedConsultation(null);
      setDetailType(null);
      resetReviewForm();
      fetchData();
    } catch (err) {
      const { message, details } = describeError(err);
      console.error('Review error:', message, details);
      showToast(`Failed to submit review: ${message}`, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ─── Master review booking consultation ───────────────────────────
  const handleBookingReview = async (consultationId: string, action: 'approved' | 'declined') => {
    if (!user) return;
    setReviewSubmitting(true);
    try {
      const { error } = await supabase
        .from('booking_consultations')
        .update({
          status: action,
          master_id: user.id,
          master_notes: reviewNotes.trim() || null,
          responded_at: new Date().toISOString(),
          approval_expires_at: action === 'approved' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        })
        .eq('id', consultationId);
      if (error) throw error;

      showToast(`Booking consultation ${action}!`, 'success');
      setSelectedConsultation(null);
      setDetailType(null);
      resetReviewForm();
      fetchData();
    } catch (err) {
      const { message, details } = describeError(err);
      console.error('Booking review error:', message, details);
      showToast(`Failed to submit review: ${message}`, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ─── Submit pre-service questionnaire (client) ────────────────────
  const handleQuestionnaireSubmit = async () => {
    if (!user || !selectedAppointment) return;
    setQuestionnaireSubmitting(true);
    try {
      const { error } = await supabase.from('consultation_responses').insert({
        client_id: user.id,
        master_id: selectedAppointment.master_id,
        service_id: selectedAppointment.service_id,
        appointment_id: selectedAppointment.id,
        has_had_before: hadBefore,
        was_with_this_master: wasWithMaster,
        time_since_last: timeSinceLast || null,
        additional_answers: Object.keys(questionnaireAnswers).length > 0 ? questionnaireAnswers : null,
        consultation_notes: questionnaireNotes.trim() || null,
        consultation_completed: true,
      });
      if (error) throw error;

      showToast('Pre-service form submitted!', 'success');
      setSelectedAppointment(null);
      resetQuestionnaireForm();
      fetchData();
    } catch (err) {
      const { message, details } = describeError(err);
      console.error('Questionnaire error:', message, details);
      showToast(`Failed to submit form: ${message}`, 'error');
    } finally {
      setQuestionnaireSubmitting(false);
    }
  };

  const resetReviewForm = () => {
    setReviewNotes('');
    setReviewDoable(null);
    setReviewRecommendations('');
    setReviewPriceRange('');
    setReviewDuration('');
  };

  const resetQuestionnaireForm = () => {
    setQuestionnaireAnswers({});
    setHadBefore(false);
    setWasWithMaster(false);
    setTimeSinceLast('');
    setQuestionnaireNotes('');
  };

  const openDetail = (item: PhotoConsultation | BookingConsultation, type: 'photo' | 'booking') => {
    setSelectedConsultation(item);
    setDetailType(type);
    resetReviewForm();
    if (type === 'photo') {
      const pc = item as PhotoConsultation;
      setReviewNotes(pc.professional_notes || pc.master_reply || '');
      setReviewDoable(pc.is_doable);
      setReviewRecommendations(pc.recommendations || '');
      setReviewPriceRange(pc.estimated_price_range || '');
      setReviewDuration(pc.estimated_duration || '');
    } else {
      const bc = item as BookingConsultation;
      setReviewNotes(bc.master_notes || '');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-[var(--color-brand-pink-dark)]" />
        </div>
      </div>
    );
  }

  // ─── Detail/Review Panel (Dual-Pane Split Layout) ─────────────────
  if (selectedConsultation && detailType) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in px-4">
        <button
          onClick={() => { setSelectedConsultation(null); setDetailType(null); }}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:translate-x-[-2px] mb-6 transition-all duration-200"
        >
          <ArrowLeft size={16} /> Back to consultations
        </button>

        {detailType === 'photo' && (() => {
          const pc = selectedConsultation as PhotoConsultation;
          const allPhotos = pc.photo_urls?.length ? pc.photo_urls : [pc.photo_url];
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Pane: Client Context (col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-card border border-[var(--color-border-light)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[var(--color-border-light)] flex items-center justify-between flex-wrap gap-3 bg-white/40">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--color-text-primary)]">
                        {pc.title || 'Photo Consultation'}
                      </h3>
                      {pc.client_profile && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          From Client: <span className="font-semibold text-[var(--color-text-secondary)]">{pc.client_profile.full_name || 'Client'}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {statusBadge(pc.status)}
                      <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{formatDate(pc.created_at)}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Visual Photo Grid with zoom hover */}
                    <div>
                      <label className="label-upper mb-3">Submitted Photos</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allPhotos.map((url, i) => (
                          <div 
                            key={i} 
                            onClick={() => setLightboxUrl(url)}
                            className="relative rounded-xl overflow-hidden border border-[var(--color-border-light)] aspect-square cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <img src={url} alt={`Consultation photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 transform scale-90 group-hover:scale-100 transition-all duration-300">
                                <Eye size={16} />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Client Message */}
                    {(pc.description || pc.client_message) && (
                      <div className="bg-[var(--color-surface-light)]/70 rounded-xl p-4.5 border border-[var(--color-border-light)]">
                        <label className="label-upper mb-1.5">Client Notes</label>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">
                          "{pc.description || pc.client_message}"
                        </p>
                      </div>
                    )}

                    {/* Service Type Category */}
                    {pc.service_type && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Target Category:</span>
                        <span className="text-xs font-semibold text-[var(--color-brand-pink-dark)] bg-[var(--color-brand-pink-light)] px-3 py-1 rounded-full border border-[var(--color-brand-pink)]/10">
                          {pc.service_type}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Existing master reply (client view) */}
                {!isMasterOrOwner && pc.status !== 'pending' && (
                  <div className="glass-card-pink border border-[var(--color-brand-pink)]/20 p-6 space-y-4">
                    <h4 className="font-bold text-sm text-[var(--color-brand-pink-dark)] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className="animate-pulse" />
                      Professional Feedback
                    </h4>
                    {pc.is_doable !== null && (
                      <div className="flex items-center gap-2">
                        {pc.is_doable ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ThumbsUp size={12} /> Recommended & Doable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                            <ThumbsDown size={12} /> Not Recommended / Alternative Proposed
                          </span>
                        )}
                      </div>
                    )}
                    {pc.master_reply && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-[var(--color-border-light)] text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {pc.master_reply}
                      </div>
                    )}
                    {pc.recommendations && (
                      <div className="space-y-1.5">
                        <span className="label-upper">Recommendations</span>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{pc.recommendations}</p>
                      </div>
                    )}
                    {(pc.estimated_price_range || pc.estimated_duration) && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border-light)]">
                        {pc.estimated_price_range && (
                          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] bg-white/40 p-2.5 rounded-xl border border-[var(--color-border-light)]">
                            <DollarSign size={16} className="text-[var(--color-brand-pink-dark)] shrink-0" />
                            <div>
                              <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Est. Price Range</p>
                              <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">{pc.estimated_price_range}</p>
                            </div>
                          </div>
                        )}
                        {pc.estimated_duration && (
                          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] bg-white/40 p-2.5 rounded-xl border border-[var(--color-border-light)]">
                            <Timer size={16} className="text-[var(--color-brand-pink-dark)] shrink-0" />
                            <div>
                              <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Est. Duration</p>
                              <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">{pc.estimated_duration}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Pane: Master Review Form (col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                {isMasterOrOwner && pc.status === 'pending' && (
                  <div className="glass-card border border-[var(--color-border-light)] p-6 space-y-5 animate-slide-up stagger-1 h-fit sticky top-6 bg-white/80">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border-light)]">
                      Your Professional Assessment
                    </h3>

                    {/* Doable suitability buttons */}
                    <div className="space-y-2">
                      <label className="label-upper">Is this styling request doable?</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setReviewDoable(true)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-300 cursor-pointer ${
                            reviewDoable === true
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md scale-[1.02]'
                              : 'bg-white border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-emerald-300 hover:text-emerald-600'
                          }`}
                        >
                          <ThumbsUp size={16} /> Yes, doable
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewDoable(false)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-300 cursor-pointer ${
                            reviewDoable === false
                              ? 'bg-red-50 border-red-500 text-red-700 shadow-md scale-[1.02]'
                              : 'bg-white border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          <ThumbsDown size={16} /> Not recommended
                        </button>
                      </div>
                    </div>

                    {/* Professional notes */}
                    <div>
                      <label className="label-upper">Professional Notes / Message</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Provide details on hair quality, thickness, suitability, or options..."
                        rows={3}
                        className="input-glass mt-1 resize-none"
                      />
                    </div>

                    {/* Recommendations */}
                    <div>
                      <label className="label-upper">Recommendations / Care Tips</label>
                      <textarea
                        value={reviewRecommendations}
                        onChange={(e) => setReviewRecommendations(e.target.value)}
                        placeholder="e.g. Bring reference photos, wash hair 24h prior, etc."
                        rows={2.5}
                        className="input-glass mt-1 resize-none"
                      />
                    </div>

                    {/* Price Range & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-upper">Est. Price Range</label>
                        <input
                          type="text"
                          value={reviewPriceRange}
                          onChange={(e) => setReviewPriceRange(e.target.value)}
                          placeholder="e.g. €60 - €80"
                          className="input-glass mt-1"
                        />
                      </div>
                      <div>
                        <label className="label-upper">Est. Duration</label>
                        <input
                          type="text"
                          value={reviewDuration}
                          onChange={(e) => setReviewDuration(e.target.value)}
                          placeholder="e.g. 1.5 - 2 hours"
                          className="input-glass mt-1"
                        />
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex flex-col gap-2 pt-3">
                      <button
                        onClick={() => handleReviewSubmit(pc.id, 'approved')}
                        disabled={reviewSubmitting || reviewDoable === null}
                        className="btn-pink py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {reviewSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Approve & Send Assessment
                      </button>
                      <button
                        onClick={() => handleReviewSubmit(pc.id, 'declined')}
                        disabled={reviewSubmitting}
                        className="btn-outline py-3 text-sm font-semibold flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} /> Decline Request
                      </button>
                    </div>
                  </div>
                )}

                {/* Already Reviewed panel */}
                {isMasterOrOwner && pc.status !== 'pending' && (
                  <div className="glass-card-purple border border-[var(--color-secondary)]/20 p-6 space-y-4 h-fit sticky top-6">
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Your Submitted Review
                    </h4>
                    {pc.is_doable !== null && (
                      <div className="flex items-center gap-2">
                        {pc.is_doable ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ThumbsUp size={12} /> Marked as doable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                            <ThumbsDown size={12} /> Marked not recommended
                          </span>
                        )}
                      </div>
                    )}
                    {pc.professional_notes && (
                      <div className="space-y-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-light)]">
                        <span className="label-upper">Your Notes</span>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">"{pc.professional_notes}"</p>
                      </div>
                    )}
                    {pc.recommendations && (
                      <div className="space-y-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-light)]">
                        <span className="label-upper">Recommendations</span>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{pc.recommendations}</p>
                      </div>
                    )}
                    {(pc.estimated_price_range || pc.estimated_duration) && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {pc.estimated_price_range && (
                          <div className="p-2.5 bg-white/60 border border-[var(--color-border-light)] rounded-xl text-xs">
                            <span className="text-[var(--color-text-muted)] font-semibold uppercase">Est. Price:</span>{' '}
                            <span className="font-semibold text-[var(--color-text-primary)]">{pc.estimated_price_range}</span>
                          </div>
                        )}
                        {pc.estimated_duration && (
                          <div className="p-2.5 bg-white/60 border border-[var(--color-border-light)] rounded-xl text-xs">
                            <span className="text-[var(--color-text-muted)] font-semibold uppercase">Duration:</span>{' '}
                            <span className="font-semibold text-[var(--color-text-primary)]">{pc.estimated_duration}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {detailType === 'booking' && (() => {
          const bc = selectedConsultation as BookingConsultation;
          const allPhotos = bc.photo_urls || [];
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Pane: Details Card */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-card border border-[var(--color-border-light)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[var(--color-border-light)] flex items-center justify-between flex-wrap gap-3 bg-white/40">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Pre-Booking Review</h3>
                      {bc.client_profile && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          From Client: <span className="font-semibold text-[var(--color-text-secondary)]">{bc.client_profile.full_name || 'Client'}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {statusBadge(bc.status)}
                      <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{formatDate(bc.created_at)}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {bc.service && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Service Selected:</span>
                        <span className="text-xs font-semibold text-[var(--color-brand-pink-dark)] bg-[var(--color-brand-pink-light)] px-3 py-1 rounded-full border border-[var(--color-brand-pink)]/10">
                          {bc.service.name}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl bg-[var(--color-surface-light)]/60 border border-[var(--color-border-light)]">
                        <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Had service before?</p>
                        <p className="text-sm font-bold text-[var(--color-text-primary)] mt-1">{bc.had_before ? 'Yes' : 'No'}</p>
                      </div>
                      {bc.had_before && (
                        <>
                          <div className="p-3.5 rounded-xl bg-[var(--color-surface-light)]/60 border border-[var(--color-border-light)]">
                            <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">How long ago?</p>
                            <p className="text-sm font-bold text-[var(--color-text-primary)] mt-1">{bc.how_long_ago || 'N/A'}</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-[var(--color-surface-light)]/60 border border-[var(--color-border-light)]">
                            <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">Was master's work?</p>
                            <p className="text-sm font-bold text-[var(--color-text-primary)] mt-1">
                              {bc.was_my_work === true ? 'Yes' : bc.was_my_work === false ? 'No' : 'N/A'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {bc.additional_notes && (
                      <div className="bg-[var(--color-surface-light)]/70 rounded-xl p-4.5 border border-[var(--color-border-light)]">
                        <label className="label-upper mb-1.5">Additional Client Answers</label>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">
                          "{bc.additional_notes}"
                        </p>
                      </div>
                    )}

                    {allPhotos.length > 0 && (
                      <div>
                        <label className="label-upper mb-3">Submitted Photos</label>
                        <div className="grid grid-cols-3 gap-3">
                          {allPhotos.map((url, i) => (
                            <div 
                              key={i} 
                              onClick={() => setLightboxUrl(url)}
                              className="relative rounded-xl overflow-hidden border border-[var(--color-border-light)] aspect-square cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              <img src={url} alt={`Reference photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                                  <Eye size={14} />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client feedback view */}
                {!isMasterOrOwner && bc.master_notes && (
                  <div className="glass-card-pink border border-[var(--color-brand-pink)]/20 p-6">
                    <h4 className="font-bold text-sm text-[var(--color-brand-pink-dark)] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Sparkles size={16} />
                      Master Feedback
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-white/60 p-4 rounded-xl border border-[var(--color-border-light)]">
                      "{bc.master_notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Pane: Review Decision Panel */}
              <div className="lg:col-span-5">
                {isMasterOrOwner && bc.status === 'pending' && (
                  <div className="glass-card border border-[var(--color-border-light)] p-6 space-y-5 animate-slide-up bg-white/80 sticky top-6">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border-light)]">
                      Approve Booking Consultation
                    </h3>
                    
                    <div>
                      <label className="label-upper">Notes / Message for the client</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Provide details on preparation steps or approval notes..."
                        rows={4}
                        className="input-glass mt-1 resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => handleBookingReview(bc.id, 'approved')}
                        disabled={reviewSubmitting}
                        className="btn-pink py-3 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        {reviewSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Approve Booking
                      </button>
                      <button
                        onClick={() => handleBookingReview(bc.id, 'declined')}
                        disabled={reviewSubmitting}
                        className="btn-outline py-3 text-sm font-semibold flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} /> Decline Booking
                      </button>
                    </div>
                  </div>
                )}

                {isMasterOrOwner && bc.status !== 'pending' && bc.master_notes && (
                  <div className="glass-card-purple border border-[var(--color-secondary)]/20 p-6 space-y-3 h-fit sticky top-6">
                    <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Your Decision Notes
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic bg-white/60 p-4 rounded-xl border border-[var(--color-border-light)]">
                      "{bc.master_notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ─── Pre-Service Questionnaire (client view) ──────────────────────
  if (selectedAppointment) {
    const svc = services.find(s => s.id === selectedAppointment.service_id);
    const questions = (svc?.consultation_questions as unknown as { question: string; type?: string }[]) || [];
    return (
      <div className="max-w-2xl mx-auto animate-fade-in px-4">
        <button
          onClick={() => { setSelectedAppointment(null); resetQuestionnaireForm(); }}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:translate-x-[-2px] mb-6 transition-all duration-200"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="glass-card border border-[var(--color-border-light)] overflow-hidden shadow-elevated">
          <div className="px-6 py-5 border-b border-[var(--color-border-light)] bg-white/50">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <ClipboardList className="text-[var(--color-brand-pink-dark)]" size={20} />
              Pre-Service Questionnaire
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 font-medium flex items-center gap-1.5">
              <span>{selectedAppointment.service_name}</span>
              <span>·</span>
              <span className="text-[var(--color-text-secondary)]">
                {new Date(selectedAppointment.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Had Before toggle */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border-light)] flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hadBefore}
                  onChange={(e) => setHadBefore(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[var(--color-brand-pink)] focus:ring-[var(--color-brand-pink)] cursor-pointer group-hover:scale-105 transition-all"
                />
                <span className="text-sm font-semibold text-[var(--color-text-primary)] select-none">Have you had this service before?</span>
              </label>

              {hadBefore && (
                <div className="pl-7 space-y-4 pt-3 border-t border-[var(--color-border-light)] animate-fade-in">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={wasWithMaster}
                      onChange={(e) => setWasWithMaster(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--color-brand-pink)] focus:ring-[var(--color-brand-pink)] cursor-pointer group-hover:scale-105 transition-all"
                    />
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] select-none">Was it with this salon/professional?</span>
                  </label>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">How long ago was your last service?</label>
                    <select
                      value={timeSinceLast}
                      onChange={(e) => setTimeSinceLast(e.target.value)}
                      className="input-glass mt-1.5 py-2.5"
                    >
                      <option value="">Select duration...</option>
                      <option value="less_than_month">Less than a month ago</option>
                      <option value="1_3_months">1-3 months ago</option>
                      <option value="3_6_months">3-6 months ago</option>
                      <option value="6_12_months">6-12 months ago</option>
                      <option value="over_year">Over a year ago</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic questions from service config */}
            {questions.length > 0 && (
              <div className="space-y-5">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pb-1 border-b border-[var(--color-border-light)]">Service specific inquiries</p>
                {questions.map((q, idx) => (
                  <div key={idx} className="animate-fade-in">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-tight">
                      {q.question || `Question ${idx + 1}`}
                    </label>
                    <textarea
                      value={questionnaireAnswers[`q_${idx}`] || ''}
                      onChange={(e) => setQuestionnaireAnswers(prev => ({ ...prev, [`q_${idx}`]: e.target.value }))}
                      placeholder="Type your response here..."
                      rows={2.5}
                      className="input-glass mt-1.5 resize-none font-sans"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-tight">Additional Notes / Health Disclosures</label>
              <textarea
                value={questionnaireNotes}
                onChange={(e) => setQuestionnaireNotes(e.target.value)}
                placeholder="Mention allergies, sensitivities, or special requests..."
                rows={3}
                className="input-glass mt-1.5 resize-none font-sans"
              />
            </div>

            <button
              onClick={handleQuestionnaireSubmit}
              disabled={questionnaireSubmitting}
              className="btn-pink w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {questionnaireSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Pre-Service Questionnaire
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main View (Consolidated Portal Dashboard) ───────────────────
  const pendingPhotoCount = photoConsultations.filter(c => c.status === 'pending').length;
  const pendingBookingCount = bookingConsultations.filter(c => c.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in px-4">
      {/* Dynamic Background Blobs locally */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob-pink top-10 right-10 opacity-30 animate-float" style={{ width: '220px', height: '220px' }} />
        <div className="blob-purple bottom-20 left-10 opacity-25 animate-float" style={{ width: '260px', height: '260px', animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight text-gradient-pink w-fit">
            Consultations
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 font-medium">
            {isMasterOrOwner
              ? 'Assess client photo consults and check upcoming service questionnaires'
              : 'View your consultation statuses and complete pre-service forms'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--color-border-light)] overflow-x-auto shadow-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            let badge = 0;
            if (isMasterOrOwner) {
              if (tab === 'Photo Reviews') badge = pendingPhotoCount;
              if (tab === 'Booking Reviews') badge = pendingBookingCount;
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--color-brand-pink)] to-[var(--color-brand-purple)] text-white shadow-md scale-[1.01]'
                    : 'text-[var(--color-text-secondary)] hover:bg-white/60 hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab}
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white animate-pulse">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>


        {/* ─── Client Tab: My Requests ───────────────────────────── */}
        {!isMasterOrOwner && activeTab === 'My Requests' && (
          <div className="space-y-4 animate-scale-in">
            {photoConsultations.length === 0 && bookingConsultations.length === 0 ? (
              <div className="text-center py-20 glass-card border border-[var(--color-border-light)] p-8 max-w-md mx-auto animate-scale-in bg-white/70">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] flex items-center justify-center mx-auto mb-5 shadow-sm animate-float">
                  <FileText size={28} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No consultations yet</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-xs mx-auto">When your specialist requires a consultation, it will appear here for you to review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo consultations */}
                {photoConsultations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                      <Camera size={13} /> Photo Consultations
                    </h3>
                    {photoConsultations.map(pc => {
                      const thumb = pc.photo_urls?.[0] || pc.photo_url;
                      return (
                        <button
                          key={pc.id}
                          data-row-id={pc.id}
                          onClick={() => openDetail(pc, 'photo')}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border-light)] bg-white/70 backdrop-blur-xl hover:shadow-elevated hover:bg-white hover:-translate-y-0.5 transition-all duration-300 text-left group"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border-light)] shrink-0 shadow-sm">
                            <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-pink-dark)] transition-colors">
                                {pc.title || 'Photo Consultation'}
                              </p>
                              {statusBadge(pc.status)}
                            </div>

                            <p className="text-[11px] text-[var(--color-text-secondary)] font-medium flex items-center gap-1 flex-wrap">
                              {pc.service_type && (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)] border border-[var(--color-brand-pink)]/10">
                                  {pc.service_type}
                                </span>
                              )}
                              <span>·</span>
                              <span>{formatDate(pc.created_at)}</span>
                              {pc.photo_urls && pc.photo_urls.length > 1 && (
                                <>
                                  <span>·</span>
                                  <span className="text-[var(--color-text-muted)] flex items-center gap-0.5">
                                    <ImageIcon size={10} /> {pc.photo_urls.length} photos
                                  </span>
                                </>
                              )}
                            </p>

                            {/* Timeline indicators */}
                            <div className="pt-2 flex items-center gap-1">
                              <div className={`h-1.5 rounded-full flex-1 ${pc.status === 'pending' || pc.status === 'in_review' || pc.status === 'responded' ? 'bg-[var(--color-brand-pink)]' : 'bg-gray-100'}`} />
                              <div className={`h-1.5 rounded-full flex-1 ${pc.status === 'in_review' || pc.status === 'responded' ? 'bg-[var(--color-brand-pink)]' : 'bg-gray-100'}`} />
                              <div className={`h-1.5 rounded-full flex-1 ${pc.status === 'responded' ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] pl-2 shrink-0">
                                {pc.status === 'pending' ? 'Submitted' : pc.status === 'in_review' ? 'In Review' : 'Feedback Sent'}
                              </span>
                            </div>

                            {pc.status === 'responded' && pc.master_reply && (
                              <div className="mt-2 text-[11px] text-[var(--color-text-secondary)] bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2 flex items-start gap-1.5 animate-fade-in">
                                <Sparkles size={12} className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                                <span className="truncate italic">"{pc.master_reply}"</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Booking consultations */}
                {bookingConsultations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                      <ClipboardList size={13} /> Booking Reviews
                    </h3>
                    {bookingConsultations.map(bc => (
                      <button
                        key={bc.id}
                        data-row-id={bc.id}
                        onClick={() => openDetail(bc, 'booking')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border-light)] bg-white/70 backdrop-blur-xl hover:shadow-elevated hover:bg-white hover:-translate-y-0.5 transition-all duration-300 text-left group"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] border border-[var(--color-border-light)] flex items-center justify-center shrink-0 shadow-sm">
                          <ClipboardList size={22} className="text-[var(--color-brand-pink-dark)]" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-pink-dark)] transition-colors">
                              {bc.service?.name || 'Booking Consultation'}
                            </p>
                            {statusBadge(bc.status)}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] font-medium flex items-center gap-1.5">
                            <span>Submitted:</span>
                            <span>{formatDate(bc.created_at)}</span>
                          </p>
                          {bc.status === 'pending' && (
                            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                              <Clock size={11} /> Pending Master Approval
                            </p>
                          )}
                          {bc.status !== 'pending' && bc.master_notes && (
                            <div className="mt-2 text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-surface-light)] border border-[var(--color-border-light)] rounded-xl p-2 truncate italic">
                              "{bc.master_notes}"
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Client Tab: Pre-Service Forms ─────────────────────── */}
        {!isMasterOrOwner && activeTab === 'Pre-Service Forms' && (
          <div className="space-y-4 animate-scale-in">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-20 glass-card border border-[var(--color-border-light)] p-8 max-w-md mx-auto bg-white/70">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] flex items-center justify-center mx-auto mb-5 shadow-sm animate-float">
                  <ClipboardList size={28} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No pre-service forms needed</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-xs mx-auto">Forms will appear here when you have upcoming appointments that require a pre-service questionnaire.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {upcomingAppointments.map(appt => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--color-border-light)] bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] border border-[var(--color-border-light)] flex items-center justify-center shrink-0">
                        <ClipboardList size={20} className="text-[var(--color-brand-pink-dark)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{appt.service_name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">
                          {new Date(appt.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div>
                      {appt.has_response ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedAppointment(appt)}
                          className="btn-pink px-4 py-2 text-xs font-bold flex items-center gap-1 hover:scale-105 cursor-pointer shadow-sm"
                        >
                          Fill Form <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Master Tab: Photo Reviews ─────────────────────────── */}
        {isMasterOrOwner && activeTab === 'Photo Reviews' && (
          <div className="space-y-4 animate-scale-in">
            {photoConsultations.length === 0 ? (
              <div className="text-center py-20 glass-card border border-[var(--color-border-light)] p-8 max-w-md mx-auto bg-white/70">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <Eye size={28} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No photo reviews</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1.5">New photo consultations from clients will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photoConsultations.map(pc => {
                  const thumb = pc.photo_urls?.[0] || pc.photo_url;
                  const isPending = pc.status === 'pending';
                  return (
                    <button
                      key={pc.id}
                      data-row-id={pc.id}
                      onClick={() => openDetail(pc, 'photo')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left group relative ${
                        isPending 
                          ? 'border-[var(--color-brand-pink)]/30 bg-gradient-to-r from-pink-50/50 to-white/90 shadow-sm hover:shadow-md' 
                          : 'border-[var(--color-border-light)] bg-white/70 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border-light)] shrink-0 shadow-sm">
                        <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-pink-dark)] transition-colors">
                            {pc.title || 'Photo Consultation'}
                          </p>
                          {statusBadge(pc.status)}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[var(--color-text-primary)]">{pc.client_profile?.full_name || 'Client'}</span>
                          <span>·</span>
                          <span>{formatDate(pc.created_at)}</span>
                          {pc.service_type && (
                            <>
                              <span>·</span>
                              <span className="px-2 py-0.5 rounded-md bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)] text-[10px] font-bold">
                                {pc.service_type}
                              </span>
                            </>
                          )}
                        </p>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                            Action Needed
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Master Tab: Booking Reviews ───────────────────────── */}
        {isMasterOrOwner && activeTab === 'Booking Reviews' && (
          <div className="space-y-4 animate-scale-in">
            {bookingConsultations.length === 0 ? (
              <div className="text-center py-20 glass-card border border-[var(--color-border-light)] p-8 max-w-md mx-auto bg-white/70">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <CalendarPlus size={28} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No booking reviews</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1.5">Pre-booking consultations requiring approval will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingConsultations.map(bc => {
                  const isPending = bc.status === 'pending';
                  return (
                    <button
                      key={bc.id}
                      data-row-id={bc.id}
                      onClick={() => openDetail(bc, 'booking')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left group relative ${
                        isPending 
                          ? 'border-[var(--color-brand-pink)]/30 bg-gradient-to-r from-pink-50/50 to-white/90 shadow-sm hover:shadow-md' 
                          : 'border-[var(--color-border-light)] bg-white/70 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] border border-[var(--color-border-light)] flex items-center justify-center shrink-0 shadow-sm">
                        <ClipboardList size={22} className="text-[var(--color-brand-pink-dark)]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-pink-dark)] transition-colors">
                            {bc.service?.name || 'Booking Consultation'}
                          </p>
                          {statusBadge(bc.status)}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--color-text-primary)]">{bc.client_profile?.full_name || 'Client'}</span>
                          <span>·</span>
                          <span>{formatDate(bc.created_at)}</span>
                        </p>
                        {bc.had_before && (
                          <p className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase">
                            Had Service Before: {bc.how_long_ago ? bc.how_long_ago.replace(/_/g, ' ') : 'Yes'}
                          </p>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                            Pending Review
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Master Tab: Assessments ───────────────────────────── */}
        {isMasterOrOwner && activeTab === 'Assessments' && (
          <div className="space-y-4 animate-scale-in">
            {consultationResponses.length === 0 ? (
              <div className="text-center py-20 glass-card border border-[var(--color-border-light)] p-8 max-w-md mx-auto bg-white/70">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-brand-pink-light)] to-[var(--color-lavender)] flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <ClipboardList size={28} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No assessments</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1.5">Completed client pre-service questionnaires will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consultationResponses.map(cr => (
                  <div
                    key={cr.id}
                    data-row-id={cr.id}
                    className="p-5 rounded-2xl border border-[var(--color-border-light)] bg-white/70 backdrop-blur-xl shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden border border-white/20 shadow-sm">
                          {cr.client_profile?.avatar_url ? (
                            <img src={cr.client_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (cr.client_profile?.full_name?.charAt(0) || 'C').toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                            {cr.client_profile?.full_name || 'Client'}
                          </p>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">{formatDate(cr.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {cr.service && (
                          <span className="text-[10px] font-bold text-[var(--color-brand-pink-dark)] bg-[var(--color-brand-pink-light)] px-2.5 py-0.5 rounded-full border border-[var(--color-brand-pink)]/10 shadow-sm">
                            {cr.service.name}
                          </span>
                        )}
                        {cr.appointment && (
                          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] bg-white/50 px-2 py-0.5 rounded-full border border-[var(--color-border-light)]">
                            Appt: {cr.appointment.start_time ? new Date(cr.appointment.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                          </span>
                        )}
                      </div>

                      {/* Summary answers */}
                      <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-light)]/60 border border-[var(--color-border-light)] p-3 rounded-xl">
                        <div className="text-[11px] leading-relaxed">
                          <span className="text-[var(--color-text-muted)] font-medium">Had service before:</span>{' '}
                          <span className="font-bold text-[var(--color-text-primary)]">{cr.has_had_before ? 'Yes' : 'No'}</span>
                        </div>
                        {cr.has_had_before && (
                          <>
                            <div className="text-[11px] leading-relaxed">
                              <span className="text-[var(--color-text-muted)] font-medium">With you:</span>{' '}
                              <span className="font-bold text-[var(--color-text-primary)]">{cr.was_with_this_master ? 'Yes' : 'No'}</span>
                            </div>
                            {cr.time_since_last && (
                              <div className="text-[11px] leading-relaxed col-span-2 mt-1 border-t border-[var(--color-border-light)] pt-1">
                                <span className="text-[var(--color-text-muted)] font-medium">Last service:</span>{' '}
                                <span className="font-bold text-[var(--color-text-primary)]">{cr.time_since_last.replace(/_/g, ' ')}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Custom answers list */}
                      {cr.additional_answers && Object.keys(cr.additional_answers).length > 0 && (
                        <div className="space-y-2 border-t border-[var(--color-border-light)] pt-3">
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Dynamic questions answered</p>
                          {Object.entries(cr.additional_answers).map(([key, val]) => (
                            <div key={key} className="text-xs bg-white/40 p-2 rounded-xl border border-[var(--color-border-light)]">
                              <span className="font-semibold text-[var(--color-text-secondary)] block mb-0.5">Question {key.replace(/^q_/, '')}:</span>
                              <span className="text-[var(--color-text-primary)] leading-normal">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client Notes */}
                    {cr.consultation_notes && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100/50 flex items-start gap-2">
                        <StickyNote size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-normal italic">
                          "{cr.consultation_notes}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox Overlay Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={lightboxUrl} alt="Enlarged preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
