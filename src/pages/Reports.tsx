import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, RefreshCw, ChevronDown, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

export const Reports = () => {
  const { language } = useLanguage();
  const [topic, setTopic] = useState('global_market');
  const [loading, setLoading] = useState(false);
  const [reportContent, setReportContent] = useState('');

  const topics = [
    { id: 'global_market', ar: 'نظرة عامة على السوق العالمي', en: 'Global Market Overview' },
    { id: 'energy', ar: 'تحليل سوق الطاقة', en: 'Energy Market Analysis' },
    { id: 'metals', ar: 'توقعات المعادن الثمينة', en: 'Precious Metals Forecast' },
    { id: 'agriculture', ar: 'تقرير السلع الزراعية', en: 'Agricultural Commodities Report' },
    { id: 'crypto', ar: 'تحليل سوق العملات الرقمية', en: 'Cryptocurrency Market Analysis' },
  ];

  const generateReport = async () => {
    setLoading(true);
    setReportContent('');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key is missing');
      }

      const ai = new GoogleGenAI({ apiKey });
      const selectedTopic = topics.find(t => t.id === topic);
      const topicName = language === 'ar' ? selectedTopic?.ar : selectedTopic?.en;
      
      const prompt = language === 'ar' 
        ? `بصفتك خبيراً اقتصادياً ومحللاً مالياً، قم بالبحث عن أحدث البيانات والأخبار الاقتصادية، ثم اكتب تقرير تحليلي مفصل واحترافي حول "${topicName}". 
           يجب أن يعتمد التقرير على أحدث الأرقام والإحصائيات الحقيقية من السوق.
           تحدث عن الاتجاهات الحالية في السوق، التوقعات المستقبلية، والعوامل الرئيسية المؤثرة على الأسعار.
           استخدم تنسيق Markdown (عناوين، قوائم، نصوص عريضة) لترتيب التقرير بشكل جذاب.`
        : `As an economic expert and financial analyst, search for the latest economic data and news, then write a detailed and professional analytical report about "${topicName}". 
           The report MUST be based on the latest real numbers and statistics from the market.
           Discuss current market trends, future forecasts, and key factors affecting prices.
           Use Markdown formatting (headings, lists, bold text) to structure the report attractively.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      for await (const chunk of responseStream) {
        setReportContent(prev => prev + chunk.text);
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      
      const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      let errorMessage = language === 'ar' ? 'حدث خطأ أثناء توليد التقرير. يرجى المحاولة مرة أخرى.' : 'An error occurred while generating the report. Please try again.';
      
      if (error.message === 'API Key is missing') {
        errorMessage = language === 'ar' ? 'مفتاح API غير متوفر. يرجى التأكد من إعدادات النظام.' : 'API Key is missing. Please check system settings.';
      } else if (error?.message?.includes('API key not valid')) {
        errorMessage = language === 'ar' ? 'مفتاح API غير صالح. يرجى التأكد من إعدادات النظام.' : 'API Key is invalid. Please check system settings.';
      } else if (isQuotaError) {
        errorMessage = language === 'ar' 
          ? 'تم تجاوز حصة الاستخدام المتاحة للذكاء الاصطناعي حالياً. يرجى المحاولة مرة أخرى لاحقاً.' 
          : 'AI API quota exceeded. Please try again later.';
      } else {
        // Try to parse JSON error message if it exists
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          } else {
            errorMessage = error.message || errorMessage;
          }
        } catch (e) {
          errorMessage = error.message || errorMessage;
        }
      }

      setReportContent(`> **${language === 'ar' ? 'تنبيه' : 'Alert'}**: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([reportContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `report-${topic}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="py-12 container mx-auto px-4 min-h-[60vh]">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="text-[#D4AF37]" size={32} />
        <h2 className="text-3xl font-bold text-white">
          {language === 'ar' ? 'التقارير التحليلية الذكية' : 'Smart Analytical Reports'}
        </h2>
      </div>
      
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
        <p className="text-gray-400 mb-6 text-lg">
          {language === 'ar' 
            ? 'اختر القطاع الذي ترغب في تحليله، وسيقوم الذكاء الاصطناعي بتوليد تقرير شامل ومحدث بناءً على أحدث المعطيات الاقتصادية.' 
            : 'Select the sector you want to analyze, and the AI will generate a comprehensive and up-to-date report based on the latest economic data.'}
        </p>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/2">
            <select 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full appearance-none bg-[#0A1128] border border-[#1C2E5A] text-white py-4 px-6 rounded-xl focus:outline-none focus:border-[#D4AF37] transition-colors"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {language === 'ar' ? t.ar : t.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 pointer-events-none" size={20} />
          </div>

          <button 
            onClick={generateReport}
            disabled={loading}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#0A1128] font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {language === 'ar' ? 'توليد التقرير' : 'Generate Report'}
          </button>
        </div>
      </div>

      {reportContent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl p-6 md:p-10 shadow-2xl relative"
        >
          <div className="flex justify-between items-center mb-8 border-b border-[#1C2E5A] pb-4">
            <h3 className="text-2xl font-bold text-[#D4AF37]">
              {language === 'ar' ? 'نتيجة التحليل' : 'Analysis Result'}
            </h3>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-[#121E3D] px-4 py-2 rounded-lg border border-[#1C2E5A] hover:border-[#D4AF37]"
            >
              <Download size={18} />
              <span className="hidden sm:inline">{language === 'ar' ? 'تحميل التقرير' : 'Download Report'}</span>
            </button>
          </div>
          
          <div className="markdown-body text-gray-300 leading-relaxed">
            <Markdown>{reportContent}</Markdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};
