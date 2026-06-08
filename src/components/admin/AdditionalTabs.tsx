import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Briefcase, Network, Coins, BarChart2, AlertTriangle, Users, 
  Layout, Scale, DatabaseBackup, Plus, Save, Download, RefreshCw, Trash2, Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const SectorsTab = ({ adminUser }: { adminUser?: any }) => {
  const { language, t } = useLanguage();
  const [sectors, setSectors] = useState<any[]>([]);
  const [editingSector, setEditingSector] = useState<any>(null);

  const enforcePermission = (permissionKey: string, moduleName: string) => {
    if (adminUser?.role === 'super_admin') return true;
    if (adminUser && adminUser[permissionKey] === true) return true;
    alert(language === 'ar' ? `ليس لديك صلاحية لإدارة ${moduleName} المحددة.` : `You don't have permission to manage ${moduleName}.`);
    return false;
  };

  const fetchSectors = async () => {
    const { data } = await supabase.from('sectors').select('*').order('sort_order', { ascending: true });
    if (data) setSectors(data);
  };

  useEffect(() => {
    fetchSectors();
    const sub = supabase.channel('sectors_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'sectors' }, () => {
      fetchSectors();
    }).subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime unavailable, using normal Supabase fetch');
      }
    });
    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcePermission('can_manage_sectors', 'القطاعات')) return;
    const { id, ...data } = editingSector;
    
    try {
      if (id) {
        await supabase.from('sectors').update(data).eq('id', id);
      } else {
        await supabase.from('sectors').insert([{ ...data, created_at: new Date().toISOString() }]);
      }
      setEditingSector(null);
      fetchSectors();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id: any) => {
    if (!enforcePermission('can_manage_sectors', 'القطاعات')) return;
    if (confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) {
      await supabase.from('sectors').delete().eq('id', id);
      fetchSectors();
    }
  };

  const handleToggle = async (id: any, currentStatus: boolean) => {
    if (!enforcePermission('can_manage_sectors', 'القطاعات')) return;
    await supabase.from('sectors').update({ is_visible: !currentStatus }).eq('id', id);
    fetchSectors();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Briefcase className="text-[#D4AF37]" size={32} />
          {language === 'ar' ? 'القطاعات' : 'Sectors'}
        </h2>
        <button onClick={() => {
          if (!enforcePermission('can_manage_sectors', 'القطاعات')) return;
          setEditingSector({ name_ar: '', name_en: '', code: '', icon: 'Briefcase', is_visible: true, status: 'active', sort_order: sectors.length })
        }} className="bg-[#D4AF37] text-[#0A1128] px-6 py-3 rounded-xl font-black">
          {language === 'ar' ? 'إضافة قطاع' : 'Add Sector'}
        </button>
      </div>

      {editingSector && (
        <div className="bg-[#121E3D] p-8 rounded-3xl border border-[#1C2E5A] shadow-2xl">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</label>
              <input value={editingSector.name_ar} onChange={e => setEditingSector({...editingSector, name_ar: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-4 text-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}</label>
              <input value={editingSector.name_en} onChange={e => setEditingSector({...editingSector, name_en: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-4 text-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الكود (Unique Code)' : 'Code'}</label>
              <input value={editingSector.code} onChange={e => setEditingSector({...editingSector, code: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-4 text-white font-mono" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sort Order</label>
              <input type="number" value={editingSector.sort_order} onChange={e => setEditingSector({...editingSector, sort_order: parseInt(e.target.value)})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-4 text-white" />
            </div>
            <div className="flex gap-4">
               <button type="submit" className="bg-[#D4AF37] text-[#0A1128] px-8 py-3 rounded-xl font-black flex-1">Save</button>
               <button type="button" onClick={() => setEditingSector(null)} className="bg-[#1C2E5A] text-white px-8 py-3 rounded-xl font-black flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left rtl:text-right">
          <thead>
            <tr className="bg-[#121E3D] border-b border-[#1C2E5A] text-gray-400 text-xs uppercase tracking-widest font-black">
              <th className="p-6">Code</th>
              <th className="p-6">{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th className="p-6">Order</th>
              <th className="p-6">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {sectors.map(sector => (
              <tr key={sector.id} className="hover:bg-[#121E3D]/50 transition-colors">
                <td className="p-6 font-mono text-gray-400 text-xs">{sector.code}</td>
                <td className="p-6">
                  <div className="text-white font-bold">{sector.name_ar}</div>
                  <div className="text-gray-500 text-[10px]">{sector.name_en}</div>
                </td>
                <td className="p-6 text-white font-bold">{sector.sort_order}</td>
                <td className="p-6">
                  <button onClick={() => handleToggle(sector.id, sector.is_visible)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${sector.is_visible ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {sector.is_visible ? (language === 'ar' ? 'مرئي' : 'Visible') : (language === 'ar' ? 'مخفي' : 'Hidden')}
                  </button>
                </td>
                <td className="p-6 text-right rtl:text-left flex items-center gap-4 justify-end">
                  <button onClick={() => {
                    if (!enforcePermission('can_manage_sectors', 'القطاعات')) return;
                    setEditingSector(sector);
                  }} className="text-gray-500 hover:text-[#D4AF37]"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(sector.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DataSourcesTab = () => {
  const { language } = useLanguage();
  const [sources, setSources] = useState<any[]>([]);

  const fetchSources = async () => {
    const { data } = await supabase.from('data_sources').select('*').order('created_at', { ascending: false });
    if (data) setSources(data);
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleAdd = async () => {
    await supabase.from('data_sources').insert([{
      name: 'Libya Market API',
      url: 'https://api.libyamarket.ly',
      status: 'active',
      last_sync: new Date().toISOString()
    }]);
    fetchSources();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <DatabaseBackup className="text-[#D4AF37]" size={32} />
          {language === 'ar' ? 'مصادر البيانات' : 'Data Sources'}
        </h2>
        <button onClick={handleAdd} className="bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold">Add Source</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map(s => (
          <div key={s.id} className="bg-[#0A1128] p-6 rounded-2xl border border-[#1C2E5A]">
            <h4 className="text-white font-bold">{s.name}</h4>
            <p className="text-gray-500 text-xs">{s.url}</p>
            <button onClick={async () => { await supabase.from('data_sources').delete().eq('id', s.id); fetchSources(); }} className="text-red-500 mt-4"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ExchangeRatesTab = () => {
  const { language } = useLanguage();
  const [rates, setRates] = useState<any[]>([]);

  const fetchRates = async () => {
    const { data } = await supabase.from('exchange_rates').select('*').order('created_at', { ascending: false });
    if (data) setRates(data);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return (
    <div className="bg-[#0A1128] p-8 rounded-3xl border border-[#1C2E5A]">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Coins className="text-[#D4AF37]"/> {language === 'ar' ? 'أسعار الصرف' : 'Exchange Rates'}</h2>
      <div className="space-y-4">
        {rates.map(rate => (
          <div key={rate.id} className="flex justify-between items-center bg-[#121E3D] p-4 rounded-xl border border-[#1C2E5A]">
            <span className="text-white font-bold">{rate.currency}</span>
            <div className="flex gap-4">
              <span className="text-green-500 font-mono">{rate.official}</span>
              <span className="text-red-500 font-mono">{rate.parallel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatusTab = () => {
  const { language } = useLanguage();
  const [status, setStatus] = useState<'open' | 'maintenance'>('open');
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    const { data } = await supabase.from('platform_settings').select('value').eq('key', 'platform_status').single();
    if (data) setStatus(data.value as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async (newStatus: 'open' | 'maintenance') => {
    setLoading(true);
    await supabase.from('platform_settings').update({ value: newStatus }).eq('key', 'platform_status');
    setStatus(newStatus);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-[#0A1128] border border-[#1C2E5A] p-10 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
        
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-8 border-2 ${status === 'open' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
          <Layout size={40} />
        </div>

        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
          {language === 'ar' ? 'حالة المنصة' : 'Platform Status'}
        </h2>
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-10">
          {language === 'ar' ? 'التحكم في ظهور الموقع للزوار' : 'Control site visibility for visitors'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button 
            disabled={loading || status === 'open'}
            onClick={() => handleToggle('open')}
            className={`h-20 flex flex-col items-center justify-center rounded-2xl border-2 transition-all gap-2 ${status === 'open' ? 'bg-green-500 border-green-400 text-[#0A1128]' : 'bg-[#121E3D] border-[#1C2E5A] text-gray-500 hover:border-green-500/30'}`}
          >
            <span className="font-black uppercase tracking-widest text-sm">{language === 'ar' ? 'فتح المنصة' : 'Open Site'}</span>
            <span className="text-[10px] opacity-70 italic">{language === 'ar' ? 'VALUE: open' : 'VALUE: open'}</span>
          </button>
          
          <button 
            disabled={loading || status === 'maintenance'}
            onClick={() => handleToggle('maintenance')}
            className={`h-20 flex flex-col items-center justify-center rounded-2xl border-2 transition-all gap-2 ${status === 'maintenance' ? 'bg-red-500 border-red-400 text-white' : 'bg-[#121E3D] border-[#1C2E5A] text-gray-500 hover:border-red-500/30'}`}
          >
            <span className="font-black uppercase tracking-widest text-sm">{language === 'ar' ? 'إغلاق المنصة' : 'Close Site'}</span>
            <span className="text-[10px] opacity-70 italic">{language === 'ar' ? 'VALUE: maintenance' : 'VALUE: maintenance'}</span>
          </button>
        </div>

        {status === 'maintenance' && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            {language === 'ar' ? 'المنصة حالياً في وضع الصيانة - لا يمكن للزوار تصفح الموقع' : 'Site is currently in maintenance mode - visitors cannot browse'}
          </div>
        )}
      </div>
    </div>
  );
};

export const UsersTab = () => (<div>Users Tab</div>);
export const LegalTab = () => (<div>Legal Tab</div>);
export const BackupTab = () => (<div>Backup Tab</div>);
export const ChartsTab = () => (<div>Charts Tab</div>);
export const AlertsTab = () => (<div>Alerts Tab</div>);
export const InterfaceTab = () => (<div>Interface Tab</div>);
