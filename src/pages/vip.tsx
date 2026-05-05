import React, { useState } from 'react';
import { ChevronRight, Crown, CreditCard, ShieldCheck, Star, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export function VIP({ onBack, session }: { onBack: () => void, session?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handlePayment = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const currentUrl = window.location.origin + window.location.pathname;
            const success_url = `${currentUrl}?payment=success`;
            const failure_url = `${currentUrl}?payment=failure`;

            const userId = session?.user?.id || '';

            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: 700,
                    success_url,
                    failure_url,
                    user_id: userId
                })
            });

            console.log("Response status:", response.status);
            const textResponse = await response.text();
            console.log("Raw response text:", textResponse);

            let data;
            try {
                data = textResponse ? JSON.parse(textResponse) : {};
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError, textResponse);
                throw new Error(`تعذر قراءة رد الخادم. (${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to initialize payment');
            }

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                throw new Error('لم يتم إرجاع رابط الدفع.');
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            setErrorMsg(err.message || 'حدث خطأ أثناء معالجة الدفع.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto pt-10 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm border border-slate-100 shrink-0">
                        <ChevronRight size={20} />
                    </button>
                    <h2 className="text-2xl font-black text-slate-800">الترقية إلى VIP</h2>
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                            <Crown size={20} className="text-yellow-300" />
                            <span className="font-bold tracking-wide">باقة التميز</span>
                        </div>
                        <div className="text-left font-black tracking-tighter flex flex-col">
                            <span className="text-4xl">700 <span className="text-lg">DA</span></span>
                            <span className="text-amber-100 font-medium text-sm">/ لمدة 30 يوم</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Zap size={16} className="text-yellow-300" />
                            </div>
                            <span className="font-medium text-amber-50">توليد تمارين لا محدود بالذكاء الاصطناعي</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} className="text-green-300" />
                            </div>
                            <span className="font-medium text-amber-50">وصول كامل لجميع الحلول النموذجية</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Star size={16} className="text-purple-300" />
                            </div>
                            <span className="font-medium text-amber-50">أولوية في الدعم والمساعدة</span>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/80 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {errorMsg}
                        </div>
                    )}

                    <button 
                        onClick={handlePayment} 
                        disabled={isLoading}
                        className="w-full bg-white text-amber-600 font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:hover:scale-100 text-lg"
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <CreditCard size={24} />
                        )}
                        <span>{isLoading ? 'جاري التحويل...' : 'ادفع عبر Chargily Pay'}</span>
                    </button>
                    
                    <p className="text-center text-amber-100 text-xs font-medium mt-4 flex items-center justify-center gap-1">
                        <ShieldCheck size={14} />
                        معاملة آمنة ومحمية بنسبة 100%
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
