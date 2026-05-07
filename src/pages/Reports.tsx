import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FileText, ChevronDown, Download, AlertCircle, Clock, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useMarketData } from '../context/MarketContext';
import { AccessRestricted } from '../components/AccessRestricted';

export const Reports = () => {
  const { language } = useLanguage();
  const { platformUser } = useAuth();
  const { analyses: analysesData, loading: marketLoading } = useMarketData();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (analysesData) {
      const fetchedReports = analysesData.map((a: any) => ({ 
        id: a.id, 
        titleAr: a.title_ar,
        titleEn: a.title_en,
        contentAr: a.content_ar,
        contentEn: a.content_en,
        publishedAt: a.created_at,
        ...a
      }));
      setReports(fetchedReports);
      if (fetchedReports.length > 0 && !selectedReport) {
        setSelectedReport(fetchedReports[0]);
      }
      setLoading(marketLoading);
    }
  }, [analysesData, marketLoading, selectedReport]);

  const handleDownload = () => {
    if (!selectedReport) return;
    const content = language === 'ar' ? selectedReport.contentAr : selectedReport.contentEn;
    const title = language === 'ar' ? selectedReport.titleAr : selectedReport.titleEn;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${title}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-LY' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (platformUser?.approval_status !== 'approved' || !platformUser?.is_active) {
    return <AccessRestricted />;
  }

  return (
    <div className="py-12 container mx-auto px-4 min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
            <BookOpen className="text-[#D4AF37]" size={36} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {language === 'ar' ? 'مركز التقارير والتحليلات' : 'Reports & Analytics Center'}
            </h2>
            <p className="text-gray-400">
              {language === 'ar' ? 'تقارير حصرية ومعتمدة حول حركة الأسواق العالمية' : 'Exclusive and certified reports on global market movements'}
            </p>
          </div>
        </div>
      </div>
      
      {reports.length === 0 ? (
        <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-3xl p-16 text-center shadow-2xl">
          <AlertCircle size={64} className="text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">
            {language === 'ar' ? 'لا توجد تقارير منشورة حالياً' : 'No Published Reports Yet'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'سيتم إضافة التقارير والتحليلات الجديدة هنا قريباً.' : 'New reports and analyses will be added here soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Report List */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-white font-bold px-2 flex items-center gap-2">
              <FileText size={18} className="text-[#D4AF37]" />
              {language === 'ar' ? 'قائمة التقارير' : 'Report List'}
            </h4>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-right p-4 rounded-2xl border transition-all flex flex-col gap-2 group ${
                    selectedReport?.id === report.id
                      ? 'bg-[#1C2E5A] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5'
                      : 'bg-[#121E3D] border-[#1C2E5A] hover:border-[#1C2E5A]/80'
                  }`}
                >
                  <div className={`font-bold transition-colors ${selectedReport?.id === report.id ? 'text-[#D4AF37]' : 'text-white group-hover:text-[#D4AF37]'}`}>
                    {language === 'ar' ? report.titleAr : report.titleEn}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {formatDate(report.publishedAt)}
                    </span>
                    <span className="bg-[#0A1128] px-2 py-0.5 rounded border border-[#1C2E5A]">
                      {report.topic}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Report Viewer */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selectedReport && (
                <motion.div
                  key={selectedReport.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#121E3D] border border-[#1C2E5A] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                  {/* Header */}
                  <div className="p-8 border-b border-[#1C2E5A] bg-[#121E3D] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black px-3 py-1 rounded-full border border-[#D4AF37]/20 uppercase tracking-widest">
                          {selectedReport.topic}
                        </span>
                        <span className="text-gray-500 text-xs flex items-center gap-1 font-mono">
                          <Clock size={14} /> {formatDate(selectedReport.publishedAt)}
                        </span>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        {language === 'ar' ? selectedReport.titleAr : selectedReport.titleEn}
                      </h1>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 bg-[#0A1128] text-white rounded-xl border border-[#1C2E5A] hover:border-[#D4AF37] transition-all flex items-center justify-center gap-2 font-bold whitespace-nowrap active:scale-95"
                    >
                      <Download size={20} className="text-[#D4AF37]" />
                      {language === 'ar' ? 'تنزيل التقرير' : 'Download Report'}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-8 md:p-12 prose prose-invert max-w-none">
                    <div className="markdown-body text-gray-300 leading-relaxed text-lg">
                      <Markdown>{language === 'ar' ? selectedReport.contentAr : selectedReport.contentEn}</Markdown>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-[#1C2E5A] bg-[#0A1128]/50 text-center">
                    <p className="text-[10px] text-gray-500 font-mono italic">
                      {language === 'ar' 
                        ? `هذا التقرير تم إنشاؤه بواسطة خوارزميات الذكاء الاصطناعي ومعتمد من قبل إدارة المنصة. - ${selectedReport.author}` 
                        : `This report was generated by AI algorithms and certified by the platform administration. - ${selectedReport.author}`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
