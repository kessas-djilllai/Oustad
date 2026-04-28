import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
  PenTool
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
            <button className="w-10 h-10 md:hidden rounded-2xl glass glass-hover flex items-center justify-center text-slate-600 transition-all">
              <Menu size={20} />
            </button>
            <button 
              onClick={() => navigate('/admin/login')}
              className="hidden md:flex bg-slate-900 text-white text-xs font-bold px-4 rounded-2xl items-center hover:bg-slate-800 transition-colors"
            >
              دخول الإدارة
            </button>
          </div>
        </header>

        <StudentPortal loading={loading} />

      </div>
    </div>
  );
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
  const [view, setView] = useState<{ type: string, subject?: any, unit?: any, listType?: 'lessons' | 'exercises' }>({ type: 'dashboard' });

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 auto-rows-[120px]">
        <div className="col-span-1 rounded-3xl bg-slate-200 animate-pulse h-full min-h-[200px]" />
        <div className="col-span-1 rounded-3xl bg-slate-200 animate-pulse h-full min-h-[300px]" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
         key={view.type + (view.subject?.id || '') + (view.unit?.id || '') + (view.listType || '')}
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: 10 }}
         transition={{ duration: 0.2 }}
      >
        {view.type === 'dashboard' && <DashboardView onSubjectClick={(s) => setView({ type: 'subject', subject: s })} />}
        {view.type === 'subject' && <SubjectUnitsView subject={view.subject} onBack={() => setView({ type: 'dashboard' })} onUnitClick={(u) => setView({ type: 'unit', subject: view.subject, unit: u })} />}
        {view.type === 'unit' && <UnitDetailsView subject={view.subject} unit={view.unit} onBack={() => setView({ type: 'subject', subject: view.subject })} onSelectType={(t) => setView({ type: 'list', subject: view.subject, unit: view.unit, listType: t })} />}
        {view.type === 'list' && <ContentListView subject={view.subject} unit={view.unit} listType={view.listType!} onBack={() => setView({ type: 'unit', subject: view.subject, unit: view.unit })} />}
      </motion.div>
    </AnimatePresence>
  );
}

