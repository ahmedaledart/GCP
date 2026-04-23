import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, signInWithPopup, googleProvider } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { 
  Plus, Trash2, Save, ToggleLeft, ToggleRight, Shield, 
  LayoutDashboard, TrendingUp, Newspaper, Settings, 
  History, LogOut, ChevronRight, Globe, Image as ImageIcon,
  FileText, FileSpreadsheet, Users, Database, Download, Upload, RefreshCw,
  Bell, Search, Menu, X, MessageSquare, User, Zap, Mail, BarChart3, AlertCircle
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { generateWithRetry } from '../services/geminiService';

const safeFormatDate = (ts: any, type: 'date' | 'time' | 'both' = 'both') => {
  try {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    if (isNaN(d.getTime())) return '';
    if (type === 'both') return d.toLocaleString();
    if (type === 'date') return d.toLocaleDateString();
    return d.toLocaleTimeString();
  } catch {
    return '';
  }
};

// --- Types ---
interface NewsItem {
  id: string;
  text_ar: string;
  text_en: string;
  active: boolean;
  createdAt: any;
}

interface Commodity {
  id: string;
  symbol: string;
  nameAr: string;
  nameEn: string;
  category: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  currency?: string;
  lastUpdated: any;
}

interface Report {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  status: 'draft' | 'published';
  topic: string;
  author: string;
  publishedAt?: any;
  createdAt: any;
}

interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  addressAr: string;
  addressEn: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  adminPath: string;
  sectorApis: {
    commodities: string;
    metals: string;
    energy: string;
    agriculture: string;
  };
  isSiteActive?: boolean;
  geminiApiKey?: string;
}

type AdminTab = 'overview' | 'market' | 'news_ticker' | 'reports' | 'content' | 'settings' | 'logs' | 'messages' | 'admins';

