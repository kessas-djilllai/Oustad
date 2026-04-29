import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BookOpen, 
  Target, 
  PlayCircle, 
  PenTool, 
  Plus, 
  Save, 
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

function AdminAddLesson({ onBack }: { onBack: () => void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [title, setTitle] = useState('');
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
    if (!supabase || !selectedUnitId || !title) {
       alert('الرجاء التأكد من تعبئة جميع الحقول وإعداد قاعدة البيانات (Supabase).');
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
        alert('تمت إضافة الدرس بنجاح!');
        onBack();
      } else {
        alert('حدث خطأ أثناء الإضافة: ' + error.message);
      }
    } catch (err: any) {
      alert('حدث خطأ غير متوقع: ' + err.message);
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

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الدرس</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: الاستمرارية والاشتقاقية"
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            required
          />
        </div>

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
    const apiKey = localStorage.getItem('admin_api_key');
    const aiModel = localStorage.getItem('admin_ai_model') || 'gemini-3-flash-preview';
    if (!apiKey) {
      alert("الرجاء إعداد مفتاح Gemini API من صفحة الإعدادات أولاً.");
      return;
    }
    if (!selectedSubjectId || !selectedUnitId || !title) {
       alert("الرجاء اختيار المادة والوحدة وكتابة عنوان التمرين أولاً.");
       return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || '';
      const unitName = units.find(u => u.id === selectedUnitId)?.name || '';
      
      const prompt = `أنت معلم خبير في التعليم الثانوي. قم بإنشاء تمرين تفاعلي يتكون من 5 أسئلة اختيار من متعدد (QCM) حول مادة "${subjectName}" وتحديداً وحدة "${unitName}". 
واستهدف هذا العنوان: "${title}".
يجب أن يحتوي كل سؤال على 3 أو 4 خيارات، مع تحديد الخيار الصحيح.
قم بإرجاع النتيجة بصيغة JSON معتمدة حسب المخطط التالي.`;

      const response = await ai.models.generateContent({
        model: aiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                text: { type: Type.STRING, description: "نص السؤال" },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "مثل a, b, c, d" },
                      text: { type: Type.STRING, description: "نص الخيار" },
                      label: { type: Type.STRING, description: "أ, ب, ج, د" },
                      isCorrect: { type: Type.BOOLEAN, description: "هل هذا الخيار هو الصحيح" }
                    },
                    required: ["id", "text", "label", "isCorrect"]
                  }
                }
              },
              required: ["id", "text", "options"]
            }
          }
        }
      });
      
      const jsonStr = response.text.trim();
      const parsedQuestions = JSON.parse(jsonStr);
      setGeneratedQuestions(parsedQuestions);
      alert("تم توليد الأسئلة بنجاح!");
    } catch (err: any) {
      alert("حدث خطأ أثناء التوليد: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedUnitId || !title) {
       alert('الرجاء التأكد من تعبئة جميع الحقول وإعداد قاعدة البيانات (Supabase).');
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
        alert('تمت إضافة التمرين بنجاح!');
        onBack();
      } else {
        alert('حدث خطأ أثناء الإضافة: ' + error.message);
      }
    } catch (err: any) {
      alert('حدث خطأ غير متوقع: ' + err.message);
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

        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={generateWithAI}
            disabled={isGenerating || !selectedSubjectId || !selectedUnitId || !title}
            className="w-full bg-blue-50 text-blue-600 font-bold rounded-xl py-3.5 mt-6 hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-200 disabled:opacity-50"
          >
            {isGenerating ? (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full" />
            ) : (
               <>توليد الأسئلة بالذكاء الاصطناعي <Wand2 size={18} /></>
            )}
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-emerald-600 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/30 disabled:opacity-70"
          >
            {isSubmitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>حفظ التمرين <Save size={18} /></>
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
        alert('تمت إضافة المادة بنجاح!');
        onBack();
      } else {
        alert('حدث خطأ: ' + error.message);
      }
    } catch (err: any) {
      alert('خطأ: ' + err.message);
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
    if (!supabase || !name || !selectedSubjectId) return;
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
        alert('تمت إضافة الوحدة بنجاح!');
        onBack();
      } else {
        alert('حدث خطأ: ' + error.message);
      }
    } catch (err: any) {
      alert('خطأ: ' + err.message);
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

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اسم الوحدة</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: الميكانيك الكلاسيكية"
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
          />
        </div>

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
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isSaving, setIsSaving] = useState(false);
  
  // Available models based on Gemini AI spec
  const AVAILABLE_MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (سريع، مجاني)', recommended: true },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (احترافي، دقيق)' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini Flash Lite (خفيف جداً)' }
  ];

  useEffect(() => {
    // Load from DB or local storage
    async function loadSettings() {
      const savedKey = localStorage.getItem('admin_api_key') || '';
      const savedModel = localStorage.getItem('admin_ai_model') || 'gemini-3-flash-preview';
      setApiKey(savedKey);
      setSelectedModel(savedModel);

      // Optionally try DB
      if (supabase) {
        try {
          const { data } = await supabase.from('admin_settings').select('*').limit(1).single();
          if (data && data.api_key) {
            setApiKey(data.api_key);
            setSelectedModel(data.ai_model || 'gemini-3-flash-preview');
          }
        } catch (e) {
          // ignore DB error
        }
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('admin_api_key', apiKey);
      localStorage.setItem('admin_ai_model', selectedModel);
      
      if (supabase) {
        await supabase.from('admin_settings').upsert({ id: 1, api_key: apiKey, ai_model: selectedModel });
      }
      alert("تم حفظ الإعدادات بنجاح!");
      onBack();
    } catch (err: any) {
      alert("حدث خطأ أثناء الحفظ في قاعدة البيانات: " + err.message + "\nتم الحفظ محلياً.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-sm">
           <Cpu size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إعدادات الذكاء الاصطناعي</h2>
          <p className="text-xs text-slate-500 font-medium">قم بربط مفتاح Gemini API وتحديد النموذج المستخدم.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">مفتاح API الخاص بـ Gemini</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/50 font-mono text-left transition-all"
            dir="ltr"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">نموذج التوليد المستخدم (Model)</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all"
            required
          >
            {AVAILABLE_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.recommended && '(يوصى به)'}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-slate-800 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
        >
          {isSaving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>حفظ الإعدادات <Save size={18} /></>
          )}
        </button>
      </form>
    </div>
  )
}

function AdminDashboard({ setView }: { setView: (v: string) => void }) {
  const [stats, setStats] = useState({ subjects: 0, units: 0, lessons: 0, exercises: 0 });
  const [dbLoading, setDbLoading] = useState(false);

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

  if (view === 'add_lesson') return <AdminAddLesson onBack={() => setView('dashboard')} />;
  if (view === 'add_exercise') return <AdminAddExercise onBack={() => setView('dashboard')} />;
  if (view === 'manage_subjects') return <AdminAddSubject onBack={() => setView('dashboard')} />;
  if (view === 'manage_units') return <AdminAddUnit onBack={() => setView('dashboard')} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المواد" value={stats.subjects.toString() || "3"} trend="+1" icon={<BookOpen size={20} className="text-blue-500"/>} />
        <StatCard title="إجمالي الوحدات" value={stats.units.toString() || "12"} trend="+2" icon={<Target size={20} className="text-indigo-500"/>} />
        <StatCard title="الدروس المضافة" value={stats.lessons.toString() || "48"} trend="+5" icon={<PlayCircle size={20} className="text-emerald-500"/>} />
        <StatCard title="التمارين المتوفرة" value={stats.exercises.toString() || "124"} trend="+12" icon={<PenTool size={20} className="text-orange-500"/>} />
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
                <tr className="border-b border-slate-100/50 last:border-0">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><PlayCircle size={14}/></div>
                    <span className="font-bold">استمرارية دالة</span>
                  </td>
                  <td className="py-4">درس جديد</td>
                  <td className="py-4">منذ ساعتين</td>
                  <td className="py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">منشور</span></td>
                </tr>
                 <tr className="border-b border-slate-100/50 last:border-0">
                  <td className="py-4 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center"><PenTool size={14}/></div>
                    <span className="font-bold">تمرين شامل: أسية</span>
                  </td>
                  <td className="py-4">تمرين جديد</td>
                  <td className="py-4">منذ 5 ساعات</td>
                  <td className="py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">منشور</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 glass rounded-[2rem] p-6 hidden lg:block">
          <h3 className="font-bold text-lg text-slate-800 mb-6">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button onClick={() => setView('add_lesson')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-blue-50 border-transparent hover:border-blue-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">إضافة درس جديد</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>
            <button onClick={() => setView('add_exercise')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-emerald-50 border-transparent hover:border-emerald-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><PenTool size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-600 transition-colors">إضافة تمرين جديد</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </button>
             <button onClick={() => setView('manage_subjects')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-indigo-50 border-transparent hover:border-indigo-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">إضافة مادة جديدة</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </button>
            <button onClick={() => setView('manage_units')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-purple-50 border-transparent hover:border-purple-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Target size={16}/></div>
                 <span className="font-bold text-sm text-slate-700 group-hover:text-purple-600 transition-colors">إضافة وحدة جديدة</span>
              </div>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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
      <div className={`fixed inset-y-0 right-0 w-64 bg-white border-l border-slate-200 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col pt-6 pb-6 px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-bold text-xl text-slate-800">أدوات الإدارة</h2>
            <button onClick={closeSidebar} className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg">
               <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setView('dashboard'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
               <BookOpen size={18} /> لوحة الإحصائيات
            </button>
            <button 
              onClick={() => { setView('manage_subjects'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_subjects' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
               <BookOpen size={18} /> إضافة مادة
            </button>
            <button 
              onClick={() => { setView('manage_units'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_units' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
               <Target size={18} /> إضافة وحدة
            </button>
            <button 
              onClick={() => { setView('add_lesson'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'add_lesson' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
               <PlayCircle size={18} /> إضافة درس
            </button>
            <button 
              onClick={() => { setView('add_exercise'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'add_exercise' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
               <PenTool size={18} /> إضافة تمرين متقدم ذكاء اصطناعي
            </button>
          </nav>
          
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-auto">
             <button 
              onClick={() => { setView('settings'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'settings' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
               <Cpu size={18} /> إعدادات الذكاء الاصطناعي
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-slate-500 hover:bg-slate-50"
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