function DashboardView({ onSubjectClick }: { onSubjectClick: (s: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1 md:col-span-2 glass rounded-[2rem] p-6 flex flex-col justify-center relative overflow-hidden group hover:shadow-lg transition-all min-h-[160px]">
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all pointer-events-none" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={24} />
            ماذا تريد أن تتعلم اليوم؟
          </h2>
          <div className="relative mt-2">
            <input 
              type="text" 
              placeholder="ابحث عن درس، تمرين، أو اسأل المساعد الذكي..." 
              className="w-full bg-white/80 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-xl px-4 py-2 hover:bg-blue-600 transition-colors focus:ring-2 focus:outline-none focus:ring-blue-300 font-bold text-xs">
              شات
            </button>
          </div>
        </div>

        <div className="col-span-1 glass rounded-[2rem] p-6 flex flex-col justify-between bg-gradient-to-br from-white to-orange-50/50 group glass-hover min-h-[160px]">
           <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2 shadow-sm">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-500 mb-1">الامتحان القادم</p>
              <h4 className="font-bold text-slate-800 text-lg">بكالوريا تجريبي</h4>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-medium">
                <Clock size={14} />
                <span>بعد 14 يوم</span>
              </div>
            </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            المواد الدراسية (انقر للتفاصيل)
          </h3>
          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">علوم تجريبية</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SUBJECTS_DATA.map((sub) => (
            <motion.div 
              key={sub.id} 
              whileHover={{ scale: 1.02 }}
              onClick={() => onSubjectClick(sub)}
              className="glass rounded-[2rem] p-6 flex flex-col justify-between cursor-pointer group glass-hover"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className={`w-12 h-12 rounded-2xl ${sub.bg} ${sub.color} flex items-center justify-center shadow-sm`}>
                   <sub.icon size={24} />
                 </div>
                 <span className="text-xs font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg">{sub.units.length} وحدات</span>
              </div>
              <div>
                 <h4 className="font-bold text-lg text-slate-800 mb-4">{sub.name}</h4>
                 <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                    <span>نسبة التقدم</span>
                    <span>{sub.progress}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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

function SubjectUnitsView({ subject, onBack, onUnitClick }: { subject: any, onBack: () => void, onUnitClick: (u: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div className={`w-10 h-10 rounded-xl ${subject.bg} ${subject.color} flex items-center justify-center shadow-sm`}>
           <subject.icon size={20} />
        </div>
        <h2 className="font-bold text-xl text-slate-800">{subject.name} - الوحدات</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subject.units.map((unit: any, index: number) => (
          <motion.div 
            key={unit.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
            onClick={() => onUnitClick(unit)}
            className="glass rounded-[2rem] p-6 cursor-pointer group hover:bg-white transition-all border border-slate-200/50 hover:border-slate-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-400 mb-1 block">الوحدة {index + 1}</span>
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{unit.name}</h3>
                <div className="flex gap-4 mt-4 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><FileText size={16} className="text-blue-400"/> {unit.lessons.length} دروس</span>
                  <span className="flex items-center gap-1.5"><PenTool size={16} className="text-emerald-400"/> {unit.exercises.length} تمارين</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ChevronLeft size={20} />
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
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div>
          <h2 className="font-bold text-xl text-slate-800">{unit.name}</h2>
          <p className="text-xs text-slate-500 font-medium">{subject.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => onSelectType('lessons')}
           className="glass rounded-[2rem] p-8 cursor-pointer group hover:bg-blue-50/50 transition-all border-2 border-transparent hover:border-blue-200 text-center flex flex-col items-center justify-center sm:h-64 shadow-sm"
        >
           <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
             <PlayCircle size={40} />
           </div>
           <h3 className="font-bold text-2xl text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">الدروس</h3>
           <p className="text-sm text-slate-500">مشاهدة الدروس بالفيديو والملخصات</p>
        </motion.div>

        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => onSelectType('exercises')}
           className="glass rounded-[2rem] p-8 cursor-pointer group hover:bg-emerald-50/50 transition-all border-2 border-transparent hover:border-emerald-200 text-center flex flex-col items-center justify-center sm:h-64 shadow-sm"
        >
           <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
             <PenTool size={40} />
           </div>
           <h3 className="font-bold text-2xl text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">التمارين</h3>
           <p className="text-sm text-slate-500">حل تمارين تطبيقية مع التصحيح</p>
        </motion.div>
      </div>
    </div>
  )
}

function ContentListView({ subject, unit, listType, onBack }: { subject: any, unit: any, listType: 'lessons' | 'exercises', onBack: () => void }) {
  const items = listType === 'lessons' ? unit.lessons : unit.exercises;
  const isLessons = listType === 'lessons';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
            <ChevronRight size={20} />
          </button>
          <div>
            <h2 className="font-bold text-xl text-slate-800">{isLessons ? 'قائمة الدروس' : 'قائمة التمارين'}</h2>
            <p className="text-xs text-slate-500 font-medium">{unit.name}</p>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${isLessons ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shadow-sm`}>
           {isLessons ? <PlayCircle size={20}/> : <PenTool size={20}/>}
        </div>
      </div>

      <div className="glass rounded-[2rem] p-4 sm:p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-bold">لا يوجد محتوى حالياً</div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/70 hover:bg-white rounded-2xl border border-slate-100 transition-all group">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isLessons ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">{item.title}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1.5 flex items-center gap-1.5">
                      {isLessons ? <PenTool size={12} className="text-emerald-500"/> : <PlayCircle size={12} className="text-blue-500" />}
                      {isLessons ? `يقابله: ${unit.exercises[idx]?.title || 'لا يوجد تمرين'}` : `مرتبط بدرس: ${unit.lessons[idx]?.title || 'غير محدد'}`}
                    </p>
                  </div>
                </div>
                <button className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm w-full sm:w-auto flex justify-center items-center gap-2 ${isLessons ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'}`}>
                  {isLessons ? 'شاهد الدرس' : 'ابدأ الحل'}
                  <ChevronLeft size={16} className="opacity-70" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminDashboard({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-1 sm:col-span-3 h-24 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="col-span-1 h-32 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="col-span-1 h-32 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="col-span-1 h-32 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="col-span-1 sm:col-span-3 h-64 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="الطلاب النشطين" value="2,451" trend="+12%" icon={<TrendingUp size={20} className="text-emerald-500"/>} />
        <StatCard title="الدروس المضافة" value="142" trend="+3" icon={<BookOpen size={20} className="text-blue-500"/>} />
        <StatCard title="الامتحانات المجراة" value="8,920" trend="+1.2k" icon={<Target size={20} className="text-indigo-500"/>} />
        <StatCard title="رسائل الدعم" value="24" trend="-5%" icon={<MessageCircle size={20} className="text-orange-500"/>} />
      </div>

      {/* Main Admin Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 glass rounded-[2rem] p-6">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">أحدث التسجيلات</h3>
            <button className="text-sm text-blue-600 font-bold hover:underline">عرض الكل</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200/50">
                  <th className="pb-3 font-medium">الاسم</th>
                  <th className="pb-3 font-medium">الشعبة</th>
                  <th className="pb-3 font-medium">التاريخ</th>
                  <th className="pb-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100/50 last:border-0">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <span className="font-bold">أحمد محمود</span>
                  </td>
                  <td className="py-4">علوم تجريبية</td>
                  <td className="py-4">منذ ساعتين</td>
                  <td className="py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">نشط</span></td>
                </tr>
                 <tr className="border-b border-slate-100/50 last:border-0">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <span className="font-bold">سارة علي</span>
                  </td>
                  <td className="py-4">رياضيات</td>
                  <td className="py-4">منذ 5 ساعات</td>
                  <td className="py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">نشط</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 glass rounded-[2rem] p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/50 transition-colors text-right group">
              <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">إضافة درس جديد</span>
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/50 transition-colors text-right group">
              <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">إنشاء اختبار</span>
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
             <button className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/50 transition-colors text-right group">
              <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">مراجعة المحتوى</span>
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="glass rounded-2xl p-4 md:p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      </div>
      <div>
        <h4 className="text-xs text-slate-500 font-bold mb-1">{title}</h4>
        <div className="text-2xl font-black text-slate-800">{value}</div>
      </div>
    </div>
  )
}

// ==========================================
// 2. Admin Layout & Settings
// ==========================================

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6 relative flex justify-center">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 z-10">
        
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg md:text-xl text-slate-800">لوحة التحكم الإدارية</h1>
              <p className="text-xs text-slate-500 font-medium">نظام الإدارة المركزي</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all group">
              <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <button onClick={() => navigate('/admin/login')} className="w-auto px-4 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all gap-2 font-bold text-xs">
              <LogOut size={16} />
              <span className="hidden md:inline">تسجيل الخروج</span>
            </button>
          </div>
        </header>

        <AdminDashboard loading={loading} />

      </div>
    </div>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/admin');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-200/50 blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass rounded-[2rem] p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-white mb-4 shadow-xl">
             <Lock size={32} />
          </div>
          <h1 className="font-bold text-2xl text-slate-800 text-center">أدمين منصة بكالوريا</h1>
          <p className="text-sm text-slate-500 mt-2 text-center">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">البريد الإلكتروني للإدارة</label>
            <div className="relative">
              <input 
                type="email" 
                defaultValue="admin@bacpro.dz"
                className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-left"
                dir="ltr"
              />
              <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                defaultValue="supersecret123"
                className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-left font-mono"
                dir="ltr"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "إخفاء" : "إظهار"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-bold rounded-xl py-3 mt-6 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          >
            {isLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>تسجيل الدخول <ChevronLeft size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors">
              العودة إلى واجهة الطالب
            </button>
        </div>
      </motion.div>
    </div>
  );
}
