import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { UserIcon, Mail, CheckSquare, Square, Search, Send, RefreshCw, Menu, Users, CheckCircle2, CircleDashed, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminEmails({ triggerAlert }: { triggerAlert: (msg: string, type: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'remaining'>('all');
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
    if (window.confirm('هل أنت متأكد من رغبتك في تصفير قائمة المستلمين؟ سيتم إعادة الجميع إلى قائمة المتبقية.')) {
        localStorage.removeItem('sent_emails_history');
        setSentSet(new Set());
        triggerAlert('تم تصفير قائمة المستلمين بنجاح', 'success');
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
      triggerAlert('خطأ في جلب المستخدمين: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
      const matchesSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.raw_user_meta_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      
      if (activeTab === 'sent') return sentSet.has(u.id);
      if (activeTab === 'remaining') return !sentSet.has(u.id);
      return true;
  });

  const toggleUserSelection = (userId: string) => {
    if (sentSet.has(userId)) return; // Prevent selecting already sent users
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    // Only toggle users in the current view that haven't been sent yet
    const selectableUsers = filteredUsers.filter(u => !sentSet.has(u.id));
    
    // Check if all selectable users in view are currently selected
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
      triggerAlert('الرجاء إدخال محتوى الرسالة.', 'error');
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
            setSendingStatus(`جاري الإرسال إلى ${userObj.email}... (${sentCount + 1}/${selectedUsersList.length})`);
            
            let htmlMessage = `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">`;
            htmlMessage += `<p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br/>')}</p>`;
            
            if (includeButton && buttonText && buttonLink) {
                htmlMessage += `
                <div style="margin-top: 20px; text-align: right;">
                    <a href="${buttonLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
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
                subject: 'رسالة من إدارة منصة بكالوريا',
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
            
            // Wait slightly between each email
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (i + 60 < selectedUsersList.length) {
            for (let s = 60; s > 0; s--) {
                setSendingStatus(`إيقاف مؤقت! تم إرسال ${sentCount} رسالة. ننتظر ${s} ثانية قبل الدفعة التالية لتجنب الحظر...`);
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
      triggerAlert('تم إنهاء إرسال الرسائل!', 'success');
    } catch (err: any) {
      triggerAlert('خطأ في الإرسال: ' + err.message, 'error');
      setSendingStatus('');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] pb-24 font-sans" dir="rtl">
      {/* Navbar Minimalist */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Mail size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">إدارة المراسلات</h1>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-colors text-sm border border-slate-200 hover:border-red-200"
        >
          <RefreshCw size={16} /> <span className="hidden sm:inline">تصفير السجل</span>
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 p-6 opacity-5 transform -translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
               <Users size={80} />
            </div>
            <p className="text-slate-500 font-bold mb-2">إجمالي المستخدمين</p>
            <h2 className="text-4xl font-black text-slate-800">{users.length}</h2>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 p-6 opacity-20 transform -translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
               <CheckCircle2 size={80} />
            </div>
            <p className="text-emerald-50 font-medium mb-2">تم الإرسال بنجاح</p>
            <h2 className="text-4xl font-black">{sentSet.size}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 left-0 p-6 opacity-5 transform -translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform text-amber-500">
               <CircleDashed size={80} />
            </div>
            <p className="text-slate-500 font-bold mb-2 text-amber-600/80">المتبقي</p>
            <h2 className="text-4xl font-black text-amber-600">{users.length - sentSet.size}</h2>
          </div>
        </div>

        {/* Search and Filter Toolbar */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/60 shadow-sm flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all block"
            />
            <Search className="absolute right-4 top-4 text-slate-400" size={20} />
          </div>
          
          <div className="flex bg-slate-50 rounded-xl p-1 shrink-0 overflow-x-auto">
             <button 
               onClick={() => setActiveTab('all')}
               className={`whitespace-nowrap px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               الكل
             </button>
             <button 
               onClick={() => setActiveTab('sent')}
               className={`whitespace-nowrap px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'sent' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               المستلمة <span className="bg-emerald-100/50 px-2 py-0.5 rounded-full text-xs">{sentSet.size}</span>
             </button>
             <button 
               onClick={() => setActiveTab('remaining')}
               className={`whitespace-nowrap px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'remaining' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               المتبقية <span className="bg-amber-100/50 px-2 py-0.5 rounded-full text-xs">{users.length - sentSet.size}</span>
             </button>
          </div>
        </div>

        {/* Master Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <button 
            onClick={toggleAll}
            className="flex items-center gap-3 text-slate-600 font-bold hover:text-blue-600 transition-colors px-2"
          >
             {(() => {
                const selectableUsers = filteredUsers.filter(u => !sentSet.has(u.id));
                const allSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUsers.has(u.id));
                return allSelected ? (
                  <><CheckSquare size={22} className="text-blue-500" /> إلغاء تحديد الكل ({selectedUsers.size})</>
                ) : (
                  <><Square size={22} className="text-slate-300" /> تحديد الكل ({selectableUsers.length})</>
                );
            })()}
          </button>
          
          <button 
              onClick={() => {
                  const remaining = filteredUsers.filter(u => !sentSet.has(u.id));
                  if (remaining.length === 0 && selectedUsers.size === 0) {
                      triggerAlert('لا يوجد مستخدمين متبقين في هذه القائمة لمراسلتهم.', 'error');
                      return;
                  }
                  if (selectedUsers.size === 0) {
                      setSelectedUsers(new Set(remaining.map(u => u.id)));
                  }
                  setIsBottomSheetOpen(true);
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
              <Send size={18} className="transform -scale-x-100" /> 
              {selectedUsers.size > 0 ? `إرسال للمحددين (${selectedUsers.size})` : `إرسال للكل (${filteredUsers.filter(u => !sentSet.has(u.id)).length})`}
          </button>
        </div>

        {/* Grid List */}
        {filteredUsers.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search size={32} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-1">لا يوجد نتائج</h3>
             <p className="text-slate-500">حاول البحث بكلمات مختلفة أو تغيير التصنيف.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {filteredUsers.map(user => {
                   const name = user.raw_user_meta_data?.full_name || 'بدون اسم';
                   const initial = name.charAt(0).toUpperCase();
                   const isSelected = selectedUsers.has(user.id);
                   const isSent = sentSet.has(user.id);

                   return (
                       <div 
                         key={user.id} 
                         onClick={() => toggleUserSelection(user.id)}
                         className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col gap-4 ${
                             isSent ? 'bg-slate-50 border-slate-200 opacity-60 pointer-events-none' : 
                             isSelected ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10 scale-[1.02]' : 
                             'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                         }`}
                       >
                           <div className="absolute top-4 left-4 z-10 transition-transform group-active:scale-90">
                               {isSent ? (
                                   <CheckCircle2 size={22} className="text-emerald-500" />
                               ) : isSelected ? (
                                   <CheckSquare size={22} className="text-blue-500" />
                               ) : (
                                   <Square size={22} className="text-slate-300 group-hover:text-blue-300 transition-colors" />
                               )}
                           </div>
                           
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 transition-colors ${
                               isSent ? 'bg-slate-200 text-slate-500' : 
                               isSelected ? 'bg-blue-500 text-white' : 
                               'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                           }`}>
                               {initial}
                           </div>
                           
                           <div className="overflow-hidden pr-1">
                               <h4 className="font-bold text-slate-800 truncate text-[15px]" title={name}>{name}</h4>
                               <p className="text-[13px] text-slate-500 font-mono truncate mt-0.5" title={user.email}>{user.email}</p>
                               <span className="inline-block mt-3 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg max-w-full truncate">
                                  {user.raw_user_meta_data?.specialization || 'مستخدم غير مصنف'}
                               </span>
                           </div>
                       </div>
                   )
               })}
           </div>
        )}
      </div>

      {/* Bottom Sheet for Compose Email */}
      <AnimatePresence>
        {isBottomSheetOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm"
                    onClick={() => setIsBottomSheetOpen(false)}
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col h-[85vh]"
                    dir="rtl"
                >
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                           صياغة الرسالة
                        </h3>
                        <button onClick={() => setIsBottomSheetOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-200">
                           <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">محتوى الرسالة</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={8}
                                placeholder="اكتب رسالتك هنا..."
                                className="w-full border border-slate-200 rounded-2xl p-5 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] resize-none transition-all"
                            ></textarea>
                            <p className="text-xs text-slate-500 mt-2 font-medium">سيتم إرسال هذه الرسالة إلى عدد ({selectedUsers.size}) مستخدم.</p>
                        </div>
                        
                        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                            <label className="flex items-center gap-3 cursor-pointer mb-4 select-none">
                                <div className={`w-12 h-7 rounded-full transition-colors relative flex items-center ${includeButton ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full mx-1 absolute transition-all shadow-sm ${includeButton ? 'left-5' : 'left-0'}`}></div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={includeButton}
                                    onChange={(e) => setIncludeButton(e.target.checked)}
                                />
                                <span className="font-bold text-[15px] text-slate-700">تضمين زر (رابط) في نهاية الرسالة</span>
                            </label>

                            <AnimatePresence>
                                {includeButton && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">اسم الزر</label>
                                                <input 
                                                    type="text" 
                                                    value={buttonText}
                                                    onChange={e => setButtonText(e.target.value)}
                                                    placeholder="مثال: اضغط هنا للدخول"
                                                    className="w-full border-slate-200 rounded-xl p-3.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm border font-medium transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">الرابط (الوجهة)</label>
                                                <input 
                                                    type="url" 
                                                    value={buttonLink}
                                                    onChange={e => setButtonLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full border-slate-200 rounded-xl p-3.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm border font-mono transition-all text-left"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {isSending && sendingStatus && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-2xl text-sm font-bold text-center leading-relaxed flex flex-col items-center gap-3 animate-pulse">
                                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                {sendingStatus}
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-white flex gap-4 drop-shadow-2xl">
                        <button 
                            onClick={handleSendEmail}
                            disabled={selectedUsers.size === 0 || isSending}
                            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 text-lg shadow-lg shadow-blue-600/20"
                        >
                            <Send size={22} className="transform -scale-x-100" /> 
                            {isSending ? 'جاري الإرسال...' : `تأكيد وإرسال لـ ${selectedUsers.size} مستخدمين`}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
