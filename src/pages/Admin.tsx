import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { GoogleGenAI, Type } from "@google/genai";
import { getSubjectPrompt } from '../lib/prompts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
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
  Cpu,
  Calendar,
  FileText,
  Upload,
  Users,
  AlertCircle,
  Trash2,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminUsers from "./users";
import { PdfBacAnalis } from "./PdfBacAnalis";

export type AlertEventPayload = { message: string, type?: 'success' | 'error' | 'info' };

export const triggerAlert = (message: string, type: 'success' | 'error' | 'info' = 'info', refresh: boolean = false) => {
  let displayMessage = message;
  if (typeof displayMessage === 'string' && displayMessage.includes('Failed to fetch')) {
    displayMessage = displayMessage.replace('Failed to fetch', 'انقطع الاتصال بالخادم (Failed to fetch). تأكد من: 1) اتصالك بالإنترنت، 2) إيقاف مانع الإعلانات (Adblocker)، 3) أن مشروع Supabase الخاص بك غير متوقف (Paused).');
  }
  window.dispatchEvent(new CustomEvent<AlertEventPayload>('show-admin-alert', { detail: { message: displayMessage, type } }));
  if (type === 'success' && refresh) {
    window.dispatchEvent(new CustomEvent('refresh-admin-view'));
  }
};

export function AlertModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState<AlertEventPayload>({ message: '', type: 'info' });

  useEffect(() => {
    if (isOpen && alertData.type !== 'success') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, alertData.type]);

  useEffect(() => {
    let timeoutId: any;
    const handler = (e: any) => {
      setAlertData(e.detail);
      setIsOpen(true);
      if (e.detail.type === 'success') {
        timeoutId = setTimeout(() => setIsOpen(false), 3000);
      }
    };
    window.addEventListener('show-admin-alert', handler as EventListener);
    return () => {
      window.removeEventListener('show-admin-alert', handler as EventListener);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isOpen) return null;

  if (alertData.type === 'success') {
    return createPortal(
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 w-full max-w-sm pointer-events-none" style={{ position: 'fixed' }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="font-bold text-sm text-right leading-loose whitespace-pre-wrap">{alertData.message}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-emerald-500 hover:text-emerald-700 shrink-0">
            <X size={20} />
          </button>
        </motion.div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
      <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <motion.div initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} className="relative bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
         <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${alertData.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {alertData.type === 'error' ? <X size={32} /> : <Menu size={32} />}
         </div>
         <h3 className="text-xl font-bold text-slate-800 mb-2">{alertData.type === 'error' ? 'خطأ' : 'تنبيه'}</h3>
         <div className="text-slate-600 font-medium mb-6 text-sm break-words whitespace-pre-wrap w-full border-t border-slate-100 pt-4 overflow-y-auto max-h-60" style={{userSelect: 'text'}}>
           {alertData.message}
         </div>
         <button onClick={() => setIsOpen(false)} className="w-full bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-slate-800 transition-all text-sm">حسناً</button>
      </motion.div>
    </div>,
    document.body
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
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (confirmDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [confirmDelete]);

  const [unitsMap, setUnitsMap] = useState<Record<string, {name: string, subject_id: string}>>({});

  const fetchItems = async (silent = false) => {
    if (!supabase) return;
    if (!silent) setLoading(true);
    try {
      if (type !== 'subjects') {
        const { data: subData } = await supabase.from('subjects').select('id, name');
        if (subData) {
          const map: Record<string, string> = {};
          subData.forEach((s: any) => map[s.id] = s.name);
          setSubjectsMap(map);
        }
      }

      if (type === 'lessons' || type === 'exercises') {
        const { data: unitData } = await supabase.from('units').select('id, name, subject_id');
        if (unitData) {
          const map: Record<string, {name: string, subject_id: string}> = {};
          unitData.forEach((u: any) => map[u.id] = { name: u.name, subject_id: u.subject_id });
          setUnitsMap(map);
        }
      }

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
      
      // Optimistic update to keep scroll position stable
      setItems(prev => prev.filter(item => item.id !== id));
      
      triggerAlert("تم الحذف بنجاح", "success");
      // Refresh in background if needed
      fetchItems(true);
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
      {confirmDelete && createPortal(
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" style={{ position: 'fixed' }}>
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
         </div>,
         document.body
      )}
      <h3 className="font-bold text-lg text-slate-800 mb-4">{title}</h3>
      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-slate-500 py-8 font-bold text-sm">لا توجد عناصر حالياً</p>
          ) : (
            (() => {
              const groupedItems = items.reduce((acc: any, item: any) => {
                let groupName = "غير مصنف";
                if (type === 'subjects') {
                  const match = item.name.match(/\((.*?)\)$/);
                  groupName = match ? match[1] : 'غير مصنف';
                } else if (type === 'units') {
                  groupName = subjectsMap[item.subject_id] || 'مادة غير معروفة';
                } else if (type === 'lessons' || type === 'exercises') {
                  const unitData = unitsMap[item.unit_id];
                  if (unitData) {
                    groupName = subjectsMap[unitData.subject_id] || 'مادة غير معروفة';
                  } else {
                    groupName = 'مادة غير معروفة';
                  }
                }
                
                if (!acc[groupName]) acc[groupName] = [];
                acc[groupName].push(item);
                return acc;
              }, {});

              return Object.entries(groupedItems).map(([groupName, groupItems]: any) => (
                <motion.div 
                  key={groupName} 
                  layout 
                  className="mb-4 md:mb-6 last:mb-0 bg-white p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm"
                >
                  <h5 className="font-bold text-slate-700 mb-3 text-xs md:text-sm px-2 md:px-3 flex items-center border-r-2 md:border-r-4 border-indigo-500">{groupName}</h5>
                  <div className="space-y-2 relative min-h-[40px]">
                    <AnimatePresence initial={false}>
                    {groupItems.map((item: any) => {
                       let displayTitle = item.title || item.name;
                       let subtitle = "";
                       if (type === 'lessons' || type === 'exercises') {
                           const uData = unitsMap[item.unit_id];
                           subtitle = uData ? `الوحدة: ${uData.name}` : "";
                       }
                       if (type === 'subjects') {
                           const match = item.name.match(/^(.*?)\s*\(.*?\)$/);
                           displayTitle = match ? match[1].trim() : item.name;
                       }
                       
                       return (
                      <motion.div 
                        key={item.id} 
                        layout
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-between items-start md:items-center p-2.5 md:p-4 bg-slate-50 rounded-lg md:rounded-xl border border-slate-100 transition-colors hover:bg-white hover:border-slate-200 hover:shadow-sm gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm md:text-base break-words">{displayTitle}</h4>
                          {subtitle && <p className="text-xs text-indigo-600 mt-1">{subtitle}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString('ar-DZ') : ''}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setConfirmDelete({id: item.id, name: item.title || item.name || 'العنصر'})} 
                          disabled={deletingId === item.id}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {deletingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <Trash size={16} />
                          )}
                        </button>
                      </motion.div>
                    )})}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ));
            })()
          )}
        </div>
      )}
    </div>
  );
}

