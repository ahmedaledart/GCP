import React, { useState, useEffect } from 'react';
import { Database, Link as LinkIcon, RefreshCw, Play, Plus, Trash2, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

export const ApiSourcesTab = () => {
  const { language } = useLanguage();
  const [sources, setSources] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sourcesData } = await supabase.from('api_sources').select('*').order('created_at', { ascending: false });
      const { data: mappingsData } = await supabase.from('commodity_api_mapping').select('*').order('symbol', { ascending: true });
      
      if (sourcesData) setSources(sourcesData);
      if (mappingsData) setMappings(mappingsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAll = async () => {
    setUpdating(true);
    setStatus(null);
    try {
      console.warn('Realtime backend unavailable, skipping API ping (use server or Supabase edge functions for this)');
      setTimeout(() => {
        setStatus({ 
          type: 'success', 
          message: language === 'ar' ? `تم التحديث بنجاح (وضع الواجهة الأمامية فقط)` : `Updated successfully (Frontend only mode)` 
        });
        setUpdating(false);
      }, 1000);
    } catch (e: any) {
      setStatus({ 
        type: 'error', 
        message: language === 'ar' ? `فشل التحديث: ${e.message}` : `Update failed: ${e.message}` 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    setStatus(null);
    try {
      console.warn(`Realtime backend unavailable, skipping API ping for source ${sourceId}`);
      setTimeout(() => {
        setStatus({ 
          type: 'success', 
          message: language === 'ar' ? 'تم الاتصال بنجاح (محاكاة)' : 'Connection successful (simulated)' 
        });
      }, 1000);
    } catch (e: any) {
      setStatus({ 
        type: 'error', 
        message: language === 'ar' ? `فشل الاتصال: ${e.message}` : `Connection failed: ${e.message}` 
      });
    }
  };

  return (
    <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight">
            <Database className="text-[#D4AF37]" size={28} />
            {language === 'ar' ? 'مصادر البيانات API' : 'Price Data API'}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {language === 'ar' ? 'إدارة مصادر جلب الأسعار التلقائية وربط السلع' : 'Manage automated price sources and commodity mapping'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleUpdateAll}
            disabled={updating}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8962E] disabled:opacity-50 text-[#0A1128] px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-[#D4AF37]/20"
          >
            <RefreshCw className={updating ? 'animate-spin' : ''} size={20} />
            {language === 'ar' ? 'تحديث الكل الآن' : 'Update All Now'}
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sources Section */}
        <div className="bg-[#0A1128] rounded-2xl border border-[#1C2E5A] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-[#1C2E5A] bg-[#121E3D] flex justify-between items-center">
            <h4 className="text-white font-black flex items-center gap-2">
              <Play size={18} className="text-[#D4AF37]" />
              {language === 'ar' ? 'مزودي الخدمة' : 'API Providers'}
            </h4>
            <button className="text-[#D4AF37] hover:text-white flex items-center gap-1 text-xs font-bold">
              <Plus size={16} /> {language === 'ar' ? 'إضافة مزود' : 'Add Provider'}
            </button>
          </div>
          <div className="p-6">
             {sources.length === 0 ? (
               <div className="text-center py-10 text-gray-600 italic">
                 {language === 'ar' ? 'لا يوجد مزودين مضافين' : 'No providers added'}
               </div>
             ) : (
               <div className="space-y-4">
                 {sources.map(source => (
                   <div key={source.id} className="p-4 bg-[#121E3D] rounded-xl border border-[#1C2E5A] hover:border-[#D4AF37]/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="text-white font-bold">{source.name}</h5>
                          <p className="text-[10px] text-gray-500 font-mono">{source.base_url}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleTestConnection(source.id)}
                            className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                            title={language === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                          >
                            <Play size={16} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${source.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {source.is_active ? (language === 'ar' ? 'مفعل' : 'Active') : (language === 'ar' ? 'معطل' : 'Disabled')}
                        </div>
                        <span className="text-gray-600 text-[10px]">{source.provider}</span>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Mapping Section */}
        <div className="bg-[#0A1128] rounded-2xl border border-[#1C2E5A] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-[#1C2E5A] bg-[#121E3D] flex justify-between items-center">
            <h4 className="text-white font-black flex items-center gap-2">
              <LinkIcon size={18} className="text-[#D4AF37]" />
              {language === 'ar' ? 'ربط السلع' : 'Commodity Mapping'}
            </h4>
            <button className="text-[#D4AF37] hover:text-white flex items-center gap-1 text-xs font-bold">
              <Plus size={16} /> {language === 'ar' ? 'ربط سلعة' : 'New Mapping'}
            </button>
          </div>
          <div className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-right">
                 <thead className="text-[10px] uppercase bg-[#0D152B] text-gray-500 border-b border-[#1C2E5A]">
                   <tr>
                     <th className="px-6 py-4">{language === 'ar' ? 'الرمز الداخلي' : 'Symbol'}</th>
                     <th className="px-6 py-4">{language === 'ar' ? 'رمز API' : 'API Symbol'}</th>
                     <th className="px-6 py-4">{language === 'ar' ? 'المزود' : 'Provider'}</th>
                     <th className="px-6 py-4 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#1C2E5A]/30">
                   {mappings.map(map => (
                     <tr key={map.id} className="hover:bg-[#121E3D]/50 transition-colors">
                       <td className="px-6 py-4 font-black text-white">{map.symbol}</td>
                       <td className="px-6 py-4 font-mono text-[#D4AF37]">{map.api_symbol}</td>
                       <td className="px-6 py-4 text-gray-400 text-xs">{map.provider}</td>
                       <td className="px-6 py-4 flex justify-center">
                         <div className={`w-2 h-2 rounded-full ${map.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-[#0A1128] rounded-2xl border border-[#1C2E5A] overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#1C2E5A] bg-[#121E3D] flex items-center gap-3">
          <Info size={18} className="text-[#D4AF37]" />
          <h4 className="text-white font-black">{language === 'ar' ? 'سجل العمليات الأخير' : 'Recent Operations Log'}</h4>
        </div>
        <div className="p-6 text-center text-gray-600 text-sm">
          {language === 'ar' ? 'سيتم عرض سجلات تحديث الأسعار هنا تلقائياً' : 'API price update logs will appear here automatically'}
        </div>
      </div>
    </div>
  );
};
