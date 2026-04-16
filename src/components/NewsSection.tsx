import React, { useState, useEffect } from 'react';
import { marketNews as mockMarketNews } from '../data/mockData';
import { Newspaper, ChevronLeft, ChevronRight, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI } from '@google/genai';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchRealNews();
    
    // Update every hour (3600000 ms)
    const interval = setInterval(() => {
      fetchRealNews();
    }, 3600000);

    return () => clearInterval(interval);
  }, [language]); // Re-fetch when language changes

  const fetchRealNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = language === 'ar'
        ? `ابحث عن أحدث 4 أخبار اقتصادية ومالية عالمية من مواقع موثوقة (مثل بلومبرغ، رويترز، سي إن بي سي).
قم بإرجاع النتيجة كمصفوفة JSON فقط تحتوي على كائنات بالخصائص التالية:
- "id": معرف فريد
- "title": عنوان الخبر
- "summary": ملخص قصير للخبر
- "source": مصدر الخبر
- "time": وقت النشر (مثل "منذ ساعتين")
- "url": رابط الخبر
- "isAlert": قيمة منطقية (true/false) إذا كان الخبر عاجلاً أو هاماً جداً

لا تقم بإرجاع أي نص آخر سوى مصفوفة JSON.`
        : `Search for the latest 4 global economic and financial news headlines from reliable sources (e.g., Bloomberg, Reuters, CNBC).
Return the result ONLY as a JSON array of objects with the following properties:
- "id": a unique string
- "title": the news headline
- "summary": a short summary
- "source": the news source
- "time": when it was published (e.g., "2 hours ago")
- "url": the link to the news article
- "isAlert": boolean (true/false) if it's breaking/very important news

Do not return any other text except the JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      let text = response.text || '';
      // Clean up markdown formatting if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedNews: FetchedNews[] = JSON.parse(text);
      
      // Extract grounding URLs if available to enrich the data
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        parsedNews.forEach((item, index) => {
          if (chunks[index]?.web?.uri && (!item.url || item.url === '#')) {
            item.url = chunks[index].web.uri;
          }
        });
      }

      setNews(parsedNews.slice(0, 4));
    } catch (err: any) {
      const isQuotaError = err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED';
      if (!isQuotaError) {
        console.error('Failed to fetch real news:', err);
      }
      setError(true);
      // Fallback to mock data mapped to FetchedNews format
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
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Newspaper className="text-[#D4AF37]" />
            {t('news')}
          </h2>
          <a href="#" className="text-[#D4AF37] hover:text-[#E5C158] text-sm font-medium flex items-center gap-1 transition-colors">
            {language === 'ar' ? 'المزيد من الأخبار' : 'More News'}
            {language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </a>
        </div>

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
