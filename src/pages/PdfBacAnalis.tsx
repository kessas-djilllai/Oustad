import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";
import { triggerAlert, AlertModal } from "./Admin";
import { ChevronRight, FileText, Upload, AlertCircle, Save, CheckCircle2, XCircle, SkipForward, Play, Pause, X } from "lucide-react";

type QueuedFile = {
  id: string;
  file: File;
  type: 'exam' | 'solution';
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  errorMsg?: string;
  info?: string;
};

export function PdfBacAnalis({ onBack: customOnBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const onBack = customOnBack || (() => navigate(-1));
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      try {
        const { data: s } = await supabase.from('subjects').select('*');
        if (s) setDbSubjects(s);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const getBase64 = (fileObj: File): Promise<string> => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(fileObj);
  });

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>, type: 'exam' | 'solution') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        type,
        status: 'pending' as const
      }));
      setQueuedFiles(prev => [...prev, ...newFiles]);
    }
    // reset input value so the same file could be selected again if removed
    e.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const startProcessing = () => {
      setIsProcessing(true);
      setIsPaused(false);
      const firstPendingIndex = queuedFiles.findIndex(f => f.status === 'pending' || f.status === 'error');
      if (firstPendingIndex !== -1) {
          setCurrentIndex(firstPendingIndex);
      } else {
          setIsProcessing(false);
      }
  };

  const handleRetry = () => {
      startProcessing();
  };

  const handleContinue = () => {
      setQueuedFiles(prev => {
          const next = [...prev];
          if (currentIndex !== -1 && next[currentIndex].status === 'error') {
              next[currentIndex].status = 'skipped';
          }
          
          const nextPendingIndex = next.findIndex((f, idx) => idx > currentIndex && (f.status === 'pending' || f.status === 'error'));
          
          setTimeout(() => {
              setIsProcessing(true);
              setIsPaused(false);
              if (nextPendingIndex !== -1) {
                  setCurrentIndex(nextPendingIndex);
              } else {
                  setIsProcessing(false);
                  setCurrentIndex(-1);
              }
          }, 0);
          
          return next;
      });
  };

  useEffect(() => {
    if (isProcessing && !isPaused && currentIndex !== -1 && currentIndex < queuedFiles.length) {
      processFile(currentIndex);
    }
  }, [currentIndex, isProcessing, isPaused]);

  const processFile = async (index: number) => {
    const qFile = queuedFiles[index];
    if (!qFile || (qFile.status !== 'pending' && qFile.status !== 'error')) return;

    setQueuedFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'processing', errorMsg: undefined } : f));
    
    const isOnlySolution = qFile.type === 'solution';

    try {
      setAnalyzingStep("تهيئة الفحص...");
      
      const { data: settingsData } = await supabase.from('admin_settings').select('api_key, ai_model').limit(1).single();
      if (!settingsData?.api_key) {
        throw new Error("لم يتم تكوين مفتاح API. يرجى إعداده في الإعدادات.");
      }

      setAnalyzingStep("جاري قراءة الملف وتجهيزه...");
      
      // Select the file to pass to Gemini
      const fileToAnalyze = qFile.file;
      
      if (fileToAnalyze.size > 5 * 1024 * 1024) {
        throw new Error("حجم الملف يتجاوز 5MB");
      }
      
      const pdfBase64Data = await getBase64(fileToAnalyze);

      const subjectsList = dbSubjects.map(s => `- ${s.name}`).join('\n');
      
      const prompt = `أنت خبير في تحليل مواضيع البكالوريا الجزائرية. تم إرفاق ملف PDF (إما لأسئلة الامتحان أو للتصحيح النموذجي).
مهمتك هي استخراج المعلومات التالية فقط:
- سنة البكالوريا (مثال: 2024، 2023...)
- قائمة بأسماء المواد والتخصصات (الشعب) التي ينطبق عليها الملف. لكي تتطابق بدقة مع المواد الموجودة في القائمة أسفله. إذا كان الملف موجه لعدة شعب وتخصصات، قم بذكر جميع المواد المطابقة لها في القائمة. يجب أن يكون الاسم مطابقا تماما للقائمة.

قائمة المواد المتاحة:
${subjectsList}`;

      const actualModel = (settingsData.ai_model && settingsData.ai_model !== 'gemini-2.5-flash') ? settingsData.ai_model : 'gemini-3-flash-preview';

      setAnalyzingStep("جاري تصنيف الملفات حسب المادة والتخصص بالذكاء الاصطناعي...");

      const responseRes = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          base64Image: pdfBase64Data,
          mimeType: "application/pdf",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                bac_year: { type: "STRING" },
                subject_names: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["bac_year", "subject_names"]
            }
          }
        })
      });

      if (!responseRes.ok) {
         const d = await responseRes.json();
         throw new Error(d.error || "خطأ في الاتصال بالخادم");
      }
      
      const { text: textResponse } = await responseRes.json();
      const cleanedJson = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      
      if (!parsed.bac_year || !parsed.subject_names || !Array.isArray(parsed.subject_names) || parsed.subject_names.length === 0) {
          throw new Error("لم يتمكن الذكاء الاصطناعي من استخراج السنة أو المواد.");
      }

      const matchedSubjects: any[] = [];
      const notFoundSubjects: string[] = [];
      const norm = (str: string) => str.trim().replace(/\s+/g, ' ').replace(/[()[\]{}./\-_]/g, '');
      
      for (const subjName of parsed.subject_names) {
          let matchedSubject = dbSubjects.find(s => s.name.trim() === subjName.trim());
          if (!matchedSubject) {
              matchedSubject = dbSubjects.find(s => norm(s.name) === norm(subjName));
          }
          if (!matchedSubject) {
              matchedSubject = dbSubjects.find(s => norm(s.name).includes(norm(subjName)) || norm(subjName).includes(norm(s.name)));
          }
          if (matchedSubject) {
              // Ensure uniqueness
              if (!matchedSubjects.find(s => s.id === matchedSubject.id)) {
                  matchedSubjects.push(matchedSubject);
              }
          } else {
              notFoundSubjects.push(subjName);
          }
      }

      if (matchedSubjects.length === 0) {
          throw new Error(`تعرف الذكاء الاصطناعي على المواد التالية: [${notFoundSubjects.join('، ')}] ولكنها غير موجودة بدقة في القائمة.`);
      }

      let finalMatchedSubjects = [...matchedSubjects];
      let existingExamsToUpdate: any[] = [];

      if (supabase) {
          setAnalyzingStep(isOnlySolution ? "جاري البحث عن الموضوع لتحديثه..." : "جاري التحقق من التكرار...");
          const { data: existingExams, error: existingError } = await supabase
            .from('bac_exams')
            .select('id, subject_id, solution_file')
            .eq('year', parsed.bac_year.toString())
            .in('subject_id', finalMatchedSubjects.map(s => s.id));
            
          if (isOnlySolution) {
              if (existingError || !existingExams || existingExams.length === 0) {
                  throw new Error(`لا يوجد موضوع بكالوريا مسجل لهذه التخصصات لعام ${parsed.bac_year}. يرجى رفع الموضوع أولاً.`);
              }
              
              const examsWithSolution = existingExams.filter(e => e.solution_file);
              const examsWithoutSolution = existingExams.filter(e => !e.solution_file);
              
              if (examsWithSolution.length > 0) {
                  const subjectsWithSolutionIds = examsWithSolution.map(e => e.subject_id);
                  const subjectsWithSolutionNames = finalMatchedSubjects.filter(s => subjectsWithSolutionIds.includes(s.id)).map(s => s.name);
                  
                  if (examsWithoutSolution.length === 0) {
                        setQueuedFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'skipped', errorMsg: `التصحيح المرفوع مضاف مسبقاً لهذه المواد/التخصصات: ${subjectsWithSolutionNames.join('، ')}` } : f));
                        moveToNextFile(index);
                        return;
                  }
              }
              
              existingExamsToUpdate = examsWithoutSolution;
              
              const existingSubjectIds = existingExamsToUpdate.map(e => e.subject_id);
              
              finalMatchedSubjects = finalMatchedSubjects.filter(s => existingSubjectIds.includes(s.id));
              
          } else {
              if (!existingError && existingExams && existingExams.length > 0) {
                  const existingSubjectIds = existingExams.map(e => e.subject_id);
                  finalMatchedSubjects = finalMatchedSubjects.filter(s => !existingSubjectIds.includes(s.id));
                  
                  if (finalMatchedSubjects.length === 0) {
                      setQueuedFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'skipped', errorMsg: "الموضوع المرفوع موجود مسبقاً" } : f));
                      moveToNextFile(index);
                      return;
                  }
              }
          }
      }

      setAnalyzingStep("جاري رفع الملفات للسحابة وحفظها...");

      if (supabase) {
         let uploadedUrl = '';

         const fileName = `${isOnlySolution ? 'solution' : 'exam'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${qFile.file.name.split('.').pop() || 'pdf'}`;
         const { data: uploadData, error: uploadError } = await supabase.storage
           .from('bac_files')
           .upload(fileName, qFile.file);
           
         if (uploadError) {
             throw new Error("فشل الرفع: " + uploadError.message);
         }
         
         const { data: { publicUrl } } = supabase.storage
           .from('bac_files')
           .getPublicUrl(fileName);
           
         uploadedUrl = publicUrl;

         if (isOnlySolution) {
             if (uploadedUrl && existingExamsToUpdate.length > 0) {
                 const idsToUpdate = existingExamsToUpdate.map(e => e.id);
                 const { error } = await supabase.from('bac_exams').update({ solution_file: uploadedUrl }).in('id', idsToUpdate);
                 if (error) throw error;
             }
         } else {
             const inserts = finalMatchedSubjects.map((s: any) => ({
                 id: 'bac_' + Math.random().toString(36).substr(2, 9) + '_' + s.id.substring(0, 4),
                 year: parsed.bac_year.toString(),
                 subject_id: s.id,
                 exam_file: uploadedUrl,
                 solution_file: null
             }));

             if (inserts.length > 0) {
                 const { error } = await supabase.from('bac_exams').insert(inserts);
             
                 if (error) {
                     if (error.code === '42P01') {
                         throw new Error("الجدول bac_exams غير موجود!");
                     }
                     throw error;
                 }
             }
         }
      }

      setQueuedFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'success', info: `${parsed.bac_year} / ${finalMatchedSubjects.map(s => s.name).join(', ')}` } : f));
      
      moveToNextFile(index);

    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً. حاول لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية لمفتاح Gemini API هذا.";
      else if (errMsg.includes('لا يوجد موضوع بكالوريا مسجل')) {
          setQueuedFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'skipped', errorMsg: errMsg } : f));
          moveToNextFile(index);
          return;
      }
      
      setQueuedFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', errorMsg: errMsg } : f));
      setIsPaused(true);
    } finally {
      setAnalyzingStep('');
    }
  };

  const moveToNextFile = (currentIndexComplete: number) => {
      setQueuedFiles(currentFiles => {
          const nextPendingIndex = currentFiles.findIndex((f, idx) => idx > currentIndexComplete && (f.status === 'pending' || f.status === 'error'));
          
          setTimeout(() => {
              if (nextPendingIndex !== -1) {
                  setCurrentIndex(nextPendingIndex);
              } else {
                  setIsProcessing(false);
                  setCurrentIndex(-1);
                  triggerAlert("تم معالجة جميع الملفات في القائمة!", "success");
              }
          }, 0);
          
          return currentFiles;
      });
  };

  return (
    <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 animate-in fade-in relative">
      <AlertModal />
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
           <FileText size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">إضافة مواضيع بكالوريا</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">يُتعرف تلقائياً على المادة وسنة البكالوريا من الـ PDF</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          <div className="glass rounded-2xl p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-center relative hover:bg-indigo-50/50 transition-colors">
            <input 
              type="file" 
              multiple
              accept="application/pdf"
              onChange={(e) => handleAddFiles(e, 'exam')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-3">
               <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center shadow-inner pointer-events-none">
                 <Upload size={32} />
               </div>
               <div className="pointer-events-none">
                 <p className="font-bold text-slate-700">رفع مواضيع الامتحانات (PDF)</p>
                 <p className="text-xs text-slate-500 mt-1">تحديد ملفات متعددة مدعوم (الحد الأقصى 5MB للملف)</p>
               </div>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-6 border-2 border-dashed border-emerald-200 bg-emerald-50/30 text-center relative hover:bg-emerald-50/50 transition-colors">
            <input 
              type="file" 
              multiple
              accept="application/pdf"
              onChange={(e) => handleAddFiles(e, 'solution')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                 <Upload size={32} />
               </div>
               <div>
                 <p className="font-bold text-slate-700">رفع التصحيحات النموذجية (PDF)</p>
                 <p className="text-xs text-slate-500 mt-1">تحديد ملفات متعددة مدعوم (الحد الأقصى 5MB للملف)</p>
               </div>
            </div>
          </div>
        </div>

        {queuedFiles.length > 0 && (
          <div className="max-w-3xl mx-auto w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
             <div className="flex items-center justify-between mb-2">
               <h3 className="font-bold text-slate-800 text-sm">قائمة الملفات ({queuedFiles.length})</h3>
               <div className="text-xs text-slate-500 font-medium">
                  تم المعالجة: {queuedFiles.filter(f => f.status === 'success' || f.status === 'skipped').length} / {queuedFiles.length}
               </div>
             </div>
             <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {queuedFiles.map((qFile, index) => (
                   <div key={qFile.id} className={`p-3 rounded-xl flex items-center justify-between transition-colors border ${
                      qFile.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
                      qFile.status === 'error' ? 'bg-red-50 border-red-200' :
                      qFile.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                      qFile.status === 'skipped' ? 'bg-orange-50 border-orange-200' :
                      'bg-white border-slate-200'
                   }`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            qFile.type === 'solution' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                         }`}>
                           <FileText size={16} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <p className="font-bold text-sm text-slate-800 truncate" title={qFile.file.name}>{qFile.file.name}</p>
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
                               {qFile.type === 'solution' ? 'تصحيح' : 'موضوع'}
                             </span>
                           </div>
                           <div className="text-xs mt-0.5 truncate">
                             {qFile.status === 'processing' && <span className="text-blue-600 font-bold">{analyzingStep || 'جاري المعالجة...'}</span>}
                             {qFile.status === 'success' && <span className="text-emerald-600 font-bold" title={`تم الرفع: ${qFile.info}`}>تم الرفع: {qFile.info}</span>}
                             {qFile.status === 'error' && <span className="text-red-600 font-bold" title={qFile.errorMsg}>{qFile.errorMsg}</span>}
                             {qFile.status === 'skipped' && <span className="text-orange-600 font-bold" title={`تخطي: ${qFile.errorMsg}`}>تخطي: {qFile.errorMsg}</span>}
                             {qFile.status === 'pending' && <span className="text-slate-500">في الانتظار...</span>}
                           </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                         {qFile.status === 'processing' && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                         {qFile.status === 'success' && <CheckCircle2 size={20} className="text-emerald-500" />}
                         {qFile.status === 'skipped' && <SkipForward size={20} className="text-orange-500" />}
                         {qFile.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                         
                         {(qFile.status === 'pending' || qFile.status === 'error' || qFile.status === 'skipped') && !isProcessing && (
                           <button 
                             onClick={() => handleRemoveFile(qFile.id)}
                             className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                             title="حذف"
                           >
                             <X size={18} />
                           </button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-xl mx-auto w-full relative z-10">
          {!isProcessing && queuedFiles.some(f => f.status === 'pending' || f.status === 'error') && (
            <button 
              onClick={startProcessing} 
              className="w-full flex bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold rounded-xl py-4 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all items-center justify-center gap-2"
            >
              <Play size={20} />
              {queuedFiles.some(f => f.status === 'error') ? 'متابعة الرفع' : 'بدء الرفع'}
            </button>
          )}

          {isProcessing && isPaused && (
             <div className="flex gap-3 w-full">
               <button 
                 onClick={handleRetry} 
                 className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl py-4 shadow-sm hover:bg-slate-50 transition-all items-center justify-center gap-2 flex"
               >
                 <Play size={18} />
                 إعادة المحاولة
               </button>
               <button 
                 onClick={handleContinue} 
                 className="flex-1 bg-slate-800 text-white font-bold rounded-xl py-4 shadow-lg hover:bg-slate-700 transition-all items-center justify-center gap-2 flex"
               >
                 <SkipForward size={18} />
                 تخطي واستمرار
               </button>
             </div>
          )}

          {isProcessing && !isPaused && (
             <button 
               disabled
               className="w-full flex bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-bold rounded-xl py-4 transition-all opacity-80 cursor-wait items-center justify-center gap-3"
             >
               <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               العملية قيد التشغيل...
             </button>
          )}
        </div>
      </div>
    </div>
  );
}


