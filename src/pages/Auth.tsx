import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, AlertCircle, Mail, Lock, User, ChevronRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('علوم تجريبية');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const specializations = [
    'علوم تجريبية',
    'رياضيات',
    'تقني رياضي',
    'تسيير واقتصاد',
    'آداب وفلسفة',
    'لغات أجنبية'
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('قاعدة البيانات غير متصلة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              specialization: specialization
            }
          }
        });
        if (signUpError) throw signUpError;
      }
      
      // on success, redirect
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/20 rotate-3 hover:rotate-6 transition-transform">
             <BookOpen size={40} className="-rotate-3" />
           </div>
           <h1 className="text-3xl font-bold text-slate-800 mb-2">بكالوريا برو</h1>
           <p className="text-slate-500 font-bold">منصتك الذكية للتحضير للبكالوريا</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
             <button
               type="button"
               onClick={() => { setIsLogin(true); setError(null); }}
               className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               تسجيل الدخول
             </button>
             <button
               type="button"
               onClick={() => { setIsLogin(false); setError(null); }}
               className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               حساب جديد
             </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                        <User size={20} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        placeholder="عبد الرحمن"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الشعبة (التخصص)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                        <BookOpen size={20} />
                      </div>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                      >
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                        <ChevronRight size={20} className="-rotate-90" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-left"
                  placeholder="name@example.com"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-12 text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-left"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group mt-8 relative overflow-hidden"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="relative z-10">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب مستخدم'}</span>
                  <div className="relative z-10 transform -translate-x-1 group-hover:-translate-x-2 transition-transform">
                    {isLogin ? <ChevronRight size={20} /> : <Sparkles size={20} />}
                  </div>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
