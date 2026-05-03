import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { AdminLayout, AdminLogin } from "./pages/Admin";
import { PdfBacAnalis } from "./pages/PdfBacAnalis";
import { AuthPage } from "./pages/Auth";
import { loadUserProgress, getProgressSync, saveProgress, checkDailyLogin, getXP, getStreak, addXP } from "./lib/progress";
import { GoogleGenAI, Type } from "@google/genai";
import { getSubjectPrompt } from "./lib/prompts";
import { preprocessMath } from "./lib/utils";
import { QuizView } from "./components/QuizView";
import { SubjectTypeView, SubjectUnitsView, UnitDetailsView, ContentListView, LessonDetailsView, InteractiveExerciseView } from "./components/StudentViews";
import { PdfViewer } from "./components/PdfViewer";
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
  X,
  Flame,
  Star,
  Sun,
  Moon,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error.message);
      }
      setSession(session);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        const expiresDays = 365;
        document.cookie = `sb-${(import.meta as any).env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
      setSession(session);
      setLoading(false);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="flex gap-2">
           <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce"></div>
           <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
           <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
         </div>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const userName = session?.user?.user_metadata?.full_name || 'الطالب';

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6 relative flex justify-center">
      {/* Background Gradient & Blobs */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-[#0b0f19] dark:to-slate-900 pointer-events-none" />
      <div className="fixed top-0 left-0 w-[60vw] h-[60vh] rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[60vw] h-[60vh] rounded-full bg-indigo-300/20 dark:bg-indigo-600/10 blur-[120px] pointer-events-none z-0 translate-x-1/3 translate-y-1/3" />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 z-10 relative">
        
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
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex rounded-2xl glass glass-hover justify-center items-center text-slate-600 dark:text-slate-300 transition-all shrink-0"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="w-10 h-10 hidden sm:flex rounded-2xl glass glass-hover justify-center items-center text-slate-600 dark:text-slate-300 transition-all shrink-0">
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-2xl glass glass-hover flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all shrink-0"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <StudentPortal session={session} />

      </div>

      {/* Sidebar Drawer */}
      {/* Mobile Overlay */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-slate-900/40 z-40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-50 p-6 flex flex-col border-l border-slate-100 dark:border-slate-800 shadow-2xl rounded-l-[2rem] transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {userName.substring(0, 1)}
            </div>
            <h2 className="font-bold text-lg text-slate-800">القائمة</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          <SidebarItem icon={<BookOpen size={18} />} title="الرئيسية" active />
          <SidebarItem icon={<Calendar size={18} />} title="جدول المراجعة" />
          <SidebarItem icon={<Target size={18} />} title="الإمتحانات" badge="2" />
          <SidebarItem icon={<MessageCircle size={18} />} title="المجتمع" />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
          <SidebarItem icon={<Settings size={18} />} title="الإعدادات" />
          <div onClick={() => navigate('/admin')} className="w-full flex items-center gap-3 font-bold text-sm px-4 py-3 rounded-xl transition-all text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer">
            <Target size={18} />
            <span>لوحة التحكم (للتجريب)</span>
          </div>
          <div onClick={handleLogout} className="w-full flex items-center gap-3 font-bold text-sm px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer">
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, title, active, badge }: { icon: React.ReactNode, title: string, active?: boolean, badge?: string }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
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

function StudentPortal({ session }: { session: any }) {
  const [subjects, setSubjects] = useState<any[]>(SUBJECTS_DATA);
  const [mainTab, setMainTab] = useState<'home' | 'subjects' | 'topics' | 'settings'>('home');
  
  const [view, setViewState] = useState<{ type: string, subject?: any, unit?: any, listType?: 'lessons' | 'exercises', exercise?: any, lesson?: any }>(() => {
    const saved = localStorage.getItem('portal_view');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subject) {
          const foundSubject = SUBJECTS_DATA.find(s => s.id === parsed.subject.id);
          if (foundSubject) parsed.subject.icon = foundSubject.icon;
          else parsed.subject.icon = BookOpen;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved view", e);
      }
    }
    return { type: 'dashboard' };
  });

  const setView = (newView: any) => {
    setViewState(newView);
    const viewToSave = { ...newView };
    if (viewToSave.subject) {
      viewToSave.subject = { ...viewToSave.subject, icon: undefined }; 
    }
    localStorage.setItem('portal_view', JSON.stringify(viewToSave));
  };

  
  const [dbLoading, setDbLoading] = useState(true);
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
    async function initUser() {
      await loadUserProgress();
      await checkDailyLogin();
      setRefreshTrigger(prev => prev + 1); // trigger initial data formatting
    }
    initUser();
  }, []);

  useEffect(() => {
    // Prevent fetching formatting if data isn't loaded yet
    if (refreshTrigger === 0) return;

    // Example of how you would fetch from Supabase if keys are provided
    async function fetchData() {
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
          const qp = getProgressSync('quiz_progress', sub.id) || 0;
          return { ...sub, progress: p, quiz_progress: qp };
        });
        if (JSON.stringify(computedSubjects) !== JSON.stringify(subjects)) {
            setSubjects(computedSubjects);
        }
        setDbLoading(false);
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

        let globalSubjectCookies: any = {};
        if (adminRes.data && adminRes.data.subject_cookies) {
            try {
                globalSubjectCookies = JSON.parse(adminRes.data.subject_cookies);
            } catch(e) {}
        }
        
        if (adminRes.data && adminRes.data.bac_date) {
            setBacDate(adminRes.data.bac_date);
        }

        const specializations = [
          'علوم تجريبية',
          'رياضيات',
          'تقني رياضي',
          'تسيير واقتصاد',
          'آداب وفلسفة',
          'لغات أجنبية'
        ];
        const userSpecialization = session?.user?.user_metadata?.specialization;

        if (subjectsData.length > 0) {
          // Filter subjects by user specialization and format the data
          const formattedSubjects = subjectsData.filter((sub: any) => {
            if (!userSpecialization) return true;
            let isForAnotherSpec = false;
            for (const spec of specializations) {
               if (spec !== userSpecialization && sub.name.includes(`(${spec})`)) {
                 isForAnotherSpec = true;
                 break;
               }
            }
            return !isForAnotherSpec;
          }).map((sub: any) => {
            let displayName = sub.name;
            for (const spec of specializations) {
               if (displayName.includes(`(${spec})`)) {
                 displayName = displayName.replace(`(${spec})`, '').trim();
                 break;
               }
            }

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
            
            let qp = 0;
            const subjectCookie = globalSubjectCookies[sub.id];
            if (subjectCookie && subjectCookie.levels && subjectCookie.levels.length > 0) {
               const totalLevelsCount = subjectCookie.levels.length;
               const currentUnlocked = getProgressSync('cookie_level', sub.id) || 0;
               if (currentUnlocked >= totalLevelsCount) {
                   qp = 100;
               } else {
                   const activeLevelData = subjectCookie.levels[currentUnlocked];
                   const totalQuestionsInActive = activeLevelData?.questions?.length || 1;
                   const savedQidx = getProgressSync('cookie_qidx', `${sub.id}_${currentUnlocked}`) || 0;
                   const levelFraction = Math.min(savedQidx / totalQuestionsInActive, 1);
                   qp = Math.min(Math.round(((currentUnlocked + levelFraction) / totalLevelsCount) * 100), 100);
               }
            }
            
            
            return {
              ...sub,
              name: displayName,
              barColor: sub.bar_color || 'bg-blue-500',
              progress: p,
              quiz_progress: qp,
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

  if (dbLoading) {
    return (
      <div className="space-y-4 md:space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {/* Main search skeleton */}
          <div className="col-span-2 md:col-span-3 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 min-h-[120px] md:min-h-[160px] flex flex-col justify-center gap-3 relative overflow-hidden border border-slate-200/40">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite]" />
            <div className="flex items-center gap-3">
               <div className="w-6 h-6 rounded-md bg-orange-100/50 animate-pulse" />
               <div className="h-6 md:h-8 bg-slate-200/50 rounded-xl w-1/3 animate-pulse" />
            </div>
            <div className="h-12 md:h-14 bg-slate-100/80 rounded-xl md:rounded-2xl w-full border border-slate-200/50 mt-1" />
          </div>

          <div className="col-span-1 md:col-span-1 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 min-h-[120px] md:min-h-[160px] flex flex-col items-center justify-center gap-3 relative overflow-hidden border border-slate-200/40">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] delay-75" />
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-indigo-50 animate-pulse" />
            <div className="h-3 bg-slate-200/50 rounded-md w-1/2 animate-pulse mt-1" />
            <div className="h-4 bg-slate-200/80 rounded-md w-2/3 animate-pulse" />
          </div>
          
          <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-3 md:gap-6 min-h-[120px] md:min-h-[160px]">
            <div className="flex-1 glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 flex flex-row md:flex-col items-center justify-center md:gap-2 relative overflow-hidden border border-slate-200/40 gap-3">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] delay-150" />
              <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-orange-50 animate-pulse" />
              <div className="flex flex-col gap-1 w-1/2 md:w-full md:items-center">
                <div className="h-4 bg-slate-200/80 rounded-md w-1/2 animate-pulse" />
                <div className="h-3 bg-slate-200/50 rounded-md w-2/3 animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 flex flex-row md:flex-col items-center justify-center md:gap-2 relative overflow-hidden border border-slate-200/40 gap-3">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] delay-300" />
              <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-amber-50 animate-pulse" />
              <div className="flex flex-col gap-1 w-1/2 md:w-full md:items-center">
                <div className="h-4 bg-slate-200/80 rounded-md w-1/2 animate-pulse" />
                <div className="h-3 bg-slate-200/50 rounded-md w-2/3 animate-pulse" />
              </div>
            </div>
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
      <div key={view.type + (currentSubject?.id || '') + (currentUnit?.id || '') + (view.listType || '')}>
        {view.type === 'dashboard' && mainTab === 'home' && <DashboardHomeView subjects={subjects} bacDate={bacDate} onStartQuiz={() => setView({ type: 'quiz' })} />}
        {view.type === 'dashboard' && mainTab === 'subjects' && <DashboardSubjectsView subjects={subjects} listType={mainTab} onSubjectClick={(s) => setView({ type: 'subject_units', subject: s })} />}
        {view.type === 'dashboard' && mainTab === 'topics' && <TopicsView subjects={subjects} />}
        {view.type === 'dashboard' && mainTab === 'settings' && <SettingsView />}
        
        {view.type === 'subject_units' && <SubjectUnitsView subject={currentSubject} onBack={() => setView({ type: 'dashboard' })} onUnitClick={(u) => setView({ type: 'unit_details', subject: currentSubject, unit: u })} />}
        {view.type === 'unit_details' && <UnitDetailsView subject={currentSubject} unit={currentUnit} onBack={() => setView({ type: 'subject_units', subject: currentSubject })} onSelectItem={(type, item) => {
          if (type === 'exercises') {
            setView({ type: 'solve_exercise', subject: currentSubject, unit: currentUnit, exercise: item });
          } else {
            setView({ type: 'view_lesson', subject: currentSubject, unit: currentUnit, lesson: item });
          }
        }} />}
        {/* We can remove or ignore ContentListView since UnitDetailsView handles it now, I'll just change list to unreachable or leave it */}
        {view.type === 'view_lesson' && <LessonDetailsView subject={currentSubject} unit={currentUnit} lesson={view.lesson} onBack={() => setView({ type: 'unit_details', subject: currentSubject, unit: currentUnit })} />}
        {view.type === 'solve_exercise' && <InteractiveExerciseView subject={currentSubject} unit={currentUnit} exercise={view.exercise} onBack={() => setView({ type: 'unit_details', subject: currentSubject, unit: currentUnit })} />}
        {view.type === 'quiz' && <QuizView subjects={subjects} onBack={() => setView({ type: 'dashboard' })} />}
      </div>

      {view.type === 'dashboard' && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-40 flex items-center justify-around px-2 sm:px-6 pb-2 text-slate-500 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
          <BottomNavItem icon={<Home size={22} />} label="الرئيسية" active={mainTab === 'home'} onClick={() => { setView({ type: 'dashboard' }); setMainTab('home'); }} />
          <BottomNavItem icon={<BookOpen size={22} />} label="المواد" active={mainTab === 'subjects'} onClick={() => { setView({ type: 'dashboard' }); setMainTab('subjects'); }} />
          <BottomNavItem icon={<FileText size={22} />} label="مواضيع" active={mainTab === 'topics'} onClick={() => { setView({ type: 'dashboard' }); setMainTab('topics'); }} />
          <BottomNavItem icon={<Settings size={22} />} label="الإعدادات" active={mainTab === 'settings'} onClick={() => { setView({ type: 'dashboard' }); setMainTab('settings'); }} />
        </div>
      )}
    </>
  );
}

function BottomNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`no-global-loader flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-2xl transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`relative flex items-center justify-center ${active ? 'bg-blue-50 text-blue-600 rounded-xl w-12 h-10 shadow-sm' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
    </button>
  );
}

function BacPdfView({ year, subject, onBack }: { year: string, subject: any, onBack: () => void }) {
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exam' | 'solution'>('exam');

  useEffect(() => {
    async function loadExam() {
      if (!supabase) return;
      try {
        setLoading(true);
        const { data, error } = await supabase.from('bac_exams').select('*').eq('year', year).eq('subject_id', subject.id).limit(1).single();
        if (data) setExam(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [year, subject.id]);

  return (
    <div className="animate-in fade-in duration-300 relative z-10 flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] -mx-4 md:mx-0">
      <div className="flex items-center gap-4 mb-4 px-4 md:px-0 shrink-0">
        <button onClick={onBack} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm shrink-0 relative z-20">
          <ChevronRight size={24} />
        </button>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${subject.bg} ${subject.color} flex items-center justify-center shadow-sm shrink-0`}>
           <subject.icon size={28} />
        </div>
        <div>
          <h2 className="font-bold text-xl md:text-3xl text-slate-800">{subject.name}</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">بكالوريا {year}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1">
           <div className="flex gap-1.5 mb-4">
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
           </div>
          <p className="text-sm font-bold text-slate-500">جاري التحميل...</p>
        </div>
      ) : !exam ? (
        <div className="bg-slate-50 mx-4 md:mx-0 p-8 rounded-3xl text-center border border-slate-100 mt-10">
           <FileText size={40} className="text-slate-300 mx-auto mb-4" />
           <p className="text-slate-500 font-bold mb-1">الموضوع غير متوفر</p>
           <p className="text-slate-400 text-sm">لم يتم رفع مواضيع لهذه المادة في هذه السنة.</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 bg-white md:rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border-y md:border border-slate-200 overflow-hidden min-w-0">
           {exam.solution_file && (
             <div className="flex border-b border-slate-100 bg-slate-50/80 p-2 gap-2 shrink-0">
                <button
                   onClick={() => setActiveTab('exam')}
                   className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${activeTab === 'exam' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                   <FileText size={18} />
                   الموضوع
                </button>
                <button
                   onClick={() => setActiveTab('solution')}
                   className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${activeTab === 'solution' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                   <ClipboardList size={18} />
                   التصحيح النموذجي
                </button>
             </div>
           )}
           
           <div className="flex-1 relative w-full h-full overflow-hidden">
              {activeTab === 'exam' ? (
                 <PdfViewer url={exam.exam_file} />
              ) : (
                 <PdfViewer url={exam.solution_file} />
              )}
           </div>
        </div>
      )}
    </div>
  );
}

