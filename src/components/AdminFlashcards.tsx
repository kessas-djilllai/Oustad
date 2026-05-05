import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowRight } from 'lucide-react';
import { FLASHCARDS_DATA } from '../lib/flashcardsData';
import { supabase } from '../lib/supabase';

export function AdminFlashcards({ onBack, triggerAlert }: { onBack: () => void, triggerAlert: (msg: string, type?: 'success' | 'error') => void }) {
  const [activeTab, setActiveTab] = useState('dates_history');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [cards, setCards] = useState<any>({
    dates_history: [],
    terms_history: [],
    terms_geography: [],
    characters: []
  });

  useEffect(() => {
    async function loadFlashcards() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('admin_settings').select('flashcards_data').limit(1).single();
        if (data && data.flashcards_data) {
          const parsed = typeof data.flashcards_data === 'string' ? JSON.parse(data.flashcards_data) : data.flashcards_data;
          setCards({
            dates_history: parsed.dates_history || [],
            terms_history: parsed.terms_history || [],
            terms_geography: parsed.terms_geography || [],
            characters: parsed.characters || []
          });
        } else {
           setCards({
             dates_history: FLASHCARDS_DATA.dates || [],
             terms_history: FLASHCARDS_DATA.terms || [],
             terms_geography: [],
             characters: FLASHCARDS_DATA.characters || []
           });
        }
      } catch (err) {
        console.error("Error loading flashcards:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFlashcards();
  }, []);

  const handleAddField = () => {
    setCards((prev: any) => ({
      ...prev,
      [activeTab]: [{ title: '', description: '' }, ...(prev[activeTab] || [])]
    }));
  };

  const handleUpdateField = (index: number, field: string, value: string) => {
    setCards((prev: any) => {
      const newList = [...(prev[activeTab] || [])];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [activeTab]: newList };
    });
  };

  const handleDeleteField = (index: number) => {
    setCards((prev: any) => {
      const newList = [...(prev[activeTab] || [])];
      newList.splice(index, 1);
      return { ...prev, [activeTab]: newList };
    });
  };

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const { data: currentData } = await supabase.from('admin_settings').select('id, flashcards_data').limit(1).single();
      const updateData = currentData 
          ? { ...currentData, id: 1, flashcards_data: JSON.stringify(cards) } 
          : { id: 1, flashcards_data: JSON.stringify(cards) };
      
      const { error } = await supabase.from('admin_settings').upsert(updateData);
      
      if (error) {
           if (error.message.includes('flashcards_data')) {
             throw new Error("يرجى تحديث قاعدة البيانات وتشغيل: ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS flashcards_data TEXT;");
           }
           throw error;
      }
      
      localStorage.setItem('flashcards_custom_data', JSON.stringify(cards)); // For fast local access
      triggerAlert('تم حفظ البطاقات بنجاح في قاعدة البيانات!', 'success');
    } catch (err: any) {
      triggerAlert(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowRight size={20} />
          </button>
          <h2 className="text-2xl font-black text-slate-800">إدارة بطاقات المراجعة</h2>
        </div>
        <button disabled={isSaving} onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-bold disabled:opacity-50">
          <Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('terms_history')} className={`flex-1 py-3 px-4 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'terms_history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          مصطلحات التاريخ
        </button>
        <button onClick={() => setActiveTab('terms_geography')} className={`flex-1 py-3 px-4 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'terms_geography' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          مصطلحات الجغرافيا
        </button>
        <button onClick={() => setActiveTab('dates_history')} className={`flex-1 py-3 px-4 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'dates_history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          تواريخ التاريخ
        </button>
        <button onClick={() => setActiveTab('characters')} className={`flex-1 py-3 px-4 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'characters' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          الشخصيات
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 text-lg">قائمة البطاقات</h3>
          <button onClick={handleAddField} className="flex items-center gap-2 text-sm bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700">
            <Plus size={16} /> إضافة بطاقة جديدة
          </button>
        </div>

        {(!cards[activeTab] || cards[activeTab].length === 0) ? (
           <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              لا توجد بطاقات في هذا القسم הסريع بعد. أضف بطاقة جديدة!
           </div>
        ) : (
          cards[activeTab].map((card: any, idx: number) => (
            <div key={idx} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex-1 space-y-3 relative">
                <div className="absolute top-2 left-2 text-xs font-bold text-slate-300 pointer-events-none">
                  #{idx + 1}
                </div>
                <input 
                  type="text" 
                  value={card.title} 
                  onChange={(e) => handleUpdateField(idx, 'title', e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-100"
                  placeholder={activeTab.includes('dates') ? 'التاريخ (مثال: 5 جويلية 1962)' : activeTab.includes('terms') ? 'المصطلح (مثال: الحرب الباردة)' : 'الشخصية (مثال: هواري بومدين)'}
                />
                <textarea 
                  value={card.description} 
                  onChange={(e) => handleUpdateField(idx, 'description', e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-600 min-h-[80px] focus:outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-100 resize-none"
                  placeholder={activeTab.includes('dates') ? 'الحدث (مثال: استقلال الجزائر)' : activeTab.includes('terms') ? 'التعريف...' : 'التعريف بالشخصية...'}
                />
              </div>
              <button onClick={() => handleDeleteField(idx)} className="p-3 text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-colors mt-1 flex-shrink-0">
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