export const Admin = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // --- State ---
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data State
  const [news, setNews] = useState<NewsItem[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const ADMIN_EMAIL = "ahmedhmeda67@gmail.com";

  // --- Auth Check ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        if (user.email === ADMIN_EMAIL && user.emailVerified) {
          setIsAdmin(true);
          setIsSuperAdmin(true);
          setAdminPermissions(['manage_news', 'manage_commodities', 'manage_settings', 'manage_messages']);
          setLoading(false);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.email));
            if (adminDoc.exists()) {
              setIsAdmin(true);
              setIsSuperAdmin(false);
              setAdminPermissions(adminDoc.data().permissions || []);
            } else {
              setIsAdmin(false);
              setIsSuperAdmin(false);
              setAdminPermissions([]);
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setAdminPermissions([]);
          }
          setLoading(false);
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminPermissions([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && !isSuperAdmin && adminPermissions && adminPermissions.length > 0) {
      if (!adminPermissions.includes('view_dashboard')) {
        const fallbackTabs: Record<string, AdminTab> = {
          'manage_commodities': 'market',
          'manage_news': 'news_ticker',
          'manage_content': 'content',
          'manage_settings': 'settings',
          'manage_messages': 'messages',
          'view_logs': 'logs'
        };
        for (const [perm, tab] of Object.entries(fallbackTabs)) {
          if (adminPermissions.includes(perm)) {
            setActiveTab(tab);
            break;
          }
        }
      }
    }
  }, [isAdmin, isSuperAdmin, adminPermissions]);

  // --- Data Fetching ---
  useEffect(() => {
    if (!isAdmin) return;

    // News Ticker
    const newsUnsubscribe = onSnapshot(
      query(collection(db, 'news_ticker'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'news_ticker')
    );

    // Commodities
    const commoditiesUnsubscribe = onSnapshot(
      collection(db, 'commodities'),
      (snapshot) => {
        const mapped = snapshot.docs.map(doc => {
          const docData = doc.data();
          let parsedCategory = docData.category || '';
          if (!parsedCategory && docData.sectorEn) {
            if (docData.sectorEn === 'Energy') parsedCategory = 'energy';
            if (docData.sectorEn === 'Metals') parsedCategory = 'metals';
            if (docData.sectorEn === 'Agriculture') parsedCategory = 'agriculture';
            if (docData.sectorEn === 'Indices') parsedCategory = 'currencies';
          }
          let sectorDisplay = docData.sectorAr || docData.category;
          if (parsedCategory === 'energy') sectorDisplay = 'طاقة';
          if (parsedCategory === 'metals') sectorDisplay = 'معادن';
          if (parsedCategory === 'agriculture') sectorDisplay = 'زراعة';
          if (parsedCategory === 'currencies') sectorDisplay = 'عملات';

          return { 
            id: doc.id, 
            ...docData, 
            category: parsedCategory,
            sectorDisplay,
            high: docData.high || docData.price || 0,
            low: docData.low || docData.price || 0,
            change: docData.change || 0,
            changePercent: docData.changePercent || 0,
            trend: docData.trend || (docData.change >= 0 ? 'up' : 'down')
          };
        }) as any[];
        
        // Sort items by sector then by symbol
        mapped.sort((a, b) => {
          if (a.sectorDisplay !== b.sectorDisplay) {
            return (a.sectorDisplay || '').localeCompare(b.sectorDisplay || '');
          }
          return (a.symbol || '').localeCompare(b.symbol || '');
        });

        setCommodities(mapped);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'commodities')
    );

    // Settings
    const settingsUnsubscribe = onSnapshot(
      doc(db, 'settings', 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as SiteSettings);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/global')
    );

    // Logs
    const logsUnsubscribe = onSnapshot(
      query(collection(db, 'logs'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'logs')
    );

    // Messages
    const messagesUnsubscribe = onSnapshot(
      query(collection(db, 'messages'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'messages')
    );

    // Admins
    const adminsUnsubscribe = onSnapshot(
      query(collection(db, 'admins'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setAdminsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'admins')
    );

    // Reports
    const reportsUnsubscribe = onSnapshot(
      query(collection(db, 'reports'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[]);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'reports')
    );

    // Stats
    const statsUnsubscribe = onSnapshot(
      doc(db, 'stats', 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          setStats(snapshot.data());
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'stats/global')
    );

    return () => {
      newsUnsubscribe();
      commoditiesUnsubscribe();
      settingsUnsubscribe();
      logsUnsubscribe();
      messagesUnsubscribe();
      statsUnsubscribe();
    };
  }, [isAdmin]);

  // --- Actions ---
  const logAction = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'logs'), {
        adminEmail: auth.currentUser?.email,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log action", e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const initializeStats = async () => {
    try {
      await setDoc(doc(db, 'stats', 'global'), {
        totalVisitors: 0,
        lastReset: serverTimestamp()
      });
      await logAction('تهيئة الإحصائيات', 'تم تهيئة عداد الزوار بنجاح');
      alert('تم تهيئة الإحصائيات بنجاح');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'stats/global');
    }
  };

  const resetStats = async () => {
    if (!window.confirm('هل أنت متأكد من إعادة تعيين عداد الزوار؟')) return;
    try {
      await updateDoc(doc(db, 'stats', 'global'), {
        totalVisitors: 0,
        lastReset: serverTimestamp()
      });
      await logAction('إعادة تعيين الإحصائيات', 'تم إعادة تعيين عداد الزوار');
      alert('تم إعادة تعيين العداد بنجاح');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'stats/global');
    }
  };

  const handleDownload = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => {
        if (val && typeof val === 'object' && val !== null && 'toDate' in val) {
          return `"${safeFormatDate(val)}"`;
        }
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Helpers ---
  const SidebarItem = ({ id, icon: Icon, label }: { id: AdminTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-[#D4AF37] text-[#0A1128] font-bold shadow-lg shadow-[#D4AF37]/20' 
          : 'text-gray-400 hover:bg-[#1C2E5A] hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className={`${!isSidebarOpen && 'hidden'} whitespace-nowrap`}>{label}</span>
      {activeTab === id && isSidebarOpen && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#050A18] flex items-center justify-center">
      <RefreshCw className="text-[#D4AF37] animate-spin" size={40} />
    </div>
  );
  
  if (!isAdmin) return (
    <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
      <div className="bg-[#121E3D] border border-[#1C2E5A] p-8 rounded-2xl max-w-md w-full text-center">
        <Shield className="text-[#D4AF37] mx-auto mb-6" size={64} />
        <h1 className="text-2xl font-bold text-white mb-4">لوحة الإدارة السرية</h1>
        <p className="text-gray-400 mb-8">يجب تسجيل الدخول باستخدام حساب المسؤول للوصول إلى هذه اللوحة.</p>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full bg-[#D4AF37] text-[#0A1128] font-bold py-3 rounded-xl hover:bg-[#B5952F] transition-all flex items-center justify-center gap-2"
        >
          <Globe size={20} /> تسجيل الدخول كمسؤول
        </button>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 text-gray-500 hover:text-white text-sm transition-colors"
        >
          العودة للموقع الرئيسي
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050A18] flex text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="bg-[#0A1128] border-l border-[#1C2E5A] flex flex-col z-50 sticky top-0 h-screen"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Shield className="text-[#D4AF37]" size={24} />
                <span className="text-white font-bold text-lg">لوحة الإدارة</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#1C2E5A] rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-grow px-3 space-y-2 overflow-y-auto">
          {(isSuperAdmin || adminPermissions?.includes('view_dashboard')) && <SidebarItem id="overview" icon={LayoutDashboard} label="نظرة عامة" />}
          {(isSuperAdmin || adminPermissions?.includes('manage_commodities')) && <SidebarItem id="market" icon={TrendingUp} label="بيانات السوق" />}
          {(isSuperAdmin || adminPermissions?.includes('manage_news')) && <SidebarItem id="news_ticker" icon={Bell} label="شريط الأخبار" />}
          {(isSuperAdmin || adminPermissions?.includes('manage_content')) && <SidebarItem id="reports" icon={FileSpreadsheet} label="إدارة التقارير الذكية" />}
          {(isSuperAdmin || adminPermissions?.includes('manage_content')) && <SidebarItem id="content" icon={FileText} label="المحتوى والصفحات" />}
          {(isSuperAdmin || adminPermissions?.includes('manage_settings')) && <SidebarItem id="settings" icon={Settings} label="الإعدادات العامة" />}
          {(isSuperAdmin || adminPermissions?.includes('manage_messages')) && <SidebarItem id="messages" icon={MessageSquare} label="الرسائل والطلبات" />}
          {isSuperAdmin && <SidebarItem id="admins" icon={Users} label="المدراء" />}
          {(isSuperAdmin || adminPermissions?.includes('view_logs')) && <SidebarItem id="logs" icon={History} label="سجل العمليات" />}
        </nav>

        <div className="p-4 border-t border-[#1C2E5A]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className={`${!isSidebarOpen && 'hidden'}`}>تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-8 bg-[#050A18]">
        <header className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-black text-white tracking-tight">
              {activeTab === 'overview' && 'لوحة التحكم الرئيسية'}
              {activeTab === 'market' && 'إدارة بيانات السوق'}
              {activeTab === 'news_ticker' && 'إدارة شريط الأخبار'}
              {activeTab === 'reports' && 'إدارة التقارير التحليلية'}
              {activeTab === 'content' && 'إدارة المحتوى'}
              {activeTab === 'settings' && 'إعدادات المنصة'}
              {activeTab === 'messages' && 'الرسائل والطلبات'}
              {activeTab === 'admins' && 'إدارة المدراء'}
              {activeTab === 'logs' && 'سجل النشاط'}
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-light">مرحباً بك في نظام الإدارة الشامل والمتكامل</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl px-5 py-3 flex items-center gap-4 shadow-xl">
              <div className="text-right">
                <div className="text-white text-sm font-bold">{auth.currentUser?.displayName || 'المسؤول'}</div>
                <div className="text-gray-500 text-xs">{auth.currentUser?.email}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B5952F] flex items-center justify-center text-[#0A1128] font-black text-xl shadow-lg shadow-[#D4AF37]/20">
                {auth.currentUser?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pb-20"
          >
            {activeTab === 'overview' && (
              <OverviewSection 
                newsCount={news.length} 
                commoditiesCount={commodities.length} 
                logs={logs} 
                stats={stats}
                messagesCount={messages.filter(m => !m.read).length}
                onInitializeStats={initializeStats}
                onResetStats={resetStats}
                setActiveTab={setActiveTab}
                isSuperAdmin={isSuperAdmin}
                adminPermissions={adminPermissions}
              />
            )}
            {activeTab === 'market' && <MarketSection commodities={commodities} logAction={logAction} onDownload={handleDownload} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} />}
            {activeTab === 'news_ticker' && <NewsTickerSection news={news} logAction={logAction} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} />}
            {activeTab === 'reports' && <ReportsManagementSection reports={reports} logAction={logAction} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} commodities={commodities} settings={settings} />}
            {activeTab === 'content' && <ContentSection logAction={logAction} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} />}
            {activeTab === 'settings' && <SettingsSection settings={settings} logAction={logAction} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} />}
            {activeTab === 'messages' && <MessagesSection messages={messages} logAction={logAction} onDownload={handleDownload} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} />}
            {activeTab === 'admins' && <AdminsSection adminsList={adminsList} logAction={logAction} currentUserEmail={auth.currentUser?.email} />}
            {activeTab === 'logs' && <LogsSection logs={logs} onDownload={handleDownload} isSuperAdmin={isSuperAdmin} adminPermissions={adminPermissions} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Sub-Sections ---

const ContentSection = ({ logAction }: any) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-[#D4AF37]" /> إدارة الأقسام والصفحات
        </h3>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-white">
            <span>إدارة الصفحة الرئيسية</span>
            <ChevronRight size={18} />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-white">
            <span>إدارة صفحة التقارير</span>
            <ChevronRight size={18} />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-white">
            <span>إضافة صفحة جديدة</span>
            <Plus size={18} className="text-[#D4AF37]" />
          </button>
        </div>
      </div>

      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon size={20} className="text-[#D4AF37]" /> الوسائط والبنرات
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-video bg-[#0A1128] border border-dashed border-[#1C2E5A] rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer transition-all">
            <Upload size={24} className="mb-2" />
            <span className="text-xs">رفع بنر جديد</span>
          </div>
          <div className="aspect-video bg-[#0A1128] border border-dashed border-[#1C2E5A] rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer transition-all">
            <Upload size={24} className="mb-2" />
            <span className="text-xs">تغيير الشعار</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewSection = ({ newsCount, commoditiesCount, logs, stats, messagesCount, onInitializeStats, onResetStats, setActiveTab, isSuperAdmin, adminPermissions }: any) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="إجمالي الزوار" value={stats?.totalVisitors || 0} icon={Users} color="purple" />
        <StatCard title="الرسائل الجديدة" value={messagesCount} icon={MessageSquare} color="red" />
        <StatCard title="إجمالي الأخبار" value={newsCount} icon={Newspaper} color="blue" />
        <StatCard title="السلع المراقبة" value={commoditiesCount} icon={TrendingUp} color="gold" />
        {(isSuperAdmin || adminPermissions?.includes('view_logs')) && (
          <StatCard title="عمليات اليوم" value={logs.filter((l: any) => {
            try {
               return l.timestamp?.toDate() && !isNaN(l.timestamp.toDate().getTime()) && new Date(l.timestamp.toDate()).toDateString() === new Date().toDateString();
            } catch(e) { return false; }
          }).length} icon={History} color="green" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Zap size={20} className="text-[#D4AF37]" /> إجراءات سريعة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(isSuperAdmin || adminPermissions?.includes('manage_news')) && (
                <button 
                  onClick={() => setActiveTab('news_ticker')}
                  className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
                >
                  <Plus size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span className="text-white text-xs font-bold">إضافة خبر</span>
                </button>
              )}
              {(isSuperAdmin || adminPermissions?.includes('manage_commodities')) && (
                <button 
                  onClick={() => setActiveTab('market')}
                  className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
                >
                  <TrendingUp size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span className="text-white text-xs font-bold">تحديث أسعار</span>
                </button>
              )}
              {(isSuperAdmin || adminPermissions?.includes('manage_messages')) && (
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
                >
                  <Mail size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span className="text-white text-xs font-bold">الرسائل</span>
                </button>
              )}
              {(isSuperAdmin || adminPermissions?.includes('manage_settings')) && (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
                >
                  <Settings size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span className="text-white text-xs font-bold">الإعدادات</span>
                </button>
              )}
            </div>
          </div>

          {(isSuperAdmin || adminPermissions?.includes('view_logs')) && (
            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">آخر النشاطات</h3>
              <div className="space-y-4">
                {logs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-[#1C2E5A]/30 rounded-xl border border-[#1C2E5A]">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                      <History size={20} />
                    </div>
                    <div className="flex-grow">
                      <div className="text-white font-medium">{log.action}</div>
                      <div className="text-gray-400 text-xs">{log.details}</div>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {safeFormatDate(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {!stats ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl">
              <h4 className="text-yellow-500 font-bold mb-2">الإحصائيات غير مفعلة</h4>
              <p className="text-yellow-500/70 text-sm mb-4">يجب تهيئة عداد الزوار للبدء في تتبع حركة الموقع.</p>
              <button 
                onClick={onInitializeStats}
                className="w-full bg-yellow-500 text-[#0A1128] px-4 py-3 rounded-xl font-black text-sm shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all"
              >
                تهيئة العداد الآن
              </button>
            </div>
          ) : (
            <div className="bg-[#121E3D] border border-[#1C2E5A] p-6 rounded-2xl">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-[#D4AF37]" /> إحصائيات الزوار
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#1C2E5A]/30 rounded-xl">
                  <span className="text-gray-400 text-sm">إجمالي الزيارات</span>
                  <span className="text-white font-bold">{stats.totalVisitors}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#1C2E5A]/30 rounded-xl">
                  <span className="text-gray-400 text-sm">آخر تصفير</span>
                  <span className="text-gray-500 text-[10px]">{safeFormatDate(stats.lastReset, 'date')}</span>
                </div>
                <button 
                  onClick={onResetStats}
                  className="w-full mt-4 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all"
                >
                  إعادة تعيين العداد
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield size={20} className="text-[#D4AF37]" /> حالة النظام
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-400">قاعدة البيانات:</span>
                <span className="text-green-500 font-bold">متصل</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-400">المصادقة:</span>
                <span className="text-green-500 font-bold">مفعلة</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-400">تتبع الزوار:</span>
                <span className="text-green-500 font-bold">نشط</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    gold: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20'
  };
  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} flex items-center justify-between`}>
      <div>
        <div className="text-sm opacity-70 mb-1">{title}</div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
      <div className="p-4 rounded-xl bg-white/5">
        <Icon size={32} />
      </div>
    </div>
  );
};

const MarketSection = ({ commodities, logAction, onDownload, isSuperAdmin, adminPermissions }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSector, setImportSector] = useState('energy');
  const [importCurrency, setImportCurrency] = useState('USD');

  const canEdit = isSuperAdmin || adminPermissions?.includes('manage_commodities');
  const canAddDelete = isSuperAdmin || adminPermissions?.includes('add_delete_commodities');
  const canImport = isSuperAdmin || adminPermissions?.includes('import_csv');
  const canExport = isSuperAdmin || adminPermissions?.includes('export_data');

  // Helper to normalize and unify Arabic/English text for robust search and IDs
  const normalizeForSearch = (text: string) => {
    if (!text) return '';
    return text
      .trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, '') // Remove all mapping spaces for strict ID matching
      .toLowerCase();
  };

  // Helper to generate a unique deterministic ID from symbol or name
  const getCommodityId = (item: any) => {
    const symbol = normalizeForSearch(item.symbol || '');
    const nameAr = normalizeForSearch(item.nameAr || '');
    if (symbol) return `comm_${symbol}`;
    return `comm_${nameAr}`;
  };

  // Helper to update history array
  const getUpdatedHistory = (existingHistory: any[], newPrice: number) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newPoint = { time: timeStr, price: newPrice };
    
    if (!existingHistory || existingHistory.length === 0) {
      return Array(12).fill(newPoint);
    }
    
    const updated = [...existingHistory, newPoint].slice(-24);
    return updated;
  };

  // Function to find all duplicates and merge into one master record
  const consolidateDuplicates = async (searchSymbol: string, searchNameAr: string, freshData: any) => {
    const normSymbol = normalizeForSearch(searchSymbol);
    const normNameAr = normalizeForSearch(searchNameAr);

    // Find ALL matches across the collection
    const matches = commodities.filter((c: any) => {
      const cSymbol = normalizeForSearch(c.symbol);
      const cNameAr = normalizeForSearch(c.nameAr);
      return (normSymbol && cSymbol === normSymbol) || (normNameAr && cNameAr === normNameAr);
    });

    const deterministicId = getCommodityId(freshData);
    const masterDocRef = doc(db, 'commodities', deterministicId);

    // Filter matches to find existing Master or Slave records
    const slaves = matches.filter((m: any) => m.id !== deterministicId);
    
    // 1. Delete all slaves (Random IDs or old IDs)
    for (const slave of slaves) {
      try {
        await deleteDoc(doc(db, 'commodities', slave.id));
        console.log(`Deleted duplicate commodity record: ${slave.id}`);
      } catch (e) {
        console.error(`Failed to delete slave ${slave.id}`, e);
      }
    }

    // 2. Upsert the data into the Master record
    await setDoc(masterDocRef, freshData, { merge: true });
    return deterministicId;
  };

  const handleEdit = (item: any) => {
    if (!canEdit) return;
    setEditingId(item.id);
    setFormData(item);
  };

  const handleSave = async () => {
    if (!editingId || !canEdit) return;
    try {
      const existing = commodities.find((c: any) => c.id === editingId);
      const oldPrice = existing?.price || formData.price;
      const newPrice = Number(formData.price);
      const change = Number((newPrice - oldPrice).toFixed(2));
      const changePercent = oldPrice > 0 ? Number(((change / oldPrice) * 100).toFixed(2)) : 0;

      const updatedData = {
        ...formData,
        price: newPrice,
        prevClose: oldPrice,
        change,
        changeAmount: change,
        changePercent,
        high: Math.max(existing?.high || newPrice, newPrice),
        low: Math.min(existing?.low || newPrice, newPrice),
        trend: change >= 0 ? 'up' : 'down',
        history: getUpdatedHistory(existing?.history || [], newPrice),
        lastUpdated: serverTimestamp()
      };

      await updateDoc(doc(db, 'commodities', editingId), updatedData);
      await logAction('تعديل سلعة', `تم تعديل بيانات ${formData.nameAr} وحساب الفوارق تلقائياً`);
      setEditingId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `commodities/${editingId}`);
    }
  };

  const handleImportCSV = (e: any) => {
    if (!canImport) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const text = event.target.result;
      const rows = text.split('\n').filter((r:string) => r.trim()).slice(1);
      let processedCount = 0;
      
      for (const row of rows) {
        const parts = row.split(',');
        if (parts.length >= 6) {
          const [symbolRaw, nameArRaw, nameEnRaw, categoryRaw, priceRaw, unitRaw] = parts;
          const symbolInput = symbolRaw.trim();
          const nameArInput = nameArRaw.trim();
          const nameEnInput = nameEnRaw.trim();
          const priceInput = parseFloat(priceRaw) || 0;
          const unitInput = unitRaw.trim();
          const categoryInput = categoryRaw.trim() || importSector;

          // Aggressive matching: Symbol or Arabic Name
          const existing = commodities.find((c: any) => 
            (c.symbol && normalizeForSearch(c.symbol) === normalizeForSearch(symbolInput)) || 
            (c.nameAr && normalizeForSearch(c.nameAr) === normalizeForSearch(nameArInput))
          );
          
          const oldPrice = existing?.price || priceInput;
          const change = Number((priceInput - oldPrice).toFixed(2));
          const changePercent = oldPrice > 0 ? Number(((change / oldPrice) * 100).toFixed(2)) : 0;
          
          const commodityData: any = {
            symbol: symbolInput,
            nameAr: nameArInput,
            nameEn: nameEnInput,
            category: categoryInput,
            price: priceInput,
            prevClose: oldPrice,
            change,
            changeAmount: change,
            changePercent,
            high: Math.max(existing?.high || priceInput, priceInput),
            low: Math.min(existing?.low || priceInput, priceInput),
            trend: change >= 0 ? 'up' : 'down',
            unit: unitInput,
            currency: importCurrency,
            history: getUpdatedHistory(existing?.history || [], priceInput),
            lastUpdated: serverTimestamp()
          };

          try {
            await consolidateDuplicates(symbolInput, nameArInput, commodityData);
            processedCount++;
          } catch (err) {
            console.error("Import error", err);
          }
        }
      }
      await logAction('دمج واستيراد بيانات', `تم تنقية ودمج ${processedCount} سلع من ملف CSV`);
      alert(`تم بنجاح تنقية الأسماء ودمج ${processedCount} سلعة!`);
      setShowImportModal(false);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDelete = async (id: string) => {
    if (!canAddDelete) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه السلعة؟')) return;
    try {
      await deleteDoc(doc(db, 'commodities', id));
      await logAction('حذف سلعة', `تم حذف السلعة: ${id}`);
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `commodities/${id}`);
    }
  };

  const handleDeleteSelected = async () => {
    if (!canAddDelete) return;
    if (selectedIds.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} عنصر/عناصر؟`)) return;
    
    try {
      for (const id of selectedIds) {
         await deleteDoc(doc(db, 'commodities', id));
      }
      await logAction('حذف سلع متعددة', `تم حذف ${selectedIds.length} سلع`);
      setSelectedIds([]);
    } catch(e) {
      handleFirestoreError(e, OperationType.DELETE, `commodities_bulk`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === commodities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(commodities.map((c: any) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newCommodity, setNewCommodity] = useState({
    symbol: '', nameAr: '', nameEn: '', category: 'energy', price: 0, unit: '', currency: 'USD'
  });

  const handleAddCommodity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddDelete) return;
    try {
      const searchSymbol = newCommodity.symbol.trim();
      const searchNameAr = newCommodity.nameAr.trim();

      const existing = commodities.find((c: any) => 
        (c.symbol && normalizeForSearch(c.symbol) === normalizeForSearch(searchSymbol)) || 
        (c.nameAr && normalizeForSearch(c.nameAr) === normalizeForSearch(searchNameAr))
      );
      
      const oldPrice = existing?.price || newCommodity.price;
      const price = Number(newCommodity.price);
      const change = Number((price - oldPrice).toFixed(2));
      const changePercent = oldPrice > 0 ? Number(((change / oldPrice) * 100).toFixed(2)) : 0;
      
      const commodityData = {
        symbol: newCommodity.symbol.trim(),
        nameAr: newCommodity.nameAr.trim(),
        nameEn: newCommodity.nameEn.trim(),
        category: newCommodity.category,
        currency: newCommodity.currency,
        unit: newCommodity.unit.trim(),
        price,
        prevClose: oldPrice,
        change,
        changeAmount: change,
        changePercent,
        high: Math.max(existing?.high || price, price),
        low: Math.min(existing?.low || price, price),
        trend: change >= 0 ? 'up' : 'down',
        history: getUpdatedHistory(existing?.history || [], price),
        lastUpdated: serverTimestamp()
      };

      await consolidateDuplicates(searchSymbol, searchNameAr, commodityData);
      
      if (existing) {
        await logAction('تحديث سلعة', `تم دمج وتحديث السلعة: ${newCommodity.nameAr}`);
      } else {
        await logAction('إضافة سلعة', `تم إضافة سلعة جديدة مشفرة: ${newCommodity.nameAr}`);
      }
      
      setIsAdding(false);
      setNewCommodity({ symbol: '', nameAr: '', nameEn: '', category: 'energy', price: 0, unit: '', currency: 'USD' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'commodities');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#121E3D] p-4 rounded-xl border border-[#1C2E5A] flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-white">إدارة الأسعار والسلع (العدد: {commodities.length})</h3>
          {selectedIds.length > 0 && (
            <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full text-sm">
              محدد: {selectedIds.length}
            </span>
          )}
        </div>
        <div className="flex gap-4 flex-wrap">
          {(selectedIds.length > 0 && canAddDelete) && (
            <button 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold border border-red-500/20"
            >
              <Trash2 size={18} /> حذف المحدد
            </button>
          )}
          {canAddDelete && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0A1128] rounded-lg hover:bg-[#B5952F] transition-all font-bold"
            >
              <Plus size={18} /> إضافة سلعة يدوياً
            </button>
          )}
          {canExport && (
            <button 
              onClick={() => onDownload(commodities, 'market_data')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all border border-[#2A4075]"
            >
              <Download size={18} className="text-[#D4AF37]" /> تنزيل البيانات
            </button>
          )}
          {canImport && (
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all cursor-pointer border border-[#2A4075]"
            >
              <Upload size={18} className="text-[#D4AF37]" /> استيراد CSV
            </button>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 shadow-xl max-w-md w-full relative">
            <button 
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h4 className="text-white font-bold mb-4 text-lg border-b border-[#1C2E5A] pb-3">استيراد بيانات من CSV</h4>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">اختر قطاع السلع المراد إضافتها:</label>
                <select 
                  value={importSector} 
                  onChange={e => setImportSector(e.target.value)} 
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="energy">الطاقة</option>
                  <option value="metals">المعادن</option>
                  <option value="agriculture">السلع الزراعية</option>
                  <option value="currencies">العملات / المؤشرات</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">اختر عملة التسعير بالملف:</label>
                <select 
                  value={importCurrency} 
                  onChange={e => setImportCurrency(e.target.value)} 
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                  <option value="LYD">دينار ليبي (LYD)</option>
                </select>
              </div>
              <div className="bg-[#0A1128] border border-dashed border-[#1C2E5A] rounded-xl p-8 text-center relative hover:border-[#D4AF37] transition-colors group">
                <Upload size={32} className="mx-auto text-gray-500 group-hover:text-[#D4AF37] mb-2 transition-colors" />
                <div className="text-gray-400 text-sm">اضغط هنا لاختيار ملف CSV</div>
                <input type="file" accept=".csv" onChange={handleImportCSV} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400">
              ملاحظة: تأكد أن ترتيب الأعمدة في ملفك هو: (الرمز، الاسم عربي، الاسم إنجليزي، فئة، السعر، الوحدة)
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 shadow-xl mb-6">
          <h4 className="text-white font-bold mb-4">إضافة سلعة جديدة</h4>
          <form onSubmit={handleAddCommodity} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="الرمز (مثال: BRENT)" value={newCommodity.symbol} onChange={e => setNewCommodity({...newCommodity, symbol: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white" required />
            <input type="text" placeholder="الاسم بالعربي" value={newCommodity.nameAr} onChange={e => setNewCommodity({...newCommodity, nameAr: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white" required />
            <input type="text" placeholder="الاسم بالإنجليزي" value={newCommodity.nameEn} onChange={e => setNewCommodity({...newCommodity, nameEn: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white" required />
            <select value={newCommodity.category} onChange={e => setNewCommodity({...newCommodity, category: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white">
              <option value="energy">طاقة</option>
              <option value="metals">معادن</option>
              <option value="agriculture">زراعة</option>
              <option value="currencies">عملات</option>
            </select>
            <div className="flex gap-2">
              <input type="number" step="0.01" placeholder="السعر" value={newCommodity.price || ''} onChange={e => setNewCommodity({...newCommodity, price: parseFloat(e.target.value)})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white w-2/3" required />
              <select value={newCommodity.currency} onChange={e => setNewCommodity({...newCommodity, currency: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-2 py-2 text-white w-1/3">
                <option value="USD">دولار</option>
                <option value="EUR">يورو</option>
                <option value="LYD">دينار</option>
              </select>
            </div>
            <input type="text" placeholder="الوحدة (مثل: برميل، أونصة)" value={newCommodity.unit} onChange={e => setNewCommodity({...newCommodity, unit: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white" />
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 rounded-xl text-gray-400 hover:bg-gray-800 transition-colors">إلغاء</button>
              <button type="submit" className="px-6 py-2 bg-[#D4AF37] text-[#0A1128] font-bold rounded-xl hover:bg-[#B5952F] transition-colors">حفظ السلعة</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#1C2E5A] text-gray-300 text-sm">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === commodities.length && commodities.length > 0} 
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#1C2E5A] text-[#D4AF37] focus:ring-[#D4AF37] bg-[#0A1128]"
                />
              </th>
              <th className="px-6 py-4">الرمز</th>
              <th className="px-6 py-4">الاسم (عربي)</th>
              <th className="px-6 py-4">القطاع</th>
              <th className="px-6 py-4">السعر</th>
              <th className="px-6 py-4">الفارق العددي</th>
              <th className="px-6 py-4">الفجوة (%)</th>
              <th className="px-6 py-4">أعلى سعر</th>
              <th className="px-6 py-4">أدنى سعر</th>
              <th className="px-6 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {commodities.map((item: any) => (
              <tr key={item.id} className="hover:bg-[#1C2E5A]/30 transition-colors">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)} 
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 rounded border-[#1C2E5A] text-[#D4AF37] focus:ring-[#D4AF37] bg-[#0A1128]"
                  />
                </td>
                {editingId === item.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input type="text" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="text" value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white">
                        <option value="energy">طاقة</option>
                        <option value="metals">معادن</option>
                        <option value="agriculture">زراعة</option>
                        <option value="currencies">عملات</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-16 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                      <select value={formData.currency || 'USD'} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-16 bg-[#0A1128] border border-[#1C2E5A] rounded px-1 py-1 text-white text-xs">
                        <option value="USD">دولار</option>
                        <option value="EUR">يورو</option>
                        <option value="LYD">دينار</option>
                      </select>
                      <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-16 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" placeholder="الوحدة" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={formData.change} onChange={e => setFormData({...formData, change: parseFloat(e.target.value)})} className="w-20 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={formData.changePercent} onChange={e => setFormData({...formData, changePercent: parseFloat(e.target.value)})} className="w-20 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={formData.high} onChange={e => setFormData({...formData, high: parseFloat(e.target.value)})} className="w-20 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={formData.low} onChange={e => setFormData({...formData, low: parseFloat(e.target.value)})} className="w-20 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={handleSave} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-lg">
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-white font-mono">{item.symbol}</td>
                    <td className="px-6 py-4 text-white">{item.nameAr}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {item.sectorDisplay}
                    </td>
                    <td className="px-6 py-4 text-white font-bold">
                      {item.price} {item.currency === 'LYD' ? 'دينار' : item.currency === 'EUR' ? 'يورو' : item.currency === 'USD' ? 'دولار' : (item.currency || 'دولار')} / {item.unit}
                    </td>
                    <td className={`px-6 py-4 font-bold font-mono ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.changePercent >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {item.changePercent >= 0 ? '↑' : '↓'} {Math.abs(item.changePercent)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{item.high || item.price}</td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{item.low || item.price}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                            <Settings size={18} />
                          </button>
                        )}
                        {canAddDelete && (
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {commodities.length === 0 && (
              <tr>
                <td colSpan={10} className="p-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={48} className="text-gray-600 mb-2 opacity-50" />
                    <p className="text-lg">لا توجد سلع مضافة حالياً</p>
                    <p className="text-sm opacity-70">قم بإضافة سلع يدوياً أو استيراد ملف CSV</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsManagementSection = ({ reports, logAction, commodities, settings }: any) => {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    titleAr: '', titleEn: '', contentAr: '', contentEn: '', topic: 'global_market', status: 'draft'
  });

  const topics = [
    { id: 'global_market', ar: 'نظرة عامة على السوق العالمي', en: 'Global Market Overview' },
    { id: 'energy', ar: 'تحليل سوق الطاقة', en: 'Energy Market Analysis' },
    { id: 'metals', ar: 'توقعات المعادن الثمينة', en: 'Precious Metals Forecast' },
    { id: 'agriculture', ar: 'تقرير السلع الزراعية', en: 'Agricultural Commodities Report' },
  ];

  const handleGenerateAI = async (lang: 'ar' | 'en') => {
    setLoading(true);
    try {
      const apiKey = settings?.geminiApiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      
      if (!apiKey) {
        throw new Error('مفتاح API غير متوفر. يرجى إدخال مفتاحك في تبويب الإعدادات أولاً.');
      }

      const marketSummary = commodities.map((item: any) => 
        `${item.nameEn} (${item.symbol}): Price ${item.price} ${item.currency}, Change ${item.change} (${item.changePercent}%), High: ${item.high || item.price}, Low: ${item.low || item.price}`
      ).join('\n');

      const selectedTopic = topics.find(t => t.id === formData.topic);
      const topicName = lang === 'ar' ? selectedTopic?.ar : selectedTopic?.en;

      const prompt = lang === 'ar'
        ? `بصفتك خبيراً اقتصادياً، اكتب تقرير تحليلي مفصل ومحترف باللغة العربية حول "${topicName}" بناءً على بيانات السوق الحالية:\n\n${marketSummary}\n\nاستخدم Markdown.`
        : `As an economic expert, write a detailed and professional analytical report in English about "${topicName}" based on the following current market data:\n\n${marketSummary}\n\nUse Markdown.`;

      const text = await generateWithRetry(apiKey, prompt);
      
      if (lang === 'ar') {
        setFormData((prev: any) => ({ ...prev, contentAr: text, titleAr: `تقرير: ${topicName}` }));
      } else {
        setFormData((prev: any) => ({ ...prev, contentEn: text, titleEn: `Report: ${topicName}` }));
      }
    } catch (e: any) {
      console.error('AI Generation Error:', e);
      alert(`فشل التوليد: ${e.message}\n\nنصيحة: تأكد من مفتاح API في الإعدادات.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'reports', editingId), {
          ...formData,
          publishedAt: formData.status === 'published' ? serverTimestamp() : null
        });
        await logAction('تعديل تقرير', `تم تعديل تقرير: ${formData.titleAr}`);
      } else {
        await addDoc(collection(db, 'reports'), {
          ...formData,
          author: auth.currentUser?.email,
          createdAt: serverTimestamp(),
          publishedAt: formData.status === 'published' ? serverTimestamp() : null
        });
        await logAction('إنشاء تقرير', `تم إنشاء تقرير جديد: ${formData.titleAr}`);
      }
      setEditingId(null);
      setFormData({ titleAr: '', titleEn: '', contentAr: '', contentEn: '', topic: 'global_market', status: 'draft' });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'reports');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      await logAction('حذف تقرير', `تم حذف تقرير: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `reports/${id}`);
    }
  };

  const handleEdit = (report: any) => {
    setEditingId(report.id);
    setFormData(report);
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
          <FileText className="text-[#D4AF37]" size={24} /> {editingId ? 'تعديل التقرير' : 'إنشاء تقرير جديد'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">اسم التقرير (عربي)</label>
            <input 
              type="text" 
              value={formData.titleAr} 
              onChange={e => setFormData({...formData, titleAr: e.target.value})} 
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">اسم التقرير (إنجليزي)</label>
            <input 
              type="text" 
              value={formData.titleEn} 
              onChange={e => setFormData({...formData, titleEn: e.target.value})} 
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">القسم / الموضوع</label>
            <select 
              value={formData.topic} 
              onChange={e => setFormData({...formData, topic: e.target.value})} 
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
            >
              {topics.map(t => <option key={t.id} value={t.id}>{t.ar}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">الحالة</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})} 
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
            >
              <option value="draft">مسودة (حفظ فقط)</option>
              <option value="published">نشر (سيظهر للمستخدمين)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">محتوى التقرير (عربي - Markdown)</label>
              <button 
                onClick={() => handleGenerateAI('ar')}
                disabled={loading}
                className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50"
              >
                <Zap size={12} /> {loading ? 'جاري التوليد...' : 'توليد بالذكاء الاصطناعي'}
              </button>
            </div>
            <textarea 
              rows={10} 
              value={formData.contentAr} 
              onChange={e => setFormData({...formData, contentAr: e.target.value})} 
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white focus:border-[#D4AF37] outline-none font-mono text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">محتوى التقرير (إنجليزي - Markdown)</label>
              <button 
                onClick={() => handleGenerateAI('en')}
                disabled={loading}
                className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50"
              >
                <Zap size={12} /> {loading ? 'جاري التوليد...' : 'توليد بالذكاء الاصطناعي'}
              </button>
            </div>
            <textarea 
              rows={10} 
              value={formData.contentEn} 
              onChange={e => setFormData({...formData, contentEn: e.target.value})} 
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white focus:border-[#D4AF37] outline-none font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-[#D4AF37] text-[#0A1128] font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#B5952F] transition-all"
        >
          <Save size={20} /> {editingId ? 'تحديث التقرير' : 'حفظ التقرير الجديد'}
        </button>
      </div>

      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl overflow-hidden shadow-2xl">
        <h4 className="p-6 text-white font-bold border-b border-[#1C2E5A]">التقارير السابقة</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-[#1C2E5A] text-gray-300 text-sm">
              <tr>
                <th className="px-6 py-4">اسم التقرير</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">تاريخ النشر</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2E5A]">
              {reports.map((report: Report) => (
                <tr key={report.id} className="hover:bg-[#1C2E5A]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-white font-bold">{report.titleAr}</div>
                    <div className="text-gray-500 text-xs">{report.titleEn}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {topics.find(t => t.id === report.topic)?.ar}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {report.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {report.publishedAt ? safeFormatDate(report.publishedAt) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(report)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                        <Settings size={18} />
                      </button>
                      <button onClick={() => handleDelete(report.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NewsTickerSection = ({ news, logAction }: any) => {
  const [newNews, setNewNews] = useState({ text_ar: '', text_en: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ text_ar: '', text_en: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.text_ar || !newNews.text_en) return;
    try {
      await addDoc(collection(db, 'news_ticker'), {
        ...newNews,
        active: true,
        createdAt: serverTimestamp()
      });
      await logAction('إضافة خبر', `تم إضافة خبر جديد: ${newNews.text_ar}`);
      setNewNews({ text_ar: '', text_en: '' });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'news_ticker');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditFormData({ text_ar: item.text_ar, text_en: item.text_en });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'news_ticker', editingId), {
        text_ar: editFormData.text_ar,
        text_en: editFormData.text_en
      });
      await logAction('تعديل خبر', `تم تعديل الخبر: ${editFormData.text_ar}`);
      setEditingId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `news_ticker/${editingId}`);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'news_ticker', id), { active: !current });
      await logAction('تغيير حالة خبر', `تم تغيير حالة الخبر ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `news_ticker/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
      await deleteDoc(doc(db, 'news_ticker', id));
      await logAction('حذف خبر', 'تم حذف خبر من شريط الأخبار');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `news_ticker/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
          <Plus className="text-[#D4AF37]" size={24} /> إضافة خبر جديد للشريط
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">الخبر باللغة العربية</label>
            <input
              type="text"
              value={newNews.text_ar}
              onChange={(e) => setNewNews({ ...newNews, text_ar: e.target.value })}
              placeholder="اكتب الخبر هنا..."
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white focus:border-[#D4AF37] outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">الخبر باللغة الإنجليزية</label>
            <input
              type="text"
              value={newNews.text_en}
              onChange={(e) => setNewNews({ ...newNews, text_en: e.target.value })}
              placeholder="News in English..."
              className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white focus:border-[#D4AF37] outline-none transition-all"
            />
          </div>
          <button type="submit" className="md:col-span-2 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] text-[#0A1128] font-black py-4 rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all transform hover:-translate-y-1 active:scale-95">
            حفظ ونشر الخبر فوراً
          </button>
        </form>
      </div>

      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-right">
          <thead className="bg-[#1C2E5A] text-gray-300 text-sm">
            <tr>
              <th className="px-8 py-5">الخبر المنشور</th>
              <th className="px-8 py-5 text-center">الحالة</th>
              <th className="px-8 py-5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {news.map((item: any) => (
              <tr key={item.id} className="hover:bg-[#1C2E5A]/30 transition-colors group">
                {editingId === item.id ? (
                  <>
                    <td className="px-8 py-5">
                      <input type="text" value={editFormData.text_ar} onChange={e => setEditFormData({...editFormData, text_ar: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-4 py-2 text-white mb-2" placeholder="عربي" />
                      <input type="text" value={editFormData.text_en} onChange={e => setEditFormData({...editFormData, text_en: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-4 py-2 text-white" placeholder="English" />
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-gray-500 text-xs">قيد التعديل</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={handleSaveEdit} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg">
                          <Save size={20} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-lg">
                          <X size={20} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-8 py-5">
                      <div className="text-white font-bold mb-1">{item.text_ar}</div>
                      <div className="text-gray-500 text-xs font-light">{item.text_en}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => toggleActive(item.id, item.active)}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${item.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                      >
                        {item.active ? 'نشط الآن' : 'متوقف'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all">
                          <Settings size={20} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SettingsSection = ({ settings, logAction }: any) => {
  const [formData, setFormData] = useState<any>(settings || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), formData);
      await logAction('تحديث الإعدادات', 'تم تحديث إعدادات المنصة العامة بالكامل');
      alert('تم حفظ كافة التغييرات بنجاح');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/global');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <h4 className="text-[#D4AF37] font-black text-lg flex items-center gap-3 border-b border-[#1C2E5A] pb-4">
              <Globe size={22} /> الهوية واللغات
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">اسم المنصة (عربي)</label>
                <input 
                  type="text" 
                  value={formData.siteNameAr || ''} 
                  onChange={e => setFormData({...formData, siteNameAr: e.target.value})}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">اسم المنصة (إنجليزي)</label>
                <input 
                  type="text" 
                  value={formData.siteNameEn || ''} 
                  onChange={e => setFormData({...formData, siteNameEn: e.target.value})}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">وصف المنصة (عربي)</label>
                <textarea 
                  rows={3}
                  value={formData.descriptionAr || ''} 
                  onChange={e => setFormData({...formData, descriptionAr: e.target.value})}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">وصف المنصة (إنجليزي)</label>
                <textarea 
                  rows={3}
                  value={formData.descriptionEn || ''} 
                  onChange={e => setFormData({...formData, descriptionEn: e.target.value})}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[#D4AF37] font-black text-lg flex items-center gap-3 border-b border-[#1C2E5A] pb-4">
              <Shield size={22} /> الأمان والروابط
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37]/50 transition-all">
                <div>
                  <h5 className="text-white font-bold mb-1">حالة المنصة (تشغيل / إيقاف)</h5>
                  <p className="text-xs text-gray-400">عند الإيقاف سيتم عرض صفحة "تحت الصيانة" للزوار</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const currentState = formData.isSiteActive !== false; // defaults to true if undefined
                    setFormData({...formData, isSiteActive: !currentState});
                  }}
                  className={`text-3xl transition-colors ${formData.isSiteActive !== false ? 'text-[#D4AF37]' : 'text-gray-500'}`}
                >
                  {formData.isSiteActive !== false ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm text-gray-400 font-medium">رابط لوحة التحكم السري</label>
                <input 
                  type="text" 
                  value={formData.adminPath || '/admin-portal-secret-access-2024'} 
                  onChange={e => setFormData({...formData, adminPath: e.target.value})}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all"
                />
                <p className="text-xs text-gray-500 font-light">يجب أن يبدأ الرابط بـ / (مثال: /my-secret-admin)</p>
              </div>
              
              <div className="space-y-2 pt-4">
                <label className="text-sm text-gray-400 font-medium">رابط الشعار (Logo URL)</label>
                <input 
                  type="text" 
                  value={formData.logoUrl || ''} 
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm text-gray-400 font-medium">Gemini AI API Key (مفتاح الذكاء الاصطناعي)</label>
                <div className="relative group/key">
                  <input 
                    type="password" 
                    value={formData.geminiApiKey || ''} 
                    onChange={e => setFormData({...formData, geminiApiKey: e.target.value})}
                    placeholder="أدخل مفتاح خاص بك هنا..."
                    className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-4 text-white outline-none focus:border-[#D4AF37] transition-all group-hover/key:border-[#D4AF37]/50"
                  />
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover/key:text-[#D4AF37] transition-colors" size={18} />
                </div>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                  <span>يمكنك الحصول على مفتاح مجاني من: </span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">Google AI Studio</a>
                </p>
              </div>
            </div>

            <h4 className="text-[#D4AF37] font-black text-lg flex items-center gap-3 border-b border-[#1C2E5A] pb-4 pt-4">
              <TrendingUp size={22} /> التواصل الاجتماعي
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Facebook"
                value={formData.socialLinks?.facebook || ''} 
                onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, facebook: e.target.value}})}
                className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all"
              />
              <input 
                placeholder="Twitter"
                value={formData.socialLinks?.twitter || ''} 
                onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, twitter: e.target.value}})}
                className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <h4 className="text-[#D4AF37] font-black text-lg flex items-center gap-3 border-b border-[#1C2E5A] pb-4 pt-4">
              <Database size={22} /> روابط API للقطاعات
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">قطاع السلع</label>
                  <input 
                    placeholder="Commodities API"
                    value={formData.sectorApis?.commodities || ''} 
                    onChange={e => setFormData({...formData, sectorApis: {...formData.sectorApis, commodities: e.target.value}})}
                    className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">قطاع المعادن</label>
                  <input 
                    placeholder="Metals API"
                    value={formData.sectorApis?.metals || ''} 
                    onChange={e => setFormData({...formData, sectorApis: {...formData.sectorApis, metals: e.target.value}})}
                    className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">قطاع الطاقة</label>
                  <input 
                    placeholder="Energy API"
                    value={formData.sectorApis?.energy || ''} 
                    onChange={e => setFormData({...formData, sectorApis: {...formData.sectorApis, energy: e.target.value}})}
                    className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">قطاع الزراعة</label>
                  <input 
                    placeholder="Agriculture API"
                    value={formData.sectorApis?.agriculture || ''} 
                    onChange={e => setFormData({...formData, sectorApis: {...formData.sectorApis, agriculture: e.target.value}})}
                    className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full bg-gradient-to-r from-[#D4AF37] to-[#B5952F] text-[#0A1128] font-black py-5 rounded-2xl shadow-2xl shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-3 text-lg transform hover:-translate-y-1 active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} />}
          {isSaving ? 'جاري الحفظ...' : 'حفظ ونشر كافة التغييرات على الموقع'}
        </button>
      </div>
    </div>
  );
};

const LogsSection = ({ logs, onDownload, isSuperAdmin, adminPermissions }: any) => {
  const canExport = isSuperAdmin || adminPermissions?.includes('export_data');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">سجل العمليات الأخير</h3>
        {canExport && (
          <button 
            onClick={() => onDownload(logs, 'activity_logs')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all border border-[#2A4075]"
          >
            <Download size={18} className="text-[#D4AF37]" /> تنزيل السجل (CSV)
          </button>
        )}
      </div>
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-right">
          <thead className="bg-[#1C2E5A] text-gray-300 text-sm">
            <tr>
              <th className="px-6 py-4">المسؤول</th>
              <th className="px-6 py-4">العملية</th>
              <th className="px-6 py-4">التفاصيل</th>
              <th className="px-6 py-4">الوقت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-[#1C2E5A]/30 transition-colors">
                <td className="px-6 py-4 text-white text-sm">{log.adminEmail}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{log.details}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {safeFormatDate(log.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MessagesSection = ({ messages, logAction, onDownload, isSuperAdmin, adminPermissions }: any) => {
  const canExport = isSuperAdmin || adminPermissions?.includes('export_data');

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      await logAction('حذف رسالة', 'تم حذف رسالة من صندوق الوارد');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `messages/${id}`);
    }
  };

  const toggleRead = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: !current });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `messages/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">صندوق الوارد (الرسائل والطلبات)</h3>
        {canExport && (
          <button 
            onClick={() => onDownload(messages, 'user_messages')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all border border-[#2A4075]"
          >
            <Download size={18} className="text-[#D4AF37]" /> تنزيل الرسائل (CSV)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {messages.length === 0 ? (
          <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-12 text-center">
            <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد رسائل حالياً</p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div 
              key={msg.id} 
              className={`bg-[#121E3D] border ${msg.read ? 'border-[#1C2E5A]' : 'border-[#D4AF37]/50'} rounded-2xl p-6 shadow-xl transition-all hover:border-[#D4AF37]`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1C2E5A] flex items-center justify-center text-[#D4AF37]">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{msg.name}</h4>
                    <p className="text-gray-500 text-xs">{msg.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">
                    {safeFormatDate(msg.createdAt)}
                  </span>
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="bg-[#0A1128] rounded-xl p-4 mb-4">
                <div className="text-[#D4AF37] text-sm font-bold mb-1">{msg.subject}</div>
                <p className="text-gray-300 text-sm leading-relaxed">{msg.message}</p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => toggleRead(msg.id, msg.read)}
                  className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${msg.read ? 'text-gray-500 bg-gray-500/10' : 'text-[#D4AF37] bg-[#D4AF37]/10'}`}
                >
                  {msg.read ? 'تمت القراءة' : 'تحديد كمقروء'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminsSection = ({ adminsList, logAction, currentUserEmail }: any) => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const availablePermissions = [
    { id: 'view_dashboard', label: 'الوصول للوحة التحكم (الرئيسية)' },
    { id: 'manage_commodities', label: 'إدارة وتحديث أسعار السلع' },
    { id: 'add_delete_commodities', label: 'إضافة وحذف السلع' },
    { id: 'import_csv', label: 'استيراد البيانات (CSV/Excel)' },
    { id: 'export_data', label: 'تصدير البيانات والتقارير' },
    { id: 'manage_news', label: 'إدارة شريط الأخبار' },
    { id: 'manage_content', label: 'إدارة المحتوى والصفحات' },
    { id: 'manage_settings', label: 'إعدادات المنصة المتقدمة' },
    { id: 'manage_messages', label: 'الاطلاع وإدارة الرسائل' },
    { id: 'view_logs', label: 'الاطلاع على سجلات النظام' }
  ];

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    try {
      await setDoc(doc(db, 'admins', newAdminEmail.trim().toLowerCase()), {
        email: newAdminEmail.trim().toLowerCase(),
        addedBy: currentUserEmail,
        createdAt: serverTimestamp(),
        permissions: selectedPermissions
      });
      await logAction('إضافة مسؤول', `تم إضافة المسؤول الجديد: ${newAdminEmail} بصلاحيات: ${selectedPermissions.join(', ')}`);
      setNewAdminEmail('');
      setSelectedPermissions([]);
      alert('تمت إضافة المسؤول بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admins');
    }
  };

  const handleUpdatePermissions = async (email: string, newPermissions: string[]) => {
    try {
      await updateDoc(doc(db, 'admins', email), {
        permissions: newPermissions
      });
      await logAction('تحديث صلاحيات', `تم تحديث صلاحيات المسؤول: ${email}`);
      alert('تم تحديث الصلاحيات بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'admins');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email === 'ahmedhmeda67@gmail.com') {
      alert('لا يمكن حذف المسؤول الرئيسي');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من إزالة صلاحيات المسؤول عن ${email}؟`)) return;
    
    try {
      await deleteDoc(doc(db, 'admins', email));
      await logAction('إزالة مسؤول', `تمت إزالة المسؤول: ${email}`);
      alert('تمت إزالة المسؤول بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admins');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="text-[#D4AF37]" /> إضافة مسؤول جديد
        </h2>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="البريد الإلكتروني للمسؤول الجديد"
              className="flex-grow bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
            <button
              type="submit"
              className="bg-[#D4AF37] text-[#0A1128] font-bold px-6 py-3 rounded-xl hover:bg-[#B5952F] transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> إضافة
            </button>
          </div>
          <div className="bg-[#0A1128] p-4 rounded-xl border border-[#1C2E5A]">
            <h3 className="text-white font-bold mb-3">تحديد الصلاحيات:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePermissions.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="w-4 h-4 rounded border-gray-600 text-[#D4AF37] focus:ring-[#D4AF37] bg-gray-700"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">المدراء الحاليون</h2>
        <div className="space-y-4">
          <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="text-white font-bold">ahmedhmeda67@gmail.com</div>
              <div className="text-gray-500 text-xs">المسؤول الرئيسي (كافة الصلاحيات)</div>
            </div>
            <Shield className="text-[#D4AF37]" size={24} />
          </div>
          
          {adminsList.map((admin: any) => (
            <div key={admin.id} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">{admin.email}</div>
                  <div className="text-gray-500 text-xs">
                    تمت الإضافة بواسطة: {admin.addedBy} | {safeFormatDate(admin.createdAt, 'date')}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAdmin(admin.email)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="إزالة المسؤول"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="border-t border-[#1C2E5A] pt-3">
                <h4 className="text-sm text-gray-400 mb-2">الصلاحيات:</h4>
                <div className="flex flex-wrap gap-2">
                  {availablePermissions.map(perm => {
                    const hasPerm = admin.permissions?.includes(perm.id);
                    return (
                      <label key={perm.id} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer bg-[#121E3D] px-2 py-1 rounded">
                        <input 
                          type="checkbox" 
                          checked={hasPerm}
                          onChange={() => {
                            const newPerms = hasPerm 
                              ? admin.permissions.filter((p: string) => p !== perm.id)
                              : [...(admin.permissions || []), perm.id];
                            handleUpdatePermissions(admin.email, newPerms);
                          }}
                          className="w-3 h-3 rounded border-gray-600 text-[#D4AF37] focus:ring-[#D4AF37] bg-gray-700"
                        />
                        {perm.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
