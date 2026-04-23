import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMarketData } from '../context/MarketContext';
import { useLanguage } from '../context/LanguageContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart2, PieChart, TrendingUp, FileSpreadsheet, FileText, FileCode, Image as ImageIcon, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';

export const AnalyticsCharts = () => {
  const { data: commoditiesData } = useMarketData();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'energy' | 'metals'>('energy');
  const chartRef = useRef<HTMLDivElement>(null);
  const metricsDropdownRef = useRef<HTMLDivElement>(null);
  const [showMetricsDropdown, setShowMetricsDropdown] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({});

  const energyData = commoditiesData.filter(c => c.sectorAr === 'الطاقة');
  const metalsData = commoditiesData.filter(c => c.sectorAr === 'المعادن');

  const currentData = activeTab === 'energy' ? energyData : metalsData;

  useEffect(() => {
    const initialMetrics: Record<string, boolean> = {};
    currentData.forEach(item => {
      initialMetrics[item.id] = true;
    });
    setVisibleMetrics(initialMetrics);
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricsDropdownRef.current && !metricsDropdownRef.current.contains(event.target as Node)) {
        setShowMetricsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMetric = (id: string) => {
    setVisibleMetrics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Prepare data for comparison chart (using normalized values for demonstration)
  const comparisonData = useMemo(() => {
    if (!currentData || currentData.length === 0) return [];
    
    // Find the item with history to act as a reference for time points
    const referenceItem = currentData.find(item => item.history && item.history.length > 0);
    if (!referenceItem) return [];

    return referenceItem.history.map((point, index) => {
      const dataPoint: any = { time: point.time };
      currentData.forEach(item => {
        const itemName = language === 'ar' ? item.nameAr : item.nameEn;
        
        // Safety check for history existence and length
        if (item.history && item.history[0] && item.history[index]) {
          const startPrice = item.history[0].price || 1; // Avoid division by zero
          const currentPrice = item.history[index].price || 0;
          // Normalize to percentage change from start for fair comparison
          dataPoint[itemName] = ((currentPrice - startPrice) / startPrice) * 100;
        } else {
          // Default to 0 change if history is missing for this point/item
          dataPoint[itemName] = 0;
        }
      });
      return dataPoint;
    });
  }, [currentData, language]);

  const colors = ['#D4AF37', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

  const getSummaryExportData = () => {
    return currentData.map(item => ({
      [t('commodity')]: language === 'ar' ? item.nameAr : item.nameEn,
      [t('sector')]: language === 'ar' ? item.sectorAr : item.sectorEn,
      [t('currentPrice')]: item.price,
      [t('changePercent')]: `${item.changePercent}%`,
      [t('status')]: language === 'ar' ? item.statusAr : item.statusEn,
    }));
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Add Comparison Data
    const wsComparison = XLSX.utils.json_to_sheet(comparisonData);
    XLSX.utils.book_append_sheet(wb, wsComparison, "Performance History");
    
    // Add Summary Data
    const wsSummary = XLSX.utils.json_to_sheet(getSummaryExportData());
    XLSX.utils.book_append_sheet(wb, wsSummary, "Sector Summary");
    
    XLSX.writeFile(wb, `${activeTab}_analytics.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add Summary Table
    doc.text(t('sectorSummary'), 14, 15);
    const summaryData = getSummaryExportData();
    const summaryColumn = Object.keys(summaryData[0] || {});
    const summaryRows = summaryData.map(item => Object.values(item));
    
    autoTable(doc, {
      head: [summaryColumn],
      body: summaryRows,
      startY: 20,
    });
    
    // Add Comparison Table
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 20;
    doc.text(t('performanceComparison'), 14, finalY + 15);
    const tableColumn = Object.keys(comparisonData[0] || {});
    const tableRows = comparisonData.map(item => Object.values(item).map(val => typeof val === 'number' ? val.toFixed(2) : val));
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: finalY + 20,
    });
    
    doc.save(`${activeTab}_analytics.pdf`);
  };

  const exportToCSV = () => {
    // For CSV, we'll download two separate files as CSV doesn't support multiple sheets
    
    // 1. Summary CSV
    const wsSummary = XLSX.utils.json_to_sheet(getSummaryExportData());
    XLSX.writeFile({
      SheetNames: ["Summary"],
      Sheets: { "Summary": wsSummary }
    }, `${activeTab}_summary.csv`, { bookType: 'csv' });

    // 2. History CSV
    const wsComparison = XLSX.utils.json_to_sheet(comparisonData);
    XLSX.writeFile({
      SheetNames: ["History"],
      Sheets: { "History": wsComparison }
    }, `${activeTab}_history.csv`, { bookType: 'csv' });
  };

  const exportToPNG = async () => {
    if (chartRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(chartRef.current, { cacheBust: true, backgroundColor: '#0A1128' });
      const link = document.createElement('a');
      link.download = `${activeTab}_chart.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  return (
    <section className="py-16 bg-[#121E3D] border-y border-[#1C2E5A]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
              <BarChart2 className="text-[#D4AF37]" />
              {t('analyticsTitle')}
            </h2>
            <p className="text-sm text-gray-400">{t('analyticsSub')}</p>
          </div>

          <div className="flex flex-col sm:flex-row bg-[#0A1128] p-1 rounded-lg border border-[#1C2E5A] gap-2">
            <div className="flex bg-[#121E3D] rounded-md p-1">
              <button 
                onClick={() => setActiveTab('energy')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'energy' ? 'bg-[#1C2E5A] text-[#D4AF37] shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                {t('energySector')}
              </button>
              <button 
                onClick={() => setActiveTab('metals')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'metals' ? 'bg-[#1C2E5A] text-[#D4AF37] shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                {t('metalsSector')}
              </button>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="relative" ref={metricsDropdownRef}>
                <button 
                  onClick={() => setShowMetricsDropdown(!showMetricsDropdown)}
                  className="p-2 text-[#D4AF37] hover:bg-[#1C2E5A] rounded-lg transition-colors flex items-center gap-2"
                  title={t('metrics') || 'Metrics'}
                >
                  <Filter size={18} />
                </button>
                {showMetricsDropdown && (
                  <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} bg-[#121E3D] border border-[#1C2E5A] rounded-lg shadow-xl p-3 z-50 min-w-[200px]`}>
                    <h4 className="text-white text-sm font-bold mb-2 border-b border-[#1C2E5A] pb-2">{t('metrics') || 'Metrics'}</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {currentData.map(item => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                          <input 
                            type="checkbox" 
                            checked={visibleMetrics[item.id] !== false} 
                            onChange={() => toggleMetric(item.id)}
                            className="rounded border-[#1C2E5A] bg-[#0A1128] text-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                          <span className="text-sm">{language === 'ar' ? item.nameAr : item.nameEn}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={exportToExcel} className="p-2 text-[#10B981] hover:bg-[#1C2E5A] rounded-lg transition-colors" title={t('downloadExcel')}>
                <FileSpreadsheet size={18} />
              </button>
              <button onClick={exportToCSV} className="p-2 text-[#3B82F6] hover:bg-[#1C2E5A] rounded-lg transition-colors" title={t('downloadCsv')}>
                <FileCode size={18} />
              </button>
              <button onClick={exportToPNG} className="p-2 text-[#D4AF37] hover:bg-[#1C2E5A] rounded-lg transition-colors" title={t('downloadPng')}>
                <ImageIcon size={18} />
              </button>
              <button onClick={exportToPDF} className="p-2 text-[#EF4444] hover:bg-[#1C2E5A] rounded-lg transition-colors" title={t('downloadPdf')}>
                <FileText size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Comparison Chart */}
          <div ref={chartRef} className="lg:col-span-2 bg-[#0A1128] rounded-2xl p-6 border border-[#1C2E5A] shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D4AF37]" />
              {t('performanceComparison')}
            </h3>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C2E5A" vertical={false} />
                  <XAxis dataKey="time" stroke="#6B7280" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(val) => `${val.toFixed(1)}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121E3D', borderColor: '#1C2E5A', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {currentData.filter(item => visibleMetrics[item.id] !== false).map((item, index) => {
                    const itemName = language === 'ar' ? item.nameAr : item.nameEn;
                    return (
                      <Line 
                        key={item.id} 
                        type="monotone" 
                        dataKey={itemName} 
                        stroke={colors[index % colors.length]} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Summary Cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#1C2E5A] to-[#0A1128] rounded-2xl p-6 border border-[#2A4075] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10"></div>
              <h3 className="text-lg font-bold text-white mb-4">{t('sectorSummary')}</h3>
              
              <div className="space-y-4 relative z-10 max-h-64 overflow-y-auto pr-2">
                {currentData.filter(item => visibleMetrics[item.id] !== false).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-[#2A4075]/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                      <span className="text-sm text-gray-300">{language === 'ar' ? item.nameAr : item.nameEn}</span>
                    </div>
                    <div className="text-left" dir="ltr">
                      <div className="text-sm font-bold text-white">{(item.price || 0).toFixed(2)}</div>
                      <div className={`text-xs ${item.trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {item.trend === 'up' ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A1128] rounded-2xl p-6 border border-[#1C2E5A] shadow-xl flex-grow flex flex-col justify-center items-center text-center">
              <PieChart size={48} className="text-[#D4AF37] mb-4 opacity-50" />
              <h4 className="text-white font-bold mb-2">{t('detailedReport')}</h4>
              <p className="text-xs text-gray-400 mb-4">{t('detailedReportDesc')}</p>
              <button className="px-4 py-2 bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A1128] rounded-lg text-sm font-bold transition-colors w-full">
                {t('downloadReport')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
