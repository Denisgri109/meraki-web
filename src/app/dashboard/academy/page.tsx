'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Play, Search, Users, ArrowLeft, CheckCircle2, Clock, BookOpen, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  instructor_id: string | null;
  enrollment_count?: number;
  lesson_count?: number;
}

export default function AcademyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Flow State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*, course_enrollments(count), lessons(count)')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) console.error('[Academy] courses error:', error);

        const coursesWithEnrollment = (data || []).map((c: any) => ({
          ...c,
          enrollment_count: c.course_enrollments?.[0]?.count || 0,
          lesson_count: c.lessons?.[0]?.count || 0,
        }));

        setCourses(coursesWithEnrollment as Course[]);
      } catch (err) {
        console.error('[Academy] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = courses.filter((c) => {
    return !search || c.title?.toLowerCase().includes(search.toLowerCase());
  });

  const handleEnroll = async () => {
    if (!user || !selectedCourse) return;
    setEnrolling(true);

    try {
      // In a real app with Stripe, we would create a Stripe Checkout session here instead of writing straight to DB.
      // For now, simulating a successful purchase flow and granting access.
      const { error } = await supabase.from('course_enrollments').insert({
        student_id: user.id,
        course_id: selectedCourse.id,
        amount_paid: selectedCourse.price,
        status: 'active'
      } as any);

      if (error) {
        // If error is unique constraint, user is already enrolled
        if (error.code === '23505') {
          alert('You are already enrolled in this course!');
          return;
        }
        throw error;
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Enrollment failed:', err);
      alert('Failed to process enrollment. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // SUCCESS VIEW
  if (isSuccess) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto text-center pt-20">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/30 animate-bounce-gentle">
          <GraduationCap size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Enrollment Successful!</h2>
        <p className="text-[var(--color-text-secondary)] mb-8 text-lg">
          You are now enrolled in <span className="font-bold text-[var(--color-text-primary)]">{selectedCourse?.title}</span>. Get ready to master your craft!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => router.push('/dashboard/academy/my-courses')} className="btn-primary px-8 py-3">
            Start Learning Now
          </button>
          <button onClick={() => { setIsSuccess(false); setSelectedCourse(null); }} className="px-8 py-3 rounded-xl font-bold bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] transition-colors">
            Browse More Courses
          </button>
        </div>
      </div>
    );
  }

  // COURSE DETAILS / CHECKOUT VIEW
  if (selectedCourse) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in pb-20">
        <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Courses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-video rounded-[var(--radius-3xl)] overflow-hidden shadow-2xl relative bg-black">
              {selectedCourse.thumbnail_url ? (
                <img src={selectedCourse.thumbnail_url} alt={selectedCourse.title} className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-cyan-900 flex items-center justify-center">
                  <Play size={64} className="text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 cursor-pointer hover:scale-110 transition-transform shadow-2xl">
                  <Play size={32} className="text-white ml-2" fill="white" />
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-4">{selectedCourse.title}</h1>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-6">
                {selectedCourse.description || "Learn everything you need to know from the best professionals in the industry. This comprehensive course covers all techniques, from basics to advanced aesthetics."}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-[var(--color-border-light)]">
                <div className="flex flex-col gap-1 text-center p-3">
                  <Clock size={24} className="text-cyan-500 mx-auto" />
                  <span className="text-xs text-[var(--color-text-muted)] mt-2 uppercase tracking-wide font-bold">Access</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">Lifetime</span>
                </div>
                <div className="flex flex-col gap-1 text-center p-3">
                  <Users size={24} className="text-pink-500 mx-auto" />
                  <span className="text-xs text-[var(--color-text-muted)] mt-2 uppercase tracking-wide font-bold">Enrolled</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{selectedCourse.enrollment_count || 0} Students</span>
                </div>
                <div className="flex flex-col gap-1 text-center p-3">
                  <BookOpen size={24} className="text-amber-400 mx-auto" />
                  <span className="text-xs text-[var(--color-text-muted)] mt-2 uppercase tracking-wide font-bold">Content</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{selectedCourse.lesson_count || 0} Lessons</span>
                </div>
                <div className="flex flex-col gap-1 text-center p-3">
                  <ShieldCheck size={24} className="text-emerald-500 mx-auto" />
                  <span className="text-xs text-[var(--color-text-muted)] mt-2 uppercase tracking-wide font-bold">Certificate</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">Included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Card */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 shadow-xl border border-[var(--color-border)] shadow-cyan-500/10">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Enrollment Summary</h2>
              <div className="h-[1px] w-full bg-[var(--color-border-light)] mb-6" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-[var(--color-text-secondary)] font-medium">Course Price</span>
                <span className="text-3xl font-extrabold text-gradient-pink">£{selectedCourse.price?.toFixed(2) || '0.00'}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Lifetime access to all materials</span>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--color-text-secondary)]">1-on-1 mentorship sessions</span>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Official Merakí Certification</span>
                </div>
              </div>

              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:-translate-y-1 transition-all"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)' }}
              >
                {enrolling ? 'Processing...' : 'Enroll Now'}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 opacity-60">
                <ShieldCheck size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">Secure enrollment process</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BROWSING VIEW (Default)
  return (
    <div className="animate-fade-in pb-20">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
        <img src="https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1600&q=80&auto=format&fit=crop" alt="Academy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <GraduationCap size={18} style={{ color: '#67E8F9' }} />
            <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#67E8F9', fontWeight: 700 }}>Academy</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Master Your Craft</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px', maxWidth: '400px' }}>Learn from industry experts and elevate your skills</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass"
            style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="aspect-video shimmer" />
              <div style={{ padding: '20px' }}>
                <div className="shimmer" style={{ height: '16px', borderRadius: '4px', width: '75%', marginBottom: '8px' }} />
                <div className="shimmer" style={{ height: '12px', borderRadius: '4px', width: '100%', marginBottom: '16px' }} />
                <div className="shimmer" style={{ height: '12px', borderRadius: '4px', width: '33%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '64px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #BFDBFE, #A5F3FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} className="animate-float">
            <GraduationCap size={32} style={{ color: '#60A5FA' }} />
          </div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>No courses available yet</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '8px' }}>New courses are added regularly — check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="glass-card overflow-hidden hover:shadow-xl hover:border-cyan-500/30 hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #60A5FA, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    <Play size={28} style={{ color: 'white', marginLeft: '4px' }} />
                  </div>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="group-hover:text-cyan-600 transition-colors">
                  {course.title}
                </h3>
                {course.description && (
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{course.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} />{course.enrollment_count || 0} enrolled</span>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-gradient-pink" style={{ fontSize: '18px', fontWeight: 700 }}>£{course.price?.toFixed(2) || '0.00'}</span>
                  <span style={{ fontSize: '12px', color: '#06B6D4', fontWeight: 700 }} className="opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
