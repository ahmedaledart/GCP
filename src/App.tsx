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
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { MarketProvider } from './context/MarketContext';

const MaintenanceMode = () => (
  <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
    <div className="bg-[#121E3D] border border-[#1C2E5A] p-12 rounded-2xl max-w-md w-full text-center">
      <ShieldAlert className="text-[#D4AF37] mx-auto mb-6" size={80} />
      <h1 className="text-3xl font-black text-white mb-4">الموقع تحت الصيانة</h1>
      <p className="text-gray-400 text-lg leading-relaxed">
        نأسف، المنصة حالياً مغلقة لأغراض التحديث والصيانة. 
        يرجى العودة لاحقاً.
      </p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { settings } = useSettings();
  const location = useLocation();
  const adminPath = settings.adminPath || '/admin-portal-secret-access-2024';
  
  // Ensure path starts with /
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

  const adminPath = settings.adminPath || '/admin-portal-secret-access-2024';
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
