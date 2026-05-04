import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, ShieldCheck, ArrowRight } from 'lucide-react';
import { googleProvider, signInWithPopup, auth, logUserActivity } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      await logUserActivity('تسجيل الدخول', 'قام المستخدم بتسجيل الدخول عبر Google');
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
                {language === 'ar' ? 'مرحباً بك مجدداً' : 'Welcome Back'}
              </h2>
              <p className="text-gray-400">
                {language === 'ar' ? 'سجل دخولك للوصول إلى كافة المميزات' : 'Sign in to access all features'}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span>{isLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : (language === 'ar' ? 'التسجيل بواسطة Google' : 'Sign in with Google')}</span>
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1C2E5A]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0A1128] px-2 text-gray-500">
                    {language === 'ar' ? 'مجاني وآمن' : 'Free and Secure'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="text-center text-xs text-gray-500">
                {language === 'ar' 
                  ? 'من خلال تسجيل الدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.'
                  : 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
