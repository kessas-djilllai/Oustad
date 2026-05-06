import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700"
      >
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>

        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">
          عذراً، الصفحة غير موجودة
        </h2>

        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          يبدو أنك وصلت إلى رابط غير صحيح أو أن الصفحة التي تبحث عنها قد تم
          نقلها أو حذفها.
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
        >
          <Home size={20} />
          <span>العودة للرئيسية</span>
        </button>
      </motion.div>
    </div>
  );
}
