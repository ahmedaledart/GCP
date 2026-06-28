import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, User, Globe, LogOut, X, CheckCircle, AlertTriangle, Info, Settings, Save } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { AuthProvider, useAuth } from '../context/AuthContext';

export const Header = () => {
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const { user, platformUser, signOut, statusMessage } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const ADMIN_EMAIL = "ahmedhmeda67@gmail.com";
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}#table`);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      if (user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        try {
          const { data } = await supabase.from('admin_users').select('*').eq('email', user.email).single();
          setIsAdmin(!!data && data.is_active);
        } catch (error) {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('userId', user.id).order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const sub = supabase.channel('notifs').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `userId=eq.${user.id}` }, () => {
      fetchNotifications();
    }).subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime unavailable, using normal Supabase fetch');
      }
    });

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowNotifications(false);
      navigate('/');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      await markAsRead(notif.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `font-medium transition-colors ${isActive ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-gray-300 hover:text-white'}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `block py-3 px-4 font-medium transition-colors ${isActive ? 'text-[#D4AF37] bg-[#1C2E5A]/50 rounded-lg' : 'text-gray-300 hover:text-white hover:bg-[#1C2E5A]/30 rounded-lg'}`;

  return (
    <header className="bg-[#0A1128] border-b border-[#1C2E5A] sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={settings.siteLogo || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png"} 
            alt="Logo" 
            className="w-12 h-12 object-contain" 
            referrerPolicy="no-referrer" 
          />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}
            </h1>
          </div>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          <NavLink to="/" className={navLinkClass}>{t('home')}</NavLink>
          <NavLink to="/markets" className={navLinkClass}>{t('markets')}</NavLink>
          <NavLink to="/analytics" className={navLinkClass}>{t('analytics')}</NavLink>
          <NavLink to="/news" className={navLinkClass}>{t('news')}</NavLink>
          <NavLink to="/reports" className={navLinkClass}>{t('reports')}</NavLink>
          <NavLink to="/faq" className={navLinkClass}>{t('faq')}</NavLink>
          {isAdmin && (
           
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-[#121E3D] rounded-full px-4 py-2 border border-[#1C2E5A] focus-within:border-[#D4AF37] transition-colors">
            <Search size={18} className="text-gray-400 mx-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="bg-transparent border-none outline-none text-sm text-white w-48 placeholder-gray-500"
            />
          </form>
          
          {user && (
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#0A1128]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} w-80 bg-[#121E3D] border border-[#1C2E5A] rounded-xl shadow-2xl z-50 overflow-hidden`}
                  >
                    <div className="p-4 border-b border-[#1C2E5A] flex items-center justify-between bg-[#0A1128]">
                      <h3 className="text-white font-bold">{language === 'ar' ? 'التنبيهات' : 'Notifications'}</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-[#D4AF37] hover:underline">
                          {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          {language === 'ar' ? 'لا توجد تنبيهات حالياً' : 'No notifications yet'}
                        </div>
                      ) : (
                        <div className="divide-y divide-[#1C2E5A]">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 hover:bg-[#1C2E5A]/30 transition-colors cursor-pointer ${!notif.read ? 'bg-[#1C2E5A]/10' : ''}`}
                              onClick={() => markAsRead(notif.id)}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-1 flex-shrink-0 ${notif.type === 'alert' ? 'text-red-500' : notif.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
                                  {notif.type === 'alert' ? <AlertTriangle size={16} /> : notif.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                                </div>
                                <div className="flex-1">
                                  <h4 className={`text-sm font-bold ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                                    {language === 'ar' ? notif.titleAr : notif.titleEn}
                                  </h4>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                    {language === 'ar' ? notif.messageAr : notif.messageEn}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-1.5 flex-shrink-0"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button 
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 text-gray-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
          >
            <Globe size={20} />
            <span className="text-xs uppercase">{language === 'ar' ? 'EN' : 'AR'}</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white uppercase tracking-tight">{platformUser?.full_name || user.email?.split('@')[0]}</span>
                  <div className="w-8 h-8 rounded-xl bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-[#D4AF37] shadow-inner overflow-hidden">
                    <User size={18} />
                  </div>
                </div>
                {platformUser && (
                  <div className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 px-2 py-0.5 rounded-full border ${
                    platformUser.approval_status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    platformUser.approval_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {platformUser.approval_status === 'approved' ? (language === 'ar' ? 'مفعل' : 'Approved') :
                     platformUser.approval_status === 'pending' ? (language === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval') :
                     platformUser.approval_status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') :
                     (language === 'ar' ? 'موقوف' : 'Deactivated')}
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout} 
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" 
                title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A1128] transition-all px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10">
              <User size={18} />
              <span className="hidden sm:inline">{language === 'ar' ? 'دخول / تسجيل' : 'Login / Register'}</span>
            </button>
          )}

          <button 
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#0A1128] border-b border-[#1C2E5A] absolute top-20 left-0 w-full shadow-2xl overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>{t('home')}</NavLink>
              <NavLink to="/markets" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>{t('markets')}</NavLink>
              <NavLink to="/analytics" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>{t('analytics')}</NavLink>
              <NavLink to="/news" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>{t('news')}</NavLink>
              <NavLink to="/reports" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>{t('reports')}</NavLink>
              <NavLink to="/faq" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>{t('faq')}</NavLink>
              
              <div className="mt-4 pt-4 border-t border-[#1C2E5A] flex flex-col gap-4">
                <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#121E3D] rounded-full px-4 py-2 border border-[#1C2E5A] focus-within:border-[#D4AF37] transition-colors">
                  <Search size={18} className="text-gray-400 mx-2 flex-shrink-0" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                  />
                </form>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
