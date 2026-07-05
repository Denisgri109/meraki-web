'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft, Search, GraduationCap, DollarSign, Users, CheckCircle2,
  ChevronRight, Loader2, X, Clock, Play, BookOpen, AlertTriangle,
  Gift, UserPlus, Mail, KeyRound, Tag, Sparkles, PartyPopper
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface StudentEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  completed_at: string | null;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  course: {
    id: string;
    title: string;
    price: number | null;
  } | null;
  progress: number;
  lastActive: string | null;
  completedLessonsCount: number;
  totalLessonsCount: number;
}

interface Lesson {
  id: string;
  title: string;
  chapter: { title: string } | null;
  chapter_id: string | null;
}

interface CompletedLessonProgress {
  lesson_id: string;
  completed_at: string;
  lesson: {
    title: string;
    chapter: { title: string } | null;
  } | null;
}

export default function AcademyStudentsPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (role && role !== 'owner') {
      router.replace('/dashboard/academy');
    }
  }, [role, router]);

  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Analytics stats
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    completionRate: 0,
  });

  // Student details modal
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<CompletedLessonProgress[]>([]);
  const [allCourseLessons, setAllCourseLessons] = useState<Lesson[]>([]);

  // ── Launch Day Voucher Registration ───────────────────────────────────────
  // Help-desk flow: register a walk-in client and claim their prize-wheel voucher.
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    fullName: '',
    email: '',
    password: '',
    code: 'LAUNCH50',
  });
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{
    ok: boolean;
    email: string;
    voucherCode: string;
    discount: string;
    expiresAt: string;
  } | null>(null);

  const handleRegisterAndClaim = async () => {
    const { fullName, email, password, code } = voucherForm;

    if (!fullName.trim()) { showToast('Enter the client\'s full name.', 'error'); return; }
    if (!email.trim() || !email.includes('@')) { showToast('Enter a valid email address.', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }
    if (!code.trim()) { showToast('Enter a voucher code.', 'error'); return; }

    setRegistering(true);
    setRegisterResult(null);

    try {
      // 1. Temporary client so the developer's own session is never overwritten.
      const tempClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } },
      );

      // 2. Register the new walk-in client.
      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim(), role: 'client' } },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already') || signUpError.status === 422) {
          throw new Error('This email is already registered. Ask the client to log in and claim their voucher from the app.');
        }
        throw signUpError;
      }
      if (!signUpData.user) {
        throw new Error('Registration did not return a user. Email confirmation may be enabled — disable it in Supabase Auth settings for launch day.');
      }

      // 3. Claim the voucher using the new user's own session (claim-voucher
      //    requires the caller's JWT to match the userId).
      const { data: claimData, error: claimError } = await tempClient.functions.invoke('claim-voucher', {
        body: { code: code.trim().toUpperCase(), userId: signUpData.user.id },
      });

      if (claimError) {
        const msg = (claimError as any)?.message?.toLowerCase() || '';
        if (msg.includes('not found') || msg.includes('invalid')) {
          throw new Error('Voucher code not found. Check the code on the prize wheel.');
        }
        if (msg.includes('usage') || msg.includes('limit') || msg.includes('max')) {
          throw new Error('This voucher has reached its usage limit.');
        }
        if (msg.includes('already')) {
          throw new Error('This user has already claimed this voucher.');
        }
        if (msg.includes('expired')) {
          throw new Error('This voucher has expired.');
        }
        throw claimError;
      }

      const claimed = claimData?.voucher || claimData;
      setRegisterResult({
        ok: true,
        email: email.trim(),
        voucherCode: claimed?.code || code.trim().toUpperCase(),
        discount: claimed?.discount_type === 'percentage'
          ? `${claimed.discount_value}% off`
          : `€${Number(claimed?.discount_value || 0).toFixed(2)} off`,
        expiresAt: claimData?.expires_at || claimed?.expires_at || '',
      });
      showToast(`${fullName.trim()} registered and voucher applied!`, 'success');
    } catch (err: any) {
      console.error('[Voucher Registration] error:', err);
      showToast(err?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const resetVoucherForm = () => {
    setVoucherForm({ fullName: '', email: '', password: '', code: 'LAUNCH50' });
    setRegisterResult(null);
    setShowVoucherModal(false);
  };


  const fetchStudentData = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch course enrollments for this instructor's courses
      // We first fetch courses of the instructor to only show relevant enrollments
      const { data: ownerCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', user.id);

      if (!ownerCourses || ownerCourses.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      const ownerCourseIds = ownerCourses.map(c => c.id);

      const { data: enrollmentData, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          profile:profiles!course_enrollments_student_id_fkey(id, full_name, email, avatar_url),
          course:courses(id, title, price)
        `)
        .in('course_id', ownerCourseIds)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      if (!enrollmentData || enrollmentData.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      const courseIds = [...new Set(enrollmentData.map((e) => e.course_id).filter((id): id is string => !!id))];
      const studentIds = [...new Set(enrollmentData.map((e) => e.student_id).filter((id): id is string => !!id))];

      // 2. Fetch all lessons for these courses
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, course_id, title')
        .in('course_id', courseIds);

      const lessonsByCourse = (allLessons || []).reduce((acc: Record<string, string[]>, lesson) => {
        if (!acc[lesson.course_id]) acc[lesson.course_id] = [];
        acc[lesson.course_id].push(lesson.id);
        return acc;
      }, {});

      const allLessonIds = (allLessons || []).map((l) => l.id);

      // 3. Fetch all progress for these students and lessons
      let progressByUser: Record<string, { completed: Set<string>; latestUpdate: string | null }> = {};
      if (studentIds.length > 0 && allLessonIds.length > 0) {
        const { data: allProgress } = await supabase
          .from('lesson_progress')
          .select('user_id, lesson_id, completed_at, updated_at')
          .in('user_id', studentIds)
          .in('lesson_id', allLessonIds);

        progressByUser = (allProgress || []).reduce((acc, prog) => {
          if (!acc[prog.user_id]) {
            acc[prog.user_id] = { completed: new Set(), latestUpdate: null };
          }
          if (prog.completed_at) {
            acc[prog.user_id].completed.add(prog.lesson_id);
          }
          if (prog.updated_at) {
            const updateDate = new Date(prog.updated_at).getTime();
            const currentLatestStr = acc[prog.user_id].latestUpdate;
            const currentLatest = currentLatestStr ? new Date(currentLatestStr).getTime() : 0;
            if (updateDate > currentLatest) {
              acc[prog.user_id].latestUpdate = prog.updated_at;
            }
          }
          return acc;
        }, {} as Record<string, { completed: Set<string>; latestUpdate: string | null }>);
      }

      // 4. Enrich enrollments with progress calculations
      const enriched: StudentEnrollment[] = enrollmentData.map((enrollment) => {
        const courseId = enrollment.course_id || '';
        const studentId = enrollment.student_id || '';

        const courseLessonIds = lessonsByCourse[courseId] || [];
        const totalLessonsCount = courseLessonIds.length;

        const userProg = progressByUser[studentId] || { completed: new Set(), latestUpdate: null };

        let completedLessonsCount = 0;
        for (const lid of courseLessonIds) {
          if (userProg.completed.has(lid)) {
            completedLessonsCount++;
          }
        }

        const progress = totalLessonsCount > 0
          ? Math.min(Math.round((completedLessonsCount / totalLessonsCount) * 100), 100)
          : 0;

        return {
          ...enrollment,
          course_id: courseId,
          student_id: studentId,
          enrolled_at: enrollment.enrolled_at || '',
          progress,
          completedLessonsCount,
          totalLessonsCount,
          lastActive: userProg.latestUpdate || enrollment.enrolled_at,
        };
      });

      setEnrollments(enriched);

      // Compute analytics
      const uniqueStudentsCount = new Set(enriched.map((e) => e.student_id)).size;
      const totalRevenueVal = enriched.reduce((sum, e) => sum + (e.course?.price || 0), 0);
      const completedCount = enriched.filter((e) => e.completed_at || e.progress === 100).length;
      const completionRateVal = enriched.length > 0
        ? Math.round((completedCount / enriched.length) * 100)
        : 0;

      setAnalytics({
        totalStudents: uniqueStudentsCount,
        totalRevenue: totalRevenueVal,
        completionRate: completionRateVal,
      });

    } catch (err: any) {
      console.error('[Academy Students] fetch error:', err);
      showToast(err.message || 'Failed to fetch student data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, showToast]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const openStudentDetails = async (enrollment: StudentEnrollment) => {
    setSelectedEnrollment(enrollment);
    setModalLoading(true);
    try {
      // 1. Fetch course lessons with chapter names
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          chapter_id,
          chapter:chapters(title)
        `)
        .eq('course_id', enrollment.course_id)
        .order('order_index');

      const mappedLessons: Lesson[] = (lessonsData || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        chapter_id: l.chapter_id,
        chapter: l.chapter ? { title: l.chapter.title } : null,
      }));
      setAllCourseLessons(mappedLessons);

      // 2. Fetch completed lesson progress details
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select(`
          lesson_id,
          completed_at,
          lesson:lessons(
            title,
            chapter:chapters(title)
          )
        `)
        .eq('user_id', enrollment.student_id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const mappedProgress: CompletedLessonProgress[] = (progressData || [])
        .filter((p: any) => mappedLessons.some((ml) => ml.id === p.lesson_id))
        .map((p: any) => ({
          lesson_id: p.lesson_id,
          completed_at: p.completed_at,
          lesson: p.lesson ? {
            title: p.lesson.title,
            chapter: p.lesson.chapter ? { title: p.lesson.chapter.title } : null
          } : null,
        }));

      setCompletedLessons(mappedProgress);

    } catch (err: any) {
      console.error('Error fetching student progress details:', err);
      showToast('Failed to load student progress details', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const studentName = e.profile?.full_name?.toLowerCase() || '';
    const studentEmail = e.profile?.email?.toLowerCase() || '';
    const courseTitle = e.course?.title?.toLowerCase() || '';
    const query = search.toLowerCase();

    return studentName.includes(query) || studentEmail.includes(query) || courseTitle.includes(query);
  });

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <button
        onClick={() => router.push('/dashboard/academy')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Academy
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-pink-500" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-text-muted)]">Students</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Student Directory</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Track and support student progress across your academy</p>
        </div>
        <button
          onClick={() => setShowVoucherModal(true)}
          className="btn-pink inline-flex items-center gap-2 px-5 py-3 text-sm font-bold shrink-0 shadow-md hover:shadow-lg transition-all"
        >
          <Gift size={16} /> Register Client & Voucher
        </button>
      </div>

      {/* ── Launch Day Registration Banner ── */}
      <div className="glass-card p-4 mb-8 flex items-center gap-4 border-l-4 border-[var(--color-brand-pink)]">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-[var(--color-brand-pink-dark)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-[var(--color-text-primary)]">Launch Day Help-Desk</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Register walk-in clients and apply their prize-wheel voucher (e.g. <span className="font-mono font-semibold text-[var(--color-brand-pink-dark)]">LAUNCH50</span> — 50% off, valid 7 days).
          </p>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 mb-3" />
          <p className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{analytics.totalStudents}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Total Students</p>
        </div>
        <div className="glass-card p-5">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 mb-3" />
          <p className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">£{analytics.totalRevenue.toFixed(2)}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Estimated Revenue</p>
        </div>
        <div className="glass-card p-5">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 mb-3" />
          <p className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{analytics.completionRate}%</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Avg Completion Rate</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Search by student name, email, or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass w-full pl-11"
        />
      </div>

      {/* Students List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mx-auto mb-4 animate-float">
            <Users size={32} className="text-pink-500" />
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">
            {search ? 'No matching students' : 'No students enrolled yet'}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {search ? 'Try adjusting your search filters' : 'Students will appear here once they enroll in a course'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEnrollments.map((enrollment) => {
            const hasCompleted = enrollment.completed_at || enrollment.progress === 100;
            return (
              <div
                key={enrollment.id}
                onClick={() => openStudentDetails(enrollment)}
                className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                {/* Profile info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm animate-fade-in">
                    {enrollment.profile?.avatar_url ? (
                      <img src={enrollment.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      enrollment.profile?.full_name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-pink-500 transition-colors truncate">
                        {enrollment.profile?.full_name || 'Anonymous Student'}
                      </p>
                      {hasCompleted && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{enrollment.profile?.email}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium truncate">
                      Enrolled: <span className="text-[var(--color-text-primary)]">{enrollment.course?.title || 'Unknown Course'}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 md:w-48 shrink-0">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all ${hasCompleted ? 'from-emerald-400 to-green-500' : 'from-pink-400 to-rose-500'}`}
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] w-12 text-right">
                    {enrollment.progress}%
                  </span>
                </div>

                {/* Last Active and Chevron */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--color-border-light)]">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Last Active</p>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">
                      {formatLastActive(enrollment.lastActive)}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Student Details Modal ── */}
      {selectedEnrollment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setSelectedEnrollment(null)}
        >
          <div
            className="glass-card w-full max-w-xl p-6 shadow-2xl my-8 relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)] shrink-0">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Student Profile & Progress</h2>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-[var(--color-border-light)]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0">
                  {selectedEnrollment.profile?.avatar_url ? (
                    <img src={selectedEnrollment.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedEnrollment.profile?.full_name?.charAt(0) || '?'
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] truncate">
                    {selectedEnrollment.profile?.full_name || 'Anonymous Student'}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] truncate">{selectedEnrollment.profile?.email}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Student ID: <span className="font-mono text-gray-500">{selectedEnrollment.student_id.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-gray-50/30 p-5 rounded-xl border border-[var(--color-border-light)]">
                <h4 className="font-bold text-[var(--color-text-primary)] text-sm mb-3">
                  Course: {selectedEnrollment.course?.title || 'Unknown Course'}
                </h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all ${selectedEnrollment.progress === 100 ? 'from-emerald-400 to-green-500' : 'from-pink-400 to-rose-500'}`}
                      style={{ width: `${selectedEnrollment.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[var(--color-text-secondary)] shrink-0">
                    {selectedEnrollment.progress}% Complete
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border-light)] pt-3 text-xs text-[var(--color-text-secondary)]">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Enrolled Date</p>
                    <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                      {new Date(selectedEnrollment.enrolled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Completed Lessons</p>
                    <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                      {selectedEnrollment.completedLessonsCount} / {selectedEnrollment.totalLessonsCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline of Completed Lessons */}
              <div>
                <h4 className="font-bold text-[var(--color-text-primary)] text-sm mb-4">Lesson Completion Timeline</h4>
                {modalLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-pink-500" size={24} />
                  </div>
                ) : allCourseLessons.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] text-center py-6">No lessons are present in this course.</p>
                ) : (
                  <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                    {allCourseLessons.map((lesson) => {
                      const progressInfo = completedLessons.find(p => p.lesson_id === lesson.id);
                      const isCompleted = !!progressInfo;
                      return (
                        <div key={lesson.id} className="relative">
                          {/* Timeline dot */}
                          <span
                            className={`absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white transition-colors z-10 ${isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}
                          />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                              {lesson.title}
                            </p>
                            {lesson.chapter?.title && (
                              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase tracking-wider">
                                {lesson.chapter.title}
                              </p>
                            )}
                            {isCompleted && (
                              <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                <Clock size={10} /> Completed {new Date(progressInfo.completed_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[var(--color-border-light)] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="btn-primary px-6 py-2"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Launch Day Voucher Registration Modal ── */}
      {showVoucherModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={resetVoucherForm}
        >
          <div
            className="glass-card w-full max-w-md p-6 shadow-2xl my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <Gift size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Register Client & Voucher</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Launch day help-desk</p>
                </div>
              </div>
              <button
                onClick={resetVoucherForm}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {registerResult?.ok ? (
              /* ── Success state ── */
              <div className="py-6 text-center">
                <style>{`
                  @keyframes checkPop {
                    0% { transform: scale(0); opacity: 0; }
                    55% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .check-pop { animation: checkPop 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                `}</style>
                <div className="check-pop w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 size={42} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-3">
                  <PartyPopper size={12} className="text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">All Set</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Client Registered!</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                  <span className="font-semibold">{registerResult.email}</span> can now log in and pay on-site.
                </p>

                <div className="bg-[var(--color-surface-light)] rounded-xl p-4 text-left space-y-2 mb-5 border border-[var(--color-border-light)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
                      <Tag size={11} /> Voucher
                    </span>
                    <span className="font-mono text-sm font-bold text-[var(--color-brand-pink-dark)]">{registerResult.voucherCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Discount</span>
                    <span className="text-sm font-bold text-emerald-600">{registerResult.discount}</span>
                  </div>
                  {registerResult.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
                        <Clock size={11} /> Expires
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {new Date(registerResult.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[var(--color-text-muted)] mb-5 leading-relaxed">
                  The voucher is now active on their account and will be applied automatically when they scan a QR code to pay.
                </p>

                <div className="flex gap-3">
                  <button onClick={resetVoucherForm} className="btn-outline flex-1 py-2.5 text-sm">Close</button>
                  <button
                    onClick={() => { setRegisterResult(null); setVoucherForm({ fullName: '', email: '', password: '', code: voucherForm.code }); }}
                    className="btn-pink flex-1 py-2.5 text-sm"
                  >
                    Register Next
                  </button>
                </div>
              </div>
            ) : (
              /* ── Registration form ── */
              <div className="py-5 space-y-4">
                <div>
                  <label className="label-upper">Client Full Name *</label>
                  <div className="relative mt-1">
                    <UserPlus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      type="text"
                      value={voucherForm.fullName}
                      onChange={(e) => setVoucherForm({ ...voucherForm, fullName: e.target.value })}
                      className="input-glass w-full pl-10"
                      placeholder="e.g. Sofia Rossi"
                      disabled={registering}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-upper">Email *</label>
                  <div className="relative mt-1">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      type="email"
                      value={voucherForm.email}
                      onChange={(e) => setVoucherForm({ ...voucherForm, email: e.target.value })}
                      className="input-glass w-full pl-10"
                      placeholder="client@email.com"
                      disabled={registering}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-upper">Password *</label>
                  <div className="relative mt-1">
                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      type="password"
                      value={voucherForm.password}
                      onChange={(e) => setVoucherForm({ ...voucherForm, password: e.target.value })}
                      className="input-glass w-full pl-10"
                      placeholder="Min. 6 characters"
                      disabled={registering}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-upper">Voucher Code (from prize wheel)</label>
                  <div className="relative mt-1">
                    <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input
                      type="text"
                      value={voucherForm.code}
                      onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                      className="input-glass w-full pl-10 font-mono uppercase tracking-wider"
                      placeholder="LAUNCH50"
                      disabled={registering}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                    The voucher applies a 7-day discount, enforced server-side. Expires exactly 7 days from activation.
                  </p>
                </div>

                <button
                  onClick={handleRegisterAndClaim}
                  disabled={registering}
                  className="btn-pink w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {registering ? (
                    <><Loader2 size={16} className="animate-spin" /> Registering & applying voucher…</>
                  ) : (
                    <><Gift size={16} /> Register & Apply Voucher</>
                  )}
                </button>

                <p className="text-[11px] text-[var(--color-text-muted)] text-center leading-relaxed">
                  Creates the client account and applies the voucher in one step. The client can then scan a QR code to pay with their discount.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
