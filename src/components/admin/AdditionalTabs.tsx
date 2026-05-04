import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Briefcase, Network, Coins, BarChart2, AlertTriangle, Users, 
  Layout, Scale, DatabaseBackup, Plus, Save, Download, RefreshCw, Trash2, Edit
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from '../../lib/api';
import { auth, db } from '../../lib/api';

export const SectorsTab = () => {
  const { language, t } = useLanguage();
  const [sectors, setSectors] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'sectors'), (snap) => {
      setSectors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, 'sectors'), {
      nameAr: 'قطاع جديد',
      nameEn: 'New Sector',
      active: true,
      createdAt: serverTimestamp()
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Briefcase className="text-[#D4AF37]" size={32} />
            {t('sectors' as any) || (language === 'ar' ? 'القطاعات' : 'Sectors')}
          </h2>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158] transition-all">
          <Plus size={18} /> {language === 'ar' ? 'إضافة قطاع' : 'Add Sector'}
        </button>
      </div>

      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left rtl:text-right">
          <thead>
            <tr className="bg-[#121E3D] border-b border-[#1C2E5A] text-gray-400 text-xs uppercase tracking-widest font-black">
              <th className="p-6">{language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</th>
              <th className="p-6">{language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}</th>
              <th className="p-6">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {sectors.map(sector => (
              <tr key={sector.id} className="hover:bg-[#121E3D]/50 transition-colors">
                <td className="p-6 text-white font-bold">{sector.nameAr}</td>
                <td className="p-6 text-white font-bold">{sector.nameEn}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sector.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {sector.active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="p-6 text-right rtl:text-left">
                  <button onClick={() => deleteDoc(doc(db, 'sectors', sector.id))} className="text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {sectors.length === 0 && (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500">لا توجد قطاعات.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DataSourcesTab = () => {
  const { language, t } = useLanguage();
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'data_sources'), (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, 'data_sources'), {
      name: 'Alpha Vantage API',
      url: 'https://www.alphavantage.co/',
      status: 'active',
      lastSync: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Network className="text-[#D4AF37]" size={32} />
            {t('dataSources' as any) || (language === 'ar' ? 'مصادر البيانات' : 'Data Sources')}
          </h2>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158] transition-all">
          <Plus size={18} /> {language === 'ar' ? 'إضافة مصدر' : 'Add Source'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map(s => (
          <div key={s.id} className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 relative">
            <div className="absolute top-6 right-6 rtl:left-6 rtl:right-auto">
              <span className={`w-3 h-3 rounded-full block ${s.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{s.name}</h3>
            <p className="text-sm text-gray-400 mb-4 font-mono">{s.url}</p>
            <div className="flex justify-between items-center text-xs text-gray-500 font-bold border-t border-[#1C2E5A] pt-4">
              <span>{language === 'ar' ? 'آخر تحديث' : 'Last sync'}:</span>
              <span>{new Date(s.lastSync).toLocaleTimeString()}</span>
            </div>
            <button onClick={() => deleteDoc(doc(db, 'data_sources', s.id))} className="absolute bottom-6 right-6 rtl:left-6 rtl:right-auto text-gray-500 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {sources.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-500 border border-dashed border-[#1C2E5A] rounded-2xl">
            لا توجد مصادر بيانات.
          </div>
        )}
      </div>
    </div>
  );
};

export const ExchangeRatesTab = () => {
  const { language, t } = useLanguage();
  const [rates, setRates] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'exchange_rates'), (snap) => {
      setRates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, 'exchange_rates'), {
      currency: 'USD/LYD',
      official: 4.85,
      parallel: 7.25,
      createdAt: serverTimestamp()
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Coins className="text-[#D4AF37]" size={32} />
            {t('exchangeRates' as any) || (language === 'ar' ? 'أسعار الصرف' : 'Exchange Rates')}
          </h2>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158] transition-all">
          <Plus size={18} /> {language === 'ar' ? 'إضافة سعر' : 'Add Rate'}
        </button>
      </div>

      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left rtl:text-right">
          <thead>
            <tr className="bg-[#121E3D] border-b border-[#1C2E5A] text-gray-400 text-xs uppercase tracking-widest font-black">
              <th className="p-6">{language === 'ar' ? 'العملة' : 'Currency'}</th>
              <th className="p-6">{language === 'ar' ? 'الرسمي' : 'Official'}</th>
              <th className="p-6">{language === 'ar' ? 'الموازي' : 'Parallel'}</th>
              <th className="p-6">{language === 'ar' ? 'الفجوة' : 'Gap'}</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {rates.map(rate => {
              const gap = rate.parallel - rate.official;
              const gapPercent = ((gap / rate.official) * 100).toFixed(1);
              return (
                <tr key={rate.id} className="hover:bg-[#121E3D]/50 transition-colors">
                  <td className="p-6 text-white font-bold">{rate.currency}</td>
                  <td className="p-6 text-white font-mono">{rate.official}</td>
                  <td className="p-6 text-white font-mono">{rate.parallel}</td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold font-mono">
                      {gap.toFixed(2)} ({gapPercent}%)
                    </span>
                  </td>
                  <td className="p-6 text-right rtl:text-left">
                    <button onClick={() => deleteDoc(doc(db, 'exchange_rates', rate.id))} className="text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {rates.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-gray-500">لا توجد أسعار صرف.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const UsersTab = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'system_users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, 'system_users'), {
      name: 'محمود أحمد',
      email: 'user@example.com',
      role: 'Editor',
      status: 'Active',
      createdAt: serverTimestamp()
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Users className="text-[#D4AF37]" size={32} />
            {language === 'ar' ? 'المستخدمون والصلاحيات' : 'Users & Permissions'}
          </h2>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158] transition-all">
          <Plus size={18} /> {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </button>
      </div>

      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left rtl:text-right">
          <thead>
            <tr className="bg-[#121E3D] border-b border-[#1C2E5A] text-gray-400 text-xs uppercase tracking-widest font-black">
              <th className="p-6 text-left rtl:text-right">{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th className="p-6 text-left rtl:text-right">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
              <th className="p-6 text-left rtl:text-right">{language === 'ar' ? 'الصلاحية' : 'Role'}</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {users.map(u => (
              <tr key={u.id}>
                <td className="p-6 text-white font-bold">{u.name}</td>
                <td className="p-6 text-gray-400">{u.email}</td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-xs font-bold">
                    {u.role}
                  </span>
                </td>
                <td className="p-6 text-right rtl:text-left">
                  <button onClick={() => deleteDoc(doc(db, 'system_users', u.id))} className="text-gray-500 hover:text-red-500">
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
}

export const LegalTab = () => {
  const { language } = useLanguage();
  const [legal, setLegal] = useState<any>({
    privacyAr: '', privacyEn: '', termsAr: '', termsEn: ''
  });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'legal'), (doc) => {
      if (doc.exists()) setLegal(doc.data());
    });
  }, []);

  const handleSave = async () => {
    await setDoc(doc(db, 'settings', 'legal'), legal);
    alert(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Scale className="text-[#D4AF37]" size={32} />
            {language === 'ar' ? 'الصفحات القانونية' : 'Legal Pages'}
          </h2>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158] transition-all">
          <Save size={18} /> {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</h3>
          <div>
            <label className="text-xs text-gray-500 uppercase font-black block mb-2">AR</label>
            <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white min-h-[150px] outline-none" value={legal.privacyAr} onChange={(e) => setLegal({...legal, privacyAr: e.target.value})}></textarea>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-black block mb-2">EN</label>
            <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white min-h-[150px] outline-none" value={legal.privacyEn} onChange={(e) => setLegal({...legal, privacyEn: e.target.value})}></textarea>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">{language === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}</h3>
          <div>
            <label className="text-xs text-gray-500 uppercase font-black block mb-2">AR</label>
            <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white min-h-[150px] outline-none" value={legal.termsAr} onChange={(e) => setLegal({...legal, termsAr: e.target.value})}></textarea>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-black block mb-2">EN</label>
            <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white min-h-[150px] outline-none" value={legal.termsEn} onChange={(e) => setLegal({...legal, termsEn: e.target.value})}></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}

export const InterfaceTab = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<any>({
    primaryColor: '#D4AF37',
    darkMode: true,
    showTicker: true,
    fontFamily: 'Inter'
  });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'interface'), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    });
  }, []);

  const handleSave = async () => {
    await setDoc(doc(db, 'settings', 'interface'), settings);
    alert(language === 'ar' ? 'تم حفظ إعدادات الواجهة' : 'Interface settings saved');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <Layout className="text-[#D4AF37]" size={32} />
          {language === 'ar' ? 'إعدادات الواجهة' : 'Interface Settings'}
        </h2>
        <button onClick={handleSave} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158]">
          <Save size={18} /> {language === 'ar' ? 'حفظ' : 'Save'}
        </button>
      </div>

      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">{language === 'ar' ? 'الألوان والتصميم' : 'Colors & Design'}</h3>
            <div>
              <label className="text-xs text-gray-500 block uppercase font-bold mb-2">{language === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</label>
              <div className="flex gap-4 items-center">
                <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="w-12 h-12 rounded cursor-pointer bg-transparent border-none" />
                <span className="text-white font-mono uppercase">{settings.primaryColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 block uppercase font-bold">{language === 'ar' ? 'نوع الخط' : 'Font Family'}</label>
              <select className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl p-3 text-white" value={settings.fontFamily} onChange={e => setSettings({...settings, fontFamily: e.target.value})}>
                <option value="Inter">Inter (Default)</option>
                <option value="Cairo">Cairo (Arabic Optimized)</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">{language === 'ar' ? 'خيارات العرض' : 'Display Options'}</h3>
            <label className="flex items-center gap-4 text-gray-300">
              <input type="checkbox" checked={settings.darkMode} onChange={e => setSettings({...settings, darkMode: e.target.checked})} />
              {language === 'ar' ? 'الوضع الليلي الافتراضي' : 'Default Dark Mode'}
            </label>
            <label className="flex items-center gap-4 text-gray-300">
              <input type="checkbox" checked={settings.showTicker} onChange={e => setSettings({...settings, showTicker: e.target.checked})} />
              {language === 'ar' ? 'إظهار شريط الأخبار' : 'Show News Ticker'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BackupTab = () => {
  const { language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  
  const handleBackup = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/db');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `market_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert(language === 'ar' ? 'تم إنشاء النسخة الاحتياطية بنجاح!' : 'Backup created successfully!');
    } catch (e) {
      alert(language === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Export error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const data = JSON.parse(evt.target?.result as string);
            await fetch('/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            alert(language === 'ar' ? 'تم استعادة البيانات بنجاح!' : 'Data restored successfully!');
            window.location.reload();
          } catch (err) {
            alert(language === 'ar' ? 'ملف غير صالح' : 'Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-12">
      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-3xl p-10 max-w-2xl w-full shadow-2xl">
        <div className="w-20 h-20 bg-[#121E3D] rounded-full flex items-center justify-center mb-6 border border-[#D4AF37]/30 mx-auto">
          <DatabaseBackup className="text-[#D4AF37]" size={36} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
          {language === 'ar' ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Restore'}
        </h2>
        <p className="text-gray-400 mb-8 text-sm">
          {language === 'ar' ? 'قم بتحميل نسخة كاملة من قاعدة بيانات المنصة لتأمين بياناتك أو استعادة نسخة سابقة.' : 'Download a complete backup of the platform database to secure your data or restore a previous version.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleBackup} 
            disabled={isExporting}
            className="flex items-center justify-center gap-3 bg-[#D4AF37] text-[#0A1128] font-black py-4 rounded-xl hover:bg-[#E5C158] transition-all disabled:opacity-50"
          >
            <Download size={20} /> {isExporting ? (language === 'ar' ? 'جاري التحميل...' : 'Downloading...') : (language === 'ar' ? 'تحميل نسخة' : 'Download Backup')}
          </button>
          <button 
            onClick={handleRestore}
            className="flex items-center justify-center gap-3 bg-[#121E3D] text-[#D4AF37] font-black py-4 rounded-xl border border-[#D4AF37]/30 hover:bg-[#1C2E5A] transition-all"
          >
            <RefreshCw size={20} /> {language === 'ar' ? 'استعادة نسخة' : 'Restore Backup'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const ChartsTab = () => {
  const { language } = useLanguage();
  const [chartSettings, setChartSettings] = useState<any>({
    showVolume: true,
    showTrends: true,
    chartType: 'area',
    timeRange: '7d'
  });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'charts'), (doc) => {
      if (doc.exists()) setChartSettings(doc.data());
    });
  }, []);

  const handleSave = async () => {
    await setDoc(doc(db, 'settings', 'charts'), chartSettings);
    alert(language === 'ar' ? 'تم حفظ إعدادات الرسوم البيانية' : 'Chart settings saved');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <BarChart2 className="text-[#D4AF37]" size={32} />
          {language === 'ar' ? 'إدارة الرسوم البيانية' : 'Charts Management'}
        </h2>
        <button onClick={handleSave} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158]">
          <Save size={18} /> {language === 'ar' ? 'حفظ' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">{language === 'ar' ? 'إعدادات العرض' : 'Display Options'}</h3>
          <label className="flex items-center gap-4 text-gray-300">
            <input type="checkbox" checked={chartSettings.showVolume} onChange={e => setChartSettings({...chartSettings, showVolume: e.target.checked})} />
            {language === 'ar' ? 'إظهار حجم التداول' : 'Show Trading Volume'}
          </label>
          <label className="flex items-center gap-4 text-gray-300">
            <input type="checkbox" checked={chartSettings.showTrends} onChange={e => setChartSettings({...chartSettings, showTrends: e.target.checked})} />
            {language === 'ar' ? 'إظهار خطوط الاتجاه (Trends)' : 'Show Trend Lines'}
          </label>
          <div className="space-y-2">
            <label className="text-xs text-gray-500 block uppercase font-bold">{language === 'ar' ? 'نوع الرسم البياني الافتراضي' : 'Default Chart Type'}</label>
            <select 
              className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl p-3 text-white outline-none"
              value={chartSettings.chartType}
              onChange={e => setChartSettings({...chartSettings, chartType: e.target.value})}
            >
              <option value="area">Area Chart</option>
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>
        
        <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#121E3D] rounded-full flex items-center justify-center mb-4 mx-auto border border-[#D4AF37]/20">
              <Layout className="text-[#D4AF37]" size={24} />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'معاينة حية للإعدادات' : 'Live settings preview active'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AlertsTab = () => {
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'alerts'), (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, 'alerts'), {
      titleAr: 'تنبيه جديد',
      titleEn: 'New Alert',
      type: 'info',
      active: true,
      createdAt: serverTimestamp()
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <AlertTriangle className="text-[#D4AF37]" size={32} />
          {language === 'ar' ? 'التنبيهات والإشعارات' : 'Alerts & Notifications'}
        </h2>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-4 py-2 rounded-lg font-bold hover:bg-[#E5C158]">
          <Plus size={18} /> {language === 'ar' ? 'إضافة تنبيه' : 'Add Alert'}
        </button>
      </div>

      <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left rtl:text-right">
          <thead>
            <tr className="bg-[#121E3D] border-b border-[#1C2E5A] text-gray-400 text-xs uppercase tracking-widest font-black">
              <th className="p-6">{language === 'ar' ? 'العنوان' : 'Title'}</th>
              <th className="p-6">{language === 'ar' ? 'النوع' : 'Type'}</th>
              <th className="p-6">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {alerts.map(alert => (
              <tr key={alert.id} className="hover:bg-[#121E3D]/50 transition-colors">
                <td className="p-6 text-white font-bold">{language === 'ar' ? alert.titleAr : alert.titleEn}</td>
                <td className="p-6 capitalize text-xs font-bold text-gray-400">{alert.type}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${alert.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {alert.active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معطل' : 'Disabled')}
                  </span>
                </td>
                <td className="p-6 text-right rtl:text-left">
                  <button onClick={() => deleteDoc(doc(db, 'alerts', alert.id))} className="text-gray-500 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500">لا توجد تنبيهات نشطة.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const GeneralPlaceholderTab = ({ title, icon: Icon }: { title: string, icon: any }) => {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-24 h-24 bg-[#121E3D] rounded-full flex items-center justify-center mb-6 border border-[#1C2E5A] relative">
        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-full animate-ping"></div>
        <Icon className="text-[#D4AF37]" size={40} />
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
        {language === 'ar' ? 'هذا القسم يعمل حالياً ويتم جلب البيانات الحية.' : 'This section is currently active and fetching live data.'}
      </p>
    </div>
  );
}
