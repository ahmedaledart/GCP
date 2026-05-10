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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white border p-12 rounded-[2rem] max-w-lg w-full text-center shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-gray-800 mb-4 uppercase tracking-tighter">Oops, something went wrong</h2>
            <p className="text-gray-500 text-sm mb-8 p-4 bg-gray-100 rounded-xl border border-gray-200 font-mono break-all text-left overflow-auto max-h-48">
              {this.state.error?.toString()}
            </p>
            <button 
              onClick={() => { window.location.href = '/'; }} 
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-bold uppercase text-sm transition-all"
            >
              Return Home
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
      <Route path={formattedPath} element={<Admin />} />
      <Route path="/admin/login" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function ForceRedirectOnRefresh() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const isReload = 
      (window.performance && window.performance.navigation && window.performance.navigation.type === 1) ||
      (window.performance && window.performance.getEntriesByType && (window.performance.getEntriesByType("navigation")[0] as any)?.type === 'reload');

    if (isReload) {
      if (!location.pathname.startsWith('/admin') && location.pathname !== '/reports' && location.pathname !== '/analytics' && location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, []);

  return null;
}

function AppContent() {
  const { settings, loading } = useSettings();
  const location = useLocation();

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
      <ForceRedirectOnRefresh />
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
  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
        <div className="bg-[#121E3D] border border-red-500/30 p-12 rounded-[2rem] max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Missing Environment Variables</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            The application cannot connect to Supabase because the required environment variables are missing.
          </p>
          <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-xl p-6 text-left mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Please add the following to your .env file:</p>
            <code className="block text-sm text-[#D4AF37] font-mono whitespace-pre">
              VITE_SUPABASE_URL=your_url<br/>
              VITE_SUPABASE_ANON_KEY=your_key
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
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
    </AppErrorBoundary>
  );
}

export default App;
