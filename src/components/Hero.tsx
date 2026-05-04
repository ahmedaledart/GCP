import React from 'react';
import { ArrowRight, BarChart2, Globe2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

export const Hero = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleExploreMarkets = () => {
    navigate('/markets');
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1128] to-[#121E3D] z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #D4AF37 0%, transparent 50%)', backgroundSize: '100% 100%' }}></div>
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-[#1C2E5A] rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C2E5A] border border-[#2A4075] text-[#D4AF37] text-sm font-semibold mb-8 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            {t('heroBadge')}
          </div>

          <div className="flex flex-col items-center justify-center mb-8">
            <img 
              src={settings.siteLogo || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png"} 
              alt="Logo" 
              className="w-48 h-48 object-contain animate-pulse drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" 
              referrerPolicy="no-referrer" 
            />
            <p className="text-[#D4AF37] text-sm font-medium mt-2 tracking-wider uppercase">
              {t('poweredBy')}
            </p>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            {language === 'ar' ? settings.descriptionAr : settings.descriptionEn}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleExploreMarkets} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#0A1128] font-bold rounded-lg transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 text-lg">
              {t('exploreMarkets')}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="bg-[#121E3D]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-[#1C2E5A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe2 size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat1Title')}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{t('feat1Desc')}</p>
          </div>
          <div className="bg-[#121E3D]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-[#1C2E5A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart2 size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat2Title')}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{t('feat2Desc')}</p>
          </div>
          <div className="bg-[#121E3D]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-[#1C2E5A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat3Title')}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{t('feat3Desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
