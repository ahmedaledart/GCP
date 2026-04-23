import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useMarketData } from '../context/MarketContext';
import { generateWithRetry } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { data } = useMarketData();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis && !loading) {
      generateAnalysis();
    }
  }, [language]);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key is missing');
      }

      const marketSummary = data.map(item => 
        `${item.nameEn} (${item.symbol}): Price ${item.price}, Change ${item.changePercent}%`
      ).join('\n');

      const prompt = language === 'ar' 
        ? `بصفتك خبيرًا اقتصاديًا ومحللًا ماليًا، قم بالبحث عن أحدث الأخبار الاقتصادية ثم قدم قراءة تحليلية موجزة للأسواق العالمية بناءً على البيانات التالية:\n\n${marketSummary}\n\nركز على أهم التحركات، الاتجاهات العامة، والتوقعات المستقبلية القصيرة المدى. استخدم تنسيق Markdown.`
        : `As an economic expert and financial analyst, search for the latest economic news and provide a concise analytical reading of the global markets based on the following data:\n\n${marketSummary}\n\nFocus on major movements, general trends, and short-term future expectations. Use Markdown format.`;

      const responseText = await generateWithRetry(apiKey, prompt, { model: 'gemini-3.1-pro-preview', search: true });

      setAnalysis(responseText || '');
    } catch (err: any) {
      const isQuotaError = err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('404');
      
      console.error('Error generating analysis:', err);
      
      if (err.message === 'API Key is missing') {
        setError(language === 'ar' ? 'مفتاح API غير متوفر. يرجى التأكد من إعدادات النظام.' : 'API Key is missing. Please check system settings.');
      } else if (err?.message?.includes('API key not valid')) {
        setError(language === 'ar' ? 'مفتاح API غير صالح. يرجى التأكد من إعدادات النظام.' : 'API Key is invalid. Please check system settings.');
      } else if (isQuotaError) {
        setError(language === 'ar' 
          ? 'تم تجاوز حصة الاستخدام المتاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.' 
          : 'API quota exceeded. Please try again later.');
      } else {
        setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء توليد التحليل' : 'An error occurred while generating analysis'));
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    if (language === 'ar') {
      doc.setFont('Amiri');
    }
    
    const lines = doc.splitTextToSize(analysis, 180);
    doc.text(lines, 15, 20);
    doc.save('market_analysis.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet([{ Analysis: analysis }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analysis");
    XLSX.writeFile(wb, "market_analysis.xlsx");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1C2E5A] bg-[#121E3D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Sparkles className="text-[#D4AF37]" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {language === 'ar' ? 'قراءة تحليلية مدعومة بالذكاء الاصطناعي' : 'AI-Powered Analytical Reading'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!loading && !error && analysis && (
              <>
                <button onClick={exportToExcel} className="p-2 text-[#10B981] hover:bg-[#1C2E5A] rounded-lg transition-colors" title={t('downloadExcel')}>
                  <FileSpreadsheet size={20} />
                </button>
                <button onClick={exportToPDF} className="p-2 text-[#EF4444] hover:bg-[#1C2E5A] rounded-lg transition-colors" title={t('downloadPdf')}>
                  <FileText size={20} />
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1C2E5A] rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
              <p className="text-gray-400">
                {language === 'ar' ? 'جاري تحليل بيانات السوق...' : 'Analyzing market data...'}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="text-[#EF4444] bg-[#EF4444]/10 p-4 rounded-lg border border-[#EF4444]/20">
                {error}
              </div>
              <button 
                onClick={generateAnalysis}
                className="px-4 py-2 bg-[#1C2E5A] hover:bg-[#2A4075] text-white rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : (
            <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-[#D4AF37] max-w-none" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