function TopicsView({ subjects }: { subjects: any[] }) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [bacExamsList, setBacExamsList] = useState<{id: string, year: string, subject_id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const years = ["2025", "2024", "2023", "2022", "2021", "2020", "2019"];

  useEffect(() => {
     async function fetchList() {
       if (!supabase) return;
       try {
         setLoading(true);
         const { data, error } = await supabase.from('bac_exams').select('id, year, subject_id');
         if (data) setBacExamsList(data);
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
     }
     fetchList();
  }, []);

  if (selectedSubject && selectedYear) {
      return <BacPdfView year={selectedYear} subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
  }

  if (selectedYear) {
      const examsForYear = bacExamsList.filter(e => e.year === selectedYear);
      const subjectsWithExams = subjects.filter(s => examsForYear.some(e => e.subject_id === s.id));
      
      return (
         <div className="animate-in fade-in slide-in-from-right-4 relative z-10 space-y-6">
             <div className="flex items-center gap-4 mb-4 md:mb-8">
                 <button onClick={() => setSelectedYear(null)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm relative z-20 transition-all font-bold">
                     <ChevronRight size={24} />
                 </button>
                 <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                    <FileText size={28} />
                 </div>
                 <div>
                    <h2 className="font-bold text-xl md:text-3xl text-slate-800">مواضيع بكالوريا {selectedYear}</h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">عرض حسب التخصص والمادة</p>
                 </div>
             </div>
             {subjectsWithExams.length === 0 ? (
                 <div className="bg-slate-50 p-8 rounded-3xl text-center border border-slate-100">
                    <FileText size={40} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold mb-1">لا يوجد مواضيع متاحة</p>
                    <p className="text-slate-400 text-sm">سيتم إضافة مواضيع لهذه السنة قريباً.</p>
                 </div>
             ) : (
                 <DashboardSubjectsView 
                    subjects={subjectsWithExams} 
                    listType="topics" 
                    onSubjectClick={(s) => setSelectedSubject(s)} 
                 />
             )}
         </div>
      );
  }

  return (
    <div className="animate-in fade-in">
       <div className="mb-6">
         <h2 className="font-bold text-xl md:text-3xl text-slate-800 flex items-center gap-3">
           <FileText className="text-blue-500 font-black" size={32} />
           مواضيع بكالوريا سابقة
         </h2>
         <p className="text-sm md:text-base text-slate-500 font-medium pr-11 mt-1">اختر سنة البكالوريا لعرض المواضيع</p>
       </div>

       <div className="grid gap-2.5 md:gap-4 max-w-3xl w-full">
         {loading ? (
             <div className="space-y-4">
                 <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full">
                       <div className="relative flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                       </div>
                       <span className="text-sm font-bold text-slate-600">جاري جلب المعلومات...</span>
                    </div>
                 </div>
                 {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent z-10"></div>
                        <div className="flex items-center gap-3 md:gap-4 w-full">
                           <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-slate-100/80 animate-pulse shrink-0"></div>
                           <div className="h-5 w-32 bg-slate-100/80 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="h-8 w-20 bg-slate-100/80 rounded-xl animate-pulse shrink-0"></div>
                    </div>
                 ))}
             </div>
         ) : years.map(y => {
            const count = bacExamsList.filter(e => e.year === y && subjects.some(s => s.id === e.subject_id)).length;
            return (
              <button 
                  key={y} 
                  onClick={() => setSelectedYear(y)}
                  className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 active:scale-[0.99] transition-all group cursor-pointer w-full"
               >
                 <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-black text-base md:text-xl shadow-[0_4px_12px_-4px_rgba(37,99,235,0.2)] shrink-0">
                       {y}
                    </div>
                    <span className="font-bold text-slate-700 text-sm md:text-lg whitespace-nowrap">بكالوريا {y}</span>
                 </div>
                 <div className="flex items-center gap-2 md:gap-4">
                    <span className="text-[10px] md:text-sm bg-slate-100 text-slate-500 px-2 md:px-3 py-1 md:py-1.5 rounded-xl font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors whitespace-nowrap">{count} مواد</span>
                    <ChevronRight size={18} className="text-slate-400 rotate-180 group-hover:-translate-x-1 group-hover:text-blue-600 transition-all font-black shrink-0" />
                 </div>
              </button>
            )
         })}
       </div>
    </div>
  )
}

