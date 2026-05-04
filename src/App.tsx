import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import { Services } from './components/Services';
import { VisitorTracker } from './components/VisitorTracker';
import { ScrollToTop } from './components/ScrollToTop';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { MarketProvider } from './context/MarketContext';

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
          {language === 'ar' ? 'الموقع تحت الصيانة' : 'Site Under Maintenance'}
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed font-bold">
          {language === 'ar' ? 'نعمل حاليًا على تحديث منصة الأسعار العالمية يرجى العودة لاحقًا' : 'We are currently updating the global pricing platform, please check back later'}
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
      <Route path="/news" element={<News />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/services" element={<Services />} />
      <Route path={formattedPath} element={<Admin />} />
    </Routes>
  );
};

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
    <SettingsProvider>
      <LanguageProvider>
        <MarketProvider>
          <VisitorTracker />
          <ScrollToTop />
          <AppContent />
        </MarketProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;
