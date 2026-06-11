import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { TopCommodities } from '../components/TopCommodities';
import { AdvancedTable } from '../components/AdvancedTable';
import { NewsSection } from '../components/NewsSection';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { FileText, ChevronRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export const Home = () => {
  const { language } = useLanguage();
  const [latestReport, setLatestReport] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestReport = async () => {
      try {
        const { data } = await supabase
          .from('analyses')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (isMounted && data) {
          setLatestReport({ 
            id: data.id, 
            titleAr: data.title_ar, 
            titleEn: data.title_en,
            contentAr: data.content_ar,
            contentEn: data.content_en 
          });
        }
      } catch (e) {
        console.warn('Error fetching latest report:', e);
      }
    };
    fetchLatestReport();
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      <Hero />
      <TopCommodities />
      
      {/* Latest Intelligence Report Section */}
      <section className="bg-[#0A1128] py-8 border-b border-[#1C2E5A]/30">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-[#121E3D] to-[#0A1128] rounded-2xl p-6 md:p-8 border border-[#1C2E5A] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#D4AF37]/10 transition-all"></div>
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20 shadow-inner">
                <FileText className="text-[#D4AF37]" size={32} />
              </div>
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-[#D4AF37] text-[#0A1128] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {language === 'ar' ? 'تقرير جديد' : 'NEW REPORT'}
                  </span>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <TrendingUp size={12} /> {language === 'ar' ? 'تحليل ذكي' : 'Smart Analysis'}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-1">
                  {latestReport ? (language === 'ar' ? latestReport.titleAr : latestReport.titleEn) : (language === 'ar' ? 'التقارير التحليلية للأسواق' : 'Market Analytical Reports')}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-1 opacity-80">
                  {latestReport 
                    ? (language === 'ar' ? latestReport.contentAr.substring(0, 100) : latestReport.contentEn.substring(0, 100)) + '...'
                    : (language === 'ar' 
                      ? 'اكتشف الأسباب الكامنة وراء تحركات الأسعار عبر تقارير حصرية ومعتمدة.' 
                      : 'Discover the hidden reasons behind price movements via exclusive certified reports.')}
                </p>
              </div>
            </div>
            
            <Link 
              to="/reports"
              className="px-8 py-4 bg-[#D4AF37] text-[#0A1128] rounded-xl font-bold hover:bg-[#E5C158] transition-all flex items-center gap-2 shadow-xl shadow-[#D4AF37]/20 whitespace-nowrap active:scale-95 group relative z-10"
            >
              {language === 'ar' ? 'عرض التقرير الكامل' : 'View Full Report'}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <AdvancedTable />
      <WhyChooseUs />
      <NewsSection />
    </>
  );
};
