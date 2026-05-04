import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { triggerAlert } from "./Admin";
import { Trash2, Search, User as UserIcon, AlertCircle, Edit2, Check, Star, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [userXpMap, setUserXpMap] = useState<Record<string, {id: number, xp: number}>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [editingXp, setEditingXp] = useState<string | null>(null);
  const [tempXp, setTempXp] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    setSetupRequired(false);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from('users_view').select('*').order('created_at', { ascending: false });
      
      if (usersError) {
        if (usersError.code === '42P01' || usersError.code === 'PGRST204' || usersError.message.includes('Could not find the table')) {
          setSetupRequired(true);
          return;
        } else {
          throw usersError;
        }
      }

      // Fetch all xp progress
      const { data: xpData, error: xpError } = await supabase
        .from('user_progress')
        .select('id, user_id, progress_value')
        .eq('item_type', 'gamification')
        .eq('item_id', 'xp');
        
      if (xpError) throw xpError;

      const xpMap: Record<string, {id: number, xp: number}> = {};
      if (xpData) {
         xpData.forEach(p => {
             xpMap[p.user_id] = { id: p.id, xp: p.progress_value };
         });
      }

      setUsers(usersData || []);
      setUserXpMap(xpMap);
    } catch (err: any) {
      console.error(err);
      triggerAlert("خطأ في جلب البيانات: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveXp = async (userId: string) => {
    if (!supabase) return;
    const newXp = parseInt(tempXp);
    if (isNaN(newXp) || newXp < 0) {
      triggerAlert('الرجاء إدخال رقم صحيح', 'error');
      return;
    }
    
    try {
      const existing = userXpMap[userId];
      if (existing) {
        const { error } = await supabase.from('user_progress').update({ progress_value: newXp }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_progress').insert({
           user_id: userId,
           item_type: 'gamification',
           item_id: 'xp',
           progress_value: newXp
        });
        if (error) throw error;
      }
      
      triggerAlert('تم تحديث نقاط التلميذ (XP) بنجاح', 'success');
      setEditingXp(null);
      fetchUsers(); // refresh data
    } catch (err: any) {
      triggerAlert('خطأ أثناء حفظ النقاط: ' + err.message, 'error');
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingUser || !supabase) return;
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      triggerAlert("يرجى كتابة كلمة delete بشكل صحيح للتأكيد", "error");
      return;
    }

    setIsDeleting(true);
    try {
      // Using an RPC function to delete the user
      const { error } = await supabase.rpc('delete_user_by_id', { user_id: deletingUser.id });
      if (error) {
         if (error.message.includes('function delete_user_by_id does not exist')) {
            throw new Error("يجب إعداد وظيفة החذف (RPC) في قاعدة البيانات.");
         }
         throw error;
      }
      
      triggerAlert("تم حذف المستخدم بنجاح", "success");
      setUsers(users.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
      setDeleteConfirmText('');
    } catch (err: any) {
      triggerAlert("حدث خطأ أثناء الحذف: " + err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.raw_user_meta_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (setupRequired) {
    return (
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center gap-3 mb-4 text-orange-600">
          <AlertCircle size={24} />
          <h2 className="text-xl font-bold">إعدادات قاعدة البيانات مطلوبة</h2>
        </div>
        <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl text-sm leading-relaxed mb-6">
          لعرض وإدارة المستخدمين، يجب تشغيل أكواد SQL التالية في لوحة تحكم Supabase (SQL Editor):
        </div>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-left font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed" dir="ltr">
{`-- 1. إنشاء عرض (View) لجلب المستخدمين (آمن للعرض فقط للـ Admin)
create or replace view public.users_view as
select id, email, created_at, raw_user_meta_data
from auth.users;

-- 2. إعطاء صلاحيات قراءة للمسؤول (أو للجميع حيث يتم حمايته في التطبيق)
grant select on public.users_view to anon, authenticated;

-- 3. إنشاء وظيفة (Function) لحذف المستخدم وصلاحيات الـ API لها
create or replace function public.delete_user_by_id(user_id uuid)
returns void as $$
begin
  delete from auth.users where id = user_id;
end;
$$ language plpgsql security definer;

-- 4. إعطاء صلاحية تنفيذ الوظيفة للـ API
grant execute on function public.delete_user_by_id(uuid) to anon, authenticated;
`}
        </div>
        <button onClick={fetchUsers} className="mt-6 w-full lg:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
          تم تشغيل الأكواد - تحديث الصفحة
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="text-blue-500" /> إدارة المستخدمين والنقاط
          </h2>
          <p className="text-sm text-slate-500 mt-1">العدد الإجمالي: {users.length} مستخدم</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو البريد..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <button onClick={() => setShowAddUserModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors w-full md:w-auto shrink-0 shadow-sm shadow-blue-500/20">
            <Plus size={18} />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-separate border-spacing-y-2">
            <thead>
              <tr className="text-sm text-slate-500">
                <th className="font-bold py-2 px-4 whitespace-nowrap">الاسم والتخصص</th>
                <th className="font-bold py-2 px-4 whitespace-nowrap">البريد الإلكتروني</th>
                <th className="font-bold py-2 px-4 whitespace-nowrap">نقاط XP</th>
                <th className="font-bold py-2 px-4 whitespace-nowrap">تاريخ التسجيل</th>
                <th className="font-bold py-2 px-4 text-left whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">لا يوجد مستخدمين لعرضهم</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const xpObj = userXpMap[user.id];
                  const userXp = xpObj ? xpObj.xp : 0;
                  
                  return (
                  <tr key={user.id} className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl group">
                    <td className="py-3 px-4 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{user.raw_user_meta_data?.full_name || 'بدون اسم'}</span>
                        <span className="text-xs text-slate-500">{user.raw_user_meta_data?.specialization || 'غير محدد'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-slate-600 border-y border-slate-100 group-hover:border-slate-200">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-600 border-y border-slate-100 group-hover:border-slate-200" dir="ltr">
                      {editingXp === user.id ? (
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={tempXp} 
                             onChange={(e) => setTempXp(e.target.value)} 
                             className="w-20 px-2 py-1 rounded bg-white border border-slate-300 text-center text-sm focus:outline-none focus:border-amber-500" 
                             autoFocus
                           />
                           <button onClick={() => handleSaveXp(user.id)} className="w-6 h-6 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center rounded">
                             <Check size={14} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 items-center text-amber-500 group/xp cursor-pointer" onClick={() => { setEditingXp(user.id); setTempXp(userXp.toString()); }}>
                           <span>{userXp}</span> <Star size={14} className="fill-amber-500" />
                           <Edit2 size={12} className="opacity-0 group-hover/xp:opacity-100 text-slate-400 hover:text-blue-500 mix-blend-multiply" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 border-y border-slate-100 group-hover:border-slate-200">
                      {new Date(user.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-slate-200 text-left">
                      <button 
                        onClick={() => setDeletingUser(user)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                        title="حذف المستخدم"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Info Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden"
            >
               <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 text-blue-600">
                  <UserIcon size={24} /> إضافة مستخدم جديد
               </h3>
               
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                 <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium">
                   للحفاظ على أمان قاعدة البيانات وتجنب مشكلات الجلسات (Sessions)، <b>أفضل طريقة لإضافة مستخدم جديد هي أن يقوم شخصياً بالدخول لرابط المنصة والتسجيل</b> من واجهة الدخول (أو يمكنك فتح المنصة في نافذة تصفح متخفي والتسجيل كطالب).
                 </p>
                 <p className="text-slate-600 text-xs leading-relaxed">
                   بمجرد قيامه بالتسجيل، سيظهر حسابه فوراً في هذه القائمة، وستتمكن من تعديل نقاط الـ XP الخاصة به بحرية لمساعدته في تصدر لوحة المتصدرين.
                 </p>
               </div>
               
               <div className="flex gap-3">
                 <button 
                   onClick={() => setShowAddUserModal(false)}
                   className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                 >
                   حسناً، فهمت
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              
              <div className="flex flex-col items-center text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex justify-center items-center mb-4">
                  <Trash2 size={32} />
                </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">حذف المستخدم نهائياً</h3>
                 <p className="text-slate-600 text-sm leading-relaxed">
                   أنت على وشك حذف المستخدم <br/><span className="font-bold text-slate-800">{deletingUser.raw_user_meta_data?.full_name || deletingUser.email}</span>.<br/> لا يمكن التراجع عن هذا الإجراء وسيتم مسح جميع بياناته.
                 </p>
              </div>

              <form onSubmit={handleDelete} className="space-y-4">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">
                     للتأكيد، يرجى كتابة <span className="text-red-500 font-mono select-none">delete</span> في الحقل أدناه:
                   </label>
                   <input
                     type="text"
                     value={deleteConfirmText}
                     onChange={(e) => setDeleteConfirmText(e.target.value)}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-500 outline-none rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest transition-colors"
                     autoComplete="off"
                     dir="ltr"
                   />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setDeletingUser(null); setDeleteConfirmText(''); }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
                  >
                    {isDeleting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'حذف المستخدم'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
