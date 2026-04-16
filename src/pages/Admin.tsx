import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, signInWithPopup, googleProvider } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { 
  Plus, Trash2, Save, ToggleLeft, ToggleRight, Shield, 
  LayoutDashboard, TrendingUp, Newspaper, Settings, 
  History, LogOut, ChevronRight, Globe, Image as ImageIcon,
  FileText, Users, Database, Download, Upload, RefreshCw,
  Bell, Search, Menu, X, MessageSquare, User, Zap, Mail, BarChart3
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

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
  lastUpdated: any;
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
}

type AdminTab = 'overview' | 'market' | 'news_ticker' | 'content' | 'settings' | 'logs' | 'messages' | 'admins';

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
        setCommodities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Commodity[]);
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
          return `"${(val as any).toDate().toLocaleString()}"`;
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
          <SidebarItem id="overview" icon={LayoutDashboard} label="نظرة عامة" />
          {(isSuperAdmin || adminPermissions.includes('manage_commodities')) && <SidebarItem id="market" icon={TrendingUp} label="بيانات السوق" />}
          {(isSuperAdmin || adminPermissions.includes('manage_news')) && <SidebarItem id="news_ticker" icon={Bell} label="شريط الأخبار" />}
          {(isSuperAdmin || adminPermissions.includes('manage_settings')) && <SidebarItem id="content" icon={FileText} label="المحتوى والصفحات" />}
          {(isSuperAdmin || adminPermissions.includes('manage_settings')) && <SidebarItem id="settings" icon={Settings} label="الإعدادات العامة" />}
          {(isSuperAdmin || adminPermissions.includes('manage_messages')) && <SidebarItem id="messages" icon={MessageSquare} label="الرسائل والطلبات" />}
          {isSuperAdmin && <SidebarItem id="admins" icon={Users} label="المدراء" />}
          {isSuperAdmin && <SidebarItem id="logs" icon={History} label="سجل العمليات" />}
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
              />
            )}
            {activeTab === 'market' && <MarketSection commodities={commodities} logAction={logAction} onDownload={handleDownload} />}
            {activeTab === 'news_ticker' && <NewsTickerSection news={news} logAction={logAction} />}
            {activeTab === 'content' && <ContentSection logAction={logAction} />}
            {activeTab === 'settings' && <SettingsSection settings={settings} logAction={logAction} />}
            {activeTab === 'messages' && <MessagesSection messages={messages} logAction={logAction} onDownload={handleDownload} />}
            {activeTab === 'admins' && <AdminsSection adminsList={adminsList} logAction={logAction} currentUserEmail={auth.currentUser?.email} />}
            {activeTab === 'logs' && <LogsSection logs={logs} onDownload={handleDownload} />}
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

