import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { triggerAlert, AlertModal } from "./Admin";
import { ChevronRight, FileText, Upload, AlertCircle, Save } from "lucide-react";
import { pdfjs } from 'react-pdf';

export function PdfBacAnalis({ onBack: customOnBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const onBack = customOnBack || (() => navigate(-1));
  const [examFile, setExamFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  
  const [detectedYear, setDetectedYear] = useState<string>("");
  const [detectedSubject, setDetectedSubject] = useState<any>(null);

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
    
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      
      let fullText = '';
      const numPages = Math.min(pdfDocument.numPages, 2); // check first 2 pages
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + ' ';
      }
      return fullText;
    } catch (err) {
      console.error("Text extraction error:", err);
      return "";
    }
  };

  const handleExamFileChange = async (file: File) => {
    setExamFile(file);
    setDetectedYear("");
    setDetectedSubject(null);
    setErrorMsg(null);
    setIsDetecting(true);
    
    try {
      let pdfText = await extractTextFromPdf(file);
      pdfText = pdfText + " " + decodeURIComponent(file.name);
      
      const parsedYearMatch = pdfText.match(/20[0-2][0-9]/);
      let foundYear = parsedYearMatch ? parsedYearMatch[0] : "";
      
      const norm = (str: string) => str.trim().replace(/\s+/g, '').replace(/[()[\]{}./\-_:،؛]/g, '');
      const textForward = norm(pdfText);
      const textReversedLetters = pdfText.split('').reverse().join('');
      const textReversedWords = pdfText.split(' ').reverse().join(' ');
      const textVariations = [textForward, norm(textReversedLetters), norm(textReversedWords)];
      
      let bestMatchScore = 0;
      let matchedSubject = null;
      for (const subject of dbSubjects) {
          const sNameNorm = norm(subject.name);
          // Split into meaningful words to match parts
          const words = subject.name.split(' ').filter((w: string) => w.length > 2).map((w: string) => norm(w));
          let score = 0;
          for (const w of words) {
              if (textVariations.some(tv => tv.includes(w))) { score++; }
          }
          for (const tv of textVariations) {
            if (tv.includes(sNameNorm)) score += 5;
          }

          if (score > bestMatchScore && score > 0) {
              bestMatchScore = score;
              matchedSubject = subject;
          }
      }
      
      if (foundYear) setDetectedYear(foundYear);
      if (matchedSubject) setDetectedSubject(matchedSubject);

      if (!foundYear || !matchedSubject) {
          setErrorMsg("لم يتم التعرف على السنة أو المادة من الملف تلقائياً. تأكد من أن محتوى الملف أو اسمه يحتوي على السنة واسم المادة بوضوح.");
      }

    } catch (err) {
      console.error("Auto detect failed silently", err);
      setErrorMsg("حدث خطأ أثناء فحص الملف.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAnalyzeAndSave = async () => {
    if (!examFile) {
      triggerAlert("يرجى اختيار ملف الموضوع أولاً", "error");
      return;
    }
    
    if (!detectedYear || !detectedSubject) {
      triggerAlert("لا يمكن الحفظ، لم يتمكن النظام من استخراج بيانات المواضيع.", "error");
      return;
    }
    
    if (examFile.size > 5 * 1024 * 1024) {
      triggerAlert("حجم الملف يجب أن لا يتجاوز 5MB", "error");
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg(null);

      const parsedYear = detectedYear;
      const matchedSubject = detectedSubject;

      if (supabase) {
         let examUrl = '';
         let solutionUrl = null;

         const examFileName = `exam_${Date.now()}_${examFile.name}`;
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
           const solutionFileName = `solution_${Date.now()}_${solutionFile.name}`;
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

         const { error } = await supabase.from('bac_exams').insert({
             id: 'bac_' + Math.random().toString(36).substr(2, 9),
             year: parsedYear.toString(),
             subject_id: matchedSubject.id,
             exam_file: examUrl,
             solution_file: solutionUrl
         });
         
         if (error) {
             if (error.code === '42P01') {
                 throw new Error("الجدول bac_exams غير موجود في قاعدة البيانات! رجاء قم بإنشائه بواسطة كود SQL من واجهة الإعدادات.");
             }
             throw error;
         }
      }

      triggerAlert(`تم حفظ موضوع بكالوريا ${parsedYear} في مادة ${matchedSubject.name} بنجاح!`, "success");
      setExamFile(null);
      setSolutionFile(null);
      setDetectedYear("");
      setDetectedSubject(null);

    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً. حاول لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم.";
      setErrorMsg(errMsg);
      triggerAlert(errMsg, "error");
    } finally {
      setIsAnalyzing(false);
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
          <p className="text-xs text-slate-500 font-bold mt-1">يتم استخراج المادة والسنة بالنظام تلقائياً من الـ PDF</p>
        </div>
      </div>

      <div className="space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl whitespace-pre-wrap" dir="rtl">
            <h4 className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={18} /> نصيحة / تنبيه</h4>
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          <div className="glass rounded-2xl p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-center relative hover:bg-indigo-50/50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => { if (e.target.files && e.target.files[0]) handleExamFileChange(e.target.files[0]) }}
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

        {(isDetecting || (detectedYear && detectedSubject)) && (
           <div className="max-w-3xl mx-auto w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center min-h-[80px]">
              {isDetecting ? (
                 <div className="flex items-center gap-3 text-indigo-600 font-bold">
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    جاري فحص الملف لاستخراج معلومات المادة...
                 </div>
              ) : (detectedYear && detectedSubject) ? (
                 <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">✓</div>
                    <span>{`تم التعرف: بكالوريا ${detectedYear} - ${detectedSubject.name}`}</span>
                 </div>
              ) : null}
           </div>
        )}

        <button 
          onClick={handleAnalyzeAndSave} 
          disabled={!examFile || isAnalyzing || isDetecting || !detectedYear || !detectedSubject}
          className="w-full max-w-xl mx-auto flex bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold rounded-xl py-4 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 relative z-10"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              جاري الرفع والحفظ...
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
