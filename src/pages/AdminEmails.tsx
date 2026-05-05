import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Search, Send, RefreshCw, Menu, Check, X, Filter, Users, CheckCircle2, ChevronRight, Inbox, Plus, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminEmails({ triggerAlert }: { triggerAlert: (msg: string, type: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'remaining'>('remaining');
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  const [message, setMessage] = useState('');
  const [includeButton, setIncludeButton] = useState(false);
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState('');

  useEffect(() => {
    fetchUsers();
    const saved = localStorage.getItem('sent_emails_history');
    if (saved) {
      try {
        setSentSet(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to parse saved sent list", e);
      }
    }
  }, []);

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تصفير قائمة المستلمين؟ سيتم إعادة الجميع إلى قائمة المراسلة.')) {
        localStorage.removeItem('sent_emails_history');
        setSentSet(new Set());
        triggerAlert('تم تصفير القائمة بنجاح', 'success');
    }
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users_view').select('id, email, raw_user_meta_data').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      triggerAlert('خطأ في جلب البيانات: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
      const searchTerms = searchTerm.toLowerCase().split(' ');
      const userText = `${u.email} ${u.raw_user_meta_data?.full_name}`.toLowerCase();
      const matchesSearch = searchTerms.every(term => userText.includes(term));
      if (!matchesSearch) return false;
      
      if (activeTab === 'sent') return sentSet.has(u.id);
      if (activeTab === 'remaining') return !sentSet.has(u.id);
      return true;
  });

  const toggleUserSelection = (userId: string) => {
    if (sentSet.has(userId)) return;
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    const selectableUsers = filteredUsers.filter(u => !sentSet.has(u.id));
    const allSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUsers.has(u.id));
    
    if (allSelected) {
      const newSelected = new Set(selectedUsers);
      selectableUsers.forEach(u => newSelected.delete(u.id));
      setSelectedUsers(newSelected);
    } else {
      const newSelected = new Set(selectedUsers);
      selectableUsers.forEach(u => newSelected.add(u.id));
      setSelectedUsers(newSelected);
    }
  };

  const handleSendEmail = async () => {
    if (selectedUsers.size === 0) {
      triggerAlert('الرجاء تحديد مستخدم واحد على الأقل.', 'error');
      return;
    }
    if (!message.trim()) {
      triggerAlert('الرجاء كتابة محتوى الرسالة.', 'error');
      return;
    }

    const selectedUsersList = users
      .filter(u => selectedUsers.has(u.id))
      .filter(u => u.email);

    if (selectedUsersList.length === 0) {
        triggerAlert('لم يتم العثور على عناوين بريد إلكتروني صالحة.', 'error');
        return;
    }

    setIsSending(true);
    setSendingStatus('بدأ الإرسال...');
    let sentCount = 0;

    try {
      for (let i = 0; i < selectedUsersList.length; i += 60) {
        const batch = selectedUsersList.slice(i, i + 60);

        for (let j = 0; j < batch.length; j++) {
            const userObj = batch[j];
            setSendingStatus(`الدفعة (${Math.floor(i/60)+1}) - جاري الإرسال إلى ${userObj.email}... (${sentCount + 1}/${selectedUsersList.length})`);
            
            let htmlMessage = `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6; color: #1e293b;">`;
            htmlMessage += `<p style="white-space: pre-wrap; font-size: 16px;">${message.replace(/\n/g, '<br/>')}</p>`;
            
            if (includeButton && buttonText && buttonLink) {
                htmlMessage += `
                <div style="margin-top: 30px; text-align: right;">
                    <a href="${buttonLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        ${buttonText}
                    </a>
                </div>
                `;
            }
            htmlMessage += `</div>`;
            
            const response = await fetch('/api/send-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: userObj.email,
                subject: 'إشعار من منصة بكالوريا',
                message,
                htmlMessage
              })
            });

            if (!response.ok) {
                console.error(`فشل الإرسال إلى ${userObj.email}`);
            } else {
                setSentSet(prev => {
                    const next = new Set(prev).add(userObj.id);
                    localStorage.setItem('sent_emails_history', JSON.stringify(Array.from(next)));
                    return next;
                });
                setSelectedUsers(prev => {
                    const next = new Set(prev);
                    next.delete(userObj.id);
                    return next;
                });
            }
            sentCount++;
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (i + 60 < selectedUsersList.length) {
            for (let s = 60; s > 0; s--) {
                setSendingStatus(`تم الإرسال لـ ${sentCount}. ننتظر ${s} ثانية لتجنب الحظر...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
      }

      setMessage('');
      setIncludeButton(false);
      setButtonText('');
      setButtonLink('');
      setIsBottomSheetOpen(false);
      setSendingStatus('');
      triggerAlert('تم إرسال جميع الرسائل بنجاح!', 'success');
      setSelectedUsers(new Set());
    } catch (err: any) {
      triggerAlert('حدث خطأ أثناء الإرسال: ' + err.message, 'error');
      setSendingStatus('');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
           <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
           <p className="font-medium text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const remainingCount = users.length - sentSet.size;
  const selectableFiltered = filteredUsers.filter(u => !sentSet.has(u.id));
  const isAllSelected = selectableFiltered.length > 0 && selectableFiltered.every(u => selectedUsers.has(u.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans" dir="rtl">
      
      <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-start gap-4 mb-8">
            <Menu className="text-slate-800" size={28} />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">المراسلات للإدارة</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6 leading-tight">
            {/* Mass Send Button */}
            <button 
                onClick={() => {
                    const remaining = filteredUsers.filter(u => !sentSet.has(u.id));
                    if (remaining.length === 0) {
                        triggerAlert('لا يوجد مستخدمين متبقين في هذه القائمة لمراسلتهم.', 'error');
                        return;
                    }
                    setSelectedUsers(new Set(remaining.map(u => u.id)));
                    setIsBottomSheetOpen(true);
                }}
                className="flex-1 bg-blue-500 text-white rounded-3xl p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform"
            >
                <div className="flex flex-col text-right font-bold text-[17px]">
                    <span>إرسال</span>
                    <span>للمتبقين ({remainingCount})</span>
                </div>
                <Send size={24} className="transform -scale-x-100 opacity-90" />
            </button>

            {/* Reset Button */}
            <button 
                onClick={handleReset}
                className="w-1/3 bg-red-50 text-red-600 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 font-bold text-sm active:scale-[0.98] transition-transform"
            >
                <RefreshCw size={22} className="mb-1" />
                تصفير
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 bg-white border border-slate-200/50 rounded-2xl shadow-sm mb-6 flex-row-reverse relative z-0">
            <button 
                onClick={() => setActiveTab('remaining')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors rounded-xl ${activeTab === 'remaining' ? 'bg-white shadow text-slate-800 border border-slate-100' : 'text-slate-500'}`}
            >
                المتبقية <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'remaining' ? 'bg-slate-400 text-white' : 'bg-slate-200 text-slate-600'}`}>{remainingCount}</span>
            </button>
            <button 
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors rounded-xl ${activeTab === 'sent' ? 'bg-white shadow text-emerald-600 border border-slate-100' : 'text-slate-500'}`}
            >
                المستلمة <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'sent' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{sentSet.size}</span>
            </button>
            <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors rounded-xl ${activeTab === 'all' ? 'bg-white shadow text-blue-600 border border-slate-100' : 'text-slate-500'}`}
            >
                الكل
            </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو الايميل..." 
                className="w-full bg-white border border-slate-200/50 rounded-2xl py-4 pr-12 pl-6 text-[15px] font-medium outline-none text-right shadow-sm focus:border-blue-500 transition-colors" 
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>

        {/* User Cards */}
        <div className="space-y-4">
            {filteredUsers.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search size={28} className="text-slate-300" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-1">لا يوجد نتائج</h3>
               </div>
            ) : (
                filteredUsers.map(user => {
                    const name = user.raw_user_meta_data?.full_name || 'بدون اسم';
                    const initial = name.charAt(0).toUpperCase();
                    const isSent = sentSet.has(user.id);

                    return (
                        <div 
                            key={user.id}
                            onClick={() => {
                                if (!isSent) {
                                  setSelectedUsers(new Set([user.id]));
                                  setIsBottomSheetOpen(true);
                                }
                            }}
                            className={`bg-white rounded-2xl p-3 shadow-sm border flex items-center gap-3 transition-all ${
                                isSent ? 'opacity-60 grayscale border-slate-100 pointer-events-none' : 
                                'border-slate-100/80 cursor-pointer hover:border-blue-300 active:scale-95'
                            }`}
                        >
                            <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg transition-colors ${
                                isSent ? 'bg-slate-200 text-slate-500' : 
                                'bg-blue-50 text-blue-600'
                            }`}>
                                {initial}
                            </div>

                            <div className="flex flex-col text-right overflow-hidden flex-1">
                                <span className="font-bold text-slate-800 text-[15px] truncate">{name}</span>
                                <span className="font-mono text-[13px] text-slate-500 truncate mt-0.5">{user.email}</span>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
      </div>

      {/* Modern Composer Drawer (Bottom Sheet on Mobile) */}
      <AnimatePresence>
        {isBottomSheetOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm"
                    onClick={() => !isSending && setIsBottomSheetOpen(false)}
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                    dir="rtl"
                >
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                           رسالة جديدة
                        </h3>
                        <button 
                            onClick={() => !isSending && setIsBottomSheetOpen(false)} 
                            className="text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-200"
                            disabled={isSending}
                        >
                           <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-5 bg-white">
                        
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-3 text-sm text-blue-800 shrink-0">
                            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                            <p>سيتم إرسال هذه الرسالة إلى <strong>{selectedUsers.size}</strong> مستخدم. يرجى المراجعة بعناية قبل الإرسال.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">النص (يدعم المسافات)</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={5}
                                placeholder="اكتب رسالتك تفصيلياً هنا..."
                                className="w-full border border-slate-200 rounded-2xl p-4 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[15px] resize-none transition-all"
                            ></textarea>
                        </div>
                        
                        <div className="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden p-5 shrink-0">
                            <div 
                                className="flex items-center justify-between cursor-pointer select-none"
                                onClick={() => setIncludeButton(!includeButton)}
                            >
                                <span className="font-bold text-[15px] text-slate-700">تضمين زر (رابط) في الأسفل</span>
                                <div className={`w-12 h-7 rounded-full transition-colors relative flex items-center ${includeButton ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full mx-1 absolute transition-all shadow-sm ${includeButton ? 'left-5' : 'left-0'}`}></div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {includeButton && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 gap-4 mt-4 pt-4 border-t border-slate-200">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">النص على الزر</label>
                                                <input 
                                                    type="text" 
                                                    value={buttonText}
                                                    onChange={e => setButtonText(e.target.value)}
                                                    placeholder="مثال: تسجيل الدخول"
                                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">الرابط الوجهة</label>
                                                <input 
                                                    type="url" 
                                                    value={buttonLink}
                                                    onChange={e => setButtonLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all shadow-sm font-mono text-left"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {isSending && sendingStatus && (
                            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm font-medium text-center flex flex-col items-center gap-3 shrink-0">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                {sendingStatus}
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-white drop-shadow-2xl">
                        <button 
                            onClick={handleSendEmail}
                            disabled={selectedUsers.size === 0 || isSending}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[17px] shadow-lg shadow-blue-500/20"
                        >
                            <Send size={20} className="transform -scale-x-100" /> 
                            {isSending ? 'جاري التنفيذ...' : `تأكيد وإرسال لـ ${selectedUsers.size}`}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