const OverviewSection = ({ newsCount, commoditiesCount, logs, stats, messagesCount, onInitializeStats, onResetStats, setActiveTab }: any) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="إجمالي الزوار" value={stats?.totalVisitors || 0} icon={Users} color="purple" />
        <StatCard title="الرسائل الجديدة" value={messagesCount} icon={MessageSquare} color="red" />
        <StatCard title="إجمالي الأخبار" value={newsCount} icon={Newspaper} color="blue" />
        <StatCard title="السلع المراقبة" value={commoditiesCount} icon={TrendingUp} color="gold" />
        <StatCard title="عمليات اليوم" value={logs.filter((l: any) => new Date(l.timestamp?.toDate()).toDateString() === new Date().toDateString()).length} icon={History} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Zap size={20} className="text-[#D4AF37]" /> إجراءات سريعة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setActiveTab('news_ticker')}
                className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
              >
                <Plus size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span className="text-white text-xs font-bold">إضافة خبر</span>
              </button>
              <button 
                onClick={() => setActiveTab('market')}
                className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
              >
                <TrendingUp size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span className="text-white text-xs font-bold">تحديث أسعار</span>
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
              >
                <Mail size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span className="text-white text-xs font-bold">الرسائل</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className="p-4 bg-[#1C2E5A]/30 border border-[#1C2E5A] rounded-xl hover:border-[#D4AF37] transition-all text-center group"
              >
                <Settings size={24} className="mx-auto mb-2 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span className="text-white text-xs font-bold">الإعدادات</span>
              </button>
            </div>
          </div>

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
                    {log.timestamp?.toDate().toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  <span className="text-gray-500 text-[10px]">{stats.lastReset?.toDate().toLocaleDateString()}</span>
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

const MarketSection = ({ commodities, logAction, onDownload }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'commodities', editingId), {
        ...formData,
        lastUpdated: serverTimestamp()
      });
      await logAction('تعديل سلعة', `تم تعديل بيانات ${formData.nameAr}`);
      setEditingId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `commodities/${editingId}`);
    }
  };

  const handleImportCSV = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const text = event.target.result;
      const rows = text.split('\n').slice(1); // Skip header
      for (const row of rows) {
        const [symbol, nameAr, nameEn, category, price, unit] = row.split(',');
        if (symbol && price) {
          try {
            await addDoc(collection(db, 'commodities'), {
              symbol, nameAr, nameEn, category, 
              price: parseFloat(price), 
              change: 0, changePercent: 0, 
              unit, lastUpdated: serverTimestamp()
            });
          } catch (err) {
            console.error("Import error", err);
          }
        }
      }
      await logAction('استيراد بيانات', `تم استيراد بيانات من ملف CSV`);
      alert('تم استيراد البيانات بنجاح');
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السلعة؟')) return;
    try {
      await deleteDoc(doc(db, 'commodities', id));
      await logAction('حذف سلعة', `تم حذف السلعة: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `commodities/${id}`);
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newCommodity, setNewCommodity] = useState({
    symbol: '', nameAr: '', nameEn: '', category: 'energy', price: 0, unit: ''
  });

  const handleAddCommodity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'commodities'), {
        ...newCommodity,
        change: 0,
        changePercent: 0,
        lastUpdated: serverTimestamp()
      });
      await logAction('إضافة سلعة', `تم إضافة سلعة جديدة: ${newCommodity.nameAr}`);
      setIsAdding(false);
      setNewCommodity({ symbol: '', nameAr: '', nameEn: '', category: 'energy', price: 0, unit: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'commodities');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">إدارة الأسعار والسلع</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0A1128] rounded-lg hover:bg-[#B5952F] transition-all font-bold"
          >
            <Plus size={18} /> إضافة سلعة يدوياً
          </button>
          <button 
            onClick={() => onDownload(commodities, 'market_data')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all border border-[#2A4075]"
          >
            <Download size={18} className="text-[#D4AF37]" /> تنزيل البيانات (CSV)
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all cursor-pointer border border-[#2A4075]">
            <Upload size={18} className="text-[#D4AF37]" /> استيراد CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
        </div>
      </div>

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
            <input type="number" step="0.01" placeholder="السعر الافتتاحي" value={newCommodity.price || ''} onChange={e => setNewCommodity({...newCommodity, price: parseFloat(e.target.value)})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white" required />
            <input type="text" placeholder="الوحدة (مثال: USD)" value={newCommodity.unit} onChange={e => setNewCommodity({...newCommodity, unit: e.target.value})} className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-4 py-2 text-white" required />
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
              <th className="px-6 py-4">الرمز</th>
              <th className="px-6 py-4">الاسم (عربي)</th>
              <th className="px-6 py-4">السعر الحالي</th>
              <th className="px-6 py-4">التغيير</th>
              <th className="px-6 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2E5A]">
            {commodities.map((item: any) => (
              <tr key={item.id} className="hover:bg-[#1C2E5A]/30 transition-colors">
                {editingId === item.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input type="text" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="text" value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-20 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                      <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-16 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={formData.change} onChange={e => setFormData({...formData, change: parseFloat(e.target.value)})} className="w-20 bg-[#0A1128] border border-[#1C2E5A] rounded px-2 py-1 text-white" />
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
                    <td className="px-6 py-4 text-white font-bold">{item.price} {item.unit}</td>
                    <td className={`px-6 py-4 font-bold ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                          <Settings size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                          <Trash2 size={18} />
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
              <div className="space-y-2">
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

const LogsSection = ({ logs, onDownload }: any) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">سجل العمليات الأخير</h3>
        <button 
          onClick={() => onDownload(logs, 'activity_logs')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all border border-[#2A4075]"
        >
          <Download size={18} className="text-[#D4AF37]" /> تنزيل السجل (CSV)
        </button>
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
                  {log.timestamp?.toDate().toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MessagesSection = ({ messages, logAction, onDownload }: any) => {
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
        <button 
          onClick={() => onDownload(messages, 'user_messages')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C2E5A] text-white rounded-lg hover:bg-[#2A4075] transition-all border border-[#2A4075]"
        >
          <Download size={18} className="text-[#D4AF37]" /> تنزيل الرسائل (CSV)
        </button>
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
                    {msg.createdAt?.toDate().toLocaleString()}
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
    { id: 'manage_commodities', label: 'إدارة الأسعار والسوق' },
    { id: 'manage_news', label: 'إدارة الأخبار' },
    { id: 'manage_settings', label: 'إعدادات الموقع والمحتوى' },
    { id: 'manage_messages', label: 'إدارة الرسائل' }
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
                    تمت الإضافة بواسطة: {admin.addedBy} | {admin.createdAt?.toDate().toLocaleDateString()}
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
