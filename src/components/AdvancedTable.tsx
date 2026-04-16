import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sector, SectorEn } from '../data/mockData';
import { useMarketData } from '../context/MarketContext';
import { Search, Filter, Download, ArrowUpDown, ChevronDown, ChevronUp, FileText, FileSpreadsheet, FileCode, Wifi, WifiOff, Columns } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { PriceDisplay } from './PriceDisplay';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type SortConfig = {
  key: keyof ReturnType<typeof useMarketData>['data'][0] | null;
  direction: 'asc' | 'desc';
};

export const AdvancedTable = () => {
  const { data: commoditiesData, connected, lastUpdate, latency } = useMarketData();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector | SectorEn | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [visibleColumns, setVisibleColumns] = useState({
    commodity: true,
    sector: true,
    price: true,
    prevClose: true,
    changePercent: true,
    high: true,
    low: true,
    unit: true,
    status: true,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sectorsAr: (Sector | 'all')[] = ['all', 'الطاقة', 'المعادن', 'السلع الزراعية', 'المؤشرات'];
  const sectorsEn: (SectorEn | 'all')[] = ['all', 'Energy', 'Metals', 'Agriculture', 'Indices'];
  const sectors = language === 'ar' ? sectorsAr : sectorsEn;

  const handleSort = (key: keyof typeof commoditiesData[0]) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const getExportData = () => {
    return filteredAndSortedData.map(item => {
      const row: any = {};
      if (visibleColumns.commodity) row[t('commodity')] = language === 'ar' ? item.nameAr : item.nameEn;
      if (visibleColumns.sector) row[t('sector')] = language === 'ar' ? item.sectorAr : item.sectorEn;
      if (visibleColumns.price) row[t('currentPrice')] = item.price;
      if (visibleColumns.prevClose) row[t('prevClose')] = item.prevClose;
      if (visibleColumns.changePercent) row[t('changePercent')] = `${item.changePercent}%`;
      if (visibleColumns.high) row[t('high')] = item.high;
      if (visibleColumns.low) row[t('low')] = item.low;
      if (visibleColumns.unit) row[t('unit')] = language === 'ar' ? item.unitAr : item.unitEn;
      if (visibleColumns.status) row[t('status')] = language === 'ar' ? item.statusAr : item.statusEn;
      return row;
    });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prices");
    XLSX.writeFile(wb, "global_prices.xlsx");
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    XLSX.writeFile({
      SheetNames: ["Prices"],
      Sheets: { "Prices": ws }
    }, "global_prices.csv", { bookType: 'csv' });
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    const tableColumn = [
      t('commodity'), t('sector'), t('currentPrice'), t('prevClose'), 
      t('changePercent'), t('high'), t('low'), t('unit'), t('status')
    ];
    
    const tableRows = filteredAndSortedData.map(item => [
      language === 'ar' ? item.nameAr : item.nameEn,
      language === 'ar' ? item.sectorAr : item.sectorEn,
      item.price.toString(),
      item.prevClose.toString(),
      `${item.changePercent}%`,
      item.high.toString(),
      item.low.toString(),
      language === 'ar' ? item.unitAr : item.unitEn,
      language === 'ar' ? item.statusAr : item.statusEn,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });
    
    doc.save("global_prices.pdf");
  };

  const filteredAndSortedData = useMemo(() => {
    let filterableData = commoditiesData;

    // Filter by sector
    if (selectedSector !== 'all') {
      filterableData = filterableData.filter(item => 
        item.sectorAr === selectedSector || item.sectorEn === selectedSector
      );
    }

    // Filter by search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filterableData = filterableData.filter(item => 
        item.nameAr.toLowerCase().includes(lowerSearch) || 
        item.nameEn.toLowerCase().includes(lowerSearch) || 
        item.symbol.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortConfig.key) {
      filterableData.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];
        
        // Handle language specific sorting
        if (sortConfig.key === 'nameAr' || sortConfig.key === 'nameEn') {
            aValue = language === 'ar' ? a.nameAr : a.nameEn;
            bValue = language === 'ar' ? b.nameAr : b.nameEn;
        } else if (sortConfig.key === 'sectorAr' || sortConfig.key === 'sectorEn') {
            aValue = language === 'ar' ? a.sectorAr : a.sectorEn;
            bValue = language === 'ar' ? b.sectorAr : b.sectorEn;
        } else if (sortConfig.key === 'statusAr' || sortConfig.key === 'statusEn') {
            aValue = language === 'ar' ? a.statusAr : a.statusEn;
            bValue = language === 'ar' ? b.statusAr : b.statusEn;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filterableData;
  }, [searchTerm, selectedSector, sortConfig, commoditiesData, language]);

  const renderSortIcon = (key: keyof typeof commoditiesData[0]) => {
    // Map language specific keys back to base for icon rendering
    let activeKey = sortConfig.key;
    if (activeKey === 'nameAr' || activeKey === 'nameEn') activeKey = language === 'ar' ? 'nameAr' : 'nameEn';
    if (activeKey === 'sectorAr' || activeKey === 'sectorEn') activeKey = language === 'ar' ? 'sectorAr' : 'sectorEn';
    if (activeKey === 'statusAr' || activeKey === 'statusEn') activeKey = language === 'ar' ? 'statusAr' : 'statusEn';

    const checkKey = (key === 'nameAr' || key === 'nameEn') ? (language === 'ar' ? 'nameAr' : 'nameEn') :
                     (key === 'sectorAr' || key === 'sectorEn') ? (language === 'ar' ? 'sectorAr' : 'sectorEn') :
                     (key === 'statusAr' || key === 'statusEn') ? (language === 'ar' ? 'statusAr' : 'statusEn') : key;

    if (activeKey !== checkKey) return <ArrowUpDown size={14} className="text-gray-500" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#D4AF37]" /> : <ChevronDown size={14} className="text-[#D4AF37]" />;
  };

  return (
    <section id="table" className="py-16 bg-[#0A1128]">
      <div className="container mx-auto px-4">
        <div className="bg-[#121E3D] rounded-2xl border border-[#1C2E5A] shadow-2xl overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-6 border-b border-[#1C2E5A] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{t('tableTitle')}</h2>
              <p className="text-sm text-gray-400">{t('tableSub')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-grow lg:flex-grow-0">
                <Search size={18} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                <input 
                  type="text" 
                  placeholder={t('searchTable')} 
                  className={`w-full lg:w-64 bg-[#0A1128] border border-[#1C2E5A] rounded-lg py-2 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-white focus:outline-none focus:border-[#D4AF37] transition-colors`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sector Filter */}
              <div className="relative">
                <Filter size={18} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                <select 
                  className={`appearance-none bg-[#0A1128] border border-[#1C2E5A] rounded-lg py-2 ${language === 'ar' ? 'pr-10 pl-8' : 'pl-10 pr-8'} text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer`}
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value as any)}
                >
                  {sectors.map((sector, idx) => (
                    <option key={idx} value={sector}>{sector === 'all' ? t('allSectors') : sector}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                    className="flex items-center gap-2 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#2A4075]"
                    title={t('columns') || 'Columns'}
                  >
                    <Columns size={16} className="text-[#D4AF37]" />
                    <span className="hidden sm:inline">{t('columns') || 'Columns'}</span>
                  </button>
                  {showColumnDropdown && (
                    <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} bg-[#121E3D] border border-[#1C2E5A] rounded-lg shadow-xl p-3 z-50 min-w-[200px]`}>
                      <h4 className="text-white text-sm font-bold mb-2 border-b border-[#1C2E5A] pb-2">{t('columns') || 'Columns'}</h4>
                      <div className="space-y-2">
                        {Object.entries(visibleColumns).map(([key, isVisible]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                            <input 
                              type="checkbox" 
                              checked={isVisible} 
                              onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                              className="rounded border-[#1C2E5A] bg-[#0A1128] text-[#D4AF37] focus:ring-[#D4AF37]"
                            />
                            <span className="text-sm">{t(key as any) || key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#2A4075]" title={t('downloadExcel')}>
                  <FileSpreadsheet size={16} className="text-[#10B981]" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button onClick={exportToCSV} className="flex items-center gap-2 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#2A4075]" title={t('downloadCsv')}>
                  <FileCode size={16} className="text-[#3B82F6]" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button onClick={exportToPDF} className="flex items-center gap-2 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#2A4075]" title={t('downloadPdf')}>
                  <FileText size={16} className="text-[#EF4444]" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
              <thead>
                <tr className="bg-[#0A1128] border-b border-[#1C2E5A]">
                  {visibleColumns.commodity && (
                    <th className="p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort(language === 'ar' ? 'nameAr' : 'nameEn')}>
                      <div className="flex items-center gap-2">{t('commodity')} {renderSortIcon(language === 'ar' ? 'nameAr' : 'nameEn')}</div>
                    </th>
                  )}
                  {visibleColumns.sector && (
                    <th className="p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort(language === 'ar' ? 'sectorAr' : 'sectorEn')}>
                      <div className="flex items-center gap-2">{t('sector')} {renderSortIcon(language === 'ar' ? 'sectorAr' : 'sectorEn')}</div>
                    </th>
                  )}
                  {visibleColumns.price && (
                    <th className="p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort('price')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>{t('currentPrice')} {renderSortIcon('price')}</div>
                    </th>
                  )}
                  {visibleColumns.prevClose && (
                    <th className="p-4 font-semibold text-gray-300 hidden sm:table-cell cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort('prevClose')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>{t('prevClose')} {renderSortIcon('prevClose')}</div>
                    </th>
                  )}
                  {visibleColumns.changePercent && (
                    <th className="p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort('changePercent')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>{t('changePercent')} {renderSortIcon('changePercent')}</div>
                    </th>
                  )}
                  {visibleColumns.high && (
                    <th className="p-4 font-semibold text-gray-300 hidden md:table-cell cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort('high')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>{t('high')} {renderSortIcon('high')}</div>
                    </th>
                  )}
                  {visibleColumns.low && (
                    <th className="p-4 font-semibold text-gray-300 hidden md:table-cell cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort('low')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>{t('low')} {renderSortIcon('low')}</div>
                    </th>
                  )}
                  {visibleColumns.unit && (
                    <th className="p-4 font-semibold text-gray-300 hidden lg:table-cell">{t('unit')}</th>
                  )}
                  {visibleColumns.status && (
                    <th className="p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort(language === 'ar' ? 'statusAr' : 'statusEn')}>
                      <div className="flex items-center gap-2">{t('status')} {renderSortIcon(language === 'ar' ? 'statusAr' : 'statusEn')}</div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((item, index) => {
                  const isUp = item.trend === 'up';
                  const colorClass = isUp ? 'text-[#10B981]' : 'text-[#EF4444]';
                  const bgHoverClass = 'hover:bg-[#1C2E5A]/30';
                  const name = language === 'ar' ? item.nameAr : item.nameEn;
                  const sector = language === 'ar' ? item.sectorAr : item.sectorEn;
                  const unit = language === 'ar' ? item.unitAr : item.unitEn;
                  const status = language === 'ar' ? item.statusAr : item.statusEn;

                  return (
                    <tr key={item.id} className={`border-b border-[#1C2E5A]/50 ${bgHoverClass} transition-colors ${index % 2 === 0 ? 'bg-[#121E3D]' : 'bg-[#0A1128]/30'}`}>
                      {visibleColumns.commodity && (
                        <td className="p-4">
                          <div className="font-bold text-white">{name}</div>
                          <div className="text-xs text-gray-500">{item.symbol}</div>
                        </td>
                      )}
                      {visibleColumns.sector && (
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-[#1C2E5A] text-xs text-gray-300 border border-[#2A4075]">
                            {sector}
                          </span>
                        </td>
                      )}
                      {visibleColumns.price && (
                        <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-mono font-bold text-white`} dir="ltr">
                          <PriceDisplay price={item.price} />
                        </td>
                      )}
                      {visibleColumns.prevClose && (
                        <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-mono text-gray-400 hidden sm:table-cell`} dir="ltr">
                          {item.prevClose.toFixed(2)}
                        </td>
                      )}
                      {visibleColumns.changePercent && (
                        <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-mono font-bold ${colorClass}`} dir="ltr">
                          <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-1`}>
                            {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </div>
                          <div className="text-xs opacity-70">
                            {isUp ? '+' : ''}{item.changeAmount.toFixed(2)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.high && (
                        <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-mono text-gray-400 hidden md:table-cell`} dir="ltr">
                          {item.high.toFixed(2)}
                        </td>
                      )}
                      {visibleColumns.low && (
                        <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-mono text-gray-400 hidden md:table-cell`} dir="ltr">
                          {item.low.toFixed(2)}
                        </td>
                      )}
                      {visibleColumns.unit && (
                        <td className="p-4 text-sm text-gray-400 hidden lg:table-cell">
                          {unit}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded text-xs font-medium w-fit ${item.statusEn === 'Open' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.statusEn === 'Open' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
                              {status}
                            </span>
                            <span className="text-[10px] text-gray-500" dir="ltr">
                              {format(new Date(item.lastUpdate), 'HH:mm:ss')}
                            </span>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      {t('noResults')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="p-4 border-t border-[#1C2E5A] bg-[#0A1128] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div>{t('totalResults')} <span className="text-white font-bold">{filteredAndSortedData.length}</span></div>
            
            <div className="flex flex-wrap items-center justify-center gap-6">
              {lastUpdate && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">{language === 'ar' ? 'آخر تحديث:' : 'Last Update:'}</span>
                  <span className="text-white font-mono">{format(lastUpdate, 'HH:mm:ss')}</span>
                </div>
              )}

              {latency !== null && connected && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">{language === 'ar' ? 'التأخير:' : 'Latency:'}</span>
                  <span className={`${latency < 200 ? 'text-[#10B981]' : latency < 500 ? 'text-yellow-500' : 'text-[#EF4444]'} font-mono`}>
                    {latency}ms
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Wifi size={16} className="text-[#10B981]" />
                    <span className="text-[#10B981] font-medium">{t('connected')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-[#EF4444]" />
                    <span className="text-[#EF4444] font-medium">{t('connecting')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
