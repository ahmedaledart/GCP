import React from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LiveTicker } from './components/LiveTicker';
import { NewsTicker } from './components/NewsTicker';
import { Home } from './pages/Home';
import { Markets } from './pages/Markets';
import { Analytics } from './pages/Analytics';
import { News } from './pages/News';
import { Reports } from './pages/Reports';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Admin } from './pages/Admin';
import { LegalPage } from './pages/LegalPage';
import { Services } from './components/Services';
import { VisitorTracker } from './components/VisitorTracker';
import { ScrollToTop } from './components/ScrollToTop';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { MarketProvider } from './context/MarketContext';
import { AuthProvider } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { hasSupabaseConfig } from './lib/supabase';
import { AlertCircle, PlusCircle } from 'lucide-react';

const APP_VERSION = '2026-05-10-02';

const AppVersionCheck: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [needsUpdate, setNeedsUpdate] = React.useState(false);

  React.useEffect(() => {
    try {
      const currentVersion = localStorage.getItem('APP_VERSION');
      if (currentVersion !== APP_VERSION) {
        setNeedsUpdate(true);
      }
    } catch (e) {
      console.warn("Could not check/update APP_VERSION", e);
    }
  }, []);

  if (needsUpdate) {
    return (
      <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
        <div className="bg-[#121E3D] border border-red-500/30 p-12 rounded-[2rem] max-w-lg w-full text-center shadow-xl relative overflow-hidden">
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter" dir="rtl">تم رصد نسخة جديدة من التطبيق</h2>
          <p className="text-gray-400 text-sm mb-8 whitespace-pre-wrap" dir="rtl">
            يرجى تحديث التطبيق للحصول على أحدث الميزات والإصلاحات ولضمان استقرار الأداء.
          </p>
          <button 
            onClick={() => { 
              if (typeof (window as any).resetAppStorage === 'function') {
                (window as any).resetAppStorage();
              }
              localStorage.setItem('APP_VERSION', APP_VERSION);
              window.location.href = window.location.pathname + '#/'; 
            }} 
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold uppercase text-sm transition-all shadow-lg"
          >
            تحديث التطبيق
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error Boundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
          <div className="bg-[#121E3D] border border-red-500/30 p-12 rounded-[2rem] max-w-lg w-full text-center shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter" dir="rtl">حدث خطأ في المنصة</h2>
            <p className="text-gray-400 text-sm mb-8 font-mono break-all text-left overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </p>
            <button 
              onClick={() => { 
                if (typeof (window as any).resetAppStorage === 'function') {
                  (window as any).resetAppStorage();
                } else {
                  localStorage.clear();
                  sessionStorage.clear();
                }
                window.location.href = window.location.pathname + '#/admin/login'; 
              }} 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold uppercase text-sm transition-all shadow-lg"
            >
              إصلاح وفتح المنصة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MaintenanceMode = () => {

  const { settings } = useSettings();
  const { language } = useLanguage();
  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
      <div className="bg-[#121E3D] border border-[#1C2E5A] p-12 rounded-[2rem] max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
        {settings.siteLogo ? (
          <img src={settings.siteLogo} alt="Logo" className="h-24 mx-auto mb-8 object-contain" />
        ) : (
          <ShieldAlert className="text-[#D4AF37] mx-auto mb-8" size={80} />
        )}
        <h1 className="text-3xl font-black text-white mb-6 tracking-tight uppercase">
          {language === 'ar' ? (settings.maintenanceTitleAr || 'الموقع تحت الصيانة') : 'Site Under Maintenance'}
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed font-bold">
          {language === 'ar' ? (settings.maintenanceMessageAr || 'نعمل حاليًا على تحديث منصة الأسعار العالمية يرجى العودة لاحقًا') : 'We are currently updating the global pricing platform, please check back later'}
        </p>
      </div>
    </div>
  );
};

import DisabledAdmin from './pages/DisabledAdmin';

const AppRoutes = () => {
  const { settings } = useSettings();
  const location = useLocation();
  const adminPath = settings.adminPath || '/admin';
  const formattedPath = adminPath.startsWith('/') ? adminPath : `/${adminPath}`;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/markets" element={<Markets />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/analysis" element={<Analytics />} />
      <Route path="/news" element={<News />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/privacy" element={<LegalPage />} />
      <Route path="/terms" element={<LegalPage />} />
      <Route path="/disclaimer" element={<LegalPage />} />
      <Route path="/services" element={<Services />} />
      <Route path="/auth" element={<Auth />} />
      <Route path={formattedPath} element={<DisabledAdmin />} />
      <Route path="/admin" element={<DisabledAdmin />} />
      <Route path="/admin/*" element={<DisabledAdmin />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

import { useVisitorTracking } from './hooks/useVisitorTracking';

function AppContent() {
  const { settings, loading } = useSettings();
  const location = useLocation();
  useVisitorTracking();

  if (loading) return null; // Wait for settings to load to avoid flicker

  const adminPath = settings.adminPath || '/admin';
  const formattedPath = adminPath.startsWith('/') ? adminPath : `/${adminPath}`;

  // Force strict boolean checking
  const isSiteClosed = settings.isSiteActive === false;
  const isNotOnAdminPath = !location.pathname.startsWith(formattedPath);

  // If site is closed and not on admin path, show ONLY maintenance overlay
  if (isSiteClosed && isNotOnAdminPath) {
    return <MaintenanceMode />;
  }

  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col">
      {isSiteClosed && !isNotOnAdminPath && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-bold shadow-lg z-50">
          تنبيه: المنصة مغلقة حالياً للزوار (تحت الصيانة)
        </div>
      )}
      <LiveTicker />
      <NewsTicker />
      <Header />
      <main className="flex-grow">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <AppVersionCheck>
        <SettingsProvider>
          <LanguageProvider>
            <AuthProvider>
              <MarketProvider>
                <VisitorTracker />
                <ScrollToTop />
                <AppContent />
              </MarketProvider>
            </AuthProvider>
          </LanguageProvider>
        </SettingsProvider>
      </AppVersionCheck>
    </AppErrorBoundary>
  );
}

export default App;
