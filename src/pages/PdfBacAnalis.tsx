import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";
import { triggerAlert, AlertModal } from "./Admin";
import { ChevronRight, FileText, Upload, AlertCircle, Save } from "lucide-react";

export function PdfBacAnalis({ onBack: customOnBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const onBack = customOnBack || (() => navigate(-1));
  const [examFile, setExamFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  const handleAnalyzeAndSave = async () => {
    if (!examFile) {
      triggerAlert("يرجى اختيار ملف الموضوع أولاً", "error");
      return;
    }
    
    if (examFile.size > 5 * 1024 * 1024) {
      triggerAlert("حجم الملف يجب أن لا يتجاوز 5MB", "error");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalyzingStep("تهيئة الفحص...");
      setErrorMsg(null);
      
      const { data: settingsData } = await supabase.from('admin_settings').select('api_key, ai_model').limit(1).single();
      if (!settingsData?.api_key) {
        throw new Error("لم يتم تكوين مفتاح API. يرجى إعداده في الإعدادات.");
      }

      setAnalyzingStep("جاري قراءة الملف وتجهيزه...");
      const examBase64Data = await getBase64(examFile);
      const solutionBase64Data = solutionFile ? await getBase64(solutionFile) : null;
      
      const ai = new GoogleGenAI({ apiKey: settingsData.api_key });

      const subjectsList = dbSubjects.map(s => `- ${s.name}`).join('\n');
      
      const prompt = `أنت خبير في تحليل مواضيع البكالوريا الجزائرية. تم إرفاق ملف PDF للأسئلة.
مهمتك هي استخراج المعلومات التالية فقط:
- سنة البكالوريا (مثال: 2024، 2023...)
- قائمة بأسماء المواد والتخصصات (الشعب) التي ينطبق عليها الموضوع. لكي تتطابق بدقة مع المواد الموجودة في القائمة أسفله. إذا كان الموضوع موجه لعدة شعب وتخصصات، قم بذكر جميع المواد المطابقة لها في القائمة. يجب أن يكون الاسم مطابقا تماما للقائمة.

قائمة المواد المتاحة:
${subjectsList}`;

      const actualModel = (settingsData.ai_model && settingsData.ai_model !== 'gemini-2.5-flash') ? settingsData.ai_model : 'gemini-3-flash-preview';

      setAnalyzingStep("جاري تصنيف الملفات حسب المادة والتخصص بالذكاء الاصطناعي...");

      const response = await ai.models.generateContent({
        model: actualModel,
        contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { data: examBase64Data, mimeType: 'application/pdf' } }
              ],
            }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bac_year: { type: Type.STRING },
              subject_names: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["bac_year", "subject_names"]
          }
        }
      });

      const textResponse = response.text || '';
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
          throw new Error(`تعرف الذكاء الاصطناعي على المواد التالية: [${notFoundSubjects.join('، ')}] ولكنها غير موجودة بدقة في القائمة. الرجاء التحقق من أسماء المواد.`);
      }

      setAnalyzingStep("جاري رفع الملفات للسحابة وحفظها...");

      if (supabase) {
         let examUrl = '';
         let solutionUrl = null;

         const examFileName = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${examFile.name.split('.').pop() || 'pdf'}`;
         const { data: examUploadData, error: examUploadError } = await supabase.storage
           .from('bac_files')
           .upload(examFileName, examFile);
           
         if (examUploadError) {
             throw new Error("فشل رفع الموضوع: " + examUploadError.message + " (هل أنشأت دلو Storage المسمى bac_files؟)");
         }
         
         const { data: { publicUrl: examPublicUrl } } = supabase.storage
           .from('bac_files')
           .getPublicUrl(examFileName);
           
         examUrl = examPublicUrl;

         if (solutionFile) {
           const solutionFileName = `solution_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${solutionFile.name.split('.').pop() || 'pdf'}`;
           const { error: solutionUploadError } = await supabase.storage
             .from('bac_files')
             .upload(solutionFileName, solutionFile);
             
           if (solutionUploadError) {
               throw new Error("فشل رفع الحل: " + solutionUploadError.message);
           }
           
           const { data: { publicUrl: solutionPublicUrl } } = supabase.storage
             .from('bac_files')
             .getPublicUrl(solutionFileName);
             
           solutionUrl = solutionPublicUrl;
         }

         const inserts = matchedSubjects.map(s => ({
             id: 'bac_' + Math.random().toString(36).substr(2, 9) + '_' + s.id.substring(0, 4),
             year: parsed.bac_year.toString(),
             subject_id: s.id,
             exam_file: examUrl,
             solution_file: solutionUrl
         }));

         const { error } = await supabase.from('bac_exams').insert(inserts);
         
         if (error) {
             if (error.code === '42P01') {
                 throw new Error("الجدول bac_exams غير موجود في قاعدة البيانات! رجاء قم بإنشائه بواسطة كود SQL من واجهة الإعدادات.");
             }
             throw error;
         }
      }

      triggerAlert(`تم حفظ موضوع بكالوريا ${parsed.bac_year} بنجاح للمواد/التخصصات: ${matchedSubjects.map(s => s.name).join('، ')}`, "success");
      setExamFile(null);
      setSolutionFile(null);

    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً. حاول لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية لمفتاح Gemini API هذا. يرجى إضافة مفتاح API جديد من الإعدادات.";
      setErrorMsg(errMsg);
      triggerAlert(errMsg, "error");
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep('');
    }
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
          <h2 className="font-bold text-xl text-slate-800">إضافة موضوع بكالوريا</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">يُتعرف تلقائياً على المادة وسنة البكالوريا من الـ PDF</p>
        </div>
      </div>

      <div className="space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl whitespace-pre-wrap" dir="rtl">
            <h4 className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={18} /> خطأ</h4>
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          <div className="glass rounded-2xl p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-center relative hover:bg-indigo-50/50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => { if(e.target.files) setExamFile(e.target.files[0]) }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-3">
               <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center shadow-inner pointer-events-none">
                 {examFile ? <FileText size={32} /> : <Upload size={32} />}
               </div>
               <div className="pointer-events-none">
                 <p className="font-bold text-slate-700">{examFile ? examFile.name : "رفع موضوع الامتحان (PDF)"}</p>
                 <p className="text-xs text-slate-500 mt-1">إجباري - الحد الأقصى 5MB</p>
               </div>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-6 border-2 border-dashed border-emerald-200 bg-emerald-50/30 text-center relative hover:bg-emerald-50/50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => { if (e.target.files) setSolutionFile(e.target.files[0]) }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                 {solutionFile ? <FileText size={32} /> : <Upload size={32} />}
               </div>
               <div>
                 <p className="font-bold text-slate-700">{solutionFile ? solutionFile.name : "رفع التصحيح النموذجي (PDF)"}</p>
                 <p className="text-xs text-slate-500 mt-1">اختياري - الحد الأقصى 5MB</p>
               </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleAnalyzeAndSave} 
          disabled={!examFile || isAnalyzing}
          className="w-full max-w-xl mx-auto flex bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold rounded-xl py-4 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 relative z-10"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {analyzingStep || 'جاري الفحص والحفظ...'}
            </>
          ) : (
             <>
               <Save size={20} />
               حفظ الموضوع
             </>
          )}
        </button>
      </div>
    </div>
  );
}

