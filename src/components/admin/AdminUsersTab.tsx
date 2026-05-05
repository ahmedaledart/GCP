import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Plus, Save, Trash2, Edit, Shield, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'motion/react';

export const AdminUsersTab = ({ currentUser }: { currentUser: any }) => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', role: 'editor', permissions: [] as string[], is_active: true });

  const roles = [
    { id: 'super_admin', labelAr: 'مدير عام', labelEn: 'Super Admin' },
    { id: 'admin', labelAr: 'مدير', labelEn: 'Admin' },
    { id: 'editor', labelAr: 'محرر', labelEn: 'Editor' },
    { id: 'viewer', labelAr: 'مشاهد', labelEn: 'Viewer' }
  ];

  const availablePermissions = [
    { id: 'commodities', labelAr: 'إدارة الأسعار', labelEn: 'Manage Commodities' },
    { id: 'news', labelAr: 'إدارة الأخبار', labelEn: 'Manage News' },
    { id: 'analyses', labelAr: 'إدارة التحليلات', labelEn: 'Manage Analyses' },
    { id: 'sectors', labelAr: 'إدارة القطاعات', labelEn: 'Manage Sectors' },
    { id: 'admin_users', labelAr: 'إدارة الأدمن', labelEn: 'Manage Admins' },
    { id: 'settings', labelAr: 'إعدادات المنصة', labelEn: 'Settings' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.email) return;
    
    try {
      if (editingId && editingId !== 'new') {
        const { error } = await supabase.from('admin_users').update(formData).eq('id', editingId);
        if (error) throw error;
        alert(language === 'ar' ? 'تم تحديث البيانات بنجاح' : 'Admin updated successfully');
      } else {
        const { error } = await supabase.from('admin_users').insert([formData]);
        if (error) throw error;
        alert(language === 'ar' ? 'تم إضافة المشرف بنجاح' : 'Admin added successfully');
      }
      setEditingId(null);
      setFormData({ email: '', role: 'editor', permissions: [], is_active: true });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      try {
        const { error } = await supabase.from('admin_users').delete().eq('id', id);
        if (error) throw error;
        fetchUsers();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-[#121E3D]/50 p-6 rounded-3xl border border-[#1C2E5A]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
            <Users className="text-[#D4AF37]" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {language === 'ar' ? 'إدارة المشرفين (الأدمن)' : 'Admin Management'}
            </h2>
            <p className="text-gray-500 text-xs font-bold mt-1">
              {language === 'ar' ? 'إضافة صلاحيات للموظفين (يجب تسجيلهم في Supabase Auth أولاً)' : 'Manage staff permissions (Users must be registered in Supabase Auth first)'}
            </p>
          </div>
        </div>
        {!editingId && (
          <button onClick={() => setEditingId('new')} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-6 py-3 rounded-xl font-black hover:bg-[#E5C158] transition-all shadow-lg shadow-[#D4AF37]/20">
            <Plus size={20} /> {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
          </button>
        )}
      </div>

      {editingId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A1128] p-8 rounded-3xl border border-[#1C2E5A] shadow-2xl">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
             <Shield className="text-[#D4AF37]" /> {editingId === 'new' ? (language === 'ar' ? 'مستخدم جديد' : 'New User') : (language === 'ar' ? 'تعديل مستخدم' : 'Edit User')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={editingId !== 'new'} />
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الدور التعريفي' : 'Role'}</label>
              <select className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none font-bold appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                {roles.map(r => <option key={r.id} value={r.id}>{language === 'ar' ? r.labelAr : r.labelEn}</option>)}
              </select>
            </div>

            {formData.role !== 'super_admin' && (
              <div className="md:col-span-2 space-y-4 bg-[#121E3D]/30 p-6 rounded-2xl border border-[#1C2E5A]/50">
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block border-b border-[#1C2E5A] pb-4 mb-4">{language === 'ar' ? 'تحديد الصلاحيات المخصصة' : 'Custom Permissions'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {availablePermissions.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.permissions.includes(p.id) ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-white' : 'bg-[#121E3D] border-[#1C2E5A] text-gray-400 hover:border-[#D4AF37]/30'}`}>
                      <input type="checkbox" className="hidden" checked={formData.permissions.includes(p.id)} onChange={(e) => {
                         if (e.target.checked) setFormData({...formData, permissions: [...formData.permissions, p.id]});
                         else setFormData({...formData, permissions: formData.permissions.filter(x => x !== p.id)});
                      }} />
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${formData.permissions.includes(p.id) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-[#0A1128] border-gray-600'}`}>
                        {formData.permissions.includes(p.id) && <CheckCircle2 size={14} className="text-[#0A1128]" />}
                      </div>
                      <span className="font-bold text-sm">{language === 'ar' ? p.labelAr : p.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="md:col-span-2 flex items-center gap-3 bg-[#121E3D]/50 p-4 rounded-xl border border-[#1C2E5A]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-[#D4AF37]" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                <span className="font-black text-white">{language === 'ar' ? 'حساب مفعل (يستطيع الدخول)' : 'Account Active (Can Login)'}</span>
              </label>
            </div>
            
          </div>
          
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#1C2E5A]/50">
            <button onClick={() => setEditingId(null)} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-[#121E3D] hover:text-white transition-all uppercase tracking-wider text-xs">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-8 py-3 rounded-xl font-black hover:bg-[#E5C158] transition-all uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20">
              <Save size={18} /> {language === 'ar' ? 'حفظ الحساب' : 'Save Account'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-[#0A1128] rounded-3xl border border-[#1C2E5A] overflow-hidden shadow-xl relative min-h-[200px]">
         {loading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-[#0A1128]/50 backdrop-blur-sm z-10">
             <div className="w-12 h-12 border-4 border-[#1C2E5A] border-t-[#D4AF37] rounded-full animate-spin"></div>
           </div>
         ) : users.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-16 text-gray-500">
             <Shield size={64} className="mb-4 opacity-20" />
             <p className="text-xl font-black">{language === 'ar' ? 'لا يوجد مدراء' : 'No admins found'}</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left rtl:text-right">
                <thead>
                  <tr className="bg-[#121E3D] border-b border-[#1C2E5A] text-gray-400 text-[10px] uppercase tracking-widest font-black">
                    <th className="p-6">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th className="p-6">{language === 'ar' ? 'الدور / الصلاحيات' : 'Role / Permissions'}</th>
                    <th className="p-6">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="p-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2E5A]/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#121E3D]/30 transition-colors group">
                       <td className="p-6">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-[#1C2E5A] flex items-center justify-center">
                             <Mail size={18} className="text-[#D4AF37]" />
                           </div>
                           <span className="font-bold text-white text-sm">{u.email}</span>
                         </div>
                       </td>
                       <td className="p-6">
                         <div className="flex flex-col gap-2">
                           <span className={`inline-flex items-center justify-center px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg self-start ${u.role === 'super_admin' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                             {roles.find(r => r.id === u.role)?.[language === 'ar' ? 'labelAr' : 'labelEn'] || u.role}
                           </span>
                           {u.role !== 'super_admin' && u.permissions && u.permissions.length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-1">
                               {u.permissions.map((p: string) => (
                                 <span key={p} className="text-[9px] bg-[#121E3D] text-gray-400 px-2 py-0.5 rounded-md border border-[#1C2E5A]">{availablePermissions.find(ap => ap.id === p)?.[language === 'ar' ? 'labelAr' : 'labelEn'] || p}</span>
                               ))}
                             </div>
                           )}
                         </div>
                       </td>
                       <td className="p-6">
                         {u.is_active ? (
                           <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-500 tracking-widest bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 w-max shrink-0"><CheckCircle2 size={12} /> {language === 'ar' ? 'مفعل' : 'Active'}</span>
                         ) : (
                           <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-500 tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 w-max shrink-0"><XCircle size={12} /> {language === 'ar' ? 'معطل' : 'Disabled'}</span>
                         )}
                       </td>
                       <td className="p-6">
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {setEditingId(u.id); setFormData({ email: u.email, role: u.role, permissions: u.permissions || [], is_active: u.is_active });}} className="w-8 h-8 rounded-lg bg-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                              <Edit size={14} />
                            </button>
                            {u.email !== currentUser?.email && (
                              <button onClick={() => handleDelete(u.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  );
};
