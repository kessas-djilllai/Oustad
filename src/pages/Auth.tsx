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

        // إرسال بريد إلكتروني للإدمن لاشعاره بالمستخدم الجديد
        try {
          fetch('/api/send-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: '0696666164dj@gmail.com',
              subject: 'تسجيل مستخدم جديد في منصة بكالوريا 🎉',
              message: `تم تسجيل عضو جديد:\nالاسم: ${name}\nالبريد: ${email}\nالتخصص: ${specialization}`,
              htmlMessage: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل جديد</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl;">
    <div style="max-width: 400px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background-color: #00b894; padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">تسجيل جديد 🔥</h2>
        </div>
        <div style="padding: 25px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                <tr>
                    <td width="70" valign="middle" style="padding: 15px 0; border-bottom: 1px dashed #eee; color: #2d3436; font-weight: bold; font-size: 14px; white-space: nowrap;">
                        الاسم :
                    </td>
                    <td align="right" valign="middle" style="padding: 15px 10px 15px 0; border-bottom: 1px dashed #eee;">
                        <span style="color: #2d3436; font-weight: bold; font-size: 16px; direction: ltr; display: inline-block;">
                            \${name || 'بدون اسم'}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td width="70" valign="middle" style="padding: 15px 0; border-bottom: 1px dashed #eee; color: #2d3436; font-weight: bold; font-size: 14px; white-space: nowrap;">
                        البريد :
                    </td>
                    <td align="right" valign="middle" style="padding: 15px 10px 15px 0; border-bottom: 1px dashed #eee;">
                        <span style="color: #0984e3; font-weight: bold; font-size: 15px; direction: ltr; display: inline-block; white-space: nowrap; text-decoration: none;">
                            \${email || 'غير متوفر'}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td width="70" valign="middle" style="padding: 15px 0; border-bottom: 1px dashed #eee; color: #2d3436; font-weight: bold; font-size: 14px; white-space: nowrap;">
                        التخصص :
                    </td>
                    <td align="right" valign="middle" style="padding: 15px 10px 15px 0; border-bottom: 1px dashed #eee;">
                        <span style="color: #e17055; font-weight: bold; font-size: 14px; display: inline-block;">
                            \${specialization || 'غير محدد'}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td width="70" valign="middle" style="padding: 15px 0; border-bottom: 1px dashed #eee; color: #2d3436; font-weight: bold; font-size: 14px; white-space: nowrap;">
                        الجهاز :
                    </td>
                    <td align="right" valign="middle" style="padding: 15px 10px 15px 0; border-bottom: 1px dashed #eee;">
                        <span style="color: #6c5ce7; font-weight: bold; font-size: 15px; direction: ltr; display: inline-block;">
                            منصة ويب
                        </span>
                    </td>
                </tr>
                <tr>
                    <td width="70" valign="middle" style="padding-top: 15px; color: #2d3436; font-weight: bold; font-size: 14px; white-space: nowrap;">
                        IP :
                    </td>
                    <td align="right" valign="middle" style="padding-top: 15px; padding-right: 10px;">
                        <div style="background-color: #f1f2f6; color: #2d3436; padding: 10px 15px; border-radius: 6px; font-family: monospace; font-size: 14px; display: inline-block; direction: ltr;">
                            غير متوفر
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #f0f0f0;">
            <p style="margin: 0; color: #b2bec3; font-size: 12px;">
                وقت التسجيل: <span dir="ltr">\${new Date().toLocaleString('ar-DZ')}</span>
            </p>
        </div>
    </div>
</body>
</html>
              `
            })
          }).catch(console.error);
        } catch(e) {
          console.error(e);
        }
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
