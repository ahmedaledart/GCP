import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Check, X, Ban, UserCheck, Trash2, Search, Filter, 
  Mail, Phone, Building, Briefcase, Calendar, Shield, Clock, AlertCircle,
  RefreshCw, Users, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PlatformUsersTab = ({ adminUser }: { adminUser?: any }) => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const enforcePermission = (permissionKey: string, moduleName: string) => {
    if (adminUser?.role === 'super_admin') return true;
    if (adminUser && adminUser[permissionKey] === true) return true;
    
    alert(language === 'ar' ? `ليس لديك صلاحية لإدارة ${moduleName} المحددة.` : `You don't have permission to manage ${moduleName}.`);
    return false;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching platform users:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (auth_user_id: string, status: string) => {
    if (!enforcePermission('can_manage_admins', 'مستخدمي المنصة')) return;
    try {
      const updates: any = { approval_status: status, updated_at: new Date().toISOString() };
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.is_active = true;
      }
      if (status === 'suspended') {
        updates.is_active = false;
      }
      
      console.log('Updating platform user status. Payload:', updates, 'auth_user_id:', auth_user_id);

      const { error } = await supabase
        .from('platform_users')
        .update(updates)
        .eq('auth_user_id', auth_user_id);

      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (auth_user_id: string, isActive: boolean) => {
    if (!enforcePermission('can_manage_admins', 'مستخدمي المنصة')) return;
    try {
      const payload = { is_active: isActive, updated_at: new Date().toISOString() };
      console.log('Toggling active status. Payload:', payload, 'auth_user_id:', auth_user_id);
      
      const { error } = await supabase
        .from('platform_users')
        .update(payload)
        .eq('auth_user_id', auth_user_id);

      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (auth_user_id: string) => {
    if (!enforcePermission('can_manage_admins', 'مستخدمي المنصة')) return;
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) return;
    try {
      console.log('Deleting platform user. auth_user_id:', auth_user_id);
      const { error } = await supabase
        .from('platform_users')
        .delete()
        .eq('auth_user_id', auth_user_id);

      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search) ||
      user.organization?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return (
      <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
        {language === 'ar' ? 'موقوف' : 'Deactivated'}
      </span>
    );

    switch (status) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
            {language === 'ar' ? 'تمت الموافقة' : 'Approved'}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
            {language === 'ar' ? 'مرفوض' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-500/20 animate-pulse">
            {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0A1128] p-6 rounded-3xl border border-[#1C2E5A] mb-8">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder={language === 'ar' ? 'البحث عن مستخدم...' : 'Search users...'}
            className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-3 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold placeholder:text-gray-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="text-[#D4AF37]" size={18} />
          <select
            className="bg-[#121E3D] border border-[#1C2E5A] rounded-xl px-4 py-2 text-sm text-white focus:border-[#D4AF37] outline-none font-bold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="pending">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</option>
            <option value="approved">{language === 'ar' ? 'تمت الموافقة' : 'Approved'}</option>
            <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="text-[#D4AF37] animate-spin" size={40} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-[#0A1128] rounded-[3rem] border border-[#1C2E5A] border-dashed">
             <Users className="mx-auto text-gray-700 mb-4" size={48} />
             <p className="text-gray-500 font-black uppercase tracking-widest text-xs">
               {language === 'ar' ? 'لا يوجد مستخدمين مطابقين' : 'No users found'}
             </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <motion.div
              key={user.auth_user_id || user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A1128] border border-[#1C2E5A] rounded-[2.5rem] p-8 hover:border-[#D4AF37]/30 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent"></div>
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-[#121E3D] flex items-center justify-center text-[#D4AF37] border border-[#1C2E5A] shrink-0">
                    <User size={32} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-white tracking-tight">{user.full_name}</h3>
                      {getStatusBadge(user.approval_status, user.is_active)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-bold">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail size={14} className="text-[#D4AF37]" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone size={14} className="text-[#D4AF37]" />
                        {user.phone || '---'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest">
                       <div className="flex items-center gap-2 text-blue-400/80">
                         <Building size={12} />
                         {user.organization || '---'}
                       </div>
                       <div className="flex items-center gap-2 text-purple-400/80">
                         <Briefcase size={12} />
                         {user.job_title || '---'}
                       </div>
                       <div className="flex items-center gap-2 text-gray-500">
                         <Clock size={12} />
                         {new Date(user.created_at).toLocaleDateString()}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-[#1C2E5A]">
                  {user.approval_status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(user.auth_user_id, 'approved')}
                      className="flex-grow lg:flex-none flex items-center justify-center gap-2 bg-green-500/10 text-green-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                    >
                      <Check size={16} /> {language === 'ar' ? 'موافقة' : 'Approve'}
                    </button>
                  )}
                  
                  {user.approval_status !== 'rejected' && user.approval_status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(user.auth_user_id, 'rejected')}
                      className="flex-grow lg:flex-none flex items-center justify-center gap-2 bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                      <X size={16} /> {language === 'ar' ? 'رفض' : 'Reject'}
                    </button>
                  )}

                  {user.is_active && (
                    <button
                      onClick={() => handleUpdateStatus(user.auth_user_id, 'suspended')}
                      className="flex-grow lg:flex-none flex items-center justify-center gap-2 bg-yellow-500/10 text-yellow-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-white transition-all border border-yellow-500/20"
                    >
                      <Ban size={16} /> {language === 'ar' ? 'إيقاف' : 'Suspend'}
                    </button>
                  )}

                  {!user.is_active && (
                    <button
                      onClick={() => handleToggleActive(user.auth_user_id, true)}
                      className="flex-grow lg:flex-none flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                    >
                      <UserCheck size={16} /> {language === 'ar' ? 'تفعيل' : 'Activate'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteUser(user.auth_user_id)}
                    className="flex-grow lg:flex-none flex items-center justify-center w-12 h-12 bg-red-500/5 text-red-500 rounded-2xl border border-transparent hover:border-red-500/30 transition-all ml-auto lg:ml-0"
                    title={language === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
