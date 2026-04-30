import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { AdminLayout, AdminLogin } from "./pages/Admin";
import { AuthPage } from "./pages/Auth";
import { loadUserProgress, getProgressSync, saveProgress, checkDailyLogin, getXP, getStreak, addXP } from "./lib/progress";
import { GoogleGenAI, Type } from "@google/genai";
import { getSubjectPrompt } from "./lib/prompts";
import { preprocessMath } from "./lib/utils";
import { QuizView } from "./components/QuizView";
import { 
  BookOpen,
  Target, 
  Calendar, 
  Search, 
  MessageCircle, 
  Bell, 
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  LogOut,
  Users,
  Settings,
  Lock,
  Eye,
  EyeOff,
  UserCircle,
  Calculator,
  FlaskConical,
  Globe,
  FileText,
  PlayCircle,
  ClipboardList,
  Unlock,
  Plus,
  Save,
  Trash,
  Printer,
  CheckCircle,
  RefreshCw,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={session ? <StudentLayout session={session} /> : <Navigate to="/auth" replace />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
  );
}


// ==========================================
// 1. Student Portal
// ==========================================

function StudentLayout({ session }: { session: any }) {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);

  const userName = session?.user?.user_metadata?.full_name || 'الطالب';

  useEffect(() => {
    const handleGamification = () => {
      setXP(getXP());
      setStreak(getStreak());
    };
    handleGamification(); // Initial load
    window.addEventListener('progress_updated', handleGamification);
    return () => window.removeEventListener('progress_updated', handleGamification);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6 relative overflow-hidden flex justify-center">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 z-10">
        
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
              {userName.substring(0, 1)}
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight line-clamp-1">بكالوريا برو</h1>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">مرحباً، {userName} 👋</p>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <div className="flex items-center justify-center gap-1.5 h-10 glass rounded-2xl px-3 font-bold text-orange-500 shadow-sm border border-orange-100 bg-white/50">
              <span className="text-sm leading-none mt-1" dir="ltr">{streak}</span>
              <span className="leading-none">🔥</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 h-10 glass rounded-2xl px-3 font-bold text-blue-500 shadow-sm border border-blue-100 bg-white/50">
              <span className="text-sm leading-none mt-1" dir="ltr">{xp} XP</span>
              <span className="leading-none">🏆</span>
            </div>
            <button className="w-10 h-10 hidden sm:flex rounded-2xl glass glass-hover justify-center items-center text-slate-600 transition-all shrink-0">
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-2xl glass glass-hover flex items-center justify-center text-slate-600 transition-all shrink-0"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <StudentPortal loading={loading} />

      </div>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 right-0 bottom-0 w-64 glass !bg-white/95 !backdrop-blur-2xl z-50 p-6 flex flex-col border-l border-white/50 shadow-2xl rounded-l-[2rem]"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {userName.substring(0, 1)}
                  </div>
                  <h2 className="font-bold text-lg text-slate-800">القائمة</h2>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <SidebarItem icon={<BookOpen size={18} />} title="الرئيسية" active />
                <SidebarItem icon={<Calendar size={18} />} title="جدول المراجعة" />
                <SidebarItem icon={<Target size={18} />} title="الإمتحانات" badge="2" />
                <SidebarItem icon={<MessageCircle size={18} />} title="المجتمع" />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <SidebarItem icon={<Settings size={18} />} title="الإعدادات" />
                <div onClick={() => navigate('/admin')} className="w-full flex items-center gap-3 font-bold text-sm px-4 py-3 rounded-xl transition-all text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                  <Target size={18} />
                  <span>لوحة التحكم (للتجريب)</span>
                </div>
                <div onClick={handleLogout} className="w-full flex items-center gap-3 font-bold text-sm px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 cursor-pointer">
                  <LogOut size={18} />
                  <span>تسجيل الخروج</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, title, active, badge }: { icon: React.ReactNode, title: string, active?: boolean, badge?: string }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}>
      <div className="flex items-center gap-3 font-bold text-sm">
        {icon}
        <span>{title}</span>
      </div>
      {badge && (
        <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
          {badge}
        </span>
      )}
    </div>
  )
}

