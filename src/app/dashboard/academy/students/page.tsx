'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft, Search, GraduationCap, DollarSign, Users, CheckCircle2,
  ChevronRight, Loader2, X, Clock, Play, BookOpen, AlertTriangle
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
      const enriched: StudentEnrollment[] = enrollmentData.map((enrollment: any) => {
        const courseLessonIds = lessonsByCourse[enrollment.course_id] || [];
        const totalLessonsCount = courseLessonIds.length;

        const userProg = progressByUser[enrollment.student_id] || { completed: new Set(), latestUpdate: null };

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
    </div>
  );
}
