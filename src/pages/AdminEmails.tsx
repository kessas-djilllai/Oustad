import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Search, Send, RefreshCw, Menu, Check, X, Filter, Users, CheckCircle2, ChevronRight, Inbox, Plus, AlertCircle, Bookmark, MessageSquare, History, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminEmails({ triggerAlert }: { triggerAlert: (msg: string, type: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'remaining'>('remaining');
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  
  const [visibleCount, setVisibleCount] = useState(50);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  const [message, setMessage] = useState('');
  const [includeButton, setIncludeButton] = useState(false);
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState('');
  
  const [savedMessages, setSavedMessages] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [selectedUserForOptions, setSelectedUserForOptions] = useState<any>(null);
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  const [currentUserHistory, setCurrentUserHistory] = useState<any[]>([]);
  const [showSqlModal, setShowSqlModal] = useState(false);

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
    
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
      try {
          const { data, error } = await supabase.from('admin_msg_templates').select('*').order('created_at', { ascending: false });
          if (error) {
              if (error.message?.includes('does not exist') || error.code === '42P01') {
                  setShowSqlModal(true);
              }
              throw error;
          }
          if (data) {
              setSavedMessages(data.map(d => ({
                  id: d.id,
                  message: d.message,
                  includeButton: d.include_button,
                  buttonText: d.button_text,
                  buttonLink: d.button_link
              })));
          }
      } catch (e) {
          console.error("DB Error:", e);
      }
  };

  const loadUserHistory = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('user_messages').select('*').eq('user_id', userId).order('date', { ascending: false });
          if (error) {
              if (error.message?.includes('does not exist') || error.code === '42P01') {
                  setShowSqlModal(true);
              }
              throw error;
          }
          if (data) {
              setCurrentUserHistory(data.map(d => ({
                  id: d.id,
                  text: d.text,
                  date: d.date,
                  hasButton: d.has_button,
                  buttonText: d.button_text,
                  buttonLink: d.button_link
              })));
          }
      } catch(e) {
          console.error("DB Error:", e);
      }
  };

  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, activeTab]);

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
                
                // Save to user's personal message log (database)
                try {
                    const msgToSave = {
                        user_id: userObj.id,
                        text: message,
                        date: new Date().toISOString(),
                        has_button: includeButton,
                        button_text: buttonText,
                        button_link: buttonLink
                    };
                    const { error } = await supabase.from('user_messages').insert(msgToSave);
                    if (error) throw error;
                } catch(e: any) {
                    console.error("DB Saving Error", e);
                    if (e?.message?.includes('does not exist') || e?.code === '42P01') {
                        setShowSqlModal(true);
                    } else {
                        triggerAlert('تعذر حفظ الرسالة في السجل، تحقق من الاتصال.', 'error');
                    }
                }
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
      
      <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-5 leading-tight">
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
                    setShowHistory(false);
                }}
                className="flex-1 bg-blue-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform"
            >
                <div className="flex flex-col text-right font-bold text-[15px]">
                    <span>إرسال للكل</span>
                    <span className="text-blue-100 text-[13px] font-medium">({remainingCount} متبقي)</span>
                </div>
                <Send size={22} className="transform -scale-x-100 opacity-90" />
            </button>

            {/* Reset Button */}
            <button 
                onClick={handleReset}
                className="w-[100px] bg-red-50 text-red-600 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 font-bold text-sm active:scale-[0.98] transition-transform"
            >
                <RefreshCw size={20} />
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
                <>
                {filteredUsers.slice(0, visibleCount).map(user => {
                    const name = user.raw_user_meta_data?.full_name || 'بدون اسم';
                    const initial = name.charAt(0).toUpperCase();
                    const isSent = sentSet.has(user.id);

                    return (
                        <div 
                            key={user.id}
                            onClick={() => {
                                setSelectedUserForOptions(user);
                            }}
                            className={`bg-white rounded-2xl p-3 shadow-sm border flex items-center gap-3 transition-all cursor-pointer hover:border-blue-300 active:scale-95 ${
                                isSent ? 'opacity-70 grayscale border-slate-100' : 
                                'border-slate-100/80'
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
                })}
                {visibleCount < filteredUsers.length && (
                    <button
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="w-full py-4 mt-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-white rounded-2xl border border-slate-100 shadow-sm transition-colors active:scale-95"
                    >
                        عرض المزيد ...
                    </button>
                )}
                </>
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
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-slate-900/60 z-50"
                    onClick={() => !isSending && setIsBottomSheetOpen(false)}
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                    className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 flex flex-col h-auto max-h-[85vh]"
                    dir="rtl"
                >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl shrink-0">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 text-[17px]">
                                {showHistory ? 'القوالب المحفوظة' : 'رسالة جديدة'}
                            </h3>
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-[12px] font-bold bg-slate-200/70 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-1.5"
                            >
                                <Bookmark size={14} />
                                {showHistory ? 'رجوع للرسالة' : 'سجل القوالب'}
                            </button>
                        </div>
                        <button 
                            onClick={() => !isSending && setIsBottomSheetOpen(false)} 
                            className="text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-200"
                            disabled={isSending}
                        >
                           <X size={20} />
                        </button>
                    </div>
                    
                    {showHistory ? (
                        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-slate-50">
                            {savedMessages.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-200/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bookmark size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 text-[15px] font-bold">لا توجد رسائل محفوظة حالياً</p>
                                </div>
                            ) : (
                                savedMessages.map(msg => (
                                    <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                                        <p className="text-[14px] font-medium text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[10rem] overflow-y-auto">{msg.message}</p>
                                        {msg.includeButton && (
                                            <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1.5 rounded-lg inline-block self-start font-bold border border-blue-100">
                                                زر إضافي: {msg.buttonText || 'بدون نص'}
                                            </div>
                                        )}
                                        <div className="flex gap-2 mt-1 border-t border-slate-100 pt-3">
                                            <button onClick={() => {
                                                setMessage(msg.message);
                                                setIncludeButton(msg.includeButton);
                                                setButtonText(msg.buttonText || '');
                                                setButtonLink(msg.buttonLink || '');
                                                setShowHistory(false);
                                            }} className="flex-1 bg-slate-800 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-slate-700 active:scale-[0.98] transition-all">
                                                استخدام القالب
                                            </button>
                                            <button onClick={async () => {
                                                if(window.confirm('هل أنت متأكد من حذف هذا القالب؟')) {
                                                    try {
                                                        const { error } = await supabase.from('admin_msg_templates').delete().eq('id', msg.id);
                                                        if (error) throw error;
                                                    } catch (e) {}

                                                    const updated = savedMessages.filter(m => m.id !== msg.id);
                                                    setSavedMessages(updated);
                                                    localStorage.setItem('admin_msg_history', JSON.stringify(updated));
                                                }
                                            }} className="px-4 bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-bold hover:bg-red-100 active:scale-[0.98] transition-all">
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 bg-white">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-2 text-[13px] text-blue-800 shrink-0">
                                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                                <p>إرسال إلى <strong>{selectedUsers.size}</strong> مستخدم. راجع الرسالة قبل الإرسال.</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[13px] font-bold text-slate-700">النص (يدعم المسافات)</label>
                                    {message.trim() && (
                                        <button onClick={async () => {
                                            try {
                                                const newMsg = {
                                                    message,
                                                    include_button: includeButton,
                                                    button_text: buttonText,
                                                    button_link: buttonLink
                                                };
                                                const { data, error } = await supabase.from('admin_msg_templates').insert(newMsg).select().single();
                                                if (error) throw error;
                                                
                                                if (data) {
                                                    const formatted = {
                                                        id: data.id,
                                                        message: data.message,
                                                        includeButton: data.include_button,
                                                        buttonText: data.button_text,
                                                        buttonLink: data.button_link
                                                    };
                                                    setSavedMessages([formatted, ...savedMessages]);
                                                }
                                                triggerAlert('تم حفظ الرسالة كقالب', 'success');
                                                setShowHistory(true);
                                            } catch (e: any) {
                                                console.error("DB Saving Error", e);
                                                if (e?.message?.includes('does not exist') || e?.code === '42P01') {
                                                    setShowSqlModal(true);
                                                } else {
                                                    triggerAlert('تعذر حفظ القالب، تحقق من قاعدة البيانات.', 'error');
                                                }
                                            }
                                        }} className="text-[11px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                            + حفظ كقالب
                                        </button>
                                    )}
                                </div>
                                <textarea 
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder="اكتب رسالتك تفصيلياً هنا..."
                                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[14px] resize-none transition-all font-medium leading-relaxed"
                                ></textarea>
                            </div>
                            
                            <div className="border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden p-4 shrink-0">
                                <div 
                                    className="flex items-center justify-between cursor-pointer select-none"
                                    onClick={() => setIncludeButton(!includeButton)}
                                >
                                    <span className="font-bold text-[14px] text-slate-700">تضمين زر (رابط)</span>
                                    <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${includeButton ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full mx-1 absolute transition-all shadow-sm ${includeButton ? 'left-5' : 'left-0'}`}></div>
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
                                            <div className="grid grid-cols-1 gap-3 mt-3 pt-3 border-t border-slate-200">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">النص</label>
                                                    <input 
                                                        type="text" 
                                                        value={buttonText}
                                                        onChange={e => setButtonText(e.target.value)}
                                                        placeholder="مثال: تسجيل الدخول"
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">الرابط الوجهة</label>
                                                    <input 
                                                        type="url" 
                                                        value={buttonLink}
                                                        onChange={e => setButtonLink(e.target.value)}
                                                        placeholder="https://..."
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all shadow-sm font-mono text-left"
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
                    )}

                    {!showHistory && (
                        <div className="p-4 border-t border-slate-100 bg-white drop-shadow-2xl shrink-0">
                            <button 
                                onClick={handleSendEmail}
                                disabled={selectedUsers.size === 0 || isSending}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-black bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[16px] shadow-lg shadow-blue-500/20"
                            >
                                <Send size={20} className="transform -scale-x-100" /> 
                                {isSending ? 'جاري التنفيذ...' : `تأكيد وإرسال لـ ${selectedUsers.size}`}
                            </button>
                        </div>
                    )}
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* User Options Sheet */}
      <AnimatePresence>
        {selectedUserForOptions && !showUserHistoryModal && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm"
                    onClick={() => setSelectedUserForOptions(null)}
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                    className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 flex flex-col p-6 gap-4"
                    dir="rtl"
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-black text-slate-800 text-lg">
                            خيارات المستخدم
                        </h3>
                        <button 
                            onClick={() => setSelectedUserForOptions(null)}
                            className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-2">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                            {(selectedUserForOptions.raw_user_meta_data?.full_name || 'ب').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 px-1">{selectedUserForOptions.raw_user_meta_data?.full_name || 'بدون اسم'}</span>
                            <span className="text-sm font-mono text-slate-500 line-clamp-1 px-1">{selectedUserForOptions.email}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            setSelectedUsers(new Set([selectedUserForOptions.id]));
                            setSelectedUserForOptions(null);
                            setIsBottomSheetOpen(true);
                            setShowHistory(false);
                        }}
                        className="w-full flex items-center gap-3 py-4 px-5 rounded-2xl font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                        <div className="bg-white p-2 rounded-lg shadow-sm"><Send size={18} className="transform -scale-x-100" /></div>
                        إرسال رسالة 
                    </button>

                    <button 
                        onClick={() => {
                            loadUserHistory(selectedUserForOptions.id);
                            setShowUserHistoryModal(true);
                        }}
                        className="w-full flex items-center gap-3 py-4 px-5 rounded-2xl font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-slate-500"><History size={18} /></div>
                        سجل الرسائل المرسلة
                    </button>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* User History Modal */}
      <AnimatePresence>
        {selectedUserForOptions && showUserHistoryModal && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm"
                    onClick={() => {
                        setShowUserHistoryModal(false);
                        setSelectedUserForOptions(null);
                    }}
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                    className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 flex flex-col h-[85vh]"
                    dir="rtl"
                >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl shrink-0">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowUserHistoryModal(false)}
                                className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <h3 className="font-black text-slate-800 text-[17px]">
                                سجل رسائل: {selectedUserForOptions.raw_user_meta_data?.full_name?.split(' ')[0] || 'المستخدم'}
                            </h3>
                        </div>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50">
                        {currentUserHistory.length === 0 ? (
                             <div className="text-center py-16">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                    <MessageSquare size={26} className="text-slate-300" />
                                </div>
                                <h3 className="text-slate-500 font-bold mb-1">لا توجد رسائل سابقة</h3>
                                <p className="text-sm text-slate-400">لم تقم بإرسال أي رسالة لهذا المستخدم بعد.</p>
                             </div>
                        ) : (
                            currentUserHistory.map((msg, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative group overflow-hidden">
                                    <div className="text-[12px] font-bold text-slate-400 mb-2 border-b border-slate-50 pb-2 flex items-center justify-between" dir="rtl">
                                        <div className="flex gap-2">
                                            {new Date(msg.date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm('هل أنت متأكد من حذف هذه الرسالة من السجل؟')) {
                                                    try {
                                                        const { error } = await supabase.from('user_messages').delete().eq('id', msg.id);
                                                        if (error) throw error;
                                                    } catch (e) {}

                                                    const updated = currentUserHistory.filter(m => m.id !== msg.id);
                                                    setCurrentUserHistory(updated);
                                                    const key = 'user_messages_log_' + selectedUserForOptions.id;
                                                    localStorage.setItem(key, JSON.stringify(updated));
                                                }
                                            }}
                                            className="text-white hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg p-1.5 opacity-0 group-hover:opacity-100 bg-red-400 font-bold flex items-center justify-center shrink-0"
                                        >
                                            <X size={14} /> 
                                        </button>
                                    </div>
                                    <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed font-medium">
                                        {msg.text}
                                    </p>
                                    {msg.hasButton && (
                                        <div className="mt-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col gap-1">
                                            <span className="text-[11px] font-bold text-blue-500">الزر المرفق:</span>
                                            <div className="font-bold text-blue-800 text-[13px]">{msg.buttonText}</div>
                                            <div className="text-[11px] font-mono text-blue-400 truncate dir-ltr">{msg.buttonLink}</div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* SQL Missing Alert Modal */}
      <AnimatePresence>
        {showSqlModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setShowSqlModal(false)}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    dir="rtl"
                >
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                <Database size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-red-900">جداول قاعدة البيانات مفقودة</h3>
                                <p className="text-sm font-bold text-red-600">يرجى إضافة الجداول في Supabase لتفعيل تخزين الرسائل</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowSqlModal(false)}
                            className="bg-red-100 p-2 rounded-full text-red-500 hover:bg-red-200"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-5 overflow-y-auto">
                        <p className="text-slate-600 font-medium mb-4 text-[15px] leading-relaxed">
                            لأنك تقوم باستخدام ميزة (حفظ القوالب وسجل مراسلات المستخدمين)، يجب إنشاء الجداول التالية في لوحة تحكم Supabase الخاصة بك عبر الذهاب لـ <strong>SQL Editor</strong> وتشغيل هذا الكود:
                        </p>
                        <div className="relative group">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS admin_msg_templates (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  message TEXT,
  include_button BOOLEAN DEFAULT false,
  button_text TEXT,
  button_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS user_messages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT,
  has_button BOOLEAN DEFAULT false,
  button_text TEXT,
  button_link TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);`);
                                    triggerAlert('تم نسخ الكود بنجاح', 'success');
                                }}
                                className="absolute top-3 left-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold font-sans backdrop-blur-sm transition-all"
                            >
                                نسخ الكود
                            </button>
                            <pre className="bg-slate-900 text-green-400 p-5 rounded-2xl overflow-x-auto font-mono text-[13px] leading-relaxed" dir="ltr">
{`CREATE TABLE IF NOT EXISTS admin_msg_templates (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  message TEXT,
  include_button BOOLEAN DEFAULT false,
  button_text TEXT,
  button_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS user_messages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT,
  has_button BOOLEAN DEFAULT false,
  button_text TEXT,
  button_link TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);`}
                            </pre>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
