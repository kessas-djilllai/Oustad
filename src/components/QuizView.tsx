import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Target, CheckCircle, ChevronLeft, RefreshCw, Star } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { supabase } from "../lib/supabase";
import { preprocessMath } from "../lib/utils";
import { getProgressSync, saveProgress, addXP } from "../lib/progress";

export function QuizView({ subjects, onBack }: { subjects: any[], onBack: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [step, setStep] = useState(0); // 0: select subject, 2: question answers, 3: result
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedAll, setCompletedAll] = useState(false);
  const [totalLevelsCount, setTotalLevelsCount] = useState(0);

  // Queue logic states
  const [questionsQueue, setQuestionsQueue] = useState<number[]>([]);
  const [currentQueueIdx, setCurrentQueueIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  
  // Stats
  const [answeredCorrectIds, setAnsweredCorrectIds] = useState<Set<number>>(new Set());
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const XP_PER_QUESTION = 10;
  const XP_RETRY_QUESTION = 2;

  const loadSubjectQuiz = async (subject: any) => {
      setSelectedSubject(subject);
      setLoading(true);
      setErrorMsg(null);
      setCompletedAll(false);
      
      try {
          if (!supabase) throw new Error("Supabase is not initialized");
          const { data } = await supabase.from('admin_settings').select('subject_cookies').limit(1).single();
          if (data && data.subject_cookies) {
              const parsed = JSON.parse(data.subject_cookies);
              const subjectCookies = parsed[subject.id];
              if (subjectCookies && subjectCookies.levels && subjectCookies.levels.length > 0) {
                  const unlockedLevel = getProgressSync('cookie_level', subject.id) || 0;
                  
                  if (unlockedLevel >= subjectCookies.levels.length) {
                      setCompletedAll(true);
                  } else {
                      const activeLevelData = subjectCookies.levels[unlockedLevel];
                      if (activeLevelData && activeLevelData.questions && activeLevelData.questions.length > 0) {
                          setQuestions(activeLevelData.questions);
                          setQuestionsQueue(activeLevelData.questions.map((_: any, i: number) => i));
                          setCurrentQueueIdx(0);
                          setCurrentLevelIdx(unlockedLevel);
                          setTotalLevelsCount(subjectCookies.levels.length);
                          
                          setAnsweredCorrectIds(new Set());
                          setFirstTryCorrect(0);
                          setWrongAnswers(0);
                          setXpEarned(0);
                          setSelectedAnswer(null);
                          setIsAnswerChecked(false);
                          
                          setStep(2);
                      } else {
                          setErrorMsg("لا توجد أسئلة في هذه المرحلة.");
                      }
                  }
              } else {
                  setErrorMsg("لا يوجد كويز لهذه المادة حاليا");
              }
          } else {
              setErrorMsg("لا يوجد كويز لهذه المادة حاليا");
          }
      } catch(e) {
          console.error("error loading cookies", e);
          setErrorMsg("حدث خطأ أثناء تحميل الكويز");
      } finally {
          setLoading(false);
      }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(idx);
    setIsAnswerChecked(true);
    
    const actualQIdx = questionsQueue[currentQueueIdx];
    const isCorrect = (idx === questions[actualQIdx].correct);
    const isFirstTime = questionsQueue.indexOf(actualQIdx) === currentQueueIdx;

    if (isCorrect) {
      setAnsweredCorrectIds(prev => new Set(prev).add(actualQIdx));
      if (isFirstTime) {
        setFirstTryCorrect(prev => prev + 1);
        setXpEarned(prev => prev + XP_PER_QUESTION);
      } else {
        setXpEarned(prev => prev + XP_RETRY_QUESTION);
      }
    } else {
      if (isFirstTime) {
        setWrongAnswers(prev => prev + 1);
      }
      setQuestionsQueue(prev => [...prev, actualQIdx]);
    }
  };

  const handleNext = () => {
    if (currentQueueIdx + 1 < questionsQueue.length) {
      setCurrentQueueIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      setStep(3); // Result
    }
  };

  const handleFinish = () => {
    if (selectedSubject) {
       let currentUnlocked = getProgressSync('cookie_level', selectedSubject.id) || 0;
       saveProgress('cookie_level', selectedSubject.id, Math.max(currentUnlocked, currentLevelIdx + 1));
       
       let currentProgress = getProgressSync('quiz_progress', selectedSubject.id);
       let additionalProgress = Math.round((currentLevelIdx + 1 / totalLevelsCount) * 100);
       let newProgress = Math.min(Math.max(currentProgress || 0, additionalProgress), 100);
       
       saveProgress('quiz_progress', selectedSubject.id, newProgress);
    }
    if (xpEarned > 0) {
      addXP(xpEarned);
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
          <h2 className="font-bold text-base md:text-xl text-slate-800">اختبار ومراحل الكوكيز</h2>
        </div>
      </div>

      <div className="glass rounded-[2rem] p-6 md:p-10 shadow-sm bg-white/60">
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
               <Target size={32} className="md:w-10 md:h-10" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">اختر مادة للاختبار</h3>
            <p className="text-sm md:text-base text-slate-500 mb-8">اختر المادة لتخطي المراحل المتاحة.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {subjects.map(s => (
                <button 
                   key={s.id} 
                   onClick={() => loadSubjectQuiz(s)}
                   disabled={loading && selectedSubject?.id === s.id}
                   className={`p-4 md:p-5 rounded-2xl border text-sm md:text-base font-bold transition-all text-right flex items-center justify-between ${selectedSubject?.id === s.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300'} disabled:opacity-50`}
                >
                  <span>{s.name}</span>
                  {loading && selectedSubject?.id === s.id ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-2 shrink-0"></div>
                  ) : selectedSubject?.id === s.id ? (
                      <CheckCircle size={18} className="text-blue-500 shrink-0 mr-2" />
                  ) : null}
                </button>
              ))}
              {subjects.length === 0 && <div className="col-span-full text-center text-sm text-slate-400 py-4">لا توجد مواد مضافة بعد.</div>}
            </div>
            
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-8 text-right w-full">
                <span className="shrink-0 font-bold">!</span>
                <p>{errorMsg}</p>
              </div>
            )}
            
            {completedAll && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-200 text-sm font-bold flex flex-col items-center gap-2 mb-8 text-center w-full">
                <CheckCircle size={32} className="mb-2" />
                <p className="text-lg">لقد أنهيت جميع مراحل هذه المادة بنجاح!</p>
                <button onClick={() => { saveProgress('cookie_level', selectedSubject.id, 0); loadSubjectQuiz(selectedSubject); }} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition">إعادة من البداية</button>
              </div>
            )}

          </div>
        )}

        {step === 2 && questions.length > 0 && typeof questionsQueue[currentQueueIdx] !== 'undefined' && (
          <div className="max-w-xl mx-auto">
            {/* Progress Bar over levels */}
            <div className="flex items-center gap-1 mb-6" dir="ltr">
              {Array.from({ length: totalLevelsCount }).map((_, i) => {
                   let percent = 0;
                   if (i < currentLevelIdx) percent = 100;
                   else if (i === currentLevelIdx) {
                       percent = (answeredCorrectIds.size / questions.length) * 100;
                   }
                   return (
                       <div key={i} className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden relative">
                           <div 
                               className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-300"
                               style={{ width: `${percent}%` }}
                           />
                       </div>
                   )
              })}
            </div>

            <div className="flex justify-between items-center text-xs md:text-sm text-slate-400 font-bold mb-6 md:mb-8">
               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {questionsQueue.indexOf(questionsQueue[currentQueueIdx]) === currentQueueIdx 
                     ? `السؤال ${currentQueueIdx + 1} من ${questions.length}` 
                     : <span className="flex items-center gap-1 text-amber-600"><RefreshCw size={14} /> إعادة سؤال سابق</span>
                  }
               </span>
               <span className="text-blue-500 font-bold flex flex-col sm:flex-row items-end sm:items-center gap-1.5"><Target size={14} /> <span className="line-clamp-1">المرحلة {currentLevelIdx + 1}</span></span>
            </div>
            
            <div className="text-lg md:text-2xl font-bold text-slate-800 mb-8 md:mb-10 leading-relaxed text-center markdown-body quiz-markdown prose max-w-none" dir="rtl">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                {preprocessMath(questions[questionsQueue[currentQueueIdx]].q)}
              </ReactMarkdown>
            </div>
            
            <div className="space-y-3 md:space-y-4 mb-10">
              {questions[questionsQueue[currentQueueIdx]].options && questions[questionsQueue[currentQueueIdx]].options.map((opt: string, idx: number) => {
                let btnClass = 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-sm';
                if (isAnswerChecked) {
                    if (idx === questions[questionsQueue[currentQueueIdx]].correct) {
                        btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm';
                    } else if (selectedAnswer === idx) {
                        btnClass = 'border-red-500 bg-red-50 text-red-700 shadow-sm';
                    } else {
                        btnClass = 'border-slate-200 bg-slate-50 text-slate-400 opacity-70';
                    }
                }
                
                return (
                  <div key={idx} className="space-y-2">
                    <button 
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerChecked}
                      className={`w-full p-4 md:p-5 rounded-2xl border text-sm md:text-base font-bold transition-all text-right markdown-body quiz-markdown prose max-w-none ${btnClass}`}
                      dir="rtl"
                    >
                       <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                          {preprocessMath(opt)}
                      </ReactMarkdown>
                    </button>
                    {isAnswerChecked && idx === questions[questionsQueue[currentQueueIdx]].correct && questions[questionsQueue[currentQueueIdx]].justification && (
                      <div className="text-right p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold mb-2 flex items-center justify-end gap-2 text-emerald-900">
                          <span>التبرير</span>
                        </h4>
                        <div className="text-sm md:text-base markdown-body quiz-markdown" dir="rtl">
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                              {preprocessMath(questions[questionsQueue[currentQueueIdx]].justification)}
                           </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isAnswerChecked && (
              <button 
                onClick={handleNext}
                className="w-full bg-slate-800 text-white font-bold rounded-xl py-3.5 md:py-4 transition-all hover:bg-slate-900 text-sm md:text-base shadow-lg animate-in fade-in slide-in-from-bottom-2"
              >
                {currentQueueIdx + 1 === questionsQueue.length ? 'إنهاء المرحلة' : 'السؤال التالي'}
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center pt-4 pb-4 max-w-lg mx-auto">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Target size={40} className="md:w-12 md:h-12" />
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">اكتملت المرحلة!</h3>
            <p className="text-slate-500 mb-8 font-bold">إليك إحصائياتك في هذه المرحلة</p>
            
            <div className="space-y-4 mb-8 text-right">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
                 <span className="font-bold text-emerald-700 bg-white px-3 py-1 rounded-lg shadow-sm">{firstTryCorrect} من {questions.length}</span>
                 <span className="text-emerald-800 font-bold">إجابات صحيحة من أول محاولة</span>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex justify-between items-center">
                 <span className="font-bold text-red-700 bg-white px-3 py-1 rounded-lg shadow-sm">{wrongAnswers}</span>
                 <span className="text-red-800 font-bold">إجابات خاطئة</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex justify-between items-center">
                 <span className="font-bold text-amber-700 bg-white px-3 py-1 rounded-lg shadow-sm flex items-center gap-1"><Star size={16} className="fill-amber-500" /> +{xpEarned} XP</span>
                 <span className="text-amber-800 font-bold">النقاط المكتسبة</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => {
                  setQuestionsQueue(questions.map((_: any, i: number) => i));
                  setCurrentQueueIdx(0);
                  setAnsweredCorrectIds(new Set());
                  setFirstTryCorrect(0);
                  setWrongAnswers(0);
                  setXpEarned(0);
                  setSelectedAnswer(null);
                  setIsAnswerChecked(false);
                  setStep(2);
                }}
                className="flex-1 bg-slate-100 text-slate-700 font-bold rounded-xl py-3.5 hover:bg-slate-200 transition-all text-sm md:text-base flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                <span>إعادة المرحلة</span>
              </button>
              
              <button 
                onClick={handleFinish}
                className="flex-1 bg-emerald-500 text-white font-bold rounded-xl py-3.5 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 text-sm md:text-base flex items-center justify-center gap-2"
              >
                <ChevronRight size={18} className="rotate-180" />
                <span>متابعة</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
