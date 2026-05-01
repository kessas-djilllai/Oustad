import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Target, CheckCircle, ChevronLeft } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { getQuizPrompt } from "../lib/promptQuiz";
import { supabase } from "../lib/supabase";
import { preprocessMath } from "../lib/utils";
import { getProgressSync, saveProgress, addXP } from "../lib/progress";

export function QuizView({ subjects, onBack }: { subjects: any[], onBack: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [step, setStep] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    if (!selectedSubject || !selectedUnit) return;

    setErrorMsg(null);
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
      setErrorMsg("الرجاء إعداد مفتاح Gemini API من صفحة الإعدادات (في لوحة الإدارة) أولاً.");
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = getQuizPrompt(selectedSubject.name, selectedUnit.name);
      
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
                    q: { type: Type.STRING },
                    options: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    correct: { type: Type.INTEGER },
                    justification: { type: Type.STRING }
                },
                required: ["q", "options", "correct", "justification"],
                }
            }
        }
      });
      let generated = JSON.parse(response.text || '[]');
      if (generated && generated.length > 0) {
        // Randomize the options since AI sometimes returns the correct answer in the first position
        generated = generated.map((q: any) => {
          const correctValue = q.options[q.correct];
          const newOptions = [...q.options];
          for (let i = newOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newOptions[i], newOptions[j]] = [newOptions[j], newOptions[i]];
          }
          return {
            ...q,
            options: newOptions,
            correct: newOptions.indexOf(correctValue)
          };
        });

        setQuestions(generated);
        setStep(2);
      } else {
        throw new Error("لم يتم إرجاع أي أسئلة.");
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || String(e);
      if (errMsg.includes('504') || errMsg.includes('503')) errMsg = "الخادم يواجه ضغطاً (503/504). المحاولة لاحقاً.";
      else if (errMsg.includes('Failed to fetch')) errMsg = "انقطع الاتصال بالإنترنت أو الخادم أثناء التحليل.";
      else if (errMsg.includes('token limit')) errMsg = "تجاوز التوليد الحد الأقصى للنصوص المسموح بها.";
      else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) errMsg = "لقد استنفدت الحصة المجانية لمفتاح Gemini API هذا (Quota Exceeded). يرجى التحقق من خطة الدفع الخاصة بك أو إضافة مفتاح API جديد.";
      setErrorMsg('حدث خطأ أثناء توليد الكويز: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && selectedSubject) {
      setStep(1); // Select unit
    } else if (step === 1 && selectedUnit) {
      handleGenerateQuiz();
    } else if (step === 2) {
      if (!isAnswerChecked) {
        setIsAnswerChecked(true);
        if (selectedAnswer === questions[currentQuestionIdx].correct) {
          setScore(score + 1);
        }
      } else {
        if (currentQuestionIdx + 1 < questions.length) {
          setCurrentQuestionIdx(currentQuestionIdx + 1);
          setSelectedAnswer(null);
          setIsAnswerChecked(false);
        } else {
          setStep(3); // Result
        }
      }
    }
  };

  const handleFinish = () => {
    if (selectedSubject) {
       let current = getProgressSync('quiz_progress', selectedSubject.id);
       let additionalProgress = Math.round((score / questions.length) * 100);
       let newProgress = Math.min((current < additionalProgress ? additionalProgress : current), 100);
       
       saveProgress('quiz_progress', selectedSubject.id, newProgress);
    }
    if (score > 0) {
      addXP(score * 2);
    }
    onBack();
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto mt-4 md:mt-10">
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
        <button onClick={onBack} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl glass hover:bg-white flex items-center justify-center text-slate-600 transition-all font-bold">
          <ChevronRight size={18} className="md:w-5 md:h-5" />
        </button>
        <div>
          <h2 className="font-bold text-base md:text-xl text-slate-800">اختبار سريع (كويز)</h2>
        </div>
      </div>

      <div className="glass rounded-[2rem] p-6 md:p-10 shadow-sm bg-white/60">
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
               <Target size={32} className="md:w-10 md:h-10" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">اختر مادة للاختبار</h3>
            <p className="text-sm md:text-base text-slate-500 mb-8">اختر المادة التي تريد تقييم مستواك فيها لزيادة نسبة تقدمك في الكويز.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {subjects.map(s => (
                <button 
                   key={s.id} 
                   onClick={() => setSelectedSubject(s)}
                   className={`p-4 md:p-5 rounded-2xl border text-sm md:text-base font-bold transition-all text-right flex items-center justify-between ${selectedSubject?.id === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300'}`}
                >
                  <span>{s.name}</span>
                  {selectedSubject?.id === s.id && <CheckCircle size={18} className="text-blue-500" />}
                </button>
              ))}
              {subjects.length === 0 && <div className="col-span-full text-center text-sm text-slate-400 py-4">لا توجد مواد مضافة بعد.</div>}
            </div>

            <button 
              onClick={handleNext}
              disabled={!selectedSubject}
              className="w-full sm:w-1/2 mx-auto bg-blue-600 text-white font-bold rounded-xl py-3.5 md:py-4 hover:bg-blue-700 transition-all disabled:opacity-50 text-sm md:text-base shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <span>اختر الوحدة</span>
              <ChevronLeft size={18} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">اختر وحدة من مادة {selectedSubject?.name}</h3>
            <p className="text-sm md:text-base text-slate-500 mb-8">سيتم توليد أسئلة الكويز بناءً على محتوى الوحدة بواسطة الذكاء الاصطناعي.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-64 overflow-y-auto pl-2 pr-2">
              {selectedSubject?.units?.map((u: any) => (
                <button 
                   key={u.id} 
                   onClick={() => setSelectedUnit(u)}
                   className={`p-4 md:p-5 rounded-2xl border text-sm md:text-base font-bold transition-all text-right flex items-center justify-between ${selectedUnit?.id === u.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300'}`}
                >
                  <span className="line-clamp-1 text-right w-full block">{u.name}</span>
                  {selectedUnit?.id === u.id && <CheckCircle size={18} className="text-emerald-500 shrink-0 mr-2" />}
                </button>
              ))}
              {(!selectedSubject?.units || selectedSubject.units.length === 0) && <div className="col-span-full text-center text-sm text-slate-400 py-4">لا توجد وحدات.</div>}
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-8 text-right text-right w-full">
                <span className="shrink-0 font-bold">!</span>
                <p>{errorMsg}</p>
              </div>
            )}

            <button 
              onClick={handleNext}
              disabled={!selectedUnit || loading}
              className="w-full sm:w-1/2 mx-auto bg-emerald-600 text-white font-bold rounded-xl py-3.5 md:py-4 hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm md:text-base shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">جاري التوليد...</span>
              ) : (
                <>
                  <span>توليد كويز والبدء</span>
                  <ChevronLeft size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && questions.length > 0 && (
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center text-xs md:text-sm text-slate-400 font-bold mb-6 md:mb-8">
               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">السؤال {currentQuestionIdx + 1} من {questions.length}</span>
               <span className="text-blue-500 font-bold flex flex-col sm:flex-row items-end sm:items-center gap-1.5"><Target size={14} /> <span className="line-clamp-1">{selectedUnit?.name}</span></span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-slate-800 mb-8 md:mb-10 leading-relaxed text-center markdown-body quiz-markdown prose max-w-none" dir="rtl">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {preprocessMath(questions[currentQuestionIdx].q)}
              </ReactMarkdown>
            </div>
            
            <div className="space-y-3 md:space-y-4 mb-10">
              {questions[currentQuestionIdx].options.map((opt: string, idx: number) => {
                let btnClass = 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-sm';
                if (isAnswerChecked) {
                    if (idx === questions[currentQuestionIdx].correct) {
                        btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm';
                    } else if (selectedAnswer === idx) {
                        btnClass = 'border-red-500 bg-red-50 text-red-700 shadow-sm';
                    }
                } else if (selectedAnswer === idx) {
                    btnClass = 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm';
                }
                
                return (
                  <div key={idx} className="space-y-2">
                    <button 
                      onClick={() => !isAnswerChecked && setSelectedAnswer(idx)}
                      disabled={isAnswerChecked}
                      className={`w-full p-4 md:p-5 rounded-2xl border text-sm md:text-base font-bold transition-all text-right markdown-body quiz-markdown prose max-w-none ${btnClass}`}
                      dir="rtl"
                    >
                       <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {preprocessMath(opt)}
                      </ReactMarkdown>
                    </button>
                    {isAnswerChecked && idx === questions[currentQuestionIdx].correct && questions[currentQuestionIdx].justification && (
                      <div className="text-right p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold mb-2 flex items-center justify-end gap-2 text-emerald-900">
                          <span>التبرير</span>
                        </h4>
                        <div className="text-sm md:text-base markdown-body quiz-markdown" dir="rtl">
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {preprocessMath(questions[currentQuestionIdx].justification)}
                           </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button 
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className={`w-full text-white font-bold rounded-xl py-3.5 md:py-4 transition-all disabled:opacity-50 text-sm md:text-base shadow-lg disabled:shadow-none ${isAnswerChecked ? 'bg-slate-800 hover:bg-slate-900' : 'bg-slate-800 hover:bg-slate-900'}`}
            >
              {isAnswerChecked ? (currentQuestionIdx + 1 === questions.length ? 'النتيجة' : 'السؤال التالي') : 'تحقق من الإجابة'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center pt-8 md:pt-12 pb-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
               <CheckCircle size={40} className="md:w-12 md:h-12" />
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 md:mb-4">أحسنت!</h3>
            <p className="text-sm md:text-base text-slate-500 mb-8 font-medium leading-relaxed max-w-sm mx-auto">
              لقد أكملت الكويز بنجاح وجصلت على <span className="font-bold text-emerald-600 border px-2 py-1 rounded bg-emerald-50">{score} من {questions.length}</span> وتم تحديث نسبة التقدم.
            </p>
            
            <button 
              onClick={handleFinish}
              className="w-full sm:w-1/2 mx-auto bg-emerald-500 text-white font-bold rounded-xl py-3.5 md:py-4 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 text-sm md:text-base flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
