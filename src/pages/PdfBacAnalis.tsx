import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";
import { triggerAlert, AlertModal } from "./Admin";
import { ChevronRight, FileText, Wand2, Plus, Upload, AlertCircle } from "lucide-react";
import { getAnalyzePrompt } from "../lib/promptAnalys";
import { preprocessMath } from "../lib/utils";

export function PdfBacAnalis({ onBack: customOnBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const onBack = customOnBack || (() => navigate(-1));
  const [examFile, setExamFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [bacInfo, setBacInfo] = useState<{year: string, specialization: string} | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbUnits, setDbUnits] = useState<any[]>([]);
  const [savingState, setSavingState] = useState<Record<string, boolean>>({});
  const [addedState, setAddedState] = useState<Record<string, boolean>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      const { data: s } = await supabase.from('subjects').select('*');
      if (s) setDbSubjects(s);
      const { data: u } = await supabase.from('units').select('*');
      if (u) setDbUnits(u);
    }
    fetchData();
  }, []);

  const handleExamFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExamFile(e.target.files[0]);
    }
  };

  const getBase64 = (fileObj: File): Promise<string> => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(fileObj);
  });

  const handleAnalyze = async () => {
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
      setErrorMsg(null);
      setResults([]);
      setBacInfo(null);
      setExpandedExercise(null);
      
      const { data: settingsData } = await supabase.from('admin_settings').select('api_key, ai_model').limit(1).single();
      if (!settingsData?.api_key) {
        throw new Error("لم يتم تكوين مفتاح API. يرجى إعداده في الإعدادات.");
      }

      const examBase64Data = await getBase64(examFile);
      const ai = new GoogleGenAI({ apiKey: settingsData.api_key });

      const availableSubjectsContext = dbSubjects.map(sub => {
        const subUnits = dbUnits.filter(u => u.subject_id === sub.id).map(u => u.name).join('، ');
        return `- المادة: ${sub.name} (الوحدات: ${subUnits || 'لا يوجد وحدات'})`;
      }).join('\n');

      const prompt = getAnalyzePrompt(availableSubjectsContext);

      const response = await ai.models.generateContent({
        model: settingsData.ai_model || 'gemini-2.5-flash',
        contents: [
            {
              role: 'user',
              parts: [
                { text: 'هذا هو ملف موضوع الامتحان:' },
                { inlineData: { data: examBase64Data, mimeType: examFile.type } },
                { text: prompt }
              ]
            }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bac_year: { type: Type.STRING },
              specialization: { type: Type.STRING },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    exercises: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          exercise_number: { type: Type.NUMBER },
                          subject: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          exam: { type: Type.STRING, description: "نص التمرين بتنسيق Markdown." }
                        },
                        required: ["exercise_number", "subject", "unit", "exam"]
                      }
                    }
                  },
                  required: ["topic", "exercises"]
                }
              }
            },
            required: ["topics", "bac_year", "specialization"]
          }
        }
      });

      const textResponse = response.text || '';
      const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
          const parsed = JSON.parse(cleanedJson);
          
          let parsedTopics = [];
          if (parsed.topics && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
            parsedTopics = parsed.topics;
            setBacInfo({ year: parsed.bac_year || '', specialization: parsed.specialization || '' });
          } else if (Array.isArray(parsed) && parsed.length > 0) {
             // If flat array of topics:
             if (parsed[0].exercises) {
                 parsedTopics = parsed;
             } else {
                 // It's a flat array of exercises
                 parsedTopics = [
                     {
                         topic: "التمارين المستخرجة",
                         exercises: parsed
                     }
                 ];
             }
             setBacInfo({ year: '', specialization: '' });
          } else if (parsed.exercise_number && parsed.exam) {
             // Single exercise returned
             parsedTopics = [
                 {
                     topic: "التمرين",
                     exercises: [parsed]
                 }
             ];
             setBacInfo({ year: '', specialization: '' });
          } else {
             console.error("Unknown parsed format:", parsed);
             if (parsed.topics) {
               // topics is defined but maybe not array?
               parsedTopics = Array.isArray(parsed.topics) ? parsed.topics : [parsed.topics];
             }
          }
          
          if (parsedTopics.length > 0) {
             setResults(parsedTopics);
             setShowSuccessModal(true);
          } else {
             throw new Error("تنسيق الاستجابة غير صحيح أو لا يحتوي على تمارين.");
          }
      } catch(e: any) {
          console.error("Parse Error Details:", { cleanedJson, originalText: textResponse });
          throw new Error("فشل في استخراج البيانات. قد يكون المخرج طويلاً جداً أو غير مكتمل. تفاصيل الخطأ: " + e.message);
      }

    } catch (e: any) {
      console.error("Full Error:", e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً (503/504). المحاولة لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم أثناء التحليل.";
      else if (errMsg.includes('token limit')) errMsg = "تجاوز التحليل الحد الأقصى للنصوص المسموح بها.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية أو تجاوزت عدد الطلبات في الدقيقة (Rate Limit) لمفتاحك، أو حجم الملف كبير جداً. انتظر دقيقة ثم حاول مجدداً، أو تأكد من اختيار نموذج gemini-2.5-flash من الإعدادات.";
      setErrorMsg("حدث خطأ أثناء التحليل: " + errMsg);
      triggerAlert("حدث خطأ أثناء التحليل: " + errMsg, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSolution = (topicIndex: number, exerciseIndex: number) => {
    const key = `${topicIndex}-${exerciseIndex}`;
    setExpandedExercise(prev => prev === key ? null : key);
  };

  const handleAddExerciseToUnit = async (exerciseData: any, topicGroupIndex: number, exerciseIndex: number, tInfo?: any) => {
    if (!supabase) return;
    
    const dbSubject = dbSubjects.find(s => s.name?.trim() === exerciseData.subject?.trim());
    let targetUnitId = null;

    if (dbSubject) {
       const matchingUnit = dbUnits.find(u => u.subject_id === dbSubject.id && u.name?.trim() === exerciseData.unit?.trim());
       if (matchingUnit) targetUnitId = matchingUnit.id;
    } else {
       const matchingUnit = dbUnits.find(u => u.name?.trim() === exerciseData.unit?.trim());
       if (matchingUnit) targetUnitId = matchingUnit.id;
    }

    if (!targetUnitId) {
       triggerAlert(`لم يتم العثور على وحدة متطابقة لـ "${exerciseData.unit}". يرجى التأكد من اسم الوحدة والمادة.`, "error");
       return;
    }

    const stateKey = `${topicGroupIndex}-${exerciseIndex}`;
    setSavingState(prev => ({ ...prev, [stateKey]: true }));

    try {
      const exercise_id = 'e_' + Math.random().toString(36).substr(2, 9);
      const bYear = bacInfo?.year || '';
      const bSpec = bacInfo?.specialization || '';
      const tName = tInfo?.topic || '';
      const title = `تمرين ${exerciseData.exercise_number} - باك ${bYear} ${bSpec} (${tName})`;
      
      const contentArr = [{
        exam: exerciseData.exam
      }];

      const { error } = await supabase.from('exercises').insert([{
        id: exercise_id,
        unit_id: targetUnitId,
        title: title,
        exercise_order: 99,
        content: JSON.stringify(contentArr)
      }]);

      if (error) throw error;
      triggerAlert("تمت إضافة التمرين إلى قاعدة البيانات بنجاح!", "success", false);
      setAddedState(prev => ({ ...prev, [stateKey]: true }));
    } catch (e: any) {
      triggerAlert("حدث خطأ أثناء حفظ التمرين: " + e.message, "error");
    } finally {
      setSavingState(prev => ({ ...prev, [stateKey]: false }));
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 animate-in fade-in relative">
      <AlertModal />
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">نجاح التحليل!</h3>
            <p className="text-slate-600 mb-6 font-medium text-sm">تم تحليل ملف PDF واستخراج التمارين بنجاح. راجع النتائج في الأسفل.</p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                // Try scrolling down to results if possible
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-3 transition-colors"
            >
              عرض النتائج
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
           <FileText size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">تحليل ملف PDF للبكالوريا</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">باستخدام الذكاء الاصطناعي</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-xl mx-auto w-full">
          <div className="glass rounded-2xl p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-center relative hover:bg-indigo-50/50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={handleExamFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-3">
               <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center shadow-inner">
                 {examFile ? <FileText size={32} /> : <Upload size={32} />}
               </div>
               <div>
                 <p className="font-bold text-slate-700">{examFile ? examFile.name : "رفع موضوع الامتحان (PDF)"}</p>
                 <p className="text-xs text-slate-500 mt-1">الحد الأقصى 5MB</p>
               </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleAnalyze} 
          disabled={!examFile || isAnalyzing}
          className="w-full max-w-xl mx-auto flex bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold rounded-xl py-4 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              جاري التحليل بالذكاء الاصطناعي...
            </>
          ) : (
             <>
               <Wand2 size={20} />
               تحليل الموضوع
             </>
          )}
        </button>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl whitespace-pre-wrap" dir="rtl">
            <h4 className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={18} /> حدث خطأ</h4>
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-8 animate-in fade-in">
            <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
              نتائج التحليل
              {bacInfo && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg">{bacInfo.year}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">{bacInfo.specialization}</span>
                </div>
              )}
            </h3>
            
            <div className="grid gap-8">
              {results.map((topicGroup: any, tIdx: number) => (
                <div key={tIdx} className="space-y-4">
                  <h4 className="font-bold text-md text-indigo-700 bg-indigo-50 inline-block px-4 py-2 rounded-xl border border-indigo-100">{topicGroup.topic}</h4>
                  <div className="grid gap-4">
                    {(!topicGroup.exercises || topicGroup.exercises.length === 0) ? (
                       <div className="text-center p-4 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                          لم يتم استخراج أي تمارين في هذا الموضوع.
                       </div>
                    ) : topicGroup.exercises.map((res: any, idx: number) => {
                      if (!res) return null;
                      const solKey = `${tIdx}-${idx}`;

                      return (
                      <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-6 shadow-sm">
                        <div 
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleSolution(tIdx, idx)}
                        >
                           <div className="flex items-center gap-3">
                             <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-black text-lg shadow-sm">
                               {res.exercise_number || (idx + 1)}
                             </span>
                             <div>
                               <span className="text-xs text-slate-500 font-bold block mb-1">المادة</span>
                               <span className="font-bold text-slate-800 text-lg">{res.subject || 'غير محدد'}</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-4">
                             <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 flex-1 md:text-left text-right shadow-sm">
                               <span className="text-xs text-slate-500 font-bold block mb-1">الوحدة الدراسية</span>
                               <span className="font-bold text-emerald-600">{res.unit || 'غير محدد'}</span>
                             </div>
                             {res.exam && (
                               <button className={`h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${expandedExercise === solKey ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                                  {expandedExercise === solKey ? <ChevronRight size={16} className="-rotate-90" /> : <ChevronRight size={16} className="rotate-90" />}
                                  {expandedExercise === solKey ? 'إخفاء التمرين' : 'عرض التمرين'}
                               </button>
                             )}
                           </div>
                        </div>

                        {(expandedExercise === solKey && res.exam) && (
                          <div className="p-2 md:p-6 bg-white border-t border-slate-200 animate-in slide-in-from-top-2 fade-in space-y-8">
                               <div className="markdown-container prose prose-slate prose-base md:prose-lg max-w-none text-right leading-loose w-full" dir="rtl">
                                 <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(String(res.exam))}</ReactMarkdown>
                               </div>
                               
                               <div className="pt-6 border-t border-slate-100 flex justify-end">
                                 {addedState[solKey] ? (
                                    <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-emerald-200 shadow-sm transition-all">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      تمت إضافة التمرين بنجاح
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleAddExerciseToUnit(res, tIdx, idx, topicGroup); }}
                                      disabled={savingState[solKey]}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                    >
                                      {savingState[solKey] ? (
                                        <span>جاري الإضافة...</span>
                                      ) : (
                                        <>
                                          <Plus size={20} />
                                          إضافة التمرين إلى قاعدة البيانات
                                        </>
                                      )}
                                    </button>
                                  )}
                               </div>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
