import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Target, CheckCircle, ChevronLeft, RefreshCw, Star, Trophy, BookOpen, Flag } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { supabase } from "../lib/supabase";
import { preprocessMath } from "../utils";
import { getProgressSync, saveProgress, addXP } from "../lib/progress";

export function QuizView({ subjects, onBack }: { subjects: any[], onBack: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [step, setStep] = useState(0); // 0: select subject, 2: question answers, 3: result, 4: complete all
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  // Auto-scroll progress bar when level changes
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        const activeNode = document.getElementById(`level-node-${currentLevelIdx}`);
        if (activeNode) {
          activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, [currentLevelIdx, step]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedAll, setCompletedAll] = useState(false);
  const [totalLevelsCount, setTotalLevelsCount] = useState(0);
  const [subjectCookiesStore, setSubjectCookiesStore] = useState<any>(null);

  const totalQuizProgress = subjects.length > 0 
    ? Math.round(subjects.reduce((acc, sub) => acc + (sub.quiz_progress || 0), 0) / subjects.length)
    : 0;

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
              setSubjectCookiesStore(subjectCookies);
              if (subjectCookies && subjectCookies.levels && subjectCookies.levels.length > 0) {
                  const unlockedLevel = getProgressSync('cookie_level', subject.id) || 0;
                  
                  if (unlockedLevel >= subjectCookies.levels.length) {
                      setCompletedAll(true);
                  } else {
                      setupLevel(subjectCookies, unlockedLevel, subject);
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

  const setupLevel = (subjectCookies: any, levelIdx: number, subjectParam?: any) => {
      const activeLevelData = subjectCookies.levels[levelIdx];
      const subj = subjectParam || selectedSubject;
      if (activeLevelData && activeLevelData.questions && activeLevelData.questions.length > 0) {
          setQuestions(activeLevelData.questions);
          setQuestionsQueue(activeLevelData.questions.map((_: any, i: number) => i));
          
          let savedQidx = 0;
          if (subj) {
             savedQidx = getProgressSync('cookie_qidx', `${subj.id}_${levelIdx}`) || 0;
          }
          savedQidx = Math.min(savedQidx, activeLevelData.questions.length - 1);
          if (savedQidx < 0) savedQidx = 0;

          setCurrentQueueIdx(savedQidx);
          setCurrentLevelIdx(levelIdx);
          setTotalLevelsCount(subjectCookies.levels.length);
          
          let prevAnswered = new Set<number>();
          let prevFirstTry = 0;
          let prevXp = 0;
          for(let i=0; i<savedQidx; i++) {
              prevAnswered.add(i);
              prevFirstTry++;
              prevXp += XP_PER_QUESTION;
          }
          setAnsweredCorrectIds(prevAnswered);
          setFirstTryCorrect(prevFirstTry);
          setXpEarned(prevXp);
          
          setWrongAnswers(0);
          setSelectedAnswer(null);
          setIsAnswerChecked(false);
          
          setStep(2);
      } else {
          setErrorMsg("لا توجد أسئلة في هذه المرحلة.");
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
      
      const isReplay = selectedSubject && (getProgressSync('cookie_level', selectedSubject.id) || 0) > currentLevelIdx;
      
      if (!isReplay) {
          if (isFirstTime) {
            setFirstTryCorrect(prev => prev + 1);
            setXpEarned(prev => prev + XP_PER_QUESTION);
          } else {
            setXpEarned(prev => prev + XP_RETRY_QUESTION);
          }
      } else {
          if (isFirstTime) {
              setFirstTryCorrect(prev => prev + 1);
          }
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
      const nextIdx = currentQueueIdx + 1;
      setCurrentQueueIdx(nextIdx);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      
      if (selectedSubject && nextIdx < questions.length) {
         saveProgress('cookie_qidx', `${selectedSubject.id}_${currentLevelIdx}`, nextIdx);
         
         let currentUnlocked = getProgressSync('cookie_level', selectedSubject.id) || 0;
         if (currentLevelIdx === currentUnlocked) {
             let levelFraction = nextIdx / questions.length;
             let newProgress = Math.min(Math.round(((currentUnlocked + levelFraction) / totalLevelsCount) * 100), 100);
             saveProgress('quiz_progress', selectedSubject.id, newProgress);
         }
      }
    } else {
      setStep(3); // Result
    }
  };

  const handleLevelFinishContinue = () => {
    if (selectedSubject) {
       let currentUnlocked = getProgressSync('cookie_level', selectedSubject.id) || 0;
       currentUnlocked = Math.max(currentUnlocked, currentLevelIdx + 1);
       saveProgress('cookie_level', selectedSubject.id, currentUnlocked);
       
       let newProgress = Math.min(Math.round((currentUnlocked / totalLevelsCount) * 100), 100);
       saveProgress('quiz_progress', selectedSubject.id, newProgress);

       if (xpEarned > 0) {
         addXP(xpEarned);
       }

       if (currentLevelIdx < (getProgressSync('cookie_level', selectedSubject.id) || 0) - 1) {
           // They just finished a replay of a past level. Take them back to their current active highest level!
           const targetLevel = getProgressSync('cookie_level', selectedSubject.id) || 0;
           if (targetLevel < totalLevelsCount && subjectCookiesStore) {
               setupLevel(subjectCookiesStore, targetLevel);
           } else {
               setStep(4);
           }
       } else if (currentLevelIdx + 1 < totalLevelsCount && subjectCookiesStore) {
           setupLevel(subjectCookiesStore, currentLevelIdx + 1);
       } else {
           setStep(4); // Fully completed
       }
    }
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

      <div className={`${step === 0 ? '' : 'glass rounded-[2rem] p-6 shadow-sm bg-white/60 md:p-10'}`}>
        {step === 0 && (
          <div className="w-full">
            <div className="text-center mb-10">
              <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto mb-6 flex items-center justify-center">
                {/* Background Track */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100"
                  />
                  {/* Progress Fill */}
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="100 100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - totalQuizProgress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    pathLength="100"
                    strokeLinecap="round"
                    className="text-blue-500"
                  />
                </svg>
                
                <div className="w-20 h-20 md:w-28 md:h-28 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner relative z-10">
                   <div className="text-base md:text-2xl font-black">{totalQuizProgress}%</div>
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">تقدم الكويز</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium max-w-md mx-auto">اختر المادة من القائمة لبدء تحدياتك وتخطي المراحل المتاحة.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 active-tab-transition">
              {subjects.map(sub => {
                const Icon = sub.icon || BookOpen;
                return (
                <div 
                  key={`${sub.id}`}
                  onClick={() => loadSubjectQuiz(sub)}
                  className="glass rounded-3xl md:rounded-[2rem] p-4 lg:p-6 flex flex-col justify-between cursor-pointer group glass-hover relative overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className={`absolute -left-10 -top-10 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all pointer-events-none ${sub.barColor}`} />
                  <div className="flex justify-between items-start mb-4 md:mb-6 relative">
                     <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${sub.bg || 'bg-blue-50'} ${sub.color || 'text-blue-500'} flex items-center justify-center shadow-sm`}>
                       {loading && selectedSubject?.id === sub.id ? (
                           <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                       ) : (
                           <Icon size={20} className="md:w-7 md:h-7" />
                       )}
                     </div>
                  </div>
                  <div>
                     <h4 className="font-bold text-sm md:text-lg text-slate-800 mb-2 md:mb-4 truncate">{sub.name}</h4>
                     <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 md:mb-2">
                        <span>التقدم</span>
                        <span className={sub.quiz_progress === 100 ? 'text-emerald-500 font-extrabold' : ''}>{sub.quiz_progress || 0}%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-1.5 md:h-2 overflow-hidden">
                       <div className={`h-full rounded-full transition-all duration-1000 ${sub.quiz_progress === 100 ? 'bg-emerald-500' : sub.barColor || 'bg-blue-500'}`} style={{ width: `${sub.quiz_progress || 0}%` }} />
                     </div>
                  </div>
                </div>
              )})}
              {subjects.length === 0 && <div className="col-span-full text-center text-sm text-slate-400 py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">لا توجد مواد مضافة بعد.</div>}
            </div>
            
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-red-50 text-red-600 p-5 rounded-2xl border border-red-200 text-sm font-bold flex items-center gap-3 text-right w-full shadow-sm">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                <p>{errorMsg}</p>
              </motion.div>
            )}
            
            {completedAll && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-emerald-50 text-emerald-700 p-6 rounded-3xl border border-emerald-200 text-sm font-bold flex flex-col items-center gap-3 text-center w-full shadow-sm">
                <CheckCircle size={40} className="mb-2 text-emerald-500" />
                <p className="text-xl">لقد أنهيت جميع مراحل هذه المادة بنجاح!</p>
                <button onClick={() => { 
                  saveProgress('cookie_level', selectedSubject.id, 0); 
                  saveProgress('quiz_progress', selectedSubject.id, 0); 
                  for(let i=0; i<totalLevelsCount; i++) {
                     saveProgress('cookie_qidx', `${selectedSubject.id}_${i}`, 0);
                  }
                  loadSubjectQuiz(selectedSubject); 
                }} className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl text-base font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">إعادة من البداية</button>
              </motion.div>
            )}
            
          </div>
        )}

        {step === 2 && questions.length > 0 && typeof questionsQueue[currentQueueIdx] !== 'undefined' && (
          <div className="max-w-xl mx-auto">
            {/* Progress Bar over levels */}
            <div className="relative mb-10 overflow-x-auto pb-4 hide-scrollbar scroll-smooth" id="levels-progress-container">
              <div className="min-w-full inline-flex relative px-4 md:px-6 py-2">
                
                <div className="absolute top-1/2 right-[2rem] md:right-[3rem] left-[2rem] md:left-[3rem] h-1.5 md:h-2 bg-slate-200 rounded-full -translate-y-1/2 z-0 min-w-max">
                    <div 
                        className="absolute top-0 right-0 h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ 
                            width: `${
                                (((selectedSubject ? getProgressSync('cookie_level', selectedSubject.id) || 0 : 0) + (currentLevelIdx === (selectedSubject ? getProgressSync('cookie_level', selectedSubject.id) || 0 : 0) ? answeredCorrectIds.size / questions.length : 0)) / totalLevelsCount) * 100
                            }%`,
                            maxWidth: '100%'
                        }}
                    />
                </div>
                
                <div className="flex justify-between items-center w-full gap-4 md:gap-8 relative z-10 min-w-max px-2">
                   {/* The Start Node */}
                   <div className={`shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-xs md:text-sm transition-all duration-500 bg-emerald-500 border-4 border-emerald-500 text-white shadow-md shadow-emerald-500/30`}>
                      <Flag size={16} className="md:w-5 md:h-5 text-white" />
                   </div>

                   {Array.from({ length: totalLevelsCount }).map((_, i) => {
                       const currentUnlocked = selectedSubject ? (getProgressSync('cookie_level', selectedSubject.id) || 0) : 0;
                       const isCompleted = i < currentUnlocked;
                       const isCurrentActive = i === currentLevelIdx;
                       const isClickable = i <= currentUnlocked;
                       
                       let bgClass = "bg-white border-4 border-slate-200 text-slate-400";
                       if (isCompleted) bgClass = "bg-emerald-500 border-4 border-emerald-500 text-white shadow-md shadow-emerald-500/30 cursor-pointer hover:scale-110";
                       if (i === currentUnlocked) bgClass = "bg-white border-4 border-blue-500 text-blue-500 shadow-md shadow-blue-500/30 cursor-pointer hover:scale-110";
                       if (isCurrentActive) bgClass = "bg-blue-500 border-4 border-blue-500 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100 scale-110";
                       
                       return (
                           <div 
                               key={i} 
                               id={`level-node-${i}`}
                               onClick={() => {
                                 if (isClickable && i !== currentLevelIdx) {
                                   if (i < currentUnlocked) {
                                      saveProgress('cookie_qidx', `${selectedSubject.id}_${i}`, 0);
                                   }
                                   setupLevel(subjectCookiesStore, i, selectedSubject);
                                 }
                               }}
                               title={i < currentUnlocked ? "إعادة المرحلة" : (i === currentUnlocked ? "المرحلة الحالية" : "مرحلة مقفلة")}
                               className={`shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-xs md:text-sm transition-all duration-500 ${bgClass}`}
                           >
                               {isCompleted && !isCurrentActive ? <CheckCircle size={16} className="md:w-5 md:h-5 text-white" /> : (i + 1)}
                           </div>
                       )
                   })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs md:text-sm mb-6 md:mb-8 border-b border-slate-100 pb-4">
               <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold">
                  {questionsQueue.indexOf(questionsQueue[currentQueueIdx]) === currentQueueIdx 
                     ? `السؤال ${currentQueueIdx + 1} من ${questions.length}` 
                     : <span className="flex items-center gap-1.5 text-amber-600"><RefreshCw size={14} /> إعادة سؤال سابق</span>
                  }
               </span>
               <span className="text-blue-600 font-bold flex flex-col sm:flex-row items-end sm:items-center gap-1.5"><Target size={16} className="text-blue-500" /> <span className="line-clamp-1 bg-blue-50 px-2 py-1 rounded-lg">المرحلة {currentLevelIdx + 1}</span></span>
            </div>
            
            <div className="text-lg md:text-2xl font-bold text-slate-800 mb-8 md:mb-10 leading-relaxed text-center markdown-body quiz-markdown prose max-w-none">
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
                      className={`w-full p-4 md:p-5 rounded-2xl border-2 text-sm md:text-base font-bold transition-all text-right markdown-body quiz-markdown prose max-w-none ${btnClass}`}
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
                className="w-full bg-slate-800 text-white font-bold rounded-2xl py-4 transition-all hover:bg-slate-900 text-sm md:text-base shadow-xl hover:shadow-2xl hover:shadow-slate-800/20 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2"
              >
                {currentQueueIdx + 1 === questionsQueue.length ? 'إنهاء المرحلة' : 'السؤال التالي'}
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center pt-8 pb-4 max-w-lg mx-auto">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 md:w-28 md:h-28 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
               <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-ping opacity-20"></div>
               <Target size={48} className="md:w-14 md:h-14" />
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">اكتملت المرحلة!</h3>
            <p className="text-lg text-slate-500 mb-10 font-medium">أداء رائع، إليك ملخص المرحلة:</p>
            
            <div className="space-y-4 mb-10 text-right">
              <div className="bg-white border-2 border-slate-100 p-5 rounded-3xl flex justify-between items-center shadow-sm hover:border-emerald-200 transition-colors">
                 <span className="font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-lg">{firstTryCorrect} من {questions.length}</span>
                 <span className="text-slate-700 font-bold text-lg">صحيحة من المحاولة الأولى</span>
              </div>
              <div className="bg-white border-2 border-slate-100 p-5 rounded-3xl flex justify-between items-center shadow-sm hover:border-red-200 transition-colors">
                 <span className="font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl text-lg">{wrongAnswers}</span>
                 <span className="text-slate-700 font-bold text-lg">إجابات خاطئة</span>
              </div>
              <div className="bg-white border-2 border-slate-100 p-5 rounded-3xl flex justify-between items-center shadow-sm hover:border-amber-200 transition-colors">
                 <span className="font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-lg flex items-center gap-2">
                    <Star size={20} className="fill-amber-500" /> +{xpEarned} XP
                 </span>
                 <span className="text-slate-700 font-bold text-lg">النقاط المكتسبة</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
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
                className="w-1/3 bg-slate-100 text-slate-700 font-bold rounded-2xl py-4 hover:bg-slate-200 active:scale-95 transition-all text-sm md:text-base flex items-center justify-center gap-2 border-2 border-transparent"
              >
                <RefreshCw size={20} />
                <span className="hidden sm:inline">إعادة</span>
              </button>
              
              <button 
                onClick={handleLevelFinishContinue}
                className="w-2/3 bg-emerald-500 text-white font-bold rounded-2xl py-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 text-sm md:text-base flex items-center justify-center gap-2"
              >
                <ChevronRight size={20} className="rotate-180" />
                <span>{selectedSubject && currentLevelIdx < (getProgressSync('cookie_level', selectedSubject.id) || 0) - 1 ? 'العودة لمرحلتك الحالية' : 'متابعة للمرحلة التالية'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12 max-w-lg mx-auto">
            <motion.div 
               initial={{ scale: 0, rotate: -180 }} 
               animate={{ scale: 1, rotate: 0 }} 
               transition={{ type: "spring", stiffness: 200, damping: 15 }}
               className="w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-500/30 transform rotate-12 relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-white/20 skew-x-12 translate-x-10"></div>
               <Trophy size={56} className="fill-white drop-shadow-md z-10" />
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">ألف مبروك!</h3>
            <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
              لقد أتممت بنجاح جميع مراحل <span className="font-bold text-slate-800">{selectedSubject?.name}</span>.<br/>أنت بطل حقيقي وصانع نجاح!
            </p>
            
            <button 
              onClick={onBack}
              className="w-full sm:w-2/3 mx-auto bg-slate-800 text-white font-bold rounded-2xl py-4 hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-base flex items-center justify-center gap-2"
            >
              <ChevronRight size={20} className="rotate-180" />
              <span>العودة للمواد</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

