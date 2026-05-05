import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { UserIcon, Mail, CheckSquare, Square, Search, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AdminEmails({ triggerAlert }: { triggerAlert: (msg: string, type: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchUsers();
    // Load saved SMTP credentials
    const savedEmail = localStorage.getItem('smtp_email');
    const savedPass = localStorage.getItem('smtp_pass');
    if (savedEmail) setSenderEmail(savedEmail);
    if (savedPass) setAppPassword(savedPass);
  }, []);

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
      return matchesSearch;
  });

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    if (selectedUsers.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSendEmail = async () => {
    if (selectedUsers.size === 0) {
      triggerAlert('الرجاء تحديد مستخدم واحد على الأقل.', 'error');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      triggerAlert('الرجاء إدخال عنوان ومحتوى الرسالة.', 'error');
      return;
    }
    if (!senderEmail.trim() || !appPassword.trim()) {
      triggerAlert('الرجاء إدخال إيميل المرسل وكلمة مرور التطبيقات.', 'error');
      return;
    }

    const selectedEmails = users
      .filter(u => selectedUsers.has(u.id))
      .map(u => u.email)
      .filter(Boolean);

    if (selectedEmails.length === 0) {
        triggerAlert('لم يتم العثور على عناوين بريد إلكتروني صالحة.', 'error');
        return;
    }

    setIsSending(true);
    try {
      localStorage.setItem('smtp_email', senderEmail);
      localStorage.setItem('smtp_pass', appPassword);

      const response = await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: senderEmail,
          pass: appPassword,
          to: selectedEmails,
          subject,
          message
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'فشل إرسال الرسالة');

      setSubject('');
      setMessage('');
      setSelectedUsers(new Set());
      triggerAlert('تم إرسال الرسالة بنجاح!', 'success');
    } catch (err: any) {
      triggerAlert('خطأ في الإرسال: ' + err.message, 'error');
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
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="text-blue-500" /> إرسال رسائل للمستخدمين
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            قم بتحديد المستخدمين لإرسال رسائل عبر البريد الإلكتروني لهم.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
        {/* Email Form Panel - Sticky on Desktop */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 lg:sticky lg:top-6 order-2 lg:order-1">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             تفاصيل الرسالة
          </h3>
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 mb-4">
              <h4 className="font-bold text-xs text-slate-600 border-b border-slate-100 pb-2">إعدادات بريد الإرسال (Gmail)</h4>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (Sender Email)</label>
                <input 
                  type="email" 
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="مثال: example@gmail.com"
                  className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 outline-none focus:border-blue-500 text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة مرور التطبيقات (App Password)</label>
                <input 
                  type="password" 
                  value={appPassword}
                  onChange={e => setAppPassword(e.target.value)}
                  placeholder="كلمة مرور التطبيقات..."
                  className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 outline-none focus:border-blue-500 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">عنوان الرسالة (Subject)</label>
              <input 
                type="text" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="عنوان الرسالة..."
                className="w-full border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">محتوى الرسالة (Body)</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                placeholder="اكتب رسالتك هنا..."
                className="w-full border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 text-sm resize-none"
              ></textarea>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                ملاحظة: سيتم إرسال الرسالة من الخادم تلقائياً عن طريق إعدادات بريد Gmail أعلاه باستخدام "كلمة مرور التطبيقات". سيتم وضع المستقبلين في خانة BCC للخصوصية.
              </p>
            </div>

            <button 
              onClick={handleSendEmail}
              disabled={selectedUsers.size === 0 || isSending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 mt-4"
            >
              {isSending ? (
                <>جاري الإرسال...</>
              ) : (
                <><Send size={18} /> إرسال إلى {selectedUsers.size} مستخدمين</>
              )}
            </button>
          </div>
        </div>

        {/* Users List Panel */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="flex gap-2 mb-4">
             <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 p-3 pr-10 rounded-xl outline-none focus:border-blue-500 bg-slate-50 text-sm min-w-[200px]"
              />
              <Search className="absolute right-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          <div className="mb-4">
            <button 
              onClick={toggleAll} 
              className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                <><CheckSquare size={18} className="text-blue-500" /> إلغاء تحديد الكل</>
              ) : (
                <><Square size={18} /> تحديد الكل</>
              )}
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-500 font-medium">لا يوجد مستخدمين لعرضهم</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm">
                    <th className="font-bold py-3 px-4 whitespace-nowrap border-b border-slate-200">الاسم والتخصص</th>
                    <th className="font-bold py-3 px-4 whitespace-nowrap border-b border-slate-200">البريد الإلكتروني</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.has(user.id);
                    return (
                      <tr 
                        key={user.id} 
                        onClick={() => toggleUserSelection(user.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                      <td className="py-3 px-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="text-slate-400">
                          {isSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">
                            {user.raw_user_meta_data?.full_name || 'بدون اسم'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {user.raw_user_meta_data?.specialization || 'غير محدد'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-slate-600 border-b border-slate-100">
                        {user.email}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
