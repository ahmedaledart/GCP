import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

const AppRoutes = () => {
  const { settings } = useSettings();
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

function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <MarketProvider>
          <VisitorTracker />
          <ScrollToTop />
          <div className="min-h-screen bg-[#050A18] flex flex-col">
            <LiveTicker />
            <NewsTicker />
            <Header />
            <main className="flex-grow">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </MarketProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;
