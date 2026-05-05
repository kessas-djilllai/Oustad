import { useState } from 'react';
import { ArrowRight, RotateCcw, ChevronRight, ChevronLeft, Calendar, BookOpen, Users } from 'lucide-react';
import { FLASHCARDS_DATA } from '../lib/flashcardsData';

interface FlashcardsViewProps {
  type: 'dates' | 'terms' | 'characters';
  onBack: () => void;
}

export function FlashcardsView({ type, onBack }: FlashcardsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = FLASHCARDS_DATA[type] || [];
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
      case 'dates': return { 
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
          borderMedium: 'border-purple-100/50',
          textDark: 'text-purple-950',
          borderBack: 'border-purple-200/50',
          iconBack: 'text-purple-600',
          borderTitle: 'border-purple-200',
          textTitle: 'text-purple-800'
        }
      };
      case 'terms': return { 
        title: 'مصطلحات التاريخ والجغرافيا', 
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
          borderMedium: 'border-emerald-100/50',
          textDark: 'text-emerald-950',
          borderBack: 'border-emerald-200/50',
          iconBack: 'text-emerald-600',
          borderTitle: 'border-emerald-200',
          textTitle: 'text-emerald-800'
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
          borderMedium: 'border-rose-100/50',
          textDark: 'text-rose-950',
          borderBack: 'border-rose-200/50',
          iconBack: 'text-rose-600',
          borderTitle: 'border-rose-200',
          textTitle: 'text-rose-800'
        }
      };
    }
  };

  const info = getTypeInfo() || getTypeInfo();


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
      <div className="flex items-center justify-between mb-8 px-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-0">
        
        {/* Progress Bar */}
        <div className="w-full max-w-md bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className={`h-full ${info?.classes?.bgMain} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div 
          className="relative w-full max-w-md h-[380px] md:h-[420px] perspective-1000 cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`w-full h-full relative preserve-3d transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front */}
            <div className={`absolute inset-0 backface-hidden w-full h-full glass rounded-[2.5rem] bg-gradient-to-br from-white ${info?.classes?.toColor} border ${info?.classes?.borderMedium} shadow-xl flex flex-col items-center justify-center p-8 text-center`}>
              <div className="absolute top-6 right-6 opacity-30">
                 {info?.icon}
              </div>
              <p className="text-sm font-bold text-slate-400 mb-6 tracking-wide uppercase">
                {type === 'dates' ? 'تاريخ' : type === 'terms' ? 'مصطلح' : 'شخصية'}
              </p>
              <h3 className={`text-3xl md:text-4xl font-black text-slate-800 leading-tight ${info?.classes?.textDark}`}>
                {currentCard.title}
              </h3>
              
              <div className="absolute bottom-6 flex items-center justify-center gap-2 text-slate-400 font-medium text-sm animate-pulse">
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

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-12 w-full max-w-md px-4">
          <button 
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${currentIndex === cards.length - 1 ? 'bg-slate-100 text-slate-300 shadow-none' : `${info?.classes?.bgMain} text-white ${info?.classes?.hoverBgMain} ${info?.classes?.shadowMain}`}`}
          >
            <ChevronRight className="w-8 h-8 mr-1" />
          </button>

          <div className="text-slate-400 font-bold tracking-widest text-sm">
             {currentIndex + 1} / {cards.length}
          </div>

          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${currentIndex === 0 ? 'bg-slate-100 text-slate-300 shadow-none' : `${info?.classes?.bgMain} text-white ${info?.classes?.hoverBgMain} ${info?.classes?.shadowMain}`}`}
          >
            <ChevronLeft className="w-8 h-8 ml-1" />
          </button>
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
