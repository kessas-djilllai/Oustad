import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { UserIcon, Mail, CheckSquare, Square, Search, Send, RefreshCw, Menu } from "lucide-react";
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
    <div className="bg-slate-50/50 rounded-3xl min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-6 flex flex-row-reverse items-center justify-between mb-2">
        <Menu size={28} className="text-slate-800 cursor-pointer" />
        <h1 className="text-2xl font-black text-slate-800">المراسلات والإشعارات</h1>
      </div>
      
      <div className="px-6 max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Actions Row */}
        <div className="flex gap-4 flex-row-reverse">
          {(() => {
              const remaining = filteredUsers.filter(u => !sentSet.has(u.id));
              return (
                <button 
                  onClick={() => {
                      if (remaining.length === 0) {
                          triggerAlert('لا يوجد مستخدمين متبقين في هذه القائمة.', 'error');
                          return;
                      }
                      setSelectedUsers(new Set(remaining.map(u => u.id)));
                      setIsBottomSheetOpen(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-5 py-4 rounded-2xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-3 text-lg shadow-sm"
                >
                   <Send size={20} className="transform -scale-x-100" /> إرسال للمتبقين ({remaining.length})
                </button>
              );
          })()}
          
          <button 
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-5 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition whitespace-nowrap"
          >
            <RefreshCw size={20} /> تصفير
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 gap-1 flex-row-reverse">
           <button 
             onClick={() => setActiveTab('all')}
             className={`flex-1 py-3 text-sm font-bold rounded-xl transition ${activeTab === 'all' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             الكل
           </button>
           <button 
             onClick={() => setActiveTab('sent')}
             className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 flex-row-reverse ${activeTab === 'sent' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             المستلمة <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shrink-0">{sentSet.size}</span>
           </button>
           <button 
             onClick={() => setActiveTab('remaining')}
             className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 flex-row-reverse ${activeTab === 'remaining' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             المتبقية <span className="bg-slate-400 text-white px-2 py-0.5 rounded-full text-xs font-bold shrink-0">{users.length - sentSet.size}</span>
           </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الإيميل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-200 p-4 pr-12 rounded-2xl outline-none focus:border-blue-500 bg-white text-[15px] shadow-sm text-right"
          />
          <Search className="absolute right-4 top-4 text-slate-400" size={20} />
        </div>

        {/* Users List */}
        <div className="space-y-4">
           {filteredUsers.length === 0 ? (
             <div className="text-center p-12 bg-white rounded-3xl border border-slate-100">
               <p className="text-slate-400 font-bold">لا يوجد مستخدمين لعرضهم</p>
             </div>
           ) : (
             filteredUsers.map(user => {
                 const name = user.raw_user_meta_data?.full_name || 'بدون اسم';
                 const initial = name.charAt(0).toUpperCase();

                 return (
                     <div key={user.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                         
                         <div className="flex flex-col flex-1 items-end text-right overflow-hidden">
                             <span className="font-bold text-slate-800 text-[15px] truncate w-full">{name}</span>
                             <span className="text-sm text-slate-500 font-mono truncate w-full mt-1">{user.email}</span>
                         </div>
                         
                         <div className="w-14 h-14 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl">
                             {initial}
                         </div>
                     </div>
                 )
             })
           )}
        </div>
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
                    className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]"
                >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           صياغة الرسالة
                        </h3>
                        <button onClick={() => setIsBottomSheetOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">محتوى الرسالة</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={6}
                                placeholder="اكتب رسالتك هنا..."
                                className="w-full border border-slate-200 rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 text-sm resize-none shadow-inner"
                            ></textarea>
                        </div>
                        
                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                            <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${includeButton ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full mx-1 absolute transition-all ${includeButton ? 'left-4' : 'left-0'}`}></div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={includeButton}
                                    onChange={(e) => setIncludeButton(e.target.checked)}
                                />
                                <span className="font-bold text-sm text-slate-700">تضمين زر (رابط) في نهاية الرسالة</span>
                            </label>

                            {includeButton && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                                >
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم الزر</label>
                                        <input 
                                            type="text" 
                                            value={buttonText}
                                            onChange={e => setButtonText(e.target.value)}
                                            placeholder="مثال: اضغط هنا للدخول"
                                            className="w-full border-slate-200 rounded-lg p-2.5 bg-white outline-none focus:border-blue-500 text-sm border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">الرابط (الوجهة)</label>
                                        <input 
                                            type="url" 
                                            value={buttonLink}
                                            onChange={e => setButtonLink(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full border-slate-200 rounded-lg p-2.5 bg-white outline-none focus:border-blue-500 text-sm border font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {isSending && sendingStatus && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-bold text-center leading-relaxed flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                {sendingStatus}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                        <button 
                            onClick={handleSendEmail}
                            disabled={selectedUsers.size === 0 || isSending}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow"
                        >
                            <Send size={18} /> 
                            {isSending ? 'جاري الإرسال...' : `إرسال إلى ${selectedUsers.size} مستخدمين`}
                        </button>
                        <button 
                            onClick={() => setIsBottomSheetOpen(false)}
                            disabled={isSending}
                            className="px-6 py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
