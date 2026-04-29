import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { AdminLayout, AdminLogin } from "./pages/Admin";
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
  PenTool,
  Unlock,
  Plus,
  Save,
  Trash,
  Printer,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLayout />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
  );
}

// ==========================================
// 1. Student Portal
// ==========================================

function StudentLayout() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen pb-20 md:pb-6 relative overflow-hidden flex justify-center">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 z-10">
        
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              ب
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight">بكالوريا برو</h1>
              <p className="text-xs text-slate-500 font-medium">مرحباً، عبد الرحمن 👋</p>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button className="w-10 h-10 rounded-2xl glass glass-hover flex items-center justify-center text-slate-600 transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-2xl glass glass-hover flex items-center justify-center text-slate-600 transition-all"
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
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-64 glass !bg-white/95 !backdrop-blur-2xl z-50 p-6 flex flex-col border-l border-white/50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    ب
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
                <div className="w-full flex items-center gap-3 font-bold text-sm px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 cursor-pointer">
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
  
  const [view, setViewState] = useState<{ type: string, subject?: any, unit?: any, listType?: 'lessons' | 'exercises', exercise?: any }>(() => {
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

  useEffect(() => {
    // Example of how you would fetch from Supabase if keys are provided
    async function fetchData() {
      if (!supabase) return; // Fallback to SUBJECTS_DATA if not configured
      
      try {
        setDbLoading(true);
        // Fetch all data separately to ensure everything is caught regardless of PostgREST join constraints
        const [subRes, unitRes, lessRes, exRes] = await Promise.all([
          supabase.from('subjects').select('*').order('created_at', { ascending: true }),
          supabase.from('units').select('*').order('created_at', { ascending: true }),
          supabase.from('lessons').select('*').order('created_at', { ascending: true }),
          supabase.from('exercises').select('*').order('created_at', { ascending: true }),
        ]);
        
        if (subRes.error) throw subRes.error;
        
        const subjectsData = subRes.data || [];
        const unitsData = unitRes.data || [];
        const lessonsData = lessRes.data || [];
        const exercisesData = exRes.data || [];

        if (subjectsData.length > 0) {
          // Format the data to match our UI state format
          const formattedSubjects = subjectsData.map((sub: any) => {
            const subUnits = unitsData.filter(u => u.subject_id === sub.id).sort((a: any, b: any) => a.unit_order - b.unit_order);
            
            return {
              ...sub,
              icon: Calculator, // In a real app, map icon_name to actual Lucide component
              units: subUnits.map((u: any) => ({
                ...u,
                lessons: lessonsData.filter(l => l.unit_id === u.id).sort((a: any, b: any) => a.lesson_order - b.lesson_order),
                exercises: exercisesData.filter(e => e.unit_id === u.id).sort((a: any, b: any) => a.exercise_order - b.exercise_order),
              }))
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
  }, []);

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
    <AnimatePresence mode="wait">
      <motion.div
         key={view.type + (currentSubject?.id || '') + (currentUnit?.id || '') + (view.listType || '')}
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: 10 }}
         transition={{ duration: 0.2 }}
      >
        {view.type === 'dashboard' && <DashboardView subjects={subjects} onSubjectClick={(s) => setView({ type: 'subject_type', subject: s })} />}
        {view.type === 'subject_type' && <SubjectTypeView subject={currentSubject} onBack={() => setView({ type: 'dashboard' })} onSelectType={(t) => setView({ type: 'subject_units', subject: currentSubject, listType: t })} />}
        {view.type === 'subject_units' && <SubjectUnitsView subject={currentSubject} listType={view.listType} onBack={() => setView({ type: 'subject_type', subject: currentSubject })} onUnitClick={(u) => setView({ type: 'list', subject: currentSubject, unit: u, listType: view.listType })} />}
        {view.type === 'list' && <ContentListView subject={currentSubject} unit={currentUnit} listType={view.listType!} onBack={() => setView({ type: 'subject_units', subject: currentSubject, listType: view.listType })} onSelectItem={(item) => {
          if (view.listType === 'exercises') {
            setView({ type: 'solve_exercise', subject: currentSubject, unit: currentUnit, exercise: item });
          }
        }} />}
        {view.type === 'solve_exercise' && <InteractiveExerciseView subject={currentSubject} unit={currentUnit} exercise={view.exercise} onBack={() => setView({ type: 'list', subject: currentSubject, unit: currentUnit, listType: 'exercises' })} />}
      </motion.div>
    </AnimatePresence>
  );
}

function DashboardView({ subjects, onSubjectClick }: { subjects: any[], onSubjectClick: (s: any) => void }) {
  return (
    <div className="space-y-4 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <div className="col-span-1 md:col-span-2 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 flex flex-col justify-center relative overflow-hidden group hover:shadow-lg transition-all min-h-[120px] md:min-h-[160px]">
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all pointer-events-none" />
          <h2 className="text-lg md:text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={20} />
            ماذا تريد أن تتعلم اليوم؟
          </h2>
          <div className="relative mt-1 md:mt-2">
            <input 
              type="text" 
              placeholder="ابحث عن درس، تمرين..." 
              className="w-full bg-white/80 border border-slate-200 rounded-xl md:rounded-2xl py-3 md:py-4 pr-10 md:pr-12 pl-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
            />
            <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <button className="absolute left-1.5 md:left-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 hover:bg-blue-600 transition-colors focus:ring-2 focus:outline-none focus:ring-blue-300 font-bold text-[10px] md:text-xs">
              شات
            </button>
          </div>
        </div>

        <div className="col-span-1 glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 flex flex-row md:flex-col items-center md:items-start justify-between bg-gradient-to-br from-white to-orange-50/50 group glass-hover">
           <div className="flex items-center gap-3 md:gap-0 md:flex-col md:items-start">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 md:mb-4 shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-bold text-orange-500 mb-0.5 md:mb-1">الامتحان القادم</p>
                <h4 className="font-bold text-slate-800 text-sm md:text-lg leading-tight">بكالوريا تجريبي</h4>
              </div>
           </div>
           <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500 font-medium bg-white/60 px-2 py-1 rounded-lg">
             <Clock size={12} />
             <span>بعد 14 يوم</span>
           </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-1.5 md:gap-2">
            <BookOpen size={18} className="text-indigo-500" />
            المواد الدراسية
          </h3>
          <span className="text-[10px] md:text-sm font-bold text-slate-500 bg-slate-100 px-2 md:px-3 py-1 rounded-lg md:rounded-xl">علوم تجريبية</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {subjects.map((sub) => (
            <motion.div 
              key={sub.id} 
              whileHover={{ scale: 1.02 }}
              onClick={() => onSubjectClick(sub)}
              className="glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 flex flex-col justify-between cursor-pointer group glass-hover"
            >
              <div className="flex justify-between items-start mb-3 md:mb-6">
                 <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${sub.bg} ${sub.color} flex items-center justify-center shadow-sm`}>
                   <sub.icon size={18} className="md:w-6 md:h-6" />
                 </div>
                 <span className="text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100/80 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg">{sub.units.length} وحدات</span>
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
        </div>
      </div>
    </div>
  )
}

function SubjectTypeView({ subject, onBack, onSelectType }: { subject: any, onBack: () => void, onSelectType: (t: 'lessons' | 'exercises') => void }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
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
        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => onSelectType('lessons')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-blue-50/50 transition-all border-2 border-transparent hover:border-blue-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform shadow-sm">
             <PlayCircle size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-blue-700 transition-colors">الدروس</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">مشاهدة الدروس والملخصات</p>
        </motion.div>

        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => onSelectType('exercises')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-emerald-50/50 transition-all border-2 border-transparent hover:border-emerald-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform shadow-sm">
             <PenTool size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-emerald-700 transition-colors">التمارين</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">حل تمارين تطبيقية مع التصحيح</p>
        </motion.div>
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
           {isLessons ? <PlayCircle size={16} className="md:w-5 md:h-5"/> : <PenTool size={16} className="md:w-5 md:h-5"/>}
        </div>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{subject.name} - الوحدات</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">حدد الوحدة لفتح {isLessons ? 'الدروس' : 'التمارين'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {subject.units.map((unit: any, index: number) => (
          <motion.div 
            key={unit.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
            onClick={() => onUnitClick(unit)}
            className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-6 cursor-pointer group hover:bg-white transition-all border border-slate-200/50 hover:border-slate-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-1 block">الوحدة {index + 1}</span>
                <h3 className="font-bold text-sm md:text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{unit.name}</h3>
                <div className="flex gap-3 md:gap-4 mt-2 md:mt-4 text-xs md:text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1 md:gap-1.5"><FileText size={14} className="text-blue-400"/> {unit.lessons.length} دروس</span>
                  <span className="flex items-center gap-1 md:gap-1.5"><PenTool size={14} className="text-emerald-400"/> {unit.exercises.length} تمارين</span>
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                <ChevronLeft size={16} className="md:w-5 md:h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function UnitDetailsView({ subject, unit, onBack, onSelectType }: { subject: any, unit: any, onBack: () => void, onSelectType: (t: 'lessons' | 'exercises') => void }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{unit.name}</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{subject.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-6">
        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => onSelectType('lessons')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-blue-50/50 transition-all border-2 border-transparent hover:border-blue-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform shadow-sm">
             <PlayCircle size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-blue-700 transition-colors">الدروس</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">مشاهدة الدروس والملخصات</p>
        </motion.div>

        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => onSelectType('exercises')}
           className="glass rounded-3xl md:rounded-[2rem] p-4 md:p-8 cursor-pointer group hover:bg-emerald-50/50 transition-all border-2 border-transparent hover:border-emerald-200 text-center flex flex-col items-center justify-center h-48 md:h-64 shadow-sm"
        >
           <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform shadow-sm">
             <PenTool size={28} className="md:w-10 md:h-10" />
           </div>
           <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 group-hover:text-emerald-700 transition-colors">التمارين</h3>
           <p className="text-[10px] md:text-sm text-slate-500 leading-tight">حل تمارين تطبيقية مع التصحيح</p>
        </motion.div>
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
           {isLessons ? <PlayCircle size={16} className="md:w-5 md:h-5"/> : <PenTool size={16} className="md:w-5 md:h-5"/>}
        </div>
      </div>

      <div className="glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-bold text-sm md:text-base">لا يوجد محتوى حالياً</div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-5 bg-white/70 hover:bg-white rounded-2xl md:rounded-3xl border border-slate-100 transition-all group">
                <div className="flex items-center gap-3 md:gap-4 mb-3 sm:mb-0">
                  <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-sm ${isLessons ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-base">{item.title}</h4>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 md:mt-1.5 flex items-center gap-1 md:gap-1.5">
                      {isLessons ? <PenTool size={10} className="text-emerald-500 md:w-3 md:h-3"/> : <PlayCircle size={10} className="text-blue-500 md:w-3 md:h-3" />}
                      {isLessons ? `يقابله: ${unit.exercises[idx]?.title || 'لا يوجد تمرين'}` : `مرتبط بدرس: ${unit.lessons[idx]?.title || 'غير محدد'}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onSelectItem && onSelectItem(item)}
                  className={`px-4 py-2 md:px-6 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold text-white transition-all shadow-sm w-full sm:w-auto flex justify-center items-center gap-1.5 md:gap-2 ${isLessons ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'}`}
                >
                  {isLessons ? 'شاهد الدرس' : 'ابدأ الحل'}
                  <ChevronLeft size={14} className="opacity-70 md:w-4 md:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InteractiveExerciseView({ subject, unit, exercise, onBack }: { subject: any, unit: any, exercise: any, onBack: () => void }) {
  const [showAnswers, setShowAnswers] = useState(false);
  
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

  const data = getExerciseData();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm border border-slate-100">
          <ChevronRight size={20} />
        </button>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="px-4 md:px-5 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2 text-sm shadow-sm">
             <Printer size={16} /> <span className="hidden sm:inline">طباعة</span>
           </button>
           <button onClick={() => setShowAnswers(!showAnswers)} className="px-4 md:px-5 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition text-sm shadow-sm flex items-center gap-2">
             <CheckCircle size={16} /> <span>{showAnswers ? 'إخفاء الحل' : 'عرض الحل'}</span>
           </button>
        </div>
      </div>

      <div className="bg-white mx-auto shadow-sm border border-slate-200 print:shadow-none print:border-none p-6 md:p-12 lg:p-16 text-slate-900 border-t-[12px] border-t-slate-800 relative z-10 font-[Traditional_Arabic,serif] text-base md:text-lg" style={{ minHeight: '29.7cm' }}>
         <div className="text-center mb-10 border-b border-slate-300 pb-8">
            <h1 className="text-lg md:text-xl font-bold mb-2">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
            <h2 className="text-md md:text-lg font-bold mb-8">وزارة التربية الوطنية</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-2 text-right mb-6 bg-slate-50 p-4 border border-slate-200">
               <div className="col-span-1 md:col-span-4 text-center font-bold text-xl md:text-2xl mb-4 text-slate-800 border-b border-slate-200 pb-4">امتحان شهادة البكالوريا (تمرين مقترح)</div>
               <div className="md:col-span-2"><span className="font-bold">المادة:</span> {subject?.name || 'غير محدد'}</div>
               <div className="md:col-span-2"><span className="font-bold">الوحدة:</span> {unit?.name || 'غير محدد'}</div>
               <div className="col-span-1 md:col-span-4 mt-2"><span className="font-bold">الموضوع:</span> {exercise?.title || 'تمرين عام'}</div>
            </div>
         </div>

         {!showAnswers ? (
            <div className="markdown-body rtl prose max-w-none text-right">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto w-full mb-6 relative">
                      <table {...props} className="w-full text-right" />
                    </div>
                  )
                }}
              >
                {data.exam}
              </ReactMarkdown>
            </div>
         ) : (
            <div className="mt-8 border-t-2 border-emerald-500 pt-8">
               <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-emerald-700 bg-emerald-50 inline-block px-6 py-2 rounded-full border border-emerald-200">التصحيح النموذجي</h3>
               </div>
               <div className="markdown-body rtl prose max-w-none text-right">
                 <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto w-full mb-6 relative">
                        <table {...props} className="w-full text-right" />
                      </div>
                    )
                  }}
                 >
                  {data.solution}
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

