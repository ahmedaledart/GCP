import React, { useState, useEffect } from 'react';
import { Archive, Search, Filter, Download, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';

export const ArchiveTab = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('admin_users').select('*').eq('email', user.email).single().then(({data}) => setAdminUser(data));
    }
  }, [user]);
  const [sectors, setSectors] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('sectors').select('*').order('sort_order', { ascending: true }).then(({data}) => {
      if (data) setSectors(data);
    });
  }, []);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      let query = supabase.from('commodity_price_history').select('*').order('recorded_at', { ascending: false }).limit(500);

      const { data: records, error } = await query;
      if (error) throw error;
      if (records) setData(records);
    } catch (err) {
      console.error('Error fetching archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();

    const channel = supabase
      .channel('archive_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commodity_price_history' }, () => {
        fetchArchive();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime unavailable, using normal Supabase fetch');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (adminUser?.role !== 'super_admin') {
      alert(language === 'ar' ? 'غير مصرح لك بحذف الأرشيف' : 'Unauthorized to delete archive');
      return;
    }
    
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase.from('commodity_price_history').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Error deleting record');
    }
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      ID: item.id,
      Symbol: item.symbol,
      NameAr: item.name_ar,
      NameEn: item.name_en,
      Sector: item.sector,
      Price: item.price,
      PrevPrice: item.previous_price,
      Source: item.source,
      RecordedAt: new Date(item.recorded_at).toLocaleString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, "Price_Archive.xlsx");
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.name_ar?.includes(searchTerm) || 
                          item.name_en?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'all' || item.sector === sectorFilter;
    const matchesDate = !dateFilter || item.recorded_at?.startsWith(dateFilter);
    
    return matchesSearch && matchesSector && matchesDate;
  });

  return (
    <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight">
          <Archive className="text-[#D4AF37]" size={28} />
          {language === 'ar' ? 'أرشيف الأسعار الكامل' : 'Full Price Archive'}
        </h3>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-6 py-3 rounded-xl border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-all font-bold uppercase tracking-wider text-sm"
        >
          <Download size={18} />
          {language === 'ar' ? 'تصدير إكسل' : 'Export Excel'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
          <input 
            type="text"
            placeholder={language === 'ar' ? 'البحث بالرمز أو الاسم...' : 'Search by symbol or name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl py-3 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-gray-600`}
          />
        </div>
        <select 
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl py-3 px-4 text-white focus:border-[#D4AF37] outline-none min-w-[150px]"
        >
          <option value="all">{language === 'ar' ? 'جميع القطاعات' : 'All Sectors'}</option>
          {sectors.map(s => (
            <option key={s.id} value={s.code}>{language === 'ar' ? s.name_ar : s.name_en}</option>
          ))}
        </select>
        <div className="relative">
          <Calendar className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`bg-[#0A1128] border border-[#1C2E5A] rounded-xl py-3 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-white focus:border-[#D4AF37] outline-none`}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div className="bg-[#0A1128] rounded-2xl border border-[#1C2E5A] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <thead className="text-xs uppercase bg-[#121E3D] text-gray-400 border-b border-[#1C2E5A]">
              <tr>
                <th className="px-6 py-4 text-right whitespace-nowrap">{language === 'ar' ? 'الرمز' : 'Symbol'}</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">{language === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">{language === 'ar' ? 'المصدر' : 'Source'}</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">{language === 'ar' ? 'وقت التسجيل' : 'Recorded At'}</th>
                {adminUser?.role === 'super_admin' && (
                  <th className="px-6 py-4 text-center whitespace-nowrap">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2E5A]/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-bold">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-bold">
                    {language === 'ar' ? 'لا توجد بيانات سجلات' : 'No history records found'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-[#1C2E5A]/30 transition-colors ${index % 2 === 0 ? 'bg-[#121E3D]/50' : 'bg-transparent'}`}>
                    <td className="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">{item.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{language === 'ar' ? item.name_ar : item.name_en}</td>
                    <td className="px-6 py-4 font-bold text-[#D4AF37] whitespace-nowrap">{item.price}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">{item.source || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                      {new Date(item.recorded_at).toLocaleString(language === 'ar' ? 'ar-LY' : 'en-US')}
                    </td>
                    {adminUser?.role === 'super_admin' && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors bg-red-500/10 p-2 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
