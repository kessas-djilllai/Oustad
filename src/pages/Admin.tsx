import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { GoogleGenAI, Type } from "@google/genai";
import { getSubjectPrompt } from '../lib/prompts';
import { 
  BookOpen, 
  Target, 
  PlayCircle, 
  PenTool, 
  Plus, 
  Save,
  Trash,
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  UserCircle,
  Menu,
  X,
  Wand2,
  Cpu
} from "lucide-react";
import { motion } from "motion/react";

export type AlertEventPayload = { message: string, type?: 'success' | 'error' | 'info' };

export const triggerAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  window.dispatchEvent(new CustomEvent<AlertEventPayload>('show-admin-alert', { detail: { message, type } }));
};

function AlertModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState<AlertEventPayload>({ message: '', type: 'info' });

  useEffect(() => {
    const handler = (e: any) => {
      setAlertData(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('show-admin-alert', handler as EventListener);
    return () => window.removeEventListener('show-admin-alert', handler as EventListener);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <motion.div initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} className="relative bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
         <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${alertData.type === 'error' ? 'bg-red-100 text-red-600' : alertData.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            {alertData.type === 'error' ? <X size={32} /> : alertData.type === 'success' ? <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <Menu size={32} />}
         </div>
         <h3 className="text-xl font-bold text-slate-800 mb-2">{alertData.type === 'error' ? 'خطأ' : alertData.type === 'success' ? 'نجاح' : 'تنبيه'}</h3>
         <div className="text-slate-600 font-medium mb-6 text-sm break-words whitespace-pre-wrap w-full border-t border-slate-100 pt-4 overflow-y-auto max-h-60" style={{userSelect: 'text'}}>
           {alertData.message}
         </div>
         <button onClick={() => setIsOpen(false)} className="w-full bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-slate-800 transition-all text-sm">حسناً</button>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-3 md:p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="mt-1">
        <h4 className="text-[10px] md:text-xs text-slate-500 font-bold mb-1">{title}</h4>
        <div className="text-xl md:text-2xl font-black text-slate-800">{value}</div>
      </div>
    </div>
  )
}

function AdminEntityList({ type, title }: { type: 'subjects' | 'units' | 'lessons' | 'exercises', title: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{id: string, name: string} | null>(null);

  const fetchItems = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from(type).select('*');
      if (error) {
        triggerAlert("خطأ في جلب البيانات: " + error.message, "error");
      }
      setItems(data || []);
    } catch (e: any) {
      triggerAlert("حدث خطأ غير متوقع: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  const executeDelete = async (id: string) => {
    if (!supabase) {
      triggerAlert("قاعدة البيانات غير متصلة", "error");
      return;
    }
    
    setConfirmDelete(null);
    setDeletingId(id);
    
    try {
      const { data, error } = await supabase.from(type).delete().eq('id', id).select();
      if (error) throw error;
      if (data && data.length === 0) {
        throw new Error('لم يتم الحذف. غالباً بسبب سياسات الأمان (RLS) في قاعدة البيانات. يمكن حل هذا بتشغيل أمر SQL للسماح بالحذف.');
      }
      triggerAlert("تم الحذف بنجاح", "success");
      fetchItems();
    } catch (e: any) {
      // Return a detailed string to be displayed
      let detailedError = "خطأ في الحذف: " + e.message;
      if (e.message?.includes('foreign key constraint') || e.code === '23503') {
        detailedError = "لا يمكن حذف هذا العنصر لأنه مرتبط بعناصر أخرى (مثلاً: وحدة تحتوي على دروس، أو مادة تحتوي على وحدات). يرجى حذف العناصر المرتبطة أولاً.";
      } else if (e.message?.includes('RLS')) {
         detailedError = "صلاحيات قاعدة البيانات (RLS) تمنع الحذف. يجب تفعيل سياسة الحذف (DELETE policy) في Supabase للإدمن.";
      }
      triggerAlert(detailedError, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-10 pt-8 border-t border-slate-200 relative">
      {confirmDelete && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm -m-6 rounded-[2rem]">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl text-center">
               <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash size={32} />
               </div>
               <h3 className="font-bold text-lg mb-2 text-slate-800">تأكيد الحذف</h3>
               <p className="text-slate-600 mb-6 text-sm">هل أنت متأكد من حذف '{confirmDelete.name}'؟ لا يمكن التراجع عن هذا الإجراء.</p>
               <div className="flex gap-3">
                 <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">إلغاء</button>
                 <button type="button" onClick={() => executeDelete(confirmDelete.id)} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600">نعم، احذف</button>
               </div>
            </div>
         </div>
      )}
      <h3 className="font-bold text-lg text-slate-800 mb-4">{title}</h3>
      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-slate-500 py-8 font-bold text-sm">لا توجد عناصر حالياً</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-white hover:border-slate-200 hover:shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base">{item.title || item.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString('ar-DZ') : ''}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setConfirmDelete({id: item.id, name: item.title || item.name || 'العنصر'})} 
                  disabled={deletingId === item.id}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === item.id ? (
                    <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <Trash size={16} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AdminAddLesson({ onBack }: { onBack: () => void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [title, setTitle] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSubjects() {
      if (!supabase) return;
      const { data } = await supabase.from('subjects').select('*');
      if (data) setSubjects(data);
    }
    fetchSubjects();
  }, []);

  useEffect(() => {
    async function fetchUnits() {
      if (!supabase || !selectedSubjectId) {
        setUnits([]);
        return;
      }
      const { data } = await supabase.from('units').select('*').eq('subject_id', selectedSubjectId);
      if (data) setUnits(data);
    }
    fetchUnits();
  }, [selectedSubjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedUnitId) {
      triggerAlert('الرجاء اختيار الوحدة.', 'error');
      return;
    }

    if (isBulkMode) {
      if (!jsonInput) {
        triggerAlert('الرجاء إدخال نص JSON صالحة.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        let items: any[] = [];
        try {
          items = JSON.parse(jsonInput);
        } catch (e) {
          triggerAlert('صيغة JSON غير صحيحة.', 'error');
          setIsSubmitting(false);
          return;
        }

        if (!Array.isArray(items)) {
          triggerAlert('يجب أن يكون JSON عبارة عن مصفوفة (Array).', 'error');
          setIsSubmitting(false);
          return;
        }

        const inserts = items.map((item, index) => {
          const titleStr = typeof item === 'string' ? item : item.title || item.name;
          if (!titleStr) throw new Error('لا يمكن العثور على عنوان في أحد العناصر.');
          return {
            id: 'l_' + Math.random().toString(36).substr(2, 9) + index,
            unit_id: selectedUnitId,
            title: titleStr,
            lesson_order: 99
          };
        });

        const { error } = await supabase.from('lessons').insert(inserts);
        if (!error) {
          triggerAlert(`تم إضافة ${inserts.length} درس بنجاح!`, 'success');
          onBack();
        } else {
          triggerAlert('حدث خطأ أثناء الإضافة: ' + error.message, 'error');
        }
      } catch (err: any) {
        triggerAlert('حدث خطأ: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!title) {
         triggerAlert('الرجاء كتابة عنوان الدرس.', 'error');
         return;
      }
      setIsSubmitting(true);
      try {
        const lesson_id = 'l_' + Math.random().toString(36).substr(2, 9);
        const { error } = await supabase.from('lessons').insert([{
          id: lesson_id,
          unit_id: selectedUnitId,
          title: title,
          lesson_order: 99 // simplistic order for demo
        }]);
        if (!error) {
          triggerAlert('تمت إضافة الدرس بنجاح!', 'success');
          onBack();
        } else {
          triggerAlert('حدث خطأ أثناء الإضافة: ' + error.message, 'error');
        }
      } catch (err: any) {
        triggerAlert('حدث خطأ غير متوقع: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
           <PlayCircle size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إضافة درس جديد</h2>
          <p className="text-xs text-slate-500 font-medium">قم بتعبئة تفاصيل الدرس ليتم نشره للطلاب.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اختر المادة</label>
          <select 
            value={selectedSubjectId} 
            onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedUnitId(''); }}
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            required
          >
            <option value="">-- يرجى الاختيار --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">اختر الوحدة</label>
            <select 
              value={selectedUnitId} 
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
              required
              disabled={!selectedSubjectId}
            >
              <option value="">-- يرجى الاختيار --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsBulkMode(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isBulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إضافة فردية
          </button>
          <button
            type="button"
            onClick={() => setIsBulkMode(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isBulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إضافة متعددة (JSON)
          </button>
        </div>

        {!isBulkMode ? (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الدرس</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الاستمرارية والاشتقاقية"
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              required={!isBulkMode}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">النص (JSON Array)</label>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='مثال:&#10;["الدرس الأول", "الدرس الثاني"]&#10;أو&#10;[{"title": "الدرس الأول"}, {"title": "الدرس الثاني"}]'
              className="w-full h-32 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
              dir="ltr"
              required={isBulkMode}
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>حفظ الدرس <Save size={18} /></>
          )}
        </button>
      </form>
    </div>
  )
}

function AdminAddExercise({ onBack }: { onBack: () => void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSubjects() {
      if (!supabase) return;
      const { data } = await supabase.from('subjects').select('*');
      if (data) setSubjects(data);
    }
    fetchSubjects();
  }, []);

  useEffect(() => {
    async function fetchUnits() {
      if (!supabase || !selectedSubjectId) {
        setUnits([]);
        return;
      }
      const { data } = await supabase.from('units').select('*').eq('subject_id', selectedSubjectId);
      if (data) setUnits(data);
    }
    fetchUnits();
  }, [selectedSubjectId]);

  const generateWithAI = async () => {
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
      triggerAlert("الرجاء إعداد مفتاح Gemini API من صفحة الإعدادات أولاً.", 'error');
      return;
    }
    if (!selectedSubjectId || !selectedUnitId || !title) {
       triggerAlert("الرجاء اختيار المادة والوحدة وكتابة عنوان التمرين أولاً.", 'error');
       return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || '';
      const unitName = units.find(u => u.id === selectedUnitId)?.name || '';
      
      const prompt = getSubjectPrompt(subjectName, unitName, title);

      const response = await ai.models.generateContent({
        model: aiModel,
        contents: prompt,
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
      
      const jsonStr = response.text.trim();
      const parsedData = JSON.parse(jsonStr);
      setGeneratedQuestions([{ exam: parsedData.exam, solution: parsedData.solution }]);
      triggerAlert("تم توليد الموضوع بنجاح!", 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('503')) {
         triggerAlert("خوادم جوجل (Gemini) تواجه ضغطاً كبيراً حالياً (خطأ 503). الرجاء المحاولة مرة أخرى بعد قليل.", 'error');
      } else {
         triggerAlert("حدث خطأ أثناء التوليد: " + err.message, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedUnitId || !title) {
       triggerAlert('الرجاء التأكد من تعبئة جميع الحقول وإعداد قاعدة البيانات (Supabase).', 'error');
       return;
    }
    setIsSubmitting(true);
    try {
      const exercise_id = 'e_' + Math.random().toString(36).substr(2, 9);
      // We store the generated questions in the 'content' column as JSON string
      const contentStr = generatedQuestions.length > 0 ? JSON.stringify(generatedQuestions) : null;
      
      const { error } = await supabase.from('exercises').insert([{
        id: exercise_id,
        unit_id: selectedUnitId,
        title: title,
        exercise_order: 99,
        content: contentStr
      }]);
      if (!error) {
        triggerAlert('تمت إضافة التمرين بنجاح!', 'success');
        onBack();
      } else {
        triggerAlert('حدث خطأ أثناء الإضافة: ' + error.message, 'error');
      }
    } catch (err: any) {
      triggerAlert('حدث خطأ غير متوقع: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
           <PenTool size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إضافة تمرين جديد</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة تمرين تفاعلي للوحدة المحددة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اختر المادة</label>
          <select 
            value={selectedSubjectId} 
            onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedUnitId(''); }}
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            required
          >
            <option value="">-- يرجى الاختيار --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">اختر الوحدة</label>
            <select 
              value={selectedUnitId} 
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
              required
              disabled={!selectedSubjectId}
            >
              <option value="">-- يرجى الاختيار --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">عنوان التمرين</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تمرين حول المكتسبات القبلية"
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            required
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-8">
          <button 
            type="button" 
            onClick={generateWithAI}
            disabled={isGenerating || !selectedSubjectId || !selectedUnitId || !title}
            className="flex-1 relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl py-3.5 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {isGenerating ? (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
               <>
                 <Wand2 size={18} className="animate-pulse" /> 
                 توليد التمرين الذكي
               </>
            )}
          </button>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 relative group overflow-hidden bg-slate-800 text-white font-bold rounded-xl py-3.5 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          >
            {isSubmitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>حفظ في القاعدة <Save size={18} /></>
            )}
          </button>
        </div>

        {generatedQuestions.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> الأسئلة المُولّدة جاهزة
            </h3>
            <p className="text-xs text-slate-500">تم تجهيز {generatedQuestions.length} أسئلة بنجاح. سيتم إرفاقها بالتمرين عند الحفظ.</p>
          </div>
        )}
      </form>
    </div>
  )
}

function AdminAddSubject({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !name) return;
    setIsSubmitting(true);
    try {
      const id = 's_' + Math.random().toString(36).substr(2, 9);
      const { error } = await supabase.from('subjects').insert([{
        id,
        name,
        color: 'text-indigo-500',
        bg: 'bg-indigo-100',
        bar_color: 'bg-indigo-500',
        icon_name: 'BookOpen',
        progress: 0
      }]);
      if (!error) {
        triggerAlert('تمت إضافة المادة بنجاح!', 'success');
        onBack();
      } else {
        triggerAlert('حدث خطأ: ' + error.message, 'error');
      }
    } catch (err: any) {
      triggerAlert('خطأ: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
           <BookOpen size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إضافة مادة جديدة</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة مادة لتنظيم الوحدات بداخلها.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اسم المادة</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: الفلسفة"
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>حفظ المادة <Save size={18} /></>
          )}
        </button>
      </form>
    </div>
  )
}

function AdminAddUnit({ onBack }: { onBack: () => void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [name, setName] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSubjects() {
      if (!supabase) return;
      const { data } = await supabase.from('subjects').select('*');
      if (data) setSubjects(data);
    }
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedSubjectId) return;

    if (isBulkMode) {
      if (!jsonInput) {
        triggerAlert('الرجاء إدخال نص JSON صالحة.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        let items: any[] = [];
        try {
          items = JSON.parse(jsonInput);
        } catch (e) {
          triggerAlert('صيغة JSON غير صحيحة.', 'error');
          setIsSubmitting(false);
          return;
        }

        if (!Array.isArray(items)) {
          triggerAlert('يجب أن يكون JSON عبارة عن مصفوفة (Array).', 'error');
          setIsSubmitting(false);
          return;
        }

        const inserts = items.map((item, index) => {
          const nameStr = typeof item === 'string' ? item : item.name || item.title;
          if (!nameStr) throw new Error('لا يمكن العثور على اسم في أحد العناصر.');
          return {
            id: 'u_' + Math.random().toString(36).substr(2, 9) + index,
            subject_id: selectedSubjectId,
            name: nameStr,
            unit_order: 99
          };
        });

        const { error } = await supabase.from('units').insert(inserts);
        if (!error) {
          triggerAlert(`تم إضافة ${inserts.length} وحدة بنجاح!`, 'success');
          onBack();
        } else {
          triggerAlert('حدث خطأ: ' + error.message, 'error');
        }
      } catch (err: any) {
        triggerAlert('خطأ: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!name) return;
      setIsSubmitting(true);
      try {
        const id = 'u_' + Math.random().toString(36).substr(2, 9);
        const { error } = await supabase.from('units').insert([{
          id,
          subject_id: selectedSubjectId,
          name,
          unit_order: 99
        }]);
        if (!error) {
          triggerAlert('تمت إضافة الوحدة بنجاح!', 'success');
          onBack();
        } else {
          triggerAlert('حدث خطأ: ' + error.message, 'error');
        }
      } catch (err: any) {
        triggerAlert('خطأ: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
           <Target size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إضافة وحدة جديدة</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة وحدة داخل مادة معينة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اختر المادة</label>
          <select 
            value={selectedSubjectId} 
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
          >
            <option value="">-- يرجى الاختيار --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsBulkMode(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isBulkMode ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إضافة فردية
          </button>
          <button
            type="button"
            onClick={() => setIsBulkMode(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isBulkMode ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إضافة متعددة (JSON)
          </button>
        </div>

        {!isBulkMode ? (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم الوحدة</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الميكانيك الكلاسيكية"
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              required={!isBulkMode}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">النص (JSON Array)</label>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='مثال:&#10;["الوحدة الأولى", "الوحدة الثانية"]&#10;أو&#10;[{"name": "الوحدة الأولى"}, {"name": "الوحدة الثانية"}]'
              className="w-full h-32 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
              dir="ltr"
              required={isBulkMode}
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/30 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>حفظ الوحدة <Save size={18} /></>
          )}
        </button>
      </form>
    </div>
  )
}

function AdminSettings({ onBack }: { onBack: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadSettings() {
      let currentKey = '';
      let savedModel = 'gemini-2.5-flash';
      
      if (supabase) {
        try {
          const { data } = await supabase.from('admin_settings').select('*').limit(1).single();
          if (data && data.api_key) {
            currentKey = data.api_key;
            savedModel = data.ai_model || savedModel;
          }
        } catch (e) { }
      }
      
      setSelectedModel(savedModel);
      setApiKey(currentKey);
      
      if (currentKey) {
          // Trigger real validation instead of assuming it's valid
          validateAndFetchModels(currentKey, savedModel);
      }
    }
    loadSettings();
  }, []);

  const validationIdRef = useRef(0);

  const validateAndFetchModels = async (keyToTest?: string | React.MouseEvent, modelToSelect?: string) => {
      const isClickEvent = keyToTest && typeof keyToTest === 'object' && 'preventDefault' in keyToTest;
      const key = (typeof keyToTest === 'string' && !isClickEvent) ? keyToTest : apiKey;
      
      if (!key) return;
      if (key.length < 15) {
          setValidationError('مفتاح API غير مكتمل أو قصير جداً. يرجى التأكد من نسخه بالكامل.');
          setIsValidated(false);
          return;
      }

      const currentValidationId = ++validationIdRef.current;
      setIsValidating(true);
      setValidationError(null);

      try {
          const validateWithXHR = (): Promise<any> => {
              return new Promise((resolve, reject) => {
                  const xhr = new XMLHttpRequest();
                  xhr.open("GET", `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, true);
                  xhr.onreadystatechange = () => {
                      if (xhr.readyState === 4) {
                          if (xhr.status >= 200 && xhr.status < 300) {
                              try { resolve(JSON.parse(xhr.responseText)); } catch(e) { reject(new Error("استجابة غير صالحة من الخادم.")); }
                          } else {
                              try { 
                                  const err = JSON.parse(xhr.responseText); 
                                  reject(new Error(err.error?.message || `خطأ ${xhr.status}: يرجى التأكد من صلاحية المفتاح`)); 
                              } catch(e) { reject(new Error(`خطأ ${xhr.status}: يرجى التأكد من أن مفتاح API صحيح.`)); }
                          }
                      }
                  };
                  xhr.onerror = () => reject(new Error("مشكلة في الاتصال بالانترنت أو بالخادم."));
                  xhr.send();
              });
          };

          const data = await validateWithXHR();
          
          if (validationIdRef.current !== currentValidationId) return; // تم إلغاء الطلب أو تغيير المفتاح
          
          const models = [];
          if (data.models && Array.isArray(data.models)) {
              for (const m of data.models) {
                  if (m.name.startsWith('models/gemini')) {
                      models.push({ id: m.name.replace('models/', ''), name: m.displayName || m.name.replace('models/', '') });
                  }
              }
          }

          if (models.length > 0) {
             setAvailableModels(models);
             setIsValidated(true);
             const targetModel = typeof modelToSelect === 'string' ? modelToSelect : selectedModel;
             if (!models.find(m => m.id === targetModel)) {
                 setSelectedModel(models[0].id);
             } else if (typeof modelToSelect === 'string') {
                 setSelectedModel(modelToSelect);
             }
          } else {
             setValidationError('تم التحقق ولكن لم يتم العثور على نماذج تدعم Gemini ضمن هذا المفتاح.');
             setIsValidated(false);
          }
      } catch (e: any) {
          if (validationIdRef.current !== currentValidationId) return;
          setValidationError(e.message || String(e));
          setIsValidated(false);
      } finally {
          if (validationIdRef.current === currentValidationId) {
             setIsValidating(false);
          }
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidated) {
        triggerAlert("الرجاء التحقق من المفتاح أولاً", 'error');
        return;
    }
    setIsSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('admin_settings').upsert({ id: 1, api_key: apiKey, ai_model: selectedModel });
        if (error) throw error;
        triggerAlert("تم حفظ الإعدادات بنجاح!", 'success');
        onBack();
      } else {
        triggerAlert("يرجى إعداد قاعدة البيانات لحفظ الإعدادات.", 'error');
      }
    } catch (err: any) {
      triggerAlert("حدث خطأ أثناء الحفظ في قاعدة البيانات: " + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 max-w-2xl mx-auto shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
           <Cpu size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إعدادات الذكاء الاصطناعي</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">قم بربط مفتاح Gemini API لجلب النماذج.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">مفتاح API الخاص بـ Gemini</label>
          <div className="flex gap-2">
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => { setApiKey(e.target.value); setIsValidated(false); setValidationError(null); }}
                placeholder="AIzaSy..."
                className={`flex-1 bg-slate-50 border ${validationError ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-blue-500/50'} rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 font-mono text-left transition-all`}
                dir="ltr"
              />
              <button 
                  onClick={validateAndFetchModels}
                  disabled={isValidating || !apiKey}
                  className="bg-blue-600 text-white font-bold rounded-xl px-6 py-3 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
              >
                  {isValidating ? 'جاري التحقق...' : 'التحقق'}
              </button>
          </div>
          {validationError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-start gap-2">
                 <span className="mt-0.5">⚠️</span>
                 <p className="leading-relaxed">{validationError}</p>
              </motion.div>
          )}
        </div>

        {isValidated && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-sm font-bold text-slate-700 mb-2">نموذج التوليد المستخدم (Model)</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-slate-700"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </motion.div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
           <h4 className="font-bold text-slate-800 mb-2 flex items-center justify-between">
              تحديث الصلاحيات (Supabase RLS)
              <button 
                 type="button"
                 onClick={() => {
                   navigator.clipboard.writeText(`CREATE POLICY "Allow public update to subjects" ON subjects FOR UPDATE USING (true);\nCREATE POLICY "Allow public update to units" ON units FOR UPDATE USING (true);\nCREATE POLICY "Allow public update to lessons" ON lessons FOR UPDATE USING (true);\nCREATE POLICY "Allow public update to exercises" ON exercises FOR UPDATE USING (true);\nCREATE POLICY "Allow public delete to subjects" ON subjects FOR DELETE USING (true);\nCREATE POLICY "Allow public delete to units" ON units FOR DELETE USING (true);\nCREATE POLICY "Allow public delete to lessons" ON lessons FOR DELETE USING (true);\nCREATE POLICY "Allow public delete to exercises" ON exercises FOR DELETE USING (true);`);
                   triggerAlert('تم نسخ الكود!', 'success');
                 }}
                 className="text-[10px] bg-slate-100 font-bold px-3 py-1 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
               >
                 نسخ الكود الكامل
               </button>
           </h4>
           <p className="text-xs text-slate-500 mb-3 leading-relaxed">إذا واجهتك مشكلة في التعديل أو الحذف (لا يحدث شيء وتظهر رسالة خطأ)، انسخ كود SQL أدناه وقم بتنفيذه في قسم <b>SQL Editor</b> في منصة Supabase:</p>
           
           <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-left text-xs overflow-x-auto dir-ltr font-mono leading-loose">
{`-- تحديث الصلاحيات للحذف والتعديل
CREATE POLICY "Allow public update to subjects" ON subjects FOR UPDATE USING (true);
CREATE POLICY "Allow public update to units" ON units FOR UPDATE USING (true);
...
CREATE POLICY "Allow public delete to subjects" ON subjects FOR DELETE USING (true);
CREATE POLICY "Allow public delete to units" ON units FOR DELETE USING (true);
...`}
           </pre>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || !isValidated}
          className="w-full bg-emerald-600 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isSaving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>حفظ الإعدادات <Save size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}

function AdminDashboard({ setView }: { setView: (v: string) => void }) {
  const [stats, setStats] = useState({ subjects: 0, units: 0, lessons: 0, exercises: 0 });
  const [dbLoading, setDbLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      if (!supabase) return;
      try {
        setDbLoading(true);
        const [subRes, unitRes, lessRes, exRes] = await Promise.all([
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('units').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('exercises').select('*', { count: 'exact', head: true })
        ]);

        const [recentL, recentE] = await Promise.all([
           supabase.from('lessons').select('id, title, created_at, unit_id').order('created_at', { ascending: false }).limit(3),
           supabase.from('exercises').select('id, title, created_at, unit_id').order('created_at', { ascending: false }).limit(3)
        ]);

        const combined = [
          ...(recentL.data || []).map(l => ({ ...l, type: 'lesson' })),
          ...(recentE.data || []).map(e => ({ ...e, type: 'exercise' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

        setRecentItems(combined);
        setStats({
          subjects: subRes.count || 0,
          units: unitRes.count || 0,
          lessons: lessRes.count || 0,
          exercises: exRes.count || 0
        });
      } catch (e) {
        console.error("Error fetching stats:", e);
      } finally {
        setDbLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (dbLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
             <div key={i} className="glass rounded-2xl p-4 md:p-5 flex flex-col justify-between h-[120px] relative overflow-hidden border border-slate-200/40">
               <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite]" style={{ animationDelay: `${i * 100}ms` }} />
               <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-xl bg-slate-200/60 animate-pulse" />
                 <div className="w-8 h-4 rounded-lg bg-slate-200/60 animate-pulse" />
               </div>
               <div>
                 <div className="h-3 bg-slate-200/60 w-1/2 rounded-md mb-2 animate-pulse" />
                 <div className="h-6 bg-slate-200/80 w-1/3 rounded-lg animate-pulse" />
               </div>
             </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="col-span-1 md:col-span-2 glass rounded-[2rem] p-6 h-[300px] relative overflow-hidden border border-slate-200/40">
             <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] delay-300" />
             <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-slate-200/60 w-1/3 rounded-lg animate-pulse" />
                <div className="h-4 bg-slate-200/60 w-16 rounded-md animate-pulse" />
             </div>
             <div className="space-y-4 mt-8">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-slate-200/60 animate-pulse" />
                     <div className="h-4 bg-slate-200/60 w-1/4 rounded-md animate-pulse" />
                     <div className="h-4 bg-slate-200/60 w-1/4 rounded-md animate-pulse mx-auto" />
                     <div className="h-6 bg-slate-200/60 w-16 rounded-lg animate-pulse ml-auto" />
                  </div>
                ))}
             </div>
           </div>
           
           <div className="col-span-1 glass rounded-[2rem] p-6 h-[300px] relative overflow-hidden border border-slate-200/40">
             <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] delay-500" />
             <div className="h-6 bg-slate-200/60 w-1/2 rounded-lg mb-6 animate-pulse" />
             <div className="space-y-3">
                {[1, 2, 3].map(k => (
                  <div key={k} className="w-full h-[56px] rounded-2xl bg-slate-200/50 animate-pulse" />
                ))}
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="إجمالي المواد" value={stats.subjects.toString() || "0"} icon={<BookOpen size={20} className="text-blue-500"/>} />
        <StatCard title="إجمالي الوحدات" value={stats.units.toString() || "0"} icon={<Target size={20} className="text-indigo-500"/>} />
        <StatCard title="الدروس المضافة" value={stats.lessons.toString() || "0"} icon={<PlayCircle size={20} className="text-emerald-500"/>} />
        <StatCard title="التمارين المتوفرة" value={stats.exercises.toString() || "0"} icon={<PenTool size={20} className="text-orange-500"/>} />
      </div>

      {/* Main Admin Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 glass rounded-[2rem] p-6">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">نشاط المحتوى الأخير</h3>
            <button className="text-sm text-blue-600 font-bold hover:underline">تحديث</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200/50">
                  <th className="pb-3 font-medium">العنوان</th>
                  <th className="pb-3 font-medium">النوع</th>
                  <th className="pb-3 font-medium">الوقت</th>
                  <th className="pb-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {recentItems.length > 0 ? (
                  recentItems.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-slate-100/50 last:border-0">
                      <td className="py-4 flex items-center gap-3">
                        {item.type === 'lesson' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><PlayCircle size={14}/></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center"><PenTool size={14}/></div>
                        )}
                        <span className="font-bold max-w-xs truncate">{item.title}</span>
                      </td>
                      <td className="py-4">{item.type === 'lesson' ? 'درس جديد' : 'تمرين جديد'}</td>
                      <td className="py-4 text-xs">{new Date(item.created_at).toLocaleDateString('ar-DZ')}</td>
                      <td className="py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">منشور</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-bold">لا توجد تحديثات أخيرة.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 glass rounded-[2rem] p-6 hidden lg:block">
          <h3 className="font-bold text-lg text-slate-800 mb-6">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button onClick={() => setView('manage_subjects')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-indigo-50 border-transparent hover:border-indigo-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">إدارة المواد</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </button>
            <button onClick={() => setView('manage_units')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-purple-50 border-transparent hover:border-purple-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Target size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-purple-600 transition-colors">إدارة الوحدات</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
            </button>
            <button onClick={() => setView('add_lesson')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-blue-50 border-transparent hover:border-blue-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><PlayCircle size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">إدارة الدروس</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>
            <button onClick={() => setView('add_exercise')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-emerald-50 border-transparent hover:border-emerald-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><PenTool size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-600 transition-colors">إدارة التمارين</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



function AdminManageContent({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'subjects' | 'units' | 'lessons' | 'exercises'>('subjects');

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
           <BookOpen size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إدارة المحتوى</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">عرض وحذف المحتوى الحالي</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto whitespace-nowrap">
        {[
          { id: 'subjects', label: 'المواد' },
          { id: 'units', label: 'الوحدات' },
          { id: 'lessons', label: 'الدروس' },
          { id: 'exercises', label: 'التمارين' }
        ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      {activeTab === 'subjects' && <AdminEntityList type="subjects" title="المواد الدراسية" />}
      {activeTab === 'units' && <AdminEntityList type="units" title="الوحدات" />}
      {activeTab === 'lessons' && <AdminEntityList type="lessons" title="الدروس" />}
      {activeTab === 'exercises' && <AdminEntityList type="exercises" title="التمارين" />}

    </div>
  );
}

export function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 relative flex md:flex-row flex-col">
      <AlertModal />
      {/* Mobile Header (Sidebar Toggle + Title) */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-100 z-40 sticky top-0">
        <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
           <Menu size={20} />
        </button>
        <h1 className="font-bold text-lg text-slate-800">الإدارة المركزية</h1>
        <button onClick={() => navigate('/admin/login')} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-xl">
           <LogOut size={16} />
        </button>
      </div>

      {/* Sidebar Menu */}
      <div className={`fixed inset-y-0 right-0 w-64 glass border-l border-slate-200/50 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} shadow-lg md:shadow-none`}>
        <div className="h-full flex flex-col pt-6 pb-6 px-4 bg-white/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2 className="font-black text-xl text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-md">
                 A
              </span>
              أدوات الإدارة
            </h2>
            <button onClick={closeSidebar} className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-white/50 rounded-lg">
               <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setView('dashboard'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <BookOpen size={18} /> لوحة الإحصائيات
            </button>
            <button 
              onClick={() => { setView('manage_content'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_content' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <BookOpen size={18} /> عرض ومسح المحتوى
            </button>
            <button 
              onClick={() => { setView('manage_subjects'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_subjects' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <BookOpen size={18} /> إدارة المواد
            </button>
            <button 
              onClick={() => { setView('manage_units'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_units' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <Target size={18} /> إدارة الوحدات
            </button>
            <button 
              onClick={() => { setView('add_lesson'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'add_lesson' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <PlayCircle size={18} /> إدارة الدروس
            </button>
            <button 
              onClick={() => { setView('add_exercise'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'add_exercise' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <PenTool size={18} /> إدارة التمارين
            </button>
          </nav>
          
          <div className="pt-4 border-t border-slate-200/50 space-y-2 mt-auto">
             <button 
              onClick={() => { setView('settings'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'settings' ? 'bg-slate-200 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/60'}`}
            >
               <Cpu size={18} /> إعدادات الذكاء الاصطناعي
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-500 hover:bg-white/60"
            >
               <ChevronRight size={18} /> عرض الواجهة
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div onClick={closeSidebar} className="backdrop-blur-sm bg-black/20 fixed inset-0 z-40 md:hidden animate-in fade-in transition-opacity" />
      )}

      {/* Main Content */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 z-10">
        
        <header className="hidden md:flex justify-between items-center mb-8 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">A</div>
            <div>
              <h1 className="font-bold text-lg md:text-xl text-slate-800">لوحة التحكم الإدارية</h1>
              <p className="text-xs text-slate-500 font-medium">إدارة المحتوى بكل سهولة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('settings')} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all">
              <Settings size={20} />
            </button>
            <button onClick={() => navigate('/admin/login')} className="w-auto px-4 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all gap-2 font-bold text-xs">
              <LogOut size={16} />
              <span className="hidden lg:inline">تسجيل الخروج</span>
            </button>
          </div>
        </header>

        {loading ? (
             <div className="animate-in fade-in duration-500 grid gap-6">
                <div className="h-64 rounded-[2rem] bg-slate-200 animate-pulse w-full"></div>
             </div>
        ) : (
          <div className="animate-in fade-in duration-300 slide-in-from-bottom-4">
             {view === 'dashboard' && <AdminDashboard setView={setView} />}
             {view === 'manage_content' && <AdminManageContent onBack={() => setView('dashboard')} />}
             {view === 'add_lesson' && <AdminAddLesson onBack={() => setView('dashboard')} />}
             {view === 'add_exercise' && <AdminAddExercise onBack={() => setView('dashboard')} />}
             {view === 'manage_subjects' && <AdminAddSubject onBack={() => setView('dashboard')} />}
             {view === 'manage_units' && <AdminAddUnit onBack={() => setView('dashboard')} />}
             {view === 'settings' && <AdminSettings onBack={() => setView('dashboard')} />}
          </div>
        )}

      </div>
    </div>
  );
}

export function AdminLogin() {
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