function AdminAddLesson({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
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
    if (!supabase || (!selectedUnitId && !isBulkMode)) {
      triggerAlert('الرجاء التأكد من اختيار الوحدة وإعداد قاعدة البيانات (Supabase).', 'error');
      return;
    }

    if (isBulkMode) {
      if (!jsonInput) {
        triggerAlert('الرجاء إدخال نص JSON صالحة.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        let parsed: any;
        try {
          parsed = JSON.parse(jsonInput);
        } catch (e) {
          triggerAlert('صيغة JSON غير صحيحة.', 'error');
          setIsSubmitting(false);
          return;
        }

        let inserts: any[] = [];

        const parseItems = (itemsObj: any, unitId: string) => {
           let items: any[] = [];
           if (Array.isArray(itemsObj)) {
               items = itemsObj;
           } else if (typeof itemsObj === 'object' && itemsObj !== null) {
               items = Object.entries(itemsObj).map(([key, val]) => ({
                   number: parseInt(key) || 99,
                   title: val
               }));
           }
           return items.map((item, index) => {
              const titleStr = typeof item === 'string' ? item : item.title || item.name;
              const orderNum = typeof item === 'object' && item.number ? parseInt(item.number) : 99;
              if (!titleStr) throw new Error('لا يمكن العثور على عنوان في أحد العناصر.');
              return {
                 id: 'l_' + Math.random().toString(36).substr(2, 9) + index,
                 unit_id: unitId,
                 title: titleStr,
                 lesson_order: orderNum
              };
           });
        };

        if (Array.isArray(parsed) && parsed.length > 0 && ('unit' in parsed[0] || 'lessons' in parsed[0] || 'items' in parsed[0])) {
           for (const unitObj of parsed) {
              const unitName = String(unitObj.unit || unitObj.name || '').trim();
              const foundUnit = units.find(u => String(u.name || '').trim().replace(/\s+/g, ' ') === unitName.replace(/\s+/g, ' '));
              if (!foundUnit) {
                  throw new Error(`لم يتم العثور على الوحدة: ${unitName} في المادة المحددة.`);
              }
              const unitItemsObj = unitObj.lessons || unitObj.items || unitObj.exercises || [];
              inserts.push(...parseItems(unitItemsObj, foundUnit.id));
           }
        } else if (selectedUnitId) {
           inserts.push(...parseItems(parsed, selectedUnitId));
        } else {
           throw new Error("يجب اختيار الوحدة من القائمة أو تضمين اسم الوحدة (unit) داخل ملف JSON.");
        }

        const { error } = await supabase.from('lessons').insert(inserts);
        if (!error) {
          triggerAlert(`تم إضافة ${inserts.length} درس بنجاح!`, 'success');
          setJsonInput('');
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
          setTitle('');
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
    <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 max-w-3xl mx-auto shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm shrink-0">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
           <PlayCircle size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إدارة الدروس</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة وعرض وتعديل الدروس.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6 mt-4">
        <button onClick={() => setActiveTab('add')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>إضافة درس</button>
        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>عرض الدروس</button>
      </div>

      {activeTab === 'add' ? (
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
           <label className="block text-sm font-bold text-slate-700 mb-2">اختر الوحدة {isBulkMode && '(اختياري)'}</label>
            <select 
              value={selectedUnitId} 
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
              required={!isBulkMode}
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
      ) : (
        <AdminEntityList type="lessons" title="قائمة الدروس" />
      )}
    </div>
  )
}

function AdminAddExercise({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [addMode, setAddMode] = useState<'single' | 'bulk' | 'ai'>('single');
  const [jsonInput, setJsonInput] = useState('');
  const [aiGeneratedExercises, setAiGeneratedExercises] = useState<any[]>([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

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
    let aiModel = 'gemini-3-flash-preview';
    if (supabase) {
      const { data } = await supabase.from('admin_settings').select('api_key, ai_model').limit(1).single();
      if (data && data.api_key) {
        apiKey = data.api_key;
        aiModel = (data.ai_model && data.ai_model !== 'gemini-2.5-flash') ? data.ai_model : 'gemini-3-flash-preview';
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
      triggerAlert("تم توليد الموضوع بنجاح!", 'success', false);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || String(err);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً (503/504). المحاولة لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم أثناء التحليل.";
      else if (errMsg.includes('token limit')) errMsg = "تجاوز التوليد الحد الأقصى للنصوص المسموح بها.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية لمفتاح Gemini API هذا (Quota Exceeded). يرجى التحقق من خطة الدفع الخاصة بك أو إضافة مفتاح API جديد.";
      triggerAlert("حدث خطأ أثناء التوليد: " + errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExercisesTitlesWithAI = async () => {
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
      triggerAlert("الرجاء إعداد مفتاح Gemini API من صفحة الإعدادات أولاً.", 'error');
      return;
    }
    if (!selectedSubjectId) {
       triggerAlert("الرجاء اختيار المادة أولاً.", 'error');
       return;
    }
    if (units.length === 0) {
       triggerAlert("لا توجد وحدات لهذه المادة.", 'error');
       return;
    }

    setIsGeneratingBulk(true);
    setAiGeneratedExercises([]);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || '';
      
      const unitsListStr = units.map(u => u.name).join('، ');

      const prompt = `أنت مفتش وخبير تربوي في إعداد المحتوى التعليمي. بناءً على المادة التالية: ${subjectName}. وهذه هي قائمة الوحدات التابعة لها: ${unitsListStr}. رجاءً قم باقتراح تمارين أو مواضيع لكل وحدة، وفقاً للتدرج السنوي لوزارة التربية الوطنية في الجزائر. يجب أن يتناسب عدد التمارين المقترحة مع حجم وأهمية الوحدة (الوحدات الطويلة والمعقدة تتطلب تمارين أكثر). لا تتقيد بعدد محدد، وارجع الناتج بهيكلة JSON تتضمن اسم الوحدة (unitName) ومصفوفة بأسماء التمارين (exercises).`;

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
                unitName: { type: Type.STRING, description: "اسم الوحدة تماما كما تم توفيره." },
                exercises: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "قائمة بأسماء التمارين المناسبة لهذه الوحدة"
                }
              },
              required: ["unitName", "exercises"]
            }
          }
        }
      });
      
      const jsonStr = response.text.trim();
      const parsedData = JSON.parse(jsonStr);
      
      let inserts: any[] = [];
      for (const unitObj of parsedData) {
          const unitName = String(unitObj.unitName || '').trim();
          const foundUnit = units.find(u => String(u.name || '').trim().replace(/\s+/g, ' ') === unitName.replace(/\s+/g, ' '));
          
          if (foundUnit && Array.isArray(unitObj.exercises)) {
              for (let i = 0; i < unitObj.exercises.length; i++) {
                 inserts.push({
                     unit_id: foundUnit.id,
                     title: unitObj.exercises[i],
                     exercise_order: i + 1,
                     content: null
                 });
              }
          }
      }
      
      if (inserts.length > 0) {
         setAiGeneratedExercises(inserts);
         triggerAlert(`تم توليد ${inserts.length} تمارين لـ ${parsedData.length} وحدات. يمكنك الآن حفظها.`, 'success', false);
      } else {
         triggerAlert("فشل الذكاء الاصطناعي في مطابقة الوحدات. حاول مرة أخرى.", 'error');
      }

    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || String(err);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً (503/504). المحاولة لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم أثناء التحليل.";
      else if (errMsg.includes('token limit')) errMsg = "تجاوز التوليد الحد الأقصى للنصوص المسموح بها.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية لمفتاح Gemini API هذا. يرجى إضافة مفتاح API جديد أو المحاولة بنموذج أخر من الإعدادات.";
      triggerAlert("حدث خطأ أثناء التوليد: " + errMsg, 'error');
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || (!selectedUnitId && addMode !== 'bulk' && addMode !== 'ai')) {
       triggerAlert('الرجاء التأكد من اختيار الوحدة وإعداد قاعدة البيانات (Supabase).', 'error');
       return;
    }
    
    if (addMode === 'bulk') {
      if (!jsonInput) {
        triggerAlert('الرجاء إدخال نص JSON صالحة.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        let parsed: any;
        try {
          parsed = JSON.parse(jsonInput);
        } catch (e) {
          triggerAlert('صيغة JSON غير صحيحة.', 'error');
          setIsSubmitting(false);
          return;
        }

        let inserts: any[] = [];

        const parseItems = (itemsObj: any, unitId: string) => {
           let items: any[] = [];
           if (Array.isArray(itemsObj)) {
               items = itemsObj;
           } else if (typeof itemsObj === 'object' && itemsObj !== null) {
               items = Object.entries(itemsObj).map(([key, val]) => ({
                   number: parseInt(key) || 99,
                   title: val
               }));
           }
           return items.map((item, index) => {
              const titleStr = typeof item === 'string' ? item : item.title || item.name;
              const orderNum = typeof item === 'object' && item.number ? parseInt(item.number) : 99;
              if (!titleStr) throw new Error('لا يمكن العثور على عنوان في أحد العناصر.');
              return {
                 id: 'e_' + Math.random().toString(36).substr(2, 9) + index,
                 unit_id: unitId,
                 title: titleStr,
                 exercise_order: orderNum,
                 content: null
              };
           });
        };

        if (Array.isArray(parsed) && parsed.length > 0 && ('unit' in parsed[0] || 'exercises' in parsed[0] || 'items' in parsed[0])) {
           for (const unitObj of parsed) {
              const unitName = String(unitObj.unit || unitObj.name || '').trim();
              const foundUnit = units.find(u => String(u.name || '').trim().replace(/\s+/g, ' ') === unitName.replace(/\s+/g, ' '));
              if (!foundUnit) {
                  throw new Error(`لم يتم العثور على الوحدة: ${unitName} في المادة المحددة.`);
              }
              const unitItemsObj = unitObj.exercises || unitObj.items || [];
              inserts.push(...parseItems(unitItemsObj, foundUnit.id));
           }
        } else if (selectedUnitId) {
           inserts.push(...parseItems(parsed, selectedUnitId));
        } else {
           throw new Error("يجب اختيار الوحدة من القائمة أو تضمين اسم الوحدة (unit) داخل ملف JSON.");
        }

        const { error } = await supabase.from('exercises').insert(inserts);
        if (!error) {
          triggerAlert(`تم إضافة ${inserts.length} تمرين بنجاح!`, 'success');
          setJsonInput('');
        } else {
          triggerAlert('حدث خطأ أثناء الإضافة: ' + error.message, 'error');
        }
      } catch (err: any) {
        triggerAlert('حدث خطأ: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    if (addMode === 'ai') {
      if (!aiGeneratedExercises || aiGeneratedExercises.length === 0) {
        triggerAlert('الرجاء توليد التمارين أولاً.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('exercises').insert(aiGeneratedExercises.map((ex, index) => ({
             ...ex,
             id: 'e_' + Math.random().toString(36).substr(2, 9) + index
        })));
        if (!error) {
          triggerAlert(`تم إضافة ${aiGeneratedExercises.length} تمرين من الذكاء الاصطناعي بنجاح!`, 'success');
          setAiGeneratedExercises([]);
        } else {
          triggerAlert('حدث خطأ أثناء الإضافة: ' + error.message, 'error');
        }
      } catch (err: any) {
        triggerAlert('حدث خطأ: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!title) {
       triggerAlert('الرجاء تعبئة عنوان التمرين.', 'error');
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
        setTitle('');
        setGeneratedQuestions([]);
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
    <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 max-w-3xl mx-auto shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm shrink-0">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
           <PenTool size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إدارة التمارين</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة وعرض وتعديل التمارين التفاعلية.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6 mt-4">
        <button onClick={() => setActiveTab('add')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>إضافة تمرين</button>
        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>عرض التمارين</button>
      </div>

      {activeTab === 'add' ? (
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

        {addMode !== 'ai' && (
        <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">اختر الوحدة {addMode === 'bulk' && '(اختياري)'}</label>
            <select 
              value={selectedUnitId} 
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
              required={addMode === 'single'}
              disabled={!selectedSubjectId}
            >
              <option value="">-- يرجى الاختيار --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </div>
        )}

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setAddMode('single')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${addMode === 'single' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إضافة فردية
          </button>
          <button
            type="button"
            onClick={() => setAddMode('bulk')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${addMode === 'bulk' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إضافة متعددة (JSON)
          </button>
          <button
            type="button"
            onClick={() => setAddMode('ai')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${addMode === 'ai' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            توليد بالذكاء الاصطناعي
          </button>
        </div>

        {addMode === 'single' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان التمرين</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تمرين حول المكتسبات القبلية"
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              required={addMode === 'single'}
            />
          </div>
        )}

        {addMode === 'bulk' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">النص (JSON)</label>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='مثال:&#10;{"1": "الاهتلاكات", "2": "الالتزامات"}&#10;أو&#10;[{"title": "الاهتلاكات", "number": 1}]'
              className="w-full h-32 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
              dir="ltr"
              required={addMode === 'bulk'}
            />
          </div>
        )}

        {addMode === 'ai' && (
          <div>
             <button 
                type="button"
                onClick={generateExercisesTitlesWithAI}
                disabled={isGeneratingBulk || !selectedSubjectId}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl py-4 hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50"
             >
                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {isGeneratingBulk ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>توليد التمارين (الذكاء الاصطناعي) لجميع الوحدات <Sparkles size={18} /></>
                )}
             </button>
             {aiGeneratedExercises.length > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                   <p className="text-sm font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 size={18} /> جاهز للحفظ: تم توليد {aiGeneratedExercises.length} تمارين لجميع الوحدات المتاحة.</p>
                </div>
             )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mt-8">
          {addMode === 'single' && (
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
          )}
          
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
          <div className="mt-8 space-y-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> محتوى التمرين المُولّد جاهز للحفظ (يمكنك التعديل عليه)
            </h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نص التمرين والاستحقاقات (Markdown)</label>
              <textarea
                value={generatedQuestions[0].exam}
                onChange={(e) => {
                   const newQs = [...generatedQuestions];
                   newQs[0].exam = e.target.value;
                   setGeneratedQuestions(newQs);
                }}
                rows={10}
                className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                dir="rtl"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نص التصحيح النموذجي (Markdown)</label>
              <textarea
                value={generatedQuestions[0].solution}
                onChange={(e) => {
                   const newQs = [...generatedQuestions];
                   newQs[0].solution = e.target.value;
                   setGeneratedQuestions(newQs);
                }}
                rows={10}
                className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                dir="rtl"
              />
            </div>
          </div>
        )}
      </form>
      ) : (
        <AdminEntityList type="exercises" title="قائمة التمارين" />
      )}
    </div>
  )
}

function AdminAddSubject({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [specialization, setSpecialization] = useState('جميع الشعب');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specializations = [
    'جميع الشعب',
    'علوم تجريبية',
    'رياضيات',
    'تقني رياضي',
    'تسيير واقتصاد',
    'آداب وفلسفة',
    'لغات أجنبية'
  ];

  const colors = [
    { id: 'indigo', name: 'نيلي', bg: 'bg-indigo-500' },
    { id: 'blue', name: 'أزرق', bg: 'bg-blue-500' },
    { id: 'emerald', name: 'أخضر', bg: 'bg-emerald-500' },
    { id: 'orange', name: 'برتقالي', bg: 'bg-orange-500' },
    { id: 'purple', name: 'بنفسجي', bg: 'bg-purple-500' },
    { id: 'pink', name: 'وردي', bg: 'bg-pink-500' },
    { id: 'amber', name: 'أصفر', bg: 'bg-amber-500' },
    { id: 'slate', name: 'رمادي', bg: 'bg-slate-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !name) return;
    setIsSubmitting(true);
    try {
      // NOTE: Instead of relying on a DB migration that might fail and block the user, 
      // we append the specialization to the subject name if it's not "جميع الشعب".
      // This is robust and doesn't require modifying the `subjects` table.
      const finalName = specialization === 'جميع الشعب' ? name : `${name} (${specialization})`;
      
      const id = 's_' + Math.random().toString(36).substr(2, 9);
      const { error } = await supabase.from('subjects').insert([{
        id,
        name: finalName,
        color: `text-${selectedColor}-500`,
        bg: `bg-${selectedColor}-100`,
        bar_color: `bg-${selectedColor}-500`,
        icon_name: 'BookOpen',
        progress: 0
      }]);
      if (!error) {
        triggerAlert('تمت إضافة المادة بنجاح!', 'success');
        setName('');
        setSpecialization('جميع الشعب');
        setSelectedColor('indigo');
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
    <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 max-w-3xl mx-auto shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm shrink-0">
          <ChevronRight size={20} />
        </button>
        <div className={`w-12 h-12 rounded-2xl bg-${selectedColor}-100 text-${selectedColor}-600 flex items-center justify-center shadow-sm shrink-0`}>
           <BookOpen size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إدارة المواد</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة وعرض وتعديل المواد الدراسية.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6 mt-4">
        <button onClick={() => setActiveTab('add')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>إضافة مادة</button>
        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>عرض المواد</button>
      </div>

      {activeTab === 'add' ? (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">اسم المادة</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: الفلسفة"
            className={`w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-${selectedColor}-500/50 transition-all`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">الشعبة (التخصص)</label>
          <select 
            value={specialization} 
            onChange={(e) => setSpecialization(e.target.value)}
            className={`w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-${selectedColor}-500/50 transition-all`}
          >
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">لون المادة</label>
          <div className="flex flex-wrap gap-3">
            {colors.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.id)}
                className={`w-10 h-10 rounded-full ${c.bg} shadow-sm border-2 transition-all ${selectedColor === c.id ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full bg-slate-800 text-white font-bold rounded-xl py-3.5 mt-6 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70`}
        >
          {isSubmitting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>حفظ المادة <Save size={18} /></>
          )}
        </button>
      </form>
      ) : (
        <AdminEntityList type="subjects" title="قائمة المواد الدراسية" />
      )}
    </div>
  )
}

function AdminAddUnit({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [name, setName] = useState('');
  const [trimestre, setTrimestre] = useState('1');
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
    if (!supabase) return;

    if (isBulkMode) {
      if (!jsonInput) {
        triggerAlert('الرجاء إدخال نص JSON صالحة.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        let parsed: any;
        try {
          parsed = JSON.parse(jsonInput);
        } catch (e) {
          triggerAlert('صيغة JSON غير صحيحة.', 'error');
          setIsSubmitting(false);
          return;
        }

        let allUnitsToInsert: any[] = [];

        const processImportEntry = (entry: any) => {
          const { specialization, subject, trimestre: t, units } = entry;
          if (!specialization || !subject || !units) {
             throw new Error('الـ JSON يجب أن يحتوي على: specialization, subject, units');
          }

          const targetSpec = specialization.trim();
          const targetSub = subject.trim();
          const fullSubjectName = targetSpec === 'جميع الشعب' ? targetSub : `${targetSub} (${targetSpec})`;
          
          const foundSub = subjects.find(s => {
            const sn = s.name.trim().replace(/\s+/g, ' ');
            const fsn = fullSubjectName.replace(/\s+/g, ' ');
            if (sn === fsn) return true;
            
            if (targetSpec !== 'جميع الشعب') {
              const match = sn.match(/\((.*?)\)/);
              if (match) {
                 const dbSpec = match[1].trim();
                 const dbSub = sn.split('(')[0].trim();
                 if (dbSpec === targetSpec && dbSub.includes(targetSub)) return true;
              }
            }
            return false;
          });

          if (!foundSub) {
             throw new Error(`المادة "${fullSubjectName}" غير موجودة. تأكد من مطابقة الاسم والتخصص.`);
          }

          const finalTrimestre = String(t || '1');
          const unitsArr = Array.isArray(units) ? units : [];
          
          return unitsArr.map((item: any, index: number) => {
            const nameStr = typeof item === 'string' ? item : item.name || item.title;
            if (!nameStr) throw new Error(`لا يمكن العثور على اسم في أحد العناصر لمادة ${targetSub}.`);
            return {
              id: 'u_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now() + '_' + index,
              subject_id: foundSub.id,
              name: nameStr,
              trimestre: parseInt(finalTrimestre),
              unit_order: 99
            };
          });
        };

        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'units' in parsed[0]) {
            parsed.forEach(entry => {
              allUnitsToInsert = [...allUnitsToInsert, ...processImportEntry(entry)];
            });
          } else {
            if (!selectedSubjectId) {
              throw new Error('يرجى اختيار المادة أولاً أو استخدام صيغة JSON الكاملة.');
            }
            allUnitsToInsert = parsed.map((item, index) => {
              const nameStr = typeof item === 'string' ? item : item.name || item.title;
              return {
                id: 'u_' + Math.random().toString(36).substr(2, 9) + index,
                subject_id: selectedSubjectId,
                name: nameStr,
                trimestre: parseInt(trimestre),
                unit_order: 99
              };
            });
          }
        } else {
          allUnitsToInsert = processImportEntry(parsed);
        }

        const { error: insError } = await supabase.from('units').insert(allUnitsToInsert);
        if (insError) throw insError;

        triggerAlert(`تم إضافة ${allUnitsToInsert.length} وحدة بنجاح!`, 'success');
        setJsonInput('');
      } catch (err: any) {
        triggerAlert('خطأ: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedSubjectId || !name) {
         triggerAlert('الرجاء اختيار المادة وكتابة اسم الوحدة.', 'error');
         return;
      }
      setIsSubmitting(true);
      try {
        const id = 'u_' + Math.random().toString(36).substr(2, 9);
        const { error } = await supabase.from('units').insert([{
          id,
          subject_id: selectedSubjectId,
          name,
          trimestre: parseInt(trimestre),
          unit_order: 99
        }]);
        if (!error) {
          triggerAlert('تمت إضافة الوحدة بنجاح!', 'success');
          setName('');
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
    <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 max-w-3xl mx-auto shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all font-bold shadow-sm shrink-0">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm shrink-0">
           <Target size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إدارة الوحدات</h2>
          <p className="text-xs text-slate-500 font-medium">قم بإضافة وعرض وتعديل الوحدات الدراسية.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6 mt-4">
        <button onClick={() => setActiveTab('add')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>إضافة وحدة</button>
        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>عرض الوحدات</button>
      </div>

      {activeTab === 'add' ? (
      <form onSubmit={handleSubmit} className="space-y-6">
        {!isBulkMode && (
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
        )}

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
          <>
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
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الفصل الدراسي</label>
              <select 
                value={trimestre} 
                onChange={(e) => setTrimestre(e.target.value)}
                className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                required
              >
                <option value="1">الفصل الأول</option>
                <option value="2">الفصل الثاني</option>
                <option value="3">الفصل الثالث</option>
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">النص (JSON Object)</label>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='مثال:&#10;{&#10;  "specialization": "علوم تجريبية",&#10;  "subject": "الفيزياء",&#10;  "trimestre": 1,&#10;  "units": ["الوحدة الأولى", "الوحدة الثانية"]&#10;}'
              className="w-full h-48 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
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
      ) : (
        <AdminEntityList type="units" title="قائمة الوحدات الدراسية" />
      )}
    </div>
  )
}

function AdminBacDate({ onBack }: { onBack: () => void }) {
  const [bacDate, setBacDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (supabase) {
        try {
          const { data } = await supabase.from('admin_settings').select('bac_date').limit(1).single();
          if (data && data.bac_date) {
            setBacDate(data.bac_date);
          }
        } catch (e) { }
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (supabase) {
        const { data: currentData } = await supabase.from('admin_settings').select('*').limit(1).single();
        const updateData = currentData ? { ...currentData, id: 1, bac_date: bacDate || null } : { id: 1, bac_date: bacDate || null };

        const { error } = await supabase.from('admin_settings').upsert(updateData);
        if (error) {
           if (error.message.includes('bac_date')) {
             throw new Error("يرجى تحديث قاعدة البيانات وتشغيل: ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS bac_date TEXT;");
           }
           throw error;
        }
        triggerAlert("تم حفظ تاريخ البكالوريا بنجاح!", 'success');
      } else {
        triggerAlert("يرجى إعداد قاعدة البيانات لحفظ الإعدادات.", 'error');
      }
    } catch (err: any) {
      triggerAlert("حدث خطأ أثناء الحفظ: " + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 max-w-3xl mx-auto shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
           <Calendar size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">تاريخ البكالوريا</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">تحديد تاريخ الامتحان لإظهار العداد التنازلي للطلاب.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الامتحان القادم</label>
          <input 
            type="datetime-local" 
            value={bacDate} 
            onChange={(e) => setBacDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
            dir="auto"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-300"
        >
          {isSaving ? (
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>جاري الحفظ...</span>
             </div>
          ) : (
            <>
               <Save size={20} />
               حفظ الإعدادات
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function AdminSettings({ onBack }: { onBack: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadSettings() {
      let currentKey = '';
      let savedModel = 'gemini-3-flash-preview';
      
      if (supabase) {
        try {
          const { data } = await supabase.from('admin_settings').select('*').limit(1).single();
          if (data && data.api_key) {
            currentKey = data.api_key;
            savedModel = (data.ai_model && data.ai_model !== 'gemini-2.5-flash') ? data.ai_model : savedModel;
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
        if (error) {
           throw error;
        }
        triggerAlert("تم حفظ الإعدادات بنجاح!", 'success');
      } else {
        triggerAlert("يرجى إعداد قاعدة البيانات لحفظ الإعدادات.", 'error');
      }
    } catch (err: any) {
      triggerAlert("حدث خطأ أثناء الحفظ: " + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 max-w-3xl mx-auto shadow-sm border border-slate-100">
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
                   triggerAlert('تم نسخ الكود!', 'success', false);
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

           <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 mt-6">
              تفعيل مواضيع البكالوريا (SQL)
           </h4>
           <div className="relative group mb-3">
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-left text-[10px] overflow-x-auto dir-ltr font-mono leading-loose max-h-40 overflow-y-auto">
{`-- إنشاء جدول مواضيع البكالوريا
CREATE TABLE IF NOT EXISTS bac_exams (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  exam_file TEXT NOT NULL,
  solution_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE POLICY "Allow public read to bac_exams" ON bac_exams FOR SELECT USING (true);
CREATE POLICY "Allow public update to bac_exams" ON bac_exams FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to bac_exams" ON bac_exams FOR INSERT USING (true);
CREATE POLICY "Allow public delete to bac_exams" ON bac_exams FOR DELETE USING (true);

-- إعداد دلو تخزين ملفات الـ PDF (Supabase Storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('bac_files', 'bac_files', true);

CREATE POLICY "Public Read bac_files" ON storage.objects FOR SELECT USING (bucket_id = 'bac_files');
CREATE POLICY "Public Insert bac_files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bac_files');
CREATE POLICY "Public Update bac_files" ON storage.objects FOR UPDATE USING (bucket_id = 'bac_files');
CREATE POLICY "Public Delete bac_files" ON storage.objects FOR DELETE USING (bucket_id = 'bac_files');`}
              </pre>
              <button 
                 type="button"
                 onClick={() => {
                   navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS bac_exams ( id TEXT PRIMARY KEY, year TEXT NOT NULL, subject_id TEXT NOT NULL, exam_file TEXT NOT NULL, solution_file TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ); CREATE POLICY "Allow public read to bac_exams" ON bac_exams FOR SELECT USING (true); CREATE POLICY "Allow public insert to bac_exams" ON bac_exams FOR INSERT USING (true); CREATE POLICY "Allow public update to bac_exams" ON bac_exams FOR UPDATE USING (true); CREATE POLICY "Allow public delete to bac_exams" ON bac_exams FOR DELETE USING (true); INSERT INTO storage.buckets (id, name, public) VALUES ('bac_files', 'bac_files', true); CREATE POLICY "Public Read bac_files" ON storage.objects FOR SELECT USING (bucket_id = 'bac_files'); CREATE POLICY "Public Insert bac_files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bac_files'); CREATE POLICY "Public Update bac_files" ON storage.objects FOR UPDATE USING (bucket_id = 'bac_files'); CREATE POLICY "Public Delete bac_files" ON storage.objects FOR DELETE USING (bucket_id = 'bac_files');`);
                   triggerAlert('تم نسخ كود البكالوريا!', 'success', false);
                 }}
                 className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/10 text-white hover:bg-white/20 text-xs px-2 py-1 rounded transition-all"
              >
                 نسخ
              </button>
           </div>
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
            <button onClick={() => setView('analyze_pdf')} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-violet-50 border-transparent hover:border-violet-100 transition-all text-right group border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 text-sm">تحليل موضوع (PDF)</h4>
                  <p className="text-[10px] text-slate-500">استخراج التمارين بالذكاء الاصطناعي</p>
                </div>
              </div>
              <ChevronLeft size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
            </button>
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



function AdminManageBac({ onBack }: { onBack: () => void }) {
  const [exams, setExams] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: sData } = await supabase.from('subjects').select('id, name');
        const sMap: Record<string, string> = {};
        if (sData) {
          sData.forEach(s => sMap[s.id] = s.name);
        }
        setSubjectsMap(sMap);

        const { data: eData } = await supabase.from('bac_exams').select('*').order('year', { ascending: false });
        if (eData) {
          setExams(eData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id: string, examUrl: string, solutionUrl: string | null) => {
    if (!supabase || !confirm('هل أنت متأكد من حذف هذه البكالوريا؟')) return;
    setDeletingId(id);
    try {
       const deleteFile = async (url: string) => {
         try {
           const parts = url.split('/');
           const fileName = parts[parts.length - 1];
           if (fileName) {
             await supabase.storage.from('bac_files').remove([fileName]);
           }
         } catch(e) {}
       };

       if (examUrl && examUrl.includes('bac_files/')) await deleteFile(examUrl);
       if (solutionUrl && solutionUrl.includes('bac_files/')) await deleteFile(solutionUrl);

       const { error } = await supabase.from('bac_exams').delete().eq('id', id);
       if (error) throw error;
       
       setExams(exams.filter(e => e.id !== id));
       triggerAlert('تم الحذف بنجاح', 'success');
    } catch (e: any) {
      triggerAlert('خطأ أثناء الحذف: ' + e.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all font-bold">
           <ChevronRight size={20} className="rotate-180" />
        </button>
        <div>
          <h2 className="font-bold text-xl md:text-2xl text-slate-800">إدارة البكالوريات</h2>
          <p className="text-xs text-slate-500 font-medium">عرض جميع مواضيع البكالوريا المضافة مسبقاً لحذفها أو تصفحها.</p>
        </div>
      </div>

      {loading ? (
         <div className="text-center py-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : exams.length === 0 ? (
         <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
           <p className="text-slate-500 font-bold mb-4">لا توجد مواضيع بكالوريا مضافة حالياً.</p>
         </div>
      ) : (
         <div className="grid gap-3">
           {exams.map((exam, index) => (
              <div key={exam.id || index} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4 transition-all hover:bg-white hover:shadow-md">
                 <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <FileText size={16} className="text-indigo-500" />
                       بكالوريا {exam.year} - {subjectsMap[exam.subject_id] || 'مادة غير معروفة'}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                       {exam.exam_file && (
                           <a href={exam.exam_file} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-indigo-100/50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center gap-1 transition-colors"><FileText size={12}/> عرض الموضوع</a>
                       )}
                       {exam.solution_file && (
                           <a href={exam.solution_file} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1 transition-colors"><FileText size={12}/> عرض الحل</a>
                       )}
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => handleDelete(exam.id, exam.exam_file, exam.solution_file)}
                   disabled={deletingId === exam.id}
                   className="w-full md:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {deletingId === exam.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Trash size={16} />}
                   حذف بالكامل
                 </button>
              </div>
           ))}
         </div>
      )}
    </div>
  );
}

function AdminAddCookies({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allCookies, setAllCookies] = useState<any>({});
  const [cookieToDelete, setCookieToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (cookieToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cookieToDelete]);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data: subData } = await supabase.from('subjects').select('*');
        if (subData) setSubjects(subData);

        const { data: settingsData } = await supabase.from('admin_settings').select('subject_cookies').limit(1).single();
        if (settingsData && settingsData.subject_cookies) {
            try {
               const cookies = JSON.parse(settingsData.subject_cookies);
               setAllCookies(cookies);
               if (selectedSubjectId) {
                   if (cookies[selectedSubjectId]) {
                      setJsonInput(JSON.stringify(cookies[selectedSubjectId], null, 2));
                   } else {
                      setJsonInput('{\n  "levels": [\n    {\n      "level": "المستوى 1",\n      "questions": [\n        {\n          "q": "السؤال الأول؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثاني؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثالث؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الرابع؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الخامس؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال السادس؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال السابع؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثامن؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال التاسع؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال العاشر؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        }\n      ]\n    }\n  ]\n}');
                   }
               }
            } catch(e) {
               console.error("Error parsing subject_cookies setting", e);
            }
        } else if (selectedSubjectId) {
             setJsonInput('{\n  "levels": [\n    {\n      "level": "المستوى 1",\n      "questions": [\n        {\n          "q": "السؤال الأول؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثاني؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثالث؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الرابع؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الخامس؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال السادس؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال السابع؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثامن؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال التاسع؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال العاشر؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        }\n      ]\n    }\n  ]\n}');
        }
      } catch (e) {
         console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedSubjectId, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !jsonInput) return;
    setIsSubmitting(true);
    try {
        const parsedInput = JSON.parse(jsonInput);
        
        let existingCookies: any = {};
        const { data: currentData } = await supabase.from('admin_settings').select('id, subject_cookies').limit(1).single();
        if (currentData && currentData.subject_cookies) {
            try {
                existingCookies = JSON.parse(currentData.subject_cookies);
            } catch(e) {}
        }
        
        existingCookies[selectedSubjectId] = parsedInput;
        
        const updateData = currentData ? { ...currentData, id: 1, subject_cookies: JSON.stringify(existingCookies) } : { id: 1, subject_cookies: JSON.stringify(existingCookies) };
        
        const { error } = await supabase.from('admin_settings').upsert(updateData);
        if (error) {
           if (error.message.includes('subject_cookies')) {
             throw new Error("يرجى تحديث قاعدة البيانات وتشغيل: ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS subject_cookies TEXT;");
           }
           throw error;
        }
        triggerAlert('تم حفظ الكوكيز بنجاح', 'success');
        setAllCookies(existingCookies);
    } catch(err: any) {
        triggerAlert('حدث خطأ: ' + (err.message || 'تأكد من صحة ملف JSON'), 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteCookies = async () => {
    if (!cookieToDelete) return;
    try {
        let existingCookies: any = { ...allCookies };
        delete existingCookies[cookieToDelete];
        
        const { data: currentData } = await supabase.from('admin_settings').select('id, subject_cookies').limit(1).single();
        const updateData = currentData ? { ...currentData, id: 1, subject_cookies: JSON.stringify(existingCookies) } : { id: 1, subject_cookies: JSON.stringify(existingCookies) };
        
        const { error } = await supabase.from('admin_settings').upsert(updateData);
        if (error) throw error;
        
        setAllCookies(existingCookies);
        if (selectedSubjectId === cookieToDelete) {
            setJsonInput('{\n  "levels": [\n    {\n      "level": "المستوى 1",\n      "questions": [\n        {\n          "q": "السؤال الأول؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        }\n      ]\n    }\n  ]\n}');
        }
        triggerAlert('تم مسح الكويز بنجاح', 'success');
    } catch(err: any) {
        triggerAlert('خطأ أثناء المسح: ' + err.message, 'error');
    } finally {
        setCookieToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h2 className="font-bold text-2xl text-slate-800">الكوكيز (المراحل)</h2>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'add' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            إضافة/تعديل كويز
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'view' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            عرض الكويزات
          </button>
        </div>
      </div>

      {activeTab === 'add' ? (
        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">المادة</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              >
                <option value="">-- اختر المادة --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">الكوكيز بصيغة JSON</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{\n  "levels": [\n    {\n      "level": "المستوى 1",\n      "questions": [\n        {\n          "q": "السؤال الأول؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثاني؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        {\n          "q": "السؤال الثالث؟",\n          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n          "correct": 0,\n          "justification": "تبرير الإجابة"\n        },\n        ... (10 أسئلة)\n      ]\n    }\n  ]\n}'
                className="w-full h-80 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm text-left"
                dir="ltr"
                required
                disabled={!selectedSubjectId}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedSubjectId}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الكوكيز'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100">
          <h3 className="font-bold text-xl text-slate-800 mb-6">احصائيات الكويزات (المراحل)</h3>
          {loading ? (
             <div className="text-center text-slate-500 py-10 font-bold animate-pulse">جاري التحميل...</div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.filter(s => {
                   const subjectCookies = allCookies[s.id];
                   return subjectCookies?.levels && subjectCookies.levels.length > 0;
                }).map(s => {
                   const subjectCookies = allCookies[s.id];
                   const levelsCount = subjectCookies?.levels ? subjectCookies.levels.length : 0;
                   return (
                     <div key={s.id} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl flex flex-col gap-3 transition-hover hover:border-blue-200 hover:bg-blue-50/50">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{s.name}</h4>
                           <button onClick={() => setCookieToDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors" title="مسح الكويز">
                             <Trash2 size={18} />
                           </button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-500 font-bold">عدد المراحل:</span>
                           <span className="font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                             {levelsCount} مرحلة
                           </span>
                        </div>
                     </div>
                   );
                })}
                {subjects.filter(s => allCookies[s.id]?.levels?.length > 0).length === 0 && <div className="col-span-full text-slate-500 text-center py-4 text-sm font-bold">لا توجد كويزات (مراحل) مضافة بعد</div>}
             </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {cookieToDelete && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            style={{ position: 'fixed' }}
            onClick={() => setCookieToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 text-center mb-8 font-medium">هل أنت متأكد من مسح جميع الأسئلة والمراحل الخاصة بهذه المادة؟ لا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setCookieToDelete(null)}
                  className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleDeleteCookies}
                  className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all"
                >
                  نعم، مسح
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
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
  const [isContentMenuOpen, setIsContentMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('refresh-admin-view', handleRefresh);
    return () => window.removeEventListener('refresh-admin-view', handleRefresh);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-[100dvh] bg-slate-50 relative flex md:flex-row flex-col">
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
              onClick={() => { setView('analyze_pdf'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'analyze_pdf' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <FileText size={18} /> تحليل ملف PDF
            </button>
            <button 
              onClick={() => setIsContentMenuOpen(!isContentMenuOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm ${['manage_subjects', 'manage_units', 'add_lesson', 'add_exercise'].includes(view) && !isContentMenuOpen ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <div className="flex flex-row items-center gap-3">
                 <BookOpen size={18} /> إدارة المواد
               </div>
               <ChevronRight size={16} className={`transition-transform duration-200 ${isContentMenuOpen ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} />
            </button>
            <AnimatePresence>
               {isContentMenuOpen && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden flex flex-col gap-1 pr-4 pl-2 border-r-2 border-slate-200 mr-2"
                 >
                   <button 
                     onClick={() => { setView('manage_subjects'); closeSidebar(); }}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${view === 'manage_subjects' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                   >
                     <BookOpen size={16} /> المواد والتخصصات
                   </button>
                   <button 
                     onClick={() => { setView('manage_units'); closeSidebar(); }}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${view === 'manage_units' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                   >
                     <Target size={16} /> إدارة الوحدات
                   </button>
                   <button 
                     onClick={() => { setView('add_lesson'); closeSidebar(); }}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${view === 'add_lesson' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                   >
                     <PlayCircle size={16} /> إدارة الدروس
                   </button>
                   <button 
                     onClick={() => { setView('add_exercise'); closeSidebar(); }}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${view === 'add_exercise' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                   >
                     <PenTool size={16} /> إدارة التمارين
                   </button>
                 </motion.div>
               )}
            </AnimatePresence>
            <button 
              onClick={() => { setView('manage_bac'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_bac' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <FileText size={18} /> إدارة مواضيع البكالوريا
            </button>
            <button 
              onClick={() => { setView('manage_cookies'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'manage_cookies' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <FileText size={18} /> إدارة كوكيز المواد
            </button>
            <button 
              onClick={() => { setView('users'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'users' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-white/60'}`}
            >
               <Users size={18} /> إدارة المستخدمين
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
              onClick={() => { setView('bac_date'); closeSidebar(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'bac_date' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-500 hover:bg-white/60'}`}
            >
               <Calendar size={18} /> تعيين تاريخ البكالوريا
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
      <div className="flex-1 w-full px-3 md:px-8 pt-4 md:pt-10 pb-20 md:pb-8 z-10 flex flex-col min-w-0">
        
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
          <div key={refreshKey} className="animate-in fade-in duration-300">
             {view === 'dashboard' && <AdminDashboard setView={setView} />}
             {view === 'adminManageContent' && <AdminManageContent onBack={() => setView('dashboard')} />}
             {view === 'analyze_pdf' && <PdfBacAnalis onBack={() => setView('dashboard')} />}
             {view === 'add_lesson' && <AdminAddLesson onBack={() => setView('dashboard')} />}
             {view === 'add_exercise' && <AdminAddExercise onBack={() => setView('dashboard')} />}
             {view === 'manage_subjects' && <AdminAddSubject onBack={() => setView('dashboard')} />}
             {view === 'manage_units' && <AdminAddUnit onBack={() => setView('dashboard')} />}
             {view === 'manage_bac' && <AdminManageBac onBack={() => setView('dashboard')} />}
             {view === 'manage_cookies' && <AdminAddCookies onBack={() => setView('dashboard')} />}
             {view === 'settings' && <AdminSettings onBack={() => setView('dashboard')} />}
             {view === 'bac_date' && <AdminBacDate onBack={() => setView('dashboard')} />}
             {view === 'users' && <AdminUsers />}
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
