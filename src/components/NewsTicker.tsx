import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useMarketData } from '../context/MarketContext';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Zap } from 'lucide-react';

interface NewsItem {
  id: string;
  text_ar: string;
  text_en: string;
  active: boolean;
  is_breaking?: boolean;
  createdAt: any;
}

export const NewsTicker = () => {
  const { language } = useLanguage();
  const { news: newsData } = useMarketData();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (newsData && newsData.length > 0) {
      setNews(newsData.map((n: any) => ({
        id: String(n.id),
        text_ar: n.title_ar || n.content_ar,
        text_en: n.title_en || n.content_en,
        is_breaking: n.is_breaking,
        active: true,
        createdAt: n.created_at
      })));
    }
  }, [newsData]);

  if (news.length === 0) return null;

  return (
    <div className="bg-[#1C2E5A]/30 border-y border-[#1C2E5A] overflow-hidden py-2">
      <div className="container mx-auto px-4 flex items-center">
        <div className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-3 py-1 rounded shadow-lg z-10 font-bold text-sm whitespace-nowrap">
          <Megaphone size={16} />
          {language === 'ar' ? 'آخر الأخبار' : 'Breaking'}
        </div>
        
        <div className="flex-1 relative overflow-hidden h-6 ml-4 mr-4">
          <div className="absolute inset-0 flex items-center">
            <div className="marquee flex gap-12 whitespace-nowrap">
              {news.map((item, idx) => (
                <span key={`${item.id}-${idx}`} className={`text-sm transition-colors cursor-pointer flex items-center gap-2 ${item.is_breaking ? 'text-red-500 font-bold hover:text-red-400' : 'text-gray-300 hover:text-white'}`}>
                  {item.is_breaking && <Zap size={14} className="text-red-500" />}
                  {language === 'ar' ? item.text_ar : item.text_en}
                </span>
              ))}
              {/* Duplicate for seamless loop if news is short */}
              {news.length < 5 && news.map((item, idx) => (
                <span key={`${item.id}-dup-${idx}`} className={`text-sm transition-colors cursor-pointer flex items-center gap-2 ${item.is_breaking ? 'text-red-500 font-bold hover:text-red-400' : 'text-gray-300 hover:text-white'}`}>
                  {item.is_breaking && <Zap size={14} className="text-red-500" />}
                  {language === 'ar' ? item.text_ar : item.text_en}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(${language === 'ar' ? '100%' : '-100%'}); }
        }
        [dir="rtl"] .marquee {
          animation: marquee-rtl 30s linear infinite;
        }
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
