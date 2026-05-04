import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { ChevronRight, ChevronLeft, PlayCircle, ClipboardList, FileText, CheckCircle, RefreshCw, X } from 'lucide-react';
import { getProgressSync, saveProgress, addXP } from '../lib/progress';
import { getSubjectPrompt } from '../lib/prompts';
import { preprocessMath } from '../lib/utils';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../lib/supabase';

export function SubjectTypeView({ subject, onBack, onSelectType }: { subject: any, onBack: () => void, onSelectType: (t: 'lessons' | 'exercises') => void }) {
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

export function SubjectUnitsView({ subject, onBack, onUnitClick }: { subject: any, onBack: () => void, onUnitClick: (u: any) => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm`}>
           <subject.icon size={16} className="md:w-5 md:h-5"/>
        </div>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">{subject.name}</h2>
        </div>
      </div>

      <div className="space-y-8">
        {[1, 2, 3].map(trimestreNum => {
          const trimUnits = subject.units.filter((u: any) => u.trimestre === trimestreNum || (!u.trimestre && trimestreNum === 1));
          if (trimUnits.length === 0) return null;
          
          return (
            <div key={`trim-${trimestreNum}`} className="space-y-4">
              <h3 className="font-bold text-lg md:text-xl text-slate-800 flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${trimestreNum === 1 ? 'bg-indigo-100 text-indigo-600' : trimestreNum === 2 ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                  {trimestreNum}
                </span>
                الفصل {trimestreNum === 1 ? 'الأول' : trimestreNum === 2 ? 'الثاني' : 'الثالث'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <AnimatePresence>
                {trimUnits.map((unit: any, index: number) => {
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
                  <motion.div 
                    key={unit.id}
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
          </motion.div>
        )})}
              </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export function UnitDetailsView({ subject, unit, onBack, onSelectItem }: { subject: any, unit: any, onBack: () => void, onSelectItem: (type: 'lessons' | 'exercises', item: any) => void }) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'exercises'>('exercises');
  const items = activeTab === 'lessons' ? (unit.lessons || []) : (unit.exercises || []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 md:mb-4 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold hover:scale-[1.05] active:scale-95">
            <ChevronRight size={18} className="md:w-5 md:h-5" />
          </button>
          <div>
            <h2 className="font-bold text-base md:text-xl text-slate-800">{unit.name}</h2>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">{subject.name}</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 sm:w-32 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'exercises' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardList size={16} />
            التمارين
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex-1 sm:w-32 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'lessons' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PlayCircle size={16} />
            الدروس
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl md:rounded-[2rem] p-3 md:p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-bold text-sm md:text-base">لا يوجد محتوى حالياً</div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {activeTab === 'lessons' ? (
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
                        {`يقابله: ${(unit.exercises && unit.exercises[idx]?.title) || 'لا يوجد تمرين'}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onSelectItem('lessons', item)}
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
                    onClick={() => onSelectItem('exercises', item)}
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

export function ContentListView({ subject, unit, listType, onBack, onSelectItem }: { subject: any, unit: any, listType: 'lessons' | 'exercises', onBack: () => void, onSelectItem?: (item: any) => void }) {
  const items = listType === 'lessons' ? unit.lessons : unit.exercises;
  const isLessons = listType === 'lessons';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

export function LessonDetailsView({ subject, unit, lesson, onBack }: { subject: any, unit: any, lesson: any, onBack: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
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
        <div className="prose prose-sm md:prose-base prose-slate max-w-none text-right overflow-hidden break-words w-full" dir="rtl">
           <div className="markdown-body">
             <ReactMarkdown 
               remarkPlugins={[remarkGfm, remarkMath]} 
               rehypePlugins={[rehypeKatex, rehypeRaw]}
               components={{
                 table: ({node, children, ...props}: any) => (
                   <div className="overflow-x-auto w-full mb-6 relative" dir="auto">
                     <table {...props} className="w-full text-center border-collapse border border-slate-300">
                        {React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}
                     </table>
                   </div>
                 ),
                 tbody: ({node, children, ...props}: any) => <tbody {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</tbody>,
                 thead: ({node, children, ...props}: any) => <thead {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</thead>,
                 tr: ({node, children, ...props}: any) => <tr {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</tr>,
                 colgroup: ({node, children, ...props}: any) => <colgroup {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</colgroup>,
                 th: ({node, ...props}: any) => <th {...props} className="border border-slate-300 px-4 py-2 bg-slate-50 font-bold" />,
                 td: ({node, ...props}: any) => <td {...props} className="border border-slate-300 px-4 py-2 text-center" />
               }}
             >
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

export function InteractiveExerciseView({ subject, unit, exercise, onBack, onPay }: { subject: any, unit: any, exercise: any, onBack: () => void, onPay?: () => void }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  
  const getInitialCount = () => {
    if (!exercise?.id) return 0;
    return parseInt(localStorage.getItem(`exercise_gen_count_${exercise.id}`) || '0', 10);
  };
  
  const [genCount, setGenCount] = useState(() => getInitialCount());
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    if (genCount >= 2) {
      if (onPay) onPay();
      return;
    }
    setErrorMsg(null);
    let apiKey = '';
    let aiModel = 'gemini-3-flash-preview';
    if (supabase) {
      const { data } = await supabase.from('admin_settings').select('api_key, ai_model').limit(1).single();
      if (data && data.api_key) {
        apiKey = data.api_key;
        aiModel = (data.ai_model && data.ai_model !== 'gemini-2.5-flash') ? data.ai_model : 'gemini-3-flash-preview';
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
      const newPrompt = prompt + "\n\nملاحظة مهمة: يرجى توليد تمرين مشابه للتمرين السابق من حيث الفكرة، لكن بمعطيات جديدة أو أرقام مختلفة تماماً. **بالنسبة للرياضيات**: يجب استخدام علامات `$$ ... $$` للمعادلات المفصولة و`$ ... $` للمعادلات ضمن السطر. لا تنس أبداً وضع سياق الـ LaTeX بشكل سليم واضافة علامة `\\` قبل أي دالة مثل `\\begin{cases}`, `\\frac`, `\\lim`, `\\sqrt` الخ.";

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
        const newCount = genCount + 1;
        setGenCount(newCount);
        if (exercise?.id) {
           localStorage.setItem(`exercise_gen_count_${exercise.id}`, newCount.toString());
        }
      } else {
        throw new Error("لم يتم إرجاع أي استجابة من المولد.");
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً (503/504). المحاولة لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم أثناء التحليل.";
      else if (errMsg.includes('token limit')) errMsg = "تجاوز التوليد الحد الأقصى للنصوص المسموح بها.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية لمفتاح Gemini API هذا (Quota Exceeded). يرجى التحقق من خطة الدفع الخاصة بك أو إضافة مفتاح API جديد.";
      setErrorMsg("حدث خطأ أثناء التوليد: " + errMsg);
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
             className={`px-4 md:px-5 py-2 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm flex-1 md:flex-none disabled:opacity-50 ${genCount >= 2 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
           >
             {genCount >= 2 ? (
                <>
                   <RefreshCw size={16} />
                   <span>ادفع لزيادة حجم التوليد</span>
                </>
             ) : (
                <>
                   <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} /> 
                   <span>{isGenerating ? 'جاري التوليد...' : `تمرين جديد (${2 - genCount} مجاني)`}</span>
                </>
             )}
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

         <div className="markdown-body rtl prose max-w-none text-right overflow-hidden break-words w-full">
           <ReactMarkdown 
             remarkPlugins={[remarkGfm, remarkMath]}
             rehypePlugins={[rehypeKatex, rehypeRaw]}
             components={{
               table: ({node, children, ...props}: any) => (
                 <div className="overflow-x-auto w-full mb-6 relative" dir="auto">
                   <table {...props} className="w-full text-center border-collapse border border-slate-300">
                     {React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}
                   </table>
                 </div>
               ),
               tbody: ({node, children, ...props}: any) => <tbody {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</tbody>,
               thead: ({node, children, ...props}: any) => <thead {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</thead>,
               tr: ({node, children, ...props}: any) => <tr {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</tr>,
               colgroup: ({node, children, ...props}: any) => <colgroup {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</colgroup>,
               th: ({node, ...props}: any) => <th {...props} className="border border-slate-300 px-4 py-2 bg-slate-50 font-bold" />,
               td: ({node, ...props}: any) => <td {...props} className="border border-slate-300 px-4 py-2 text-center" />
             }}
           >
             {preprocessMath(currentExercise.exam?.replace(/\\n/g, '\n').replace(/([^\n])\s+([أبتثجحخدذرزسشصضطظعغفقكلمنهوي]\))/g, '$1\n\n$2'))}
           </ReactMarkdown>
         </div>

         {showAnswers && currentExercise.solution && (
            <div ref={solutionRef} className="mt-8 border-t-2 border-emerald-500 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-emerald-700 bg-emerald-50 inline-block px-6 py-2 rounded-full border border-emerald-200">التصحيح النموذجي</h3>
               </div>
               <div className="markdown-body rtl prose max-w-none text-right overflow-hidden break-words w-full">
                 <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                  components={{
                    table: ({node, children, ...props}: any) => (
                      <div className="overflow-x-auto w-full mb-6 relative" dir="auto">
                        <table {...props} className="w-full text-center border-collapse border border-slate-300">
                           {React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}
                        </table>
                      </div>
                    ),
                    tbody: ({node, children, ...props}: any) => <tbody {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</tbody>,
                    thead: ({node, children, ...props}: any) => <thead {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</thead>,
                    tr: ({node, children, ...props}: any) => <tr {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</tr>,
                    colgroup: ({node, children, ...props}: any) => <colgroup {...props}>{React.Children.toArray(children).filter((c: any) => typeof c !== 'string' || c.trim() !== '')}</colgroup>,
                    th: ({node, ...props}: any) => <th {...props} className="border border-slate-300 px-4 py-2 bg-slate-50 font-bold" />,
                    td: ({node, ...props}: any) => <td {...props} className="border border-slate-300 px-4 py-2 text-center" />
                  }}
                 >
                  {preprocessMath(currentExercise.solution?.replace(/\\n/g, '\n').replace(/([^\n])\s+([أبتثجحخدذرزسشصضطظعغفقكلمنهوي]\))/g, '$1\n\n$2'))}
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

