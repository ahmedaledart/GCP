import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0A1128] border border-[#1C2E5A] rounded-2xl p-8 w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A028]" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/30">
                <LogIn className="text-[#D4AF37]" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'ar' ? 'تسجيل الدخول للمسؤولين' : 'Admin Login'}
              </h2>
              <p className="text-gray-400 text-sm">
                {language === 'ar' ? 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم' : 'Enter your credentials to access the dashboard'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl py-3 px-4 text-white focus:border-[#D4AF37] outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl py-3 px-4 text-white focus:border-[#D4AF37] outline-none transition-all"
                  required
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs text-center font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A1128] font-black py-4 rounded-xl transition-all shadow-xl shadow-[#D4AF37]/10 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-gray-500">
              {language === 'ar' 
                ? 'من خلال تسجيل الدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.'
                : 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