const SUBJECTS_DATA = [
  {
    id: 'math', name: 'الرياضيات', progress: 80, color: 'text-blue-500', bg: 'bg-blue-100', icon: Calculator,
    barColor: 'bg-blue-500',
    units: [
      { id: 'u1', name: 'الدوال العددية', lessons: [{id: 'l1', title: 'الاستمرارية'}, {id: 'l2', title: 'الاشتقاقية'}], exercises: [{id: 'e1', title: 'تمرين 1: الاستمرارية'}, {id: 'e2', title: 'تمرين 2: الاشتقاقية'}] },
      { id: 'u2', name: 'الدوال الأسية', lessons: [{id: 'l3', title: 'تعريف وخواص'}, {id: 'l4', title: 'دراسة الدالة الأسية'}], exercises: [{id: 'e3', title: 'تمرين 1: خواص الدالة الأسية'}, {id: 'e4', title: 'تمرين 2: دراسة شاملة'}] }
    ]
  },
  {
    id: 'physics', name: 'الفيزياء', progress: 65, color: 'text-indigo-500', bg: 'bg-indigo-100', icon: FlaskConical,
    barColor: 'bg-indigo-500',
    units: [
      { id: 'u1', name: 'المتابعة الزمنية للتحول الكيميائي', lessons: [{id: 'l1', title: 'طرق المتابعة الزمنية'}, {id: 'l2', title: 'سرعة التفاعل'}], exercises: [{id: 'e1', title: 'تمرين: المتابعة عن طريق المعايرة'}, {id: 'e2', title: 'تمرين: حساب سرعة التفاعل'}] },
    ]
  },
  {
    id: 'science', name: 'العلوم الطبيعية', progress: 40, color: 'text-emerald-500', bg: 'bg-emerald-100', icon: Globe,
    barColor: 'bg-emerald-500',
    units: [
      { id: 'u1', name: 'تركيب البروتين', lessons: [{id: 'l1', title: 'مقر تركيب البروتين'}, {id: 'l2', title: 'الاستنساخ والترجمة'}], exercises: [{id: 'e1', title: 'تمرين الاستنساخ'}, {id: 'e2', title: 'تمرين الترجمة'}] }
    ]
  }
];

