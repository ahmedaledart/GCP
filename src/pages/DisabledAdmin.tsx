import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DisabledAdmin = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050A18] flex items-center justify-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#1C2E5A]/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>

      <div className="bg-[#121E3D]/80 backdrop-blur-md border border-[#1C2E5A] p-12 rounded-[2rem] max-w-lg w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
        
        <ShieldAlert className="text-[#D4AF37] mx-auto mb-8 opacity-90" size={80} />
        
        <h1 className="text-2xl md:text-3xl font-black text-white mb-6 tracking-tight">
          {language === 'ar' ? 'لوحة التحكم الداخلية متوقفة مؤقتًا' : 'Internal Admin Board is Temporarily Disabled'}
        </h1>
        
        <p className="text-gray-400 text-lg leading-relaxed font-bold mb-10">
          {language === 'ar' 
            ? 'يتم إدارة بيانات المنصة حاليًا من خلال Supabase Dashboard.' 
            : 'Platform data is currently managed via Supabase Dashboard.'}
        </p>

        <Link 
          to="/"
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D4AF37] hover:bg-[#b08d28] text-[#050A18] rounded-xl font-black transition-all active:scale-95 group w-full uppercase tracking-wider text-sm md:text-base"
        >
          {language === 'ar' ? 'العودة إلى المنصة' : 'Return to Platform'}
          {language === 'ar' ? <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
        </Link>
      </div>
    </div>
  );
};

export default DisabledAdmin;
