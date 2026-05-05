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
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 font-sans" dir="rtl">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Mail size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">المراسلات</h1>
                        <p className="text-sm text-slate-500 hidden sm:block">إدارة رسائل المستخدمين والتنبيهات</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                     <button 
                         onClick={handleReset}
                         className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-red-100"
                     >
                         <RefreshCw size={16} /> تصفير القائمة
                     </button>
                    {(selectedUsers.size > 0 || remainingCount > 0) && (
                        <button 
                            onClick={() => {
                                if (selectedUsers.size === 0) {
                                    const remaining = users.filter(u => !sentSet.has(u.id));
                                    setSelectedUsers(new Set(remaining.map(u => u.id)));
                                }
                                setIsBottomSheetOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all"
                        >
                            <Send size={16} className="transform -scale-x-100" />
                            {selectedUsers.size > 0 ? `رسالة جديدة (${selectedUsers.size})` : 'مراسلة الجميع'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-500">إجمالي المستخدمين</h3>
                    <Users size={20} className="text-blue-500 opacity-80" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{users.length}</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-500">تم الإرسال</h3>
                    <CheckCircle2 size={20} className="text-emerald-500 opacity-80" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{sentSet.size}</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-500">في الانتظار</h3>
                    <Inbox size={20} className="text-amber-500 opacity-80" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{remainingCount}</p>
            </div>
        </div>

        {/* Content Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Toolbar */}
            <div className="border-b border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                
                {/* Search */}
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث بالاسم أو الإيميل..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow"
                    />
                </div>
                
                {/* Segmented Control */}
                <div className="flex p-0.5 bg-slate-100 border border-slate-200 rounded-lg sm:w-auto w-full">
                    {[
                        { id: 'remaining', label: 'في الانتظار', count: remainingCount },
                        { id: 'sent', label: 'المستلمة', count: sentSet.size },
                        { id: 'all', label: 'الكل', count: users.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                activeTab === tab.id 
                                ? 'bg-slate-100 text-slate-600' 
                                : 'bg-slate-200/50 text-slate-500'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List Header */}
            {filteredUsers.length > 0 && activeTab !== 'sent' && (
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center bg-slate-50 border-b border-slate-200 px-5 py-3 text-sm font-medium text-slate-500">
                    <div 
                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            isAllSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white hover:border-blue-400'
                        }`}
                        onClick={toggleAll}
                    >
                        {isAllSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div>المستخدم ({filteredUsers.length})</div>
                    <div className="text-left w-24">الحالة</div>
                </div>
            )}

            {/* List Body */}
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                            <Search size={24} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mb-1">لا توجد نتائج</h3>
                        <p className="text-sm text-slate-500">جرب تعديل كلمات البحث أو تغيير التصنيف.</p>
                    </div>
                ) : (
                    filteredUsers.map(user => {
                        const name = user.raw_user_meta_data?.full_name || 'بدون اسم';
                        const initial = name.charAt(0).toUpperCase();
                        const isSelected = selectedUsers.has(user.id);
                        const isSent = sentSet.has(user.id);

                        return (
                            <div 
                                key={user.id}
                                onClick={() => !isSent && toggleUserSelection(user.id)}
                                className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-3 transition-colors ${
                                    isSent ? 'bg-slate-50/50 opacity-75' : 
                                    isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60 cursor-pointer' : 
                                    'hover:bg-slate-50 cursor-pointer'
                                }`}
                            >
                                <div className="pt-1 self-start">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                        isSent ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed' :
                                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 
                                        'border-slate-300 bg-white'
                                    }`}>
                                        {(isSelected || isSent) && <Check size={14} strokeWidth={isSent ? 2 : 3} />}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                                        isSent ? 'bg-slate-100 border-slate-200 text-slate-500' :
                                        'bg-blue-100 border-blue-200 text-blue-700'
                                    }`}>
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-900 truncate pr-1">{name}</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                                    </div>
                                </div>
                                
                                <div className="text-left">
                                    {isSent ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                            مُرسل
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                            انتظار
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            
            {/* List Footer */}
            {selectedUsers.size > 0 && (
                <div className="bg-blue-50 border-t border-blue-100 p-4 flex items-center justify-between slide-up transition-all duration-300">
                    <span className="text-sm font-medium text-blue-800">
                        تم تحديد ({selectedUsers.size}) مستخدم
                    </span>
                    <button 
                        onClick={() => setSelectedUsers(new Set())}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        إلغاء التحديد
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Modern Composer Drawer */}
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
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
                    dir="rtl"
                >
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Mail size={16} />
                            </div>
                            <h3 className="font-bold text-slate-900">رسالة جديدة</h3>
                        </div>
                        <button 
                            onClick={() => !isSending && setIsBottomSheetOpen(false)} 
                            className="text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100"
                            disabled={isSending}
                        >
                           <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-slate-50/30">
                        
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800 shrink-0">
                            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                            <p>سيتم إرسال هذه الرسالة إلى <strong>{selectedUsers.size}</strong> مستخدم. يرجى المراجعة بعناية قبل الإرسال.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">محتوى الرسالة</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={10}
                                placeholder="اكتب رسالتك تفصيلياً هنا..."
                                className="w-full border border-slate-200 rounded-xl p-4 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm resize-none transition-all shadow-sm flex-1"
                            ></textarea>
                        </div>
                        
                        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm shrink-0">
                            <div 
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 select-none"
                                onClick={() => setIncludeButton(!includeButton)}
                            >
                                <div className="flex items-center gap-3">
                                    <Plus size={18} className={`text-slate-400 transition-transform ${includeButton ? 'rotate-45' : ''}`} />
                                    <span className="font-semibold text-sm text-slate-700">إضافة زر إجراء (CTA)</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${includeButton ? 'bg-blue-500' : 'bg-slate-200'}`}>
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
                                        <div className="p-4 pt-0 border-t border-slate-100 flex flex-col gap-4 mt-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">النص على الزر</label>
                                                <input 
                                                    type="text" 
                                                    value={buttonText}
                                                    onChange={e => setButtonText(e.target.value)}
                                                    placeholder="مثال: تسجيل الدخول"
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الرابط الموجه</label>
                                                <input 
                                                    type="url" 
                                                    value={buttonLink}
                                                    onChange={e => setButtonLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all font-mono text-left"
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
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                {sendingStatus}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white">
                        <button 
                            onClick={handleSendEmail}
                            disabled={selectedUsers.size === 0 || isSending}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Send size={18} className="transform -scale-x-100" /> 
                            {isSending ? 'جاري التنفيذ...' : 'إرسال الآن'}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <style>{`
        .slide-up {
            animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