function StudentPortal({ loading }: { loading: boolean }) {
  const [subjects, setSubjects] = useState<any[]>(SUBJECTS_DATA);
  
  const [view, setViewState] = useState<{ type: string, subject?: any, unit?: any, listType?: 'lessons' | 'exercises', exercise?: any, lesson?: any }>(() => {
    const saved = localStorage.getItem('portal_view');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fix up the icon which gets lost in JSON stringify
        if (parsed.subject) {
          const foundSubject = SUBJECTS_DATA.find(s => s.id === parsed.subject.id);
          if (foundSubject) {
             parsed.subject.icon = foundSubject.icon;
          } else {
             // Default to generic icon if not found in SUBJECTS_DATA
             parsed.subject.icon = BookOpen;
          }
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved view", e);
      }
    }
    return { type: 'dashboard' };
  });

  const setView = (newView: any) => {
    // Before saving, ensure we don't try to stringify the icon component
    setViewState(newView);
    const viewToSave = { ...newView };
    if (viewToSave.subject) {
      viewToSave.subject = { ...viewToSave.subject, icon: undefined }; 
    }
    localStorage.setItem('portal_view', JSON.stringify(viewToSave));
  };
  
  const [dbLoading, setDbLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bacDate, setBacDate] = useState<string | null>(null);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('progress_updated', handleProgressUpdate);
    return () => window.removeEventListener('progress_updated', handleProgressUpdate);
  }, []);

  useEffect(() => {
    // Example of how you would fetch from Supabase if keys are provided
    async function fetchData() {
      await loadUserProgress();
      await checkDailyLogin();
      if (!supabase) {
        // compute progress for SUBJECTS_DATA
        const computedSubjects = SUBJECTS_DATA.map((sub: any) => {
          let totalItems = 0;
          let completedItems = 0;
          sub.units?.forEach((u: any) => {
            u.lessons?.forEach((l: any) => {
              totalItems++;
              if (getProgressSync('completed_lesson', l.id) === 1) completedItems++;
            });
            u.exercises?.forEach((e: any) => {
              totalItems++;
              if (getProgressSync('completed_exercise', e.id) === 1) completedItems++;
            });
          });
          const p = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          return { ...sub, progress: p };
        });
        if (JSON.stringify(computedSubjects) !== JSON.stringify(subjects)) {
            setSubjects(computedSubjects);
        }
        return;
      }
      
      try {
        if (subjects === SUBJECTS_DATA) {
          setDbLoading(true);
        }
        // Fetch all data separately to ensure everything is caught regardless of PostgREST join constraints
        const [subRes, unitRes, lessRes, exRes, adminRes] = await Promise.all([
          supabase.from('subjects').select('*').order('created_at', { ascending: true }),
          supabase.from('units').select('*').order('created_at', { ascending: true }),
          supabase.from('lessons').select('*').order('created_at', { ascending: true }),
          supabase.from('exercises').select('*').order('created_at', { ascending: true }),
          supabase.from('admin_settings').select('*').limit(1).single()
        ]);
        
        if (subRes.error) throw subRes.error;
        
        const subjectsData = subRes.data || [];
        const unitsData = unitRes.data || [];
        const lessonsData = lessRes.data || [];
        const exercisesData = exRes.data || [];

        if (adminRes.data && adminRes.data.bac_date) {
            setBacDate(adminRes.data.bac_date);
        }

        if (subjectsData.length > 0) {
          // Format the data to match our UI state format
          const formattedSubjects = subjectsData.map((sub: any) => {
            const subUnits = unitsData.filter((u: any) => u.subject_id === sub.id).sort((a: any, b: any) => a.unit_order - b.unit_order);
            const formattedUnits = subUnits.map((u: any) => ({
                ...u,
                lessons: lessonsData.filter((l: any) => l.unit_id === u.id).sort((a: any, b: any) => a.lesson_order - b.lesson_order),
                exercises: exercisesData.filter((e: any) => e.unit_id === u.id).sort((a: any, b: any) => a.exercise_order - b.exercise_order),
            }));

            let totalItems = 0;
            let completedItems = 0;
            formattedUnits.forEach((u: any) => {
              u.lessons?.forEach((l: any) => {
                totalItems++;
                if (getProgressSync('completed_lesson', l.id) === 1) completedItems++;
              });
              u.exercises?.forEach((e: any) => {
                totalItems++;
                if (getProgressSync('completed_exercise', e.id) === 1) completedItems++;
              });
            });

            const p = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            
            return {
              ...sub,
              barColor: sub.bar_color || 'bg-blue-500',
              progress: p,
              icon: Calculator, // In a real app, map icon_name to actual Lucide component
              units: formattedUnits
            };
          });
          setSubjects(formattedSubjects);
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      } finally {
        setDbLoading(false);
      }
    }

    fetchData();
  }, [refreshTrigger]);

  if (loading || dbLoading) {
    return (
      <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          {/* Main search skeleton */}
          <div className="col-span-1 md:col-span-2 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 min-h-[120px] md:min-h-[160px] flex flex-col justify-center gap-3 relative overflow-hidden border border-slate-200/40">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite]" />
            <div className="flex items-center gap-3">
               <div className="w-6 h-6 rounded-md bg-blue-100/50 animate-pulse" />
               <div className="h-6 md:h-8 bg-slate-200/50 rounded-xl w-1/3 animate-pulse" />
            </div>
            <div className="h-12 md:h-14 bg-slate-100/80 rounded-xl md:rounded-2xl w-full border border-slate-200/50 mt-1" />
          </div>

          {/* Next exam skeleton */}
          <div className="col-span-1 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 min-h-[120px] md:min-h-[160px] flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-3 md:gap-4 relative overflow-hidden border border-slate-200/40">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] delay-75" />
            <div className="flex items-center gap-3 md:gap-0 md:flex-col md:items-start w-full">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-50 animate-pulse shrink-0 md:mb-4" />
              <div className="space-y-2 w-full">
                 <div className="h-3 bg-slate-200/50 rounded-md w-1/3 animate-pulse" />
                 <div className="h-5 md:h-6 bg-slate-200/80 rounded-md w-2/3 animate-pulse" />
              </div>
            </div>
            <div className="w-16 h-6 md:w-20 md:h-8 bg-slate-100 rounded-lg shrink-0" />
          </div>
        </div>

        <div>
          {/* Section title skeleton */}
          <div className="flex justify-between items-center mb-4 md:mb-5 px-1">
             <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-indigo-100/50 animate-pulse" />
                <div className="h-6 md:h-7 bg-slate-200/60 rounded-lg w-24 animate-pulse" />
             </div>
             <div className="h-6 md:h-7 bg-slate-100 rounded-lg w-20 md:w-24 border border-slate-200/50" />
          </div>

          {/* Subjects grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3].map((i) => (
               <div key={i} className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 min-h-[140px] md:min-h-[180px] flex flex-col justify-between relative overflow-hidden border border-slate-200/50 shadow-sm">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite]" style={{ animationDelay: `${i * 150}ms` }} />
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100/80 ring-4 ring-white animate-pulse" />
                    <div className="w-12 h-5 md:w-14 md:h-6 bg-slate-100 rounded-md md:rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-3 md:space-y-4 w-full mt-auto">
                    <div className="h-4 md:h-5 bg-slate-200/80 rounded-md w-2/3 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                         <div className="h-2.5 md:h-3 bg-slate-200/50 rounded-md w-1/4 animate-pulse" />
                         <div className="h-2.5 md:h-3 bg-slate-200/50 rounded-md w-1/6 animate-pulse" />
                      </div>
                      <div className="h-1.5 md:h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-slate-200/50 w-1/3 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentSubject = subjects.find(s => s.id === view.subject?.id) || view.subject;
  const currentUnit = currentSubject?.units?.find((u: any) => u.id === view.unit?.id) || view.unit;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
           key={view.type + (currentSubject?.id || '') + (currentUnit?.id || '') + (view.listType || '')}
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: 10 }}
           transition={{ duration: 0.2 }}
        >
          {view.type === 'dashboard' && <DashboardView subjects={subjects} bacDate={bacDate} onSubjectClick={(s, type) => setView({ type: 'subject_units', subject: s, listType: type })} onStartQuiz={() => setView({ type: 'quiz' })} />}
          {view.type === 'subject_units' && <SubjectUnitsView subject={currentSubject} listType={view.listType} onBack={() => setView({ type: 'dashboard' })} onUnitClick={(u) => setView({ type: 'list', subject: currentSubject, unit: u, listType: view.listType })} />}
          {view.type === 'list' && <ContentListView subject={currentSubject} unit={currentUnit} listType={view.listType!} onBack={() => setView({ type: 'subject_units', subject: currentSubject, listType: view.listType })} onSelectItem={(item) => {
            if (view.listType === 'exercises') {
              setView({ type: 'solve_exercise', subject: currentSubject, unit: currentUnit, exercise: item });
            } else {
              setView({ type: 'view_lesson', subject: currentSubject, unit: currentUnit, lesson: item });
            }
          }} />}
          {view.type === 'view_lesson' && <LessonDetailsView subject={currentSubject} unit={currentUnit} lesson={view.lesson} onBack={() => setView({ type: 'list', subject: currentSubject, unit: currentUnit, listType: 'lessons' })} />}
          {view.type === 'solve_exercise' && <InteractiveExerciseView subject={currentSubject} unit={currentUnit} exercise={view.exercise} onBack={() => setView({ type: 'list', subject: currentSubject, unit: currentUnit, listType: 'exercises' })} />}
          {view.type === 'quiz' && <QuizView subjects={subjects} onBack={() => setView({ type: 'dashboard' })} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function DashboardView({ subjects, bacDate, onSubjectClick, onStartQuiz }: { subjects: any[], bacDate?: string | null, onSubjectClick: (s: any, listType: 'lessons' | 'exercises') => void, onStartQuiz: () => void }) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'exercises'>(() => {
    return (localStorage.getItem('dashboard_active_tab') as 'lessons' | 'exercises') || 'lessons';
  });

  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null);

  useEffect(() => {
    localStorage.setItem('dashboard_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!bacDate) {
      setTimeLeft(null);
      return;
    }
    
    const calculateTimeLeft = () => {
      const target = new Date(bacDate);
      target.setHours(0, 0, 0, 0); // Start of the day
      const now = new Date();
      
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // update every minute
    return () => clearInterval(interval);
  }, [bacDate]);

  const totalQuizProgress = Math.round(subjects.reduce((sum, s) => {
    return sum + getProgressSync('quiz_progress', s.id);
  }, 0) / (subjects.length || 1));

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalQuizProgress / 100) * circumference;

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <div className="col-span-1 md:col-span-2 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 flex flex-col justify-center relative overflow-hidden group hover:shadow-lg transition-all min-h-[120px] md:min-h-[160px] bg-gradient-to-br from-white to-orange-50/50">
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl group-hover:bg-orange-400/30 transition-all pointer-events-none" />
          <div className="flex items-start justify-between relative">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] md:text-xs text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded-lg mb-2">
                <Calendar size={12} />
                الامتحان القادم
              </div>
              <h2 className="text-xl md:text-3xl font-black text-slate-800 mb-2">
                البكالوريا
              </h2>
              {timeLeft ? (
                <div className="text-sm md:text-base text-slate-600 font-bold flex flex-wrap items-center gap-2 mt-3" dir="rtl">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-orange-200 text-orange-600 shadow-sm">
                    <span className="text-lg">{timeLeft.days}</span>
                    <span className="text-xs">يوم</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-orange-200 text-orange-600 shadow-sm">
                    <span className="text-lg">{timeLeft.hours}</span>
                    <span className="text-xs">ساعة</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-orange-200 text-orange-600 shadow-sm">
                    <span className="text-lg">{timeLeft.minutes}</span>
                    <span className="text-xs">دقيقة</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock size={16} />
                  لم يتم تحديد تاريخ البكالوريا بعد
                </p>
              )}
            </div>
          </div>
        </div>

        <button 
           onClick={onStartQuiz}
           className="col-span-1 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 flex flex-row md:flex-col items-center md:items-start justify-between bg-gradient-to-br from-white to-blue-50/50 group text-right hover:shadow-lg transition-all"
        >
           <div className="flex items-center gap-3 md:gap-0 md:flex-col md:items-start">
             <div className="relative w-14 h-14 md:w-16 md:h-16 md:mb-4 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    className="text-indigo-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                  />
                  <circle
                    className="text-indigo-500 drop-shadow-sm transition-all duration-1000"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-700 font-bold text-xs">
                   {totalQuizProgress}%
                </div>
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-bold text-indigo-500 mb-0.5 md:mb-1">اختبار سريع (الكويز)</p>
                <h4 className="font-bold text-slate-800 text-sm md:text-lg leading-tight">تدرب الآن</h4>
              </div>
           </div>
           <div className="flex items-center gap-1 text-[10px] md:text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg mt-0 md:mt-4 group-hover:bg-indigo-100 transition-colors">
              <PlayCircle size={14} />
             <span>ابدأ الكويز</span>
           </div>
        </button>
      </div>

      <div>
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
          <h3 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-1.5 md:gap-2">
            <BookOpen size={18} className="text-indigo-500" />
            المواد الدراسية
          </h3>
          
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl w-full md:w-auto shadow-inner border border-slate-200/60">
            <button 
              onClick={() => setActiveTab('lessons')}
              className={`flex-1 flex justify-center items-center gap-2 md:w-36 py-2.5 rounded-lg text-sm font-extrabold transition-all duration-200 ${activeTab === 'lessons' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
            >
              <PlayCircle size={16} /> الدروس
            </button>
            <button 
              onClick={() => setActiveTab('exercises')}
              className={`flex-1 flex justify-center items-center gap-2 md:w-36 py-2.5 rounded-lg text-sm font-extrabold transition-all duration-200 ${activeTab === 'exercises' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
            >
              <ClipboardList size={16} /> التمارين
            </button>
          </div>
        </div>
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 active-tab-transition">
          <AnimatePresence mode="popLayout">
            {subjects.map((sub, index) => (
              <motion.div 
                key={`${activeTab}-${sub.id}`}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ 
                  duration: 0.3,
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  delay: index * 0.05
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSubjectClick(sub, activeTab)}
                className="glass rounded-3xl md:rounded-[2rem] p-3 md:p-4 lg:p-6 flex flex-col justify-between cursor-pointer group glass-hover"
              >
                <div className="flex justify-between items-start mb-3 md:mb-6">
                   <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${sub.bg} ${sub.color} flex items-center justify-center shadow-sm`}>
                     <sub.icon size={18} className="md:w-6 md:h-6" />
                   </div>
                </div>
                <div>
                   <h4 className="font-bold text-sm md:text-lg text-slate-800 mb-2 md:mb-4 truncate">{sub.name}</h4>
                   <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-500 mb-1 md:mb-1.5">
                      <span>التقدم</span>
                      <span>{sub.progress}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-1 md:h-1.5 overflow-hidden">
                     <div className={`h-full rounded-full ${sub.barColor}`} style={{ width: `${sub.progress}%` }} />
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function SubjectTypeView({ subject, onBack, onSelectType }: { subject: any, onBack: () => void, onSelectType: (t: 'lessons' | 'exercises') => void }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold hover:scale-[1.05] active:scale-95">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${subject.bg} ${subject.color} flex items-center justify-center shadow-sm`}>
           <subject.icon size={16} className="md:w-5 md:h-5" />
        </div>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{subject.name}</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">اختر نوع المحتوى</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-6">
        <div 
           onClick={() => onSelectType('lessons')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-blue-50/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 border-2 border-transparent hover:border-blue-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
             <PlayCircle size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-blue-700 transition-colors">الدروس</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">مشاهدة الدروس والملخصات</p>
        </div>

        <div 
           onClick={() => onSelectType('exercises')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-emerald-50/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 border-2 border-transparent hover:border-emerald-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
             <ClipboardList size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-emerald-700 transition-colors">التمارين</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">حل تمارين تطبيقية مع التصحيح</p>
        </div>
      </div>
    </div>
  )
}

function SubjectUnitsView({ subject, listType, onBack, onUnitClick }: { subject: any, listType?: 'lessons' | 'exercises', onBack: () => void, onUnitClick: (u: any) => void }) {
  const isLessons = listType === 'lessons';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${isLessons ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shadow-sm`}>
           {isLessons ? <PlayCircle size={16} className="md:w-5 md:h-5"/> : <ClipboardList size={16} className="md:w-5 md:h-5"/>}
        </div>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{subject.name} - الوحدات</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">حدد الوحدة لفتح {isLessons ? 'الدروس' : 'التمارين'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {subject.units.map((unit: any, index: number) => {
          let progress = 0;
          const total = (unit.lessons?.length || 0) + (unit.exercises?.length || 0);
          if (total > 0) {
            let completed = 0;
            unit.lessons?.forEach((l: any) => {
              if (getProgressSync('completed_lesson', l.id) === 1) completed++;
            });
            unit.exercises?.forEach((e: any) => {
              if (getProgressSync('completed_exercise', e.id) === 1) completed++;
            });
            progress = Math.round((completed / total) * 100);
          }
          
          return (
          <div 
            key={unit.id}
            onClick={() => onUnitClick(unit)}
            className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 cursor-pointer group hover:bg-white transition-all border border-slate-200/50 hover:border-slate-300 hover:scale-[1.01] active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div className="w-full pl-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 block">الوحدة {index + 1}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{progress}%</span>
                </div>
                <h3 className="font-bold text-sm md:text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{unit.name}</h3>
                <div className="flex gap-3 md:gap-4 mt-2 md:mt-4 text-xs md:text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1 md:gap-1.5"><FileText size={14} className="text-blue-400"/> {unit.lessons?.length || 0} دروس</span>
                  <span className="flex items-center gap-1 md:gap-1.5"><ClipboardList size={14} className="text-emerald-400"/> {unit.exercises?.length || 0} تمارين</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
                   <div className="h-full rounded-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                <ChevronLeft size={16} className="md:w-5 md:h-5" />
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}

function UnitDetailsView({ subject, unit, onBack, onSelectType }: { subject: any, unit: any, onBack: () => void, onSelectType: (t: 'lessons' | 'exercises') => void }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold hover:scale-[1.05] active:scale-95">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{unit.name}</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{subject.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-6">
        <div 
           onClick={() => onSelectType('lessons')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-blue-50/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 border-2 border-transparent hover:border-blue-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
             <PlayCircle size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-blue-700 transition-colors">الدروس</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">مشاهدة الدروس والملخصات</p>
        </div>

        <div 
           onClick={() => onSelectType('exercises')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-emerald-50/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 border-2 border-transparent hover:border-emerald-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
             <ClipboardList size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-emerald-700 transition-colors">التمارين</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">حل تمارين تطبيقية مع التصحيح</p>
        </div>
      </div>
    </div>
  )
}

function ContentListView({ subject, unit, listType, onBack, onSelectItem }: { subject: any, unit: any, listType: 'lessons' | 'exercises', onBack: () => void, onSelectItem?: (item: any) => void }) {
  const items = listType === 'lessons' ? unit.lessons : unit.exercises;
  const isLessons = listType === 'lessons';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
            <ChevronRight size={18} className="md:w-5 md:h-5" />
          </button>
          <div>
            <h2 className="font-bold text-base md:text-xl text-slate-800">{isLessons ? 'قائمة الدروس' : 'قائمة التمارين'}</h2>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">{unit.name}</p>
          </div>
        </div>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${isLessons ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shadow-sm`}>
           {isLessons ? <PlayCircle size={16} className="md:w-5 md:h-5"/> : <ClipboardList size={16} className="md:w-5 md:h-5"/>}
        </div>
      </div>

      <div className="glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-bold text-sm md:text-base">لا يوجد محتوى حالياً</div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {isLessons ? (
              items.map((item: any, idx: number) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-5 bg-white/70 hover:bg-white rounded-2xl md:rounded-3xl border border-slate-100 transition-all group">
                  <div className="flex items-center gap-3 md:gap-4 mb-3 sm:mb-0">
                    <div className={"w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-sm bg-blue-50 text-blue-600 border border-blue-100"}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs md:text-base">{item.title}</h4>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 md:mt-1.5 flex items-center gap-1 md:gap-1.5">
                        <ClipboardList size={10} className="text-emerald-500 md:w-3 md:h-3"/>
                        {`يقابله: ${unit.exercises[idx]?.title || 'لا يوجد تمرين'}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onSelectItem && onSelectItem(item)}
                    className="px-4 py-2 md:px-6 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold text-white transition-all shadow-sm w-full sm:w-auto flex justify-center items-center gap-1.5 md:gap-2 bg-blue-600 hover:bg-blue-700 hover:shadow-md"
                  >
                    شاهد الدرس
                    <ChevronLeft size={14} className="opacity-70 md:w-4 md:h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {items.map((item: any, idx: number) => (
                  <div 
                    key={item.id} 
                    onClick={() => onSelectItem && onSelectItem(item)}
                    className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 cursor-pointer group hover:bg-white transition-all border border-slate-200/50 hover:border-slate-300 relative overflow-hidden flex flex-col min-h-[140px]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                        <ClipboardList size={20} className="md:w-6 md:h-6"/>
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">تمرين {idx + 1}</span>
                    </div>
                    <h3 className="font-bold text-sm md:text-lg text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight flex-1">{item.title}</h3>
                    <div className="mt-4 flex items-center justify-between text-[10px] md:text-xs font-bold text-slate-500 relative z-10 w-full">
                       <span>اضغط للبدء</span>
                       <ChevronLeft size={14} className="text-emerald-500 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LessonDetailsView({ subject, unit, lesson, onBack }: { subject: any, unit: any, lesson: any, onBack: () => void }) {
  useEffect(() => {
    if (lesson?.id) {
      if (getProgressSync('completed_lesson', lesson.id) === 0) {
        addXP(10);
      }
      saveProgress('completed_lesson', lesson.id, 1);
    }
  }, [lesson?.id]);

  const getLessonContent = () => {
    if (lesson?.content) return lesson.content;
    return `### محتوى الدرس
هذا هو المحتوى التجريبي للدرس: **${lesson?.title || 'بلا عنوان'}**.

يمكنك هنا قراءة المفاهيم، التعرف على القوانين الأساسية والملاحظات الهامة.
    `;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{lesson?.title}</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{subject?.name} - {unit?.name}</p>
        </div>
      </div>

      <div className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8">
        <div className="prose prose-sm md:prose-base prose-slate max-w-none text-right" dir="rtl">
           <div className="markdown-body">
             <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
               {preprocessMath(getLessonContent())}
             </ReactMarkdown>
           </div>
        </div>
        <div className="mt-8 flex justify-center">
           <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-sm font-bold">
             <CheckCircle size={18} />
             <span>تم تحديث نسبة الإنجاز تلقائياً</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveExerciseView({ subject, unit, exercise, onBack }: { subject: any, unit: any, exercise: any, onBack: () => void }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (showAnswers && solutionRef.current) {
      setTimeout(() => {
        const element = solutionRef.current;
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 30;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300);
    }
  }, [showAnswers]);
  
  const getExerciseData = () => {
    if (exercise?.content) {
      try {
        const parsed = JSON.parse(exercise.content);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].exam) {
           return parsed[0];
        }
      } catch (e) {
        console.error("Failed to parse exercise content", e);
      }
    }
    
    // Default fallback
    return {
       exam: "لم يتم العثور على نص التمرين أو حدث خطأ في التحميل.",
       solution: "لم يتم العثور على التصحيح النموذجي."
    };
  };

  const [currentExercise, setCurrentExercise] = useState(() => getExerciseData());

  const generateNewExercise = async () => {
    setErrorMsg(null);
    let apiKey = '';
    let aiModel = 'gemini-2.5-flash';
    if (supabase) {
      const { data } = await supabase.from('admin_settings').select('api_key, ai_model').limit(1).single();
      if (data && data.api_key) {
        apiKey = data.api_key;
        aiModel = data.ai_model || 'gemini-2.5-flash';
      }
    }

    if (!apiKey) {
      setErrorMsg("الرجاء إعداد مفتاح Gemini API من صفحة الإعدادات (في لوحة الإدارة) أولاً.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = getSubjectPrompt(subject?.name || '', unit?.name || '', exercise?.title || '');
      const newPrompt = prompt + "\n\nملاحظة مهمة: يرجى توليد تمرين مشابه للتمرين السابق من حيث الفكرة، لكن بمعطيات جديدة أو أرقام مختلفة تماماً، لكي يتدرب الطالب بشكل أفضل.";

      const response = await ai.models.generateContent({
        model: aiModel,
        contents: newPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              exam: { type: Type.STRING, description: "نص موضوع الامتحان بتنسيق Markdown. لا تضع الحل هنا." },
              solution: { type: Type.STRING, description: "نص التصحيح النموذجي للامتحان بتنسيق Markdown" }
            },
            required: ["exam", "solution"]
          }
        }
      });
      
      if (response.text) {
        const jsonStr = response.text.trim();
        const parsedData = JSON.parse(jsonStr);
        setCurrentExercise(parsedData);
        setShowAnswers(false);
      } else {
        throw new Error("لم يتم إرجاع أي استجابة من المولد.");
      }
    } catch (e: any) {
      setErrorMsg("حدث خطأ أثناء التوليد: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 print:hidden gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm border border-slate-100 shrink-0">
          <ChevronRight size={20} />
        </button>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
           <button 
             onClick={generateNewExercise}
             disabled={isGenerating}
             className="px-4 md:px-5 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition flex items-center justify-center gap-2 text-sm shadow-sm flex-1 md:flex-none disabled:opacity-50"
           >
             <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} /> 
             <span>{isGenerating ? 'جاري التوليد...' : 'تمرين جديد'}</span>
           </button>
           <button 
             onClick={() => {
               setShowAnswers(!showAnswers);
               if (!showAnswers && exercise?.id) {
                 if (getProgressSync('completed_exercise', exercise.id) === 0) {
                   addXP(15);
                 }
                 saveProgress('completed_exercise', exercise.id, 1);
               }
             }} 
             className="px-4 md:px-5 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition text-sm shadow-sm flex items-center justify-center gap-2 flex-1 md:flex-none"
           >
             <CheckCircle size={16} /> <span>{showAnswers ? 'إخفاء الحل' : 'عرض الحل'}</span>
           </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2">
          <X className="shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="bg-white mx-auto shadow-sm border border-slate-200 print:shadow-none print:border-none p-6 md:p-12 lg:p-16 text-slate-900 border-t-[12px] border-t-slate-800 relative z-10 font-[Traditional_Arabic,serif] text-base md:text-lg" style={{ minHeight: '29.7cm' }}>
         <div className="text-center mb-10 border-b border-slate-300 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-2 text-right mb-6 bg-slate-50 p-4 border border-slate-200">
               <div className="md:col-span-2"><span className="font-bold">المادة:</span> {subject?.name || 'غير محدد'}</div>
               <div className="md:col-span-2"><span className="font-bold">الوحدة:</span> {unit?.name || 'غير محدد'}</div>
               <div className="col-span-1 md:col-span-4 mt-2"><span className="font-bold">الموضوع:</span> {exercise?.title || 'تمرين عام'}</div>
            </div>
         </div>

         <div className="markdown-body rtl prose max-w-none text-right">
           <ReactMarkdown 
             remarkPlugins={[remarkGfm, remarkMath]}
             rehypePlugins={[rehypeKatex]}
             components={{
               table: ({node, ...props}: any) => (
                 <div className="overflow-x-auto w-full mb-6 relative" dir="auto">
                   <table {...props} className="w-full text-center border-collapse border border-slate-300" />
                 </div>
               ),
               th: ({node, ...props}: any) => <th {...props} className="border border-slate-300 px-4 py-2 bg-slate-50 font-bold" />,
               td: ({node, ...props}: any) => <td {...props} className="border border-slate-300 px-4 py-2 text-center" />
             }}
           >
             {preprocessMath(currentExercise.exam?.replace(/([^\n])\s+([أبتثجحخدذرزسشصضطظعغفقكلمنهوي]\))/g, '$1\n\n$2'))}
           </ReactMarkdown>
         </div>

         {showAnswers && currentExercise.solution && (
            <div ref={solutionRef} className="mt-8 border-t-2 border-emerald-500 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-emerald-700 bg-emerald-50 inline-block px-6 py-2 rounded-full border border-emerald-200">التصحيح النموذجي</h3>
               </div>
               <div className="markdown-body rtl prose max-w-none text-right">
                 <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    table: ({node, ...props}: any) => (
                      <div className="overflow-x-auto w-full mb-6 relative" dir="auto">
                        <table {...props} className="w-full text-center border-collapse border border-slate-300" />
                      </div>
                    ),
                    th: ({node, ...props}: any) => <th {...props} className="border border-slate-300 px-4 py-2 bg-slate-50 font-bold" />,
                    td: ({node, ...props}: any) => <td {...props} className="border border-slate-300 px-4 py-2 text-center" />
                  }}
                 >
                  {preprocessMath(currentExercise.solution?.replace(/([^\n])\s+([أبتثجحخدذرزسشصضطظعغفقكلمنهوي]\))/g, '$1\n\n$2'))}
                 </ReactMarkdown>
               </div>
            </div>
         )}
         
         <div className="mt-20 pt-8 border-t border-slate-300 text-center text-sm font-bold text-slate-600 block">
            — بالتوفيق والنجاح —
         </div>
      </div>
    </div>
  )
}

