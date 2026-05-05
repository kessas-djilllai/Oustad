import { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, ChevronRight, ChevronLeft, Calendar, BookOpen, Users } from 'lucide-react';
import { FLASHCARDS_DATA } from '../lib/flashcardsData';
import { supabase } from '../lib/supabase';

interface FlashcardsViewProps {
  type: 'dates' | 'dates_history' | 'terms' | 'terms_history' | 'terms_geography' | 'characters';
  onBack: () => void;
}

export function FlashcardsView({ type, onBack }: FlashcardsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dbCards, setDbCards] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlashcards() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('admin_settings').select('flashcards_data').limit(1).single();
        if (data && data.flashcards_data) {
          const parsed = typeof data.flashcards_data === 'string' ? JSON.parse(data.flashcards_data) : data.flashcards_data;
          setDbCards(parsed);
        }
      } catch (err) {
        console.error("Error loading flashcards from database:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFlashcards();
  }, []);

  const cardsFromLocalStorage = (() => {
    try {
      const saved = localStorage.getItem('flashcards_custom_data');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  })();
  
  const cards = (dbCards && dbCards[type]) || (cardsFromLocalStorage && cardsFromLocalStorage[type]) || FLASHCARDS_DATA[type as keyof typeof FLASHCARDS_DATA] || [];
  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const getTypeInfo = () => {
    switch (type) {
      case 'dates':
      case 'dates_history': return { 
        title: 'تواريخ التاريخ', 
        icon: <Calendar className="w-6 h-6 md:w-8 md:h-8" />, 
        color: 'purple',
        classes: {
          bgLight: 'bg-purple-100',
          textIcon: 'text-purple-600',
          borderLight: 'border-purple-100',
          stroke: 'stroke-purple-500',
          bgMain: 'bg-purple-500',
          hoverBgMain: 'hover:bg-purple-600',
          shadowMain: 'hover:shadow-purple-200',
          toColor: 'to-purple-50/50',
          borderMedium: 'border-purple-200/50',
          textDark: 'text-purple-900',
          borderBack: 'border-purple-200/50',
          iconBack: 'text-purple-600',
          borderTitle: 'border-purple-200',
          textTitle: 'text-purple-800',
          gradientFront: 'bg-gradient-to-b from-purple-50 to-white',
          textSubFront: 'text-purple-500',
          iconOpacFront: 'opacity-20 text-purple-400',
          shadowOuter: 'shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)]'
        }
      };
      case 'terms':
      case 'terms_history': return { 
        title: 'مصطلحات التاريخ', 
        icon: <BookOpen className="w-6 h-6 md:w-8 md:h-8" />, 
        color: 'emerald',
        classes: {
          bgLight: 'bg-emerald-100',
          textIcon: 'text-emerald-600',
          borderLight: 'border-emerald-100',
          stroke: 'stroke-emerald-500',
          bgMain: 'bg-emerald-500',
          hoverBgMain: 'hover:bg-emerald-600',
          shadowMain: 'hover:shadow-emerald-200',
          toColor: 'to-emerald-50/50',
          borderMedium: 'border-emerald-200/50',
          textDark: 'text-emerald-900',
          borderBack: 'border-emerald-200/50',
          iconBack: 'text-emerald-600',
          borderTitle: 'border-emerald-200',
          textTitle: 'text-emerald-800',
          gradientFront: 'bg-gradient-to-b from-emerald-50 to-white',
          textSubFront: 'text-emerald-500',
          iconOpacFront: 'opacity-20 text-emerald-400',
          shadowOuter: 'shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)]'
        }
      };
      case 'terms_geography': return { 
        title: 'مصطلحات الجغرافيا', 
        icon: <BookOpen className="w-6 h-6 md:w-8 md:h-8" />, 
        color: 'teal',
        classes: {
          bgLight: 'bg-teal-100',
          textIcon: 'text-teal-600',
          borderLight: 'border-teal-100',
          stroke: 'stroke-teal-500',
          bgMain: 'bg-teal-500',
          hoverBgMain: 'hover:bg-teal-600',
          shadowMain: 'hover:shadow-teal-200',
          toColor: 'to-teal-50/50',
          borderMedium: 'border-teal-200/50',
          textDark: 'text-teal-900',
          borderBack: 'border-teal-200/50',
          iconBack: 'text-teal-600',
          borderTitle: 'border-teal-200',
          textTitle: 'text-teal-800',
          gradientFront: 'bg-gradient-to-b from-teal-50 to-white',
          textSubFront: 'text-teal-500',
          iconOpacFront: 'opacity-20 text-teal-400',
          shadowOuter: 'shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)]'
        }
      };
      case 'characters': return { 
        title: 'شخصيات التاريخ', 
        icon: <Users className="w-6 h-6 md:w-8 md:h-8" />, 
        color: 'rose',
        classes: {
          bgLight: 'bg-rose-100',
          textIcon: 'text-rose-600',
          borderLight: 'border-rose-100',
          stroke: 'stroke-rose-500',
          bgMain: 'bg-rose-500',
          hoverBgMain: 'hover:bg-rose-600',
          shadowMain: 'hover:shadow-rose-200',
          toColor: 'to-rose-50/50',
          borderMedium: 'border-rose-200/50',
          textDark: 'text-rose-900',
          borderBack: 'border-rose-200/50',
          iconBack: 'text-rose-600',
          borderTitle: 'border-rose-200',
          textTitle: 'text-rose-800',
          gradientFront: 'bg-gradient-to-b from-rose-50 to-white',
          textSubFront: 'text-rose-500',
          iconOpacFront: 'opacity-20 text-rose-400',
          shadowOuter: 'shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)]'
        }
      };
    }
  };

  const info = getTypeInfo() || getTypeInfo();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">جاري تحميل البطاقات...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl min-h-[50vh]">
        <button onClick={onBack} className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" /> العودة
        </button>
        <p>لا توجد بيانات متاحة حالياً.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-100px)] pt-4" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-6 px-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-0 md:pt-8 px-4 md:px-0">

        {/* Card */}
        <div 
          className="relative w-full max-w-md h-[340px] md:h-[420px] perspective-1000 cursor-pointer group mb-4 md:mb-6"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`w-full h-full relative preserve-3d transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front */}
            <div className={`absolute inset-0 backface-hidden w-full h-full rounded-[2.5rem] ${info?.classes?.gradientFront} border ${info?.classes?.borderMedium} ${info?.classes?.shadowOuter} flex flex-col items-center justify-center p-8 text-center`}>
              <div className={`absolute top-6 right-6 ${info?.classes?.iconOpacFront}`}>
                 {info?.icon}
              </div>
              <p className={`text-sm font-bold ${info?.classes?.textSubFront} mb-6 tracking-wide uppercase`}>
                {type === 'dates' || type === 'dates_history' ? 'تاريخ' : type === 'terms' || type === 'terms_history' || type === 'terms_geography' ? 'مصطلح' : 'شخصية'}
              </p>
              <h3 className={`text-3xl md:text-4xl font-black leading-tight ${info?.classes?.textDark}`}>
                {currentCard.title}
              </h3>
              
              <div className={`absolute bottom-6 flex items-center justify-center gap-2 ${info?.classes?.textSubFront} font-medium text-sm animate-pulse`}>
                <RotateCcw className="w-4 h-4" />
                <span>انقر للقلب</span>
              </div>
            </div>

            {/* Back */}
            <div className={`absolute inset-0 backface-hidden w-full h-full glass rounded-[2.5rem] bg-gradient-to-br from-white ${info?.classes?.toColor} border ${info?.classes?.borderBack} shadow-xl flex flex-col items-center justify-center p-8 text-center rotate-y-180`}>
              
              <div className="absolute top-6 opacity-20">
                <BookOpen className={`w-12 h-12 ${info?.classes?.iconBack}`} />
              </div>
              
              <div className="w-full max-h-[85%] overflow-y-auto custom-scrollbar px-2 z-10">
                <h3 className={`text-xl font-black mb-4 pb-4 border-b ${info?.classes?.borderTitle} ${info?.classes?.textTitle}`}>
                  {currentCard.title}
                </h3>
                <p className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed text-balance">
                  {currentCard.description}
                </p>
              </div>

               <div className="absolute bottom-6 flex items-center justify-center gap-2 text-slate-400 font-medium text-sm">
                <RotateCcw className="w-4 h-4" />
                <span>انقر للقلب مجددا</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Controls Box */}
        <div className="w-full max-w-md bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-5 flex flex-col items-center gap-5 mb-4">
          {/* Progress Bar */}
          <div className="w-full max-w-[85%] bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner mt-2">
            <div 
              className={`h-full ${info?.classes?.bgMain} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 w-full px-4 mb-1">
            <button 
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${currentIndex === cards.length - 1 ? 'bg-slate-100 text-slate-300 shadow-none' : `${info?.classes?.bgMain} text-white ${info?.classes?.hoverBgMain} ${info?.classes?.shadowMain}`}`}
            >
              <ChevronRight className="w-7 h-7 mr-1" />
            </button>

            <div className="text-slate-400 font-bold tracking-widest text-sm min-w-[3rem] text-center">
               {currentIndex + 1} / {cards.length}
            </div>

            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${currentIndex === 0 ? 'bg-slate-100 text-slate-300 shadow-none' : `${info?.classes?.bgMain} text-white ${info?.classes?.hoverBgMain} ${info?.classes?.shadowMain}`}`}
            >
              <ChevronLeft className="w-7 h-7 ml-1" />
            </button>
          </div>
        </div>

      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