function SettingsView() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-bold text-2xl text-slate-800">الإعدادات</h2>
      </div>
      <div className="bg-white rounded-[2rem] p-3 md:p-6 border border-slate-100 shadow-sm space-y-4">
         <button 
           onClick={() => navigate('/admin')}
           className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors group text-right"
         >
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 transition-transform group-hover:scale-105">
               <Target size={24} />
             </div>
             <div>
               <h4 className="font-bold text-slate-800 text-lg">لوحة التحكم</h4>
               <p className="text-sm text-slate-500 font-medium transition-colors">إدارة المحتوى وتعديل قاعدة البيانات</p>
             </div>
           </div>
           <ChevronRight size={20} className="text-slate-400 group-hover:text-orange-500 transition-transform group-hover:-translate-x-1" />
         </button>
      </div>
    </div>
  )
}

function DashboardHomeView({ subjects, bacDate, onStartQuiz }: { subjects: any[], bacDate?: string | null, onStartQuiz: () => void }) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'exercises'>(() => {
    return (localStorage.getItem('dashboard_active_tab') as 'lessons' | 'exercises') || 'lessons';
  });

  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null);
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleGamification = () => {
      setXP(getXP());
      setStreak(getStreak());
    };
    handleGamification();
    window.addEventListener('progress_updated', handleGamification);
    return () => window.removeEventListener('progress_updated', handleGamification);
  }, []);

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="col-span-2 md:col-span-3 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 flex flex-col justify-center relative overflow-hidden group hover:shadow-lg transition-all min-h-[120px] md:min-h-[160px] bg-gradient-to-br from-white to-orange-50/50">
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
          className="col-span-1 md:col-span-1 min-h-[120px] md:min-h-[160px] relative w-full h-full glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 flex flex-col items-center justify-center bg-gradient-to-br from-white to-indigo-50/50 group hover:shadow-lg transition-all overflow-hidden border border-indigo-100/50 text-center"
        >
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl group-hover:bg-indigo-400/30 transition-all pointer-events-none" />
          <div className="flex flex-col items-center gap-2 relative w-full z-10">
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shrink-0">
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
              <p className="text-[10px] md:text-sm font-bold text-indigo-500 mb-0.5">اختبار سريع</p>
              <h4 className="font-bold text-slate-800 text-sm md:text-lg leading-tight">تدرب الآن</h4>
            </div>
          </div>
        </button>

        <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-3 md:gap-6 min-h-[120px] md:min-h-[160px]">
          <div className="flex-1 relative w-full h-full glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 flex flex-row md:flex-col items-center justify-center md:gap-1 bg-gradient-to-br from-white to-amber-50/40 overflow-hidden group shadow-sm border border-amber-100/50">
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl transition-all pointer-events-none" />
            <div className="flex items-center md:flex-col gap-2 md:gap-1 relative z-10 text-center">
              <div className="w-8 h-8 md:w-16 md:h-16 rounded-full glass border border-amber-100 flex items-center justify-center text-lg md:text-3xl shadow-sm bg-white/60 text-amber-500 shrink-0 relative overflow-hidden">
                <Star size={24} fill="currentColor" className="text-amber-500 drop-shadow-sm z-10 w-5 h-5 md:w-8 md:h-8" />
                <div className="absolute inset-0 bg-amber-400/20 w-full h-full blur-xl" />
              </div>
              <div className="flex flex-col md:items-center items-start">
                <span className="font-black text-slate-800 text-base md:text-xl line-clamp-1 leading-none mb-0.5">{xp}</span>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 leading-none">نقطة خبرة</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full h-full glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 flex flex-row md:flex-col items-center justify-center md:gap-1 bg-gradient-to-br from-white to-orange-50/40 overflow-hidden group shadow-sm border border-orange-100/50">
            <div className="absolute -right-5 -top-5 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl transition-all pointer-events-none" />
            <div className="flex items-center md:flex-col gap-2 md:gap-1 relative z-10 text-center">
              <div className="w-8 h-8 md:w-16 md:h-16 rounded-full glass border border-orange-100 flex items-center justify-center text-lg md:text-3xl shadow-sm bg-white/60 text-orange-500 shrink-0 relative overflow-hidden">
                <Flame size={24} fill="currentColor" className="text-orange-500 drop-shadow-sm z-10 w-5 h-5 md:w-8 md:h-8" />
                <div className="absolute inset-0 bg-orange-400/20 w-full h-full blur-xl" />
              </div>
              <div className="flex flex-col md:items-center items-start">
                <span className="font-black text-slate-800 text-base md:text-xl line-clamp-1 leading-none mb-0.5">{streak}</span>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 leading-none">يوم متتالي</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function DashboardSubjectsView({ subjects, listType, onSubjectClick }: { subjects: any[], listType: 'lessons' | 'exercises' | 'topics' | 'subjects', onSubjectClick: (s: any) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 md:mb-8 gap-3">
        <h3 className="font-bold text-2xl text-slate-800 flex items-center gap-2">
          {listType === 'lessons' ? <PlayCircle size={24} className="text-blue-500" /> : listType === 'exercises' ? <ClipboardList size={24} className="text-blue-500" /> : listType === 'topics' ? <FileText size={24} className="text-blue-500" /> : <BookOpen size={24} className="text-blue-500" />}
          {listType === 'lessons' ? 'الدروس' : listType === 'exercises' ? 'التمارين' : listType === 'topics' ? 'مواضيع البكالوريا' : 'المواد'}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 active-tab-transition">
          {subjects.map((sub, index) => (
            <div 
              key={`${sub.id}`}
              onClick={() => onSubjectClick(sub)}
              className="glass rounded-3xl md:rounded-[2rem] p-4 lg:p-6 flex flex-col justify-between cursor-pointer group glass-hover relative overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className={`absolute -left-10 -top-10 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all pointer-events-none ${sub.barColor}`} />
              <div className="flex justify-between items-start mb-4 md:mb-6 relative">
                 <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${sub.bg} ${sub.color} flex items-center justify-center shadow-sm`}>
                   <sub.icon size={20} className="md:w-7 md:h-7" />
                 </div>
              </div>
              <div>
                 <h4 className="font-bold text-sm md:text-lg text-slate-800 mb-2 md:mb-4 truncate">{sub.name}</h4>
                 {listType !== 'topics' && (
                   <>
                     <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 md:mb-2">
                        <span>التقدم</span>
                        <span>{sub.progress}%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-1.5 md:h-2 overflow-hidden">
                       <div className={`h-full rounded-full ${sub.barColor}`} style={{ width: `${sub.progress}%` }} />
                     </div>
                   </>
                 )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
