import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, User, Phone, Building, Briefcase, 
  ArrowRight, ArrowLeft, ShieldCheck, MailCheck, AlertCircle, 
  CheckCircle2, RefreshCw, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Auth = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    organization: '',
    jobTitle: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (authError) throw authError;

        // Check platform_users status
        const { data: userData, error: userError } = await supabase
          .from('platform_users')
          .select('*')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') throw userError;

        if (userData) {
          if (!userData.is_active) {
            await supabase.auth.signOut();
            throw new Error(language === 'ar' ? 'تم إيقاف هذا الحساب يرجى التواصل مع إدارة المنصة' : 'This account has been suspended. Please contact support.');
          }
        }
        
        navigate('/');
      } else {
        // Register logic
        if (!formData.fullName || !formData.organization) {
          throw new Error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });

        if (authError) throw authError;

        if (authData.user) {
          const payload = {
            auth_user_id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone,
            organization: formData.organization,
            job_title: formData.jobTitle,
            approval_status: 'pending',
            is_active: true,
            created_at: new Date().toISOString()
          };
          
          console.log('Registering platform user payload:', payload);

          const { error: insertError } = await supabase.from('platform_users').insert([payload]);

          if (insertError) throw insertError;

          setSuccess(language === 'ar' ? 'تم إنشاء الحساب بنجاح. حسابك قيد المراجعة حالياً.' : 'Account created successfully. Your account is currently under review.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A18] flex items-center justify-center p-6 py-20">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A1128] border border-[#1C2E5A] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>

          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#121E3D] border border-[#1C2E5A] rounded-[2rem] flex items-center justify-center text-[#D4AF37] mx-auto mb-6 shadow-xl shadow-black/20">
              {isLogin ? <ShieldCheck size={40} /> : <MailCheck size={40} />}
            </div>
            <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
              {isLogin 
                ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In') 
                : (language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account')}
            </h1>
            <p className="text-gray-500 font-bold text-sm">
              {isLogin 
                ? (language === 'ar' ? 'مرحباً بك في منصة الأسعار العالمية' : 'Welcome to the World Prices Platform')
                : (language === 'ar' ? 'انضم إلى نخبة المستخدمين واحصل على تقارير حصرية' : 'Join elite users and get exclusive reports')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-sm font-bold"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3 text-green-500 text-sm font-bold"
                >
                  <CheckCircle2 size={18} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      required
                      className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="tel"
                      className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{language === 'ar' ? 'الجهة / المؤسسة' : 'Organization'}</label>
                  <div className="relative">
                    <Building className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      required
                      className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
                      value={formData.organization}
                      onChange={e => setFormData({...formData, organization: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</label>
                  <div className="relative">
                    <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
                      value={formData.jobTitle}
                      onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#0A1128] py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? <ShieldCheck size={20} /> : <User size={20} />}
                  {isLogin ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In') : (language === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
                </>
              )}
            </button>

            <div className="pt-6 border-t border-[#1C2E5A] text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#D4AF37] transition-all flex items-center justify-center gap-2 mx-auto"
              >
                {isLogin 
                  ? (language === 'ar' ? 'ليس لديك حساب؟ سجل الآن' : "Don't have an account? Register") 
                  : (language === 'ar' ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Login')}
                {language === 'ar' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
