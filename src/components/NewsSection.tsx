import React, { useState, useEffect } from 'react';
import { marketNews as mockMarketNews } from '../data/mockData';
import { Newspaper, ChevronLeft, ChevronRight, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI } from '@google/genai';
import { generateWithRetry } from '../services/geminiService';

interface FetchedNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  url: string;
  isAlert: boolean;
}

export const NewsSection = () => {
  const { t, language } = useLanguage();
  const [news, setNews] = useState<FetchedNews[]>([]);
  const [marketInsight, setMarketInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchRealNewsAndInsights();
    
    const interval = setInterval(() => {
      fetchRealNewsAndInsights();
    }, 3600000);

    return () => clearInterval(interval);
  }, [language]);

  const fetchRealNewsAndInsights = async () => {
    setLoading(true);
    setError(false);
    try {
      const apiKey = (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error('API Key missing');

      const newsPrompt = language === 'ar'
        ? `ابحث عن أحدث 4 أخبار اقتصادية ومالية عالمية من مواقع موثوقة.
قم بإرجاع النتيجة كمصفوفة JSON فقط تحتوي على كائنات تخص: id, title, summary, source, time, url, isAlert.`
        : `Search for the latest 4 global economic and financial news headlines from reliable sources.
Return the result ONLY as a JSON array of objects with: id, title, summary, source, time, url, isAlert.`;

      const insightPrompt = language === 'ar'
        ? `بناءً على الوضع الاقتصادي العالمي الحالي وتحركات أسعار السلع (النفط، الذهب، الغاز)، اكتب فقرة واحدة (insight) تشرح باختصار السبب وراء التحركات الحالية في السوق. ابدأ بعبارة "بوصلة السوق:".`
        : `Based on current global economic conditions and commodity price movements (Oil, Gold, Gas), write a single paragraph (insight) briefly explaining the reason behind current market moves. Start with "Market Compass:".`;

      // Parallelize both requests with retry logic
      const [newsTextRaw, insightText] = await Promise.all([
        generateWithRetry(apiKey, newsPrompt, { search: true }),
        generateWithRetry(apiKey, insightPrompt, { search: true })
      ]);

      let newsText = newsTextRaw;
      newsText = newsText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedNews: FetchedNews[] = JSON.parse(newsText);
      
      setNews(parsedNews.slice(0, 4));
      setMarketInsight(insightText);
    } catch (err: any) {
      console.error('Failed to fetch real news:', err);
      setError(true);
      setMarketInsight(language === 'ar' ? 'بوصلة السوق: تشهد الأسواق تقلبات نتيجة التوترات الجيوسياسية الحالية وتغيرات مستويات الطلب العالمي.' : 'Market Compass: Markets are experiencing volatility due to current geopolitical tensions and shifts in global demand levels.');
      setNews(mockMarketNews.map(mock => ({
        id: mock.id.toString(),
        title: language === 'ar' ? mock.titleAr : mock.titleEn,
        summary: language === 'ar' ? 'تحديثات السوق المباشرة' : 'Live market updates',
        source: language === 'ar' ? 'أخبار السوق' : 'Market News',
        time: language === 'ar' ? mock.timeAr : mock.timeEn,
        url: '#',
        isAlert: mock.typeAr === 'عاجل'
      })));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section className="py-16 bg-[#0A1128]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Newspaper className="text-[#D4AF37]" />
            {t('news')}
          </h2>
          <a href="#" className="text-[#D4AF37] hover:text-[#E5C158] text-sm font-medium flex items-center gap-1 transition-colors">
            {language === 'ar' ? 'المزيد من الأخبار' : 'More News'}
            {language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </a>
        </div>

        {/* AI Insight Bar */}
        {marketInsight && (
          <div className="mb-10 bg-gradient-to-r from-[#D4AF37]/10 to-transparent border-l-4 border-[#D4AF37] p-4 rounded-r-lg">
            <p className="text-[#D4AF37] text-sm md:text-base font-medium italic">
              {marketInsight}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-[#121E3D] rounded-2xl p-6 border border-[#1C2E5A] h-48 animate-pulse flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-16 h-6 bg-[#1C2E5A] rounded"></div>
                  <div className="w-16 h-4 bg-[#1C2E5A] rounded"></div>
                </div>
                <div className="w-full h-12 bg-[#1C2E5A] rounded mt-4"></div>
                <div className="w-24 h-4 bg-[#1C2E5A] rounded mt-auto"></div>
              </div>
            ))
          ) : (
            news.map((item) => {
              const type = item.isAlert ? (language === 'ar' ? 'عاجل' : 'Breaking') : item.source;
              
              return (
                <div key={item.id} className="bg-[#121E3D] rounded-2xl p-6 border border-[#1C2E5A] hover:border-[#2A4075] transition-all group flex flex-col h-full relative overflow-hidden">
                  {item.isAlert && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EF4444] to-transparent"></div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.isAlert ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' : 'bg-[#1C2E5A] text-[#D4AF37] border border-[#2A4075]'}`}>
                      {item.isAlert && <AlertTriangle size={12} className={`inline ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />}
                      {type}
                    </span>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white leading-relaxed mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h3>
                  
                  {item.summary && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">
                      {item.summary}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-[#1C2E5A]/50">
                    <a href={item.url !== '#' ? item.url : undefined} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors w-fit">
                      {language === 'ar' ? 'اقرأ التفاصيل' : 'Read Details'}
                      {item.url !== '#' ? <ExternalLink size={14} className="mx-1" /> : (language === 'ar' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)}
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
