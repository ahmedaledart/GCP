import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, User, Globe, LogOut, X, CheckCircle, AlertTriangle, Info, Settings, Save } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, logUserActivity } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

export const Header = () => {
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPathInput, setAdminPathInput] = useState('');
  const [isEditingPath, setIsEditingPath] = useState(false);
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        if (currentUser.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.email));
            if (adminDoc.exists() && adminDoc.data().permissions?.includes('manage_settings')) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      
      // If user just logged in, we can send a welcome notification if they don't have any
      if (currentUser) {
        // We will just listen to notifications
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (settings?.adminPath) {
      setAdminPathInput(settings.adminPath);
    }
  }, [settings?.adminPath]);

  const handleSaveAdminPath = async () => {
    if (!isAdmin || !adminPathInput.trim()) return;
    try {
      let formattedPath = adminPathInput.trim();
      if (!formattedPath.startsWith('/')) {
        formattedPath = '/' + formattedPath;
      }
      await updateDoc(doc(db, 'settings', 'global'), {
        adminPath: formattedPath
      });
      setIsEditingPath(false);
      alert(language === 'ar' ? 'تم تحديث مسار لوحة التحكم بنجاح!' : 'Admin path updated successfully!');
    } catch (error) {
      console.error("Error updating admin path:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء تحديث المسار' : 'Error updating path');
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Send a welcome notification upon successful login
      if (result.user) {
        await logUserActivity('تسجيل الدخول', 'قام المستخدم بتسجيل الدخول للمنصة');
        await addDoc(collection(db, 'notifications'), {
          userId: result.user.uid,
          titleAr: 'تسجيل دخول ناجح',
          titleEn: 'Successful Login',
          messageAr: `مرحباً بك ${result.user.displayName || result.user.email} في منصة أسعار السلع.`,
          messageEn: `Welcome ${result.user.displayName || result.user.email} to the Commodities Prices platform.`,
          type: 'success',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup closed by the user.");
      } else {
        console.error("Error signing in with Google", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logUserActivity('تسجيل الخروج', 'قام المستخدم بتسجيل الخروج من المنصة');
      await signOut(auth);
      setShowNotifications(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true
      });
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
            src={settings.logoUrl || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png"} 
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

              {showNotifications && (
                <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} w-80 bg-[#121E3D] border border-[#1C2E5A] rounded-xl shadow-2xl z-50 overflow-hidden`}>
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
                              <div>
                                <h4 className={`text-sm font-bold ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                                  {language === 'ar' ? notif.titleAr : notif.titleEn}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {language === 'ar' ? notif.messageAr : notif.messageEn}
                                </p>
                                <span className="text-[10px] text-gray-500 mt-2 block">
                                  {(() => {
                                    try {
                                      if (notif.createdAt?.toDate) {
                                        const d = notif.createdAt.toDate();
                                        return isNaN(d.getTime()) ? '' : d.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
                                      }
                                      return '';
                                    } catch {
                                      return '';
                                    }
                                  })()}
                                </span>
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
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 text-gray-300 hover:text-white transition-colors hidden sm:flex items-center gap-1 font-bold"
          >
            <Globe size={20} />
            <span className="text-xs uppercase">{language === 'ar' ? 'EN' : 'AR'}</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-[#D4AF37]" referrerPolicy="no-referrer" />
                <span className="text-sm font-medium text-white">{user.displayName}</span>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-white transition-colors" title="تسجيل الخروج">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-[#1C2E5A] hover:bg-[#2A4075] transition-colors px-3 py-2 rounded-lg text-sm font-medium border border-[#2A4075]">
              <User size={18} className="text-[#D4AF37]" />
              <span className="hidden sm:inline">{t('signUpGoogle')}</span>
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

      {/* Mobile Menu */}
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
                <button 
                  onClick={() => {
                    setLanguage(language === 'ar' ? 'en' : 'ar');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 text-gray-300 hover:text-white bg-[#1C2E5A]/30 hover:bg-[#1C2E5A]/50 rounded-lg transition-colors border border-transparent hover:border-[#2A4075]"
                >
                  <Globe size={20} />
                  <span className="font-bold uppercase">{language === 'ar' ? 'English' : 'العربية'}</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
