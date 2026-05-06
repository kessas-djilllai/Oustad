import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Crown,
  CreditCard,
  ShieldCheck,
  Star,
  Zap,
  CheckCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

import { loadUserProgress } from "../lib/progress";

export function VIP({
  onBack,
  session,
}: {
  onBack: () => void;
  session?: any;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    url?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showFailureToast, setShowFailureToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failure") {
      setShowFailureToast(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      if (!session?.user?.id) {
        setIsChecking(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/check-payment?user_id=${session.user.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            await loadUserProgress();
          }
          if (mounted) {
            setPaymentStatus(data);
            if (data.status === "failed" && !showFailureToast) {
               setShowFailureToast(true);
            }
          }
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };
    checkStatus();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id, showFailureToast]);

  const handlePayment = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const success_url = `${currentUrl}?payment=success`;
      const failure_url = `${currentUrl}?payment=failure`;

      const userId = session?.user?.id || "";

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 700,
          success_url,
          failure_url,
          user_id: userId,
        }),
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
        const errorDetail =
          data.error ||
          data.message ||
          (typeof data === "string" ? data : null);
        throw new Error(
          errorDetail || "حدث خطأ أثناء الاتصال ببوابة الدفع (Chargily).",
        );
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("لم يتم إرجاع رابط الدفع.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "حدث خطأ أثناء معالجة الدفع.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="max-w-xl mx-auto pt-10 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm border border-slate-100 shrink-0"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-2xl font-black text-slate-800">
            الترقية إلى VIP
          </h2>
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
              <span className="text-4xl">
                700 <span className="text-lg">DA</span>
              </span>
              <span className="text-amber-100 font-medium text-sm">
                / لمدة 30 يوم
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-yellow-300" />
              </div>
              <span className="font-medium text-amber-50">
                توليد تمارين لا محدود بالذكاء الاصطناعي
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-green-300" />
              </div>
              <span className="font-medium text-amber-50">
                وصول كامل لجميع الحلول النموذجية
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Star size={16} className="text-purple-300" />
              </div>
              <span className="font-medium text-amber-50">
                أولوية في الدعم والمساعدة
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/80 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorMsg}
            </div>
          )}

          <AnimatePresence>
            {showFailureToast && (
               <motion.div 
                 initial={{ y: -20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 className="bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center justify-between mb-6 shadow-sm border border-red-400"
               >
                 <div className="flex items-center gap-3">
                   <div className="bg-red-600/50 p-2 rounded-full">
                     <X size={16} />
                   </div>
                   <div className="flex flex-col">
                     <span className="font-bold text-sm">فشلت عملية الدفع</span>
                     <span className="text-xs text-red-100">يرجى المحاولة مرة أخرى أو الاتصال بالدعم.</span>
                   </div>
                 </div>
                 <button onClick={() => setShowFailureToast(false)} className="text-white/80 hover:text-white shrink-0 p-1">
                   <X size={20} />
                 </button>
               </motion.div>
            )}
          </AnimatePresence>

          {isChecking ? (
            <div className="w-full bg-white/30 text-amber-100 font-medium py-4 rounded-2xl flex items-center justify-center gap-3 text-lg">
              <svg
                className="animate-spin h-5 w-5 text-amber-100"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              جاري التحقق من حالة الدفع...
            </div>
          ) : paymentStatus?.status === "paid" ? (
            <div className="flex flex-col gap-3">
              <div className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-inner border border-green-200">
                <CheckCircle size={20} />
                <span className="text-sm">أنت مشترك حالياً في باقة VIP</span>
              </div>
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-white text-amber-600 font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:hover:scale-100 text-lg"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <CreditCard size={24} />
                )}
                <span>
                  {isLoading ? "جاري التحويل..." : "ادفع مرة أخرى (للتجريب)"}
                </span>
              </button>
            </div>
          ) : paymentStatus?.status === "pending" && paymentStatus?.url ? (
            <div className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-lg border border-amber-200 gap-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-8 h-8 bg-amber-100 rounded-bl-full flex items-start justify-end pr-2 pt-1 font-bold text-[10px] text-amber-600">
                !
              </div>
              <div className="flex flex-col pr-4">
                <span className="font-bold text-slate-800 text-sm">
                  لديك عملية دفع معلقة
                </span>
                <span className="text-slate-500 text-xs">
                  يرجى إكمال الدفع أو المحاولة مجددا الاستمرار.
                </span>
              </div>
              <a
                href={paymentStatus.url}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 shrink-0"
              >
                إكمال الدفع
              </a>
            </div>
          ) : (
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-white text-amber-600 font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:hover:scale-100 text-lg"
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <CreditCard size={24} />
              )}
              <span>
                {isLoading ? "جاري التحويل..." : "ادفع عبر Chargily Pay"}
              </span>
            </button>
          )}

          <p className="text-center text-amber-100 text-xs font-medium mt-4 flex items-center justify-center gap-1">
            <ShieldCheck size={14} />
            معاملة آمنة ومحمية بنسبة 100%
          </p>
        </div>
      </motion.div>
    </div>
  );
}
