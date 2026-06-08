import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, ToggleLeft, ToggleRight, Shield, 
  LayoutDashboard, TrendingUp, Newspaper, Settings,
  History, LogOut, ChevronRight, ChevronLeft, ExternalLink, Globe, Image as ImageIcon,
  FileText, FileSpreadsheet, Users, Database, Download, Upload, RefreshCw,
  Bell, Search, Menu, X, MessageSquare, User, Zap, Mail, BarChart3, AlertCircle, Lock,
  ChevronDown, Filter, Calendar, Activity, PieChart as PieChartIcon, ShieldAlert,
  Briefcase, Network, Coins, FileBarChart, BarChart2, AlertTriangle, Layout, Scale, DatabaseBackup
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { generateWithRetry } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { SectorsTab, DataSourcesTab, ExchangeRatesTab, UsersTab, LegalTab, BackupTab, ChartsTab, AlertsTab, InterfaceTab, StatusTab } from '../components/admin/AdditionalTabs';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { PlatformUsersTab } from '../components/admin/PlatformUsersTab';
import { PlatformSettingsTab } from '../components/admin/PlatformSettingsTab';
import { ApiSourcesTab } from '../components/admin/ApiSourcesTab';

const ADMIN_EMAIL = "ahmedhmeda67@gmail.com";

class AdminErrorBoundary extends React.Component<{children: React.ReactNode, language: string}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Admin Error Boundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 m-10 bg-red-500/10 border border-red-500 rounded-2xl text-red-500 font-bold font-mono" dir="ltr">
          <h2>Dashboard Crashed!</h2>
          <p>{this.state.error?.toString()}</p>
          <button onClick={() => {
            if (typeof (window as any).resetAppStorage === 'function') {
              (window as any).resetAppStorage();
            } else {
              localStorage.clear();
              sessionStorage.clear();
            }
            window.location.href = window.location.pathname + '#/admin/login';
          }} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">إصلاح وفتح المنصة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Admin = () => {
  const { language } = useLanguage();
  return (
    <AdminErrorBoundary language={language}>
      <AdminInner />
    </AdminErrorBoundary>
  );
};

const clearStorageKeys = () => {
  const prefixes = ['sb-', 'supabase', 'gcp-', 'GCP_', 'auth', 'admin', 'user', 'platform'];
  [localStorage, sessionStorage].forEach(storage => {
    Object.keys(storage).forEach(key => {
      if (prefixes.some(prefix => key.toLowerCase().startsWith(prefix.toLowerCase()))) {
        storage.removeItem(key);
      }
    });
  });
};

const AdminInner = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTabInternal] = useState(tab && tab !== 'login' ? tab : 'dashboard');
  const setActiveTab = (newTab: string) => {
    setActiveTabInternal(newTab);
    navigate(`/admin/${newTab}`, { replace: true });
  };

  useEffect(() => {
    if (isAdmin && tab === 'login') {
      navigate('/admin/dashboard', { replace: true });
    } else if (isAdmin && tab && tab !== 'login') {
      setActiveTabInternal(tab);
    }
  }, [tab, isAdmin, navigate]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === '1') {
      clearStorageKeys();
      window.location.search = '';
    }
  }, []);

  // Stats State
  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalCommodities: 0,
    totalNews: 0,
    totalReports: 0,
    totalMessages: 0
  });

  // Data States
  const [commodities, setCommodities] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({
    isSiteActive: true,
    maintenanceMessageAr: '',
    maintenanceMessageEn: '',
    contactEmail: '',
    contactPhone: '',
    platformName: 'LIBYA MARKET'
  });
  const [loading, setLoading] = useState(true);

  // Form States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [commoditySearch, setCommoditySearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [importFeedback, setImportFeedback] = useState<{message: string; errors: string[]} | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('all');

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({
    file: null as File | null,
    sectorAr: '',
    sectorEn: '',
    currency: 'USD'
  });

  const [adminUser, setAdminUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const enforcePermission = (permissionKey: string, moduleName: string) => {
    if (adminUser?.role === 'super_admin') return true;
    if (adminUser && adminUser[permissionKey]) return true;
    
    // Also check if permissions array exists and contains the required permission (or derived names)
    if (adminUser && Array.isArray(adminUser.permissions)) {
      if (permissionKey === 'can_manage_prices' && (adminUser.permissions.includes('commodities') || adminUser.permissions.includes('manage_prices'))) return true;
      if (permissionKey === 'can_manage_news' && adminUser.permissions.includes('news')) return true;
      if (permissionKey === 'can_manage_analysis' && adminUser.permissions.includes('analyses')) return true;
      if (permissionKey === 'can_manage_sectors' && adminUser.permissions.includes('sectors')) return true;
      if (permissionKey === 'can_manage_admins' && adminUser.permissions.includes('admin_users')) return true;
    }

    showToast(language === 'ar' ? `ليس لديك صلاحية لإدارة ${moduleName} المحددة.` : `You don't have permission to manage ${moduleName}.`, 'error');
    return false;
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    // Global realtime listeners for admin to keep UI in sync
    const channels = [
      supabase.channel('admin-commodities').on('postgres_changes', { event: '*', schema: 'public', table: 'commodities' }, () => fetchData()),
      supabase.channel('admin-news').on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => fetchData()),
      supabase.channel('admin-analyses').on('postgres_changes', { event: '*', schema: 'public', table: 'analyses' }, () => fetchData()),
      supabase.channel('admin-sectors').on('postgres_changes', { event: '*', schema: 'public', table: 'sectors' }, () => fetchData()),
      supabase.channel('admin-settings').on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => fetchData())
    ];

    channels.forEach(channel => channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime unavailable, using normal Supabase fetch');
      }
    }));

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [isAdmin]);

  useEffect(() => {
    // Listen to Supabase Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user;
      console.log('Session user:', currentUser?.email);
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        // We will fetch admin user if logged in (mostly for persistent session refresh)
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .ilike('email', currentUser.email)
          .single();

        if (adminData) {
          console.log('Admin profile:', adminData);
          if (adminData.is_active) {
            setIsAdmin(true);
            setAdminUser(adminData);
          } else {
            setIsAdmin(false);
            setAdminUser(null);
            if (event === 'SIGNED_IN') {
              await supabase.auth.signOut();
            }
          }
        } else if (currentUser.email === ADMIN_EMAIL) {
          console.log('Admin profile: Super Admin Hardcoded');
          setIsAdmin(true);
          setAdminUser({
            email: currentUser.email,
            role: 'super_admin',
            is_active: true,
            can_manage_admins: true,
            permissions: ['*']
          });
        } else {
          setIsAdmin(false);
          setAdminUser(null);
          if (event === 'SIGNED_IN') {
             await supabase.auth.signOut();
          }
        }
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
    });

    // Check current session on mount
    const checkSession = async () => {
      console.log('Auth loading:', true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Check session warning:', sessionError.message);
        }

        if (session?.user) {
          const currentUser = session.user;
          console.log('Session user (mount):', currentUser?.email);
          setUser(currentUser);
          
          try {
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('*')
              .ilike('email', currentUser.email)
              .single();

            if (adminData) {
              console.log('Admin profile (mount):', adminData);
              if (adminData.is_active) {
                setIsAdmin(true);
                setAdminUser(adminData);
              } else {
                await supabase.auth.signOut();
              }
            } else if (currentUser.email === ADMIN_EMAIL) {
              console.log('Admin profile (mount): Super Admin Hardcoded');
              setIsAdmin(true);
              setAdminUser({
                email: currentUser.email,
                role: 'super_admin',
                is_active: true,
                can_manage_admins: true,
                permissions: ['*']
              });
            } else {
              // Not admin
              await supabase.auth.signOut();
            }
          } catch (adminErr) {
            console.error('Failed to parse admin data:', adminErr);
          }
        }
      } catch (e: any) {
        console.error('Check session fatal error:', e.message);
      } finally {
        console.log('Auth loading:', false);
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [language]);

  const logUserActivity = async (action: string, details: string) => {
    try {
      await supabase.from('activity_logs').insert([{
        user_email: user?.email || 'System',
        action,
        details,
        timestamp: new Date().toISOString()
      }]);
    } catch (e) {
      console.error('Error logging activity:', e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Commodities
      const { data: commData, error: commError } = await supabase.from('commodities').select('*').order('created_at', { ascending: false });
      if (commError) { console.error('Error fetching commodities:', commError); }
      if (commData) {
        setCommodities(commData.map(c => ({
          id: String(c.id),
          nameAr: c.name_ar,
          nameEn: c.name_en,
          symbol: c.symbol,
          sectorAr: c.sector,
          sectorEn: c.sector,
          price: c.price,
          changePercent: c.change_percent,
          trend: c.trend,
          high: c.high,
          low: c.low,
          unit: c.unit,
          source: c.source,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          isVisible: c.is_visible,
          previousPrice: c.previous_price,
          changeValue: c.change_value,
          status: c.status
        })));
      }

      // News
      const { data: newsData, error: newsError } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      if (newsError) { console.error('Error fetching news:', newsError); }
      if (newsData) {
           setNews(newsData.map(n => ({
             id: String(n.id),
             text_ar: n.content_ar || n.title_ar,
             text_en: n.content_en || n.title_en,
             category: n.category,
             is_breaking: n.is_breaking,
             active: (n.status === 'published' || n.status === 'active') && n.is_visible !== false,
             createdAt: n.created_at,
             ...n
           })));
      }

      // Sectors
      const { data: sectorsData, error: secError } = await supabase.from('sectors').select('*').order('sort_order', { ascending: true });
      if (secError) { console.error('Error fetching sectors:', secError); }
      if (sectorsData) {
          setSectors(sectorsData.map(s => ({
              id: String(s.id),
              nameAr: s.name_ar,
              nameEn: s.name_en,
              icon: s.icon,
              code: s.code,
              isVisible: s.is_visible,
              status: s.status,
              ...s
          })));
      }

      // Analyses (Fixed from reports)
      const { data: analysesData, error: anError } = await supabase.from('analyses').select('*').order('created_at', { ascending: false });
      if (anError) { console.error('Error fetching analyses:', anError); }
      if (analysesData) {
          setReports(analysesData.map(a => ({
              id: String(a.id),
              titleAr: a.title_ar,
              titleEn: a.title_en,
              contentAr: a.content_ar,
              contentEn: a.content_en,
              status: a.status,
              analysis_type: a.analysis_type,
              sector: a.sector,
              related_symbol: a.related_symbol,
              is_visible: a.is_visible,
              publishedAt: a.created_at,
              ...a
          })));
      }

      // Messages
      const { data: msgData, error: msgError } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (msgError) { console.error('Error fetching messages:', msgError); }
      if (msgData) {
          setMessages(msgData.map(m => ({ id: String(m.id), ...m })));
      }

      // Logs
      const { data: logsData } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(50);
      if (logsData) {
          setLogs(logsData.map(l => ({ ...l, id: String(l.id) })));
      }

      // Platform Settings
      const { data: settingsData } = await supabase.from('platform_settings').select('*');
      if (settingsData) {
          const settingsObj = { ...siteSettings };
          settingsData.forEach(s => {
              if (s.key === 'platform_status') settingsObj.isSiteActive = s.value === 'open';
              if (s.key === 'maintenance_message_ar') settingsObj.maintenanceMessageAr = s.value;
              if (s.key === 'maintenance_message_en') settingsObj.maintenanceMessageEn = s.value;
              if (s.key === 'contact_email') settingsObj.contactEmail = s.value;
              if (s.key === 'contact_phone') settingsObj.contactPhone = s.value;
              if (s.key === 'platform_name') settingsObj.platformName = s.value;
              if (s.key === 'logo_url') settingsObj.logoUrl = s.value;
          });
          setSiteSettings(settingsObj);
      }

      // Stats
      let visitorCount = 0;
      if (settingsData) {
        const visitorSetting = settingsData.find(s => s.key === 'total_visitors');
        if (visitorSetting) visitorCount = parseInt(visitorSetting.value as string) || 0;
      }

      setStats({
        totalVisitors: visitorCount,
        totalCommodities: commData?.length || 0,
        totalNews: newsData?.length || 0,
        totalReports: analysesData?.length || 0,
        totalMessages: msgData?.length || 0
      });

    } catch (e: any) {
      console.error('Error fetching dashboard data:', e);
      alert('Error fetching data: ' + (e.message || e.toString()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    fetchData();


    // Realtime Subscriptions
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commodities' }, (payload) => {
          console.log('Realtime update: commodities', payload);
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, (payload) => {
          console.log('Realtime update: news', payload);
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sectors' }, (payload) => {
          console.log('Realtime update: sectors', payload);
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analyses' }, (payload) => {
          console.log('Realtime update: analyses', payload);
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, (payload) => {
          console.log('Realtime update: platform_settings', payload);
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          console.log('Realtime update: messages', payload);
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commodity_price_history' }, (payload) => {
          console.log('Realtime update: Archive', payload);
          // This will refresh the dashboard stats if any depend on history
          fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, (payload) => {
          console.log('Realtime update: logs', payload);
          fetchData();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime unavailable, using normal Supabase fetch');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    try {
      setIsLoggingIn(true);
      setLoginError(null);
      
      console.log('Login email:', loginEmail);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'https://uqqbbaylcmmtyutymqpa.supabase.co');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (authError) {
        throw new Error(authError.message);
      }
      
      console.log('Login success:', authData.user?.email);
      
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('email', loginEmail)
        .single();
        
      console.log('Admin profile:', adminData);

      if (!adminData) {
        setLoginError('ليس لديك صلاحية الدخول للوحة التحكم');
        await supabase.auth.signOut();
        return;
      }
      
      if (adminData.is_active === false) {
        setLoginError('تم تعطيل حسابك الإداري');
        await supabase.auth.signOut();
        return;
      }
      
      // User is valid and active, onAuthStateChange will handle transition to dashboard
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A18] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center gap-4">
           <div className="w-12 h-12 border-4 border-[#1C2E5A] border-t-[#D4AF37] rounded-full animate-spin"></div>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050A18] flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-[#0A1128] p-10 rounded-[2.5rem] border border-[#1C2E5A] w-full max-w-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3D47A] to-[#D4AF37]"></div>
          
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <Shield className="text-[#D4AF37] animate-pulse" size={40} />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-white text-center mb-1 uppercase tracking-tighter">
            {language === 'ar' ? 'بوابة المسؤول' : 'Admin Portal'}
          </h2>
          <p className="text-gray-500 text-center mb-10 text-[10px] font-black uppercase tracking-[0.2em]">
            {language === 'ar' ? 'يتطلب الوصول تصريح خاص' : 'Authorization required'}
          </p>
          
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {loginError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                 <p className="text-red-500 text-[10px] font-bold leading-relaxed">{loginError}</p>
                 <button 
                   type="button"
                   onClick={async () => {
                     await supabase.auth.signOut();
                     window.location.href = '/admin';
                   }}
                   className="mt-2 text-[9px] text-[#D4AF37] underline uppercase font-black"
                 >
                   {language === 'ar' ? 'إعادة تعيين الجلسة' : 'Reset Session'}
                 </button>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-14 bg-[#121E3D] border border-[#1C2E5A] rounded-2xl px-12 text-white focus:border-[#D4AF37] outline-none font-bold transition-all"
                  placeholder="admin@platform.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full h-14 bg-[#121E3D] border border-[#1C2E5A] rounded-2xl px-12 text-white focus:border-[#D4AF37] outline-none font-bold transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-14 flex items-center justify-center gap-4 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A1128] font-black rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-xl shadow-[#D4AF37]/10"
            >
              {isLoggingIn ? (
                <div className="w-6 h-6 border-2 border-[#0A1128] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="uppercase tracking-widest text-sm">{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const prefixes = ['sb-', 'supabase', 'gcp-', 'GCP_', 'auth', 'admin', 'user', 'platform'];
                [localStorage, sessionStorage].forEach(storage => {
                  Object.keys(storage).forEach(key => {
                    if (prefixes.some(prefix => key.toLowerCase().startsWith(prefix.toLowerCase()))) {
                      storage.removeItem(key);
                    }
                  });
                });
                window.location.href = 'https://ahmedaledart.github.io/GCP/#/admin/login';
                window.location.reload();
              }}
              className="w-full h-12 mt-4 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition-all text-sm border border-red-500/20"
            >
              <AlertTriangle size={16} />
              إصلاح مشكلة الدخول
            </button>
          </form>

          {user && (
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/admin';
              }}
              className="w-full mt-6 flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut size={14} />
              {language === 'ar' ? 'تسجيل الخروج من الجلسة الحالية' : 'Log out from current session'}
            </button>
          )}
          
          {loginError && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} />
              {loginError}
            </div>
          )}
          
          <div className="mt-10 text-center">
            <button onClick={() => navigate('/')} className="text-gray-600 hover:text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 mx-auto">
              {language === 'ar' ? <ChevronRight size={14} className="rotate-180" /> : <ChevronLeft size={14} />}
              {t('returnHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const downloadCSVTemplate = () => {
    const headers = "symbol,name_ar,name_en,sector,price,previous_price,high,low,unit,source,status,is_visible";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'commodities_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processExcelImport = async () => {
    if (!enforcePermission('can_manage_prices', 'الأسعار')) return;
    const { file } = importConfig;
    if (!file) return;

    const isCsvTab = activeTab === 'import_csv';
    const isExcelFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsvFile = file.name.endsWith('.csv');

    if (isCsvTab && isExcelFile) {
      setImportFeedback({
        message: language === 'ar' 
          ? 'الملف المرفوع بصيغة Excel، يرجى استخدام زر استيراد Excel أو حفظ الملف بصيغة CSV UTF-8.'
          : 'File uploaded is Excel format. Please use the Import Excel button or save the file as CSV UTF-8.',
        errors: [language === 'ar' ? 'صيغة ملف غير صالحة في تبويب CSV.' : 'Invalid file format for CSV tab.']
      });
      return;
    }

    if (!isCsvTab && isCsvFile) {
      setImportFeedback({
        message: language === 'ar' 
          ? 'الملف المرفوع بصيغة CSV، يرجى استخدام زر استيراد CSV.'
          : 'File uploaded is CSV format. Please use the Import CSV button.',
        errors: [language === 'ar' ? 'صيغة ملف غير صالحة في تبويب الإكسل.' : 'Invalid file format for Excel tab.']
      });
      return;
    }

    const parseData = async (rawRows: any[]) => {
      try {
        console.log("rawRows:", rawRows);

        // Fetch valid sector codes
        const { data: dbSectors, error: sectorError } = await supabase.from('sectors').select('code');
        if (sectorError) throw sectorError;
        const validSectorCodes = new Set((dbSectors || []).map(s => String(s.code || '').trim()));

        // Fetch existing symbols to distinguish between inserts and updates
        const { data: dbCommodities } = await supabase.from('commodities').select('symbol');
        const dbSymbols = new Set((dbCommodities || []).map(c => c.symbol));

        const validRows: any[] = [];
        const invalidRows: { rowNumber: number; symbol: string; reason: string }[] = [];
        const cleanedRows: any[] = [];
        
        const fileSymbols = new Set<string>();
        let addedCount = 0;
        let updatedCount = 0;

        rawRows.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // Assuming row 1 is header
          
          let {
            symbol, name_ar, name_en, sector, price, previous_price, high, low, unit, source, status, is_visible
          } = row;

          // Mapping different possible header names
          symbol = symbol || row['الرمز'] || row['Code'] || row['Symbol'];
          name_ar = name_ar || row['الاسم بالعربية'] || row['الاسم'] || row['السلعة'];
          name_en = name_en || row['الاسم بالإنجليزية'] || row['Name'] || row['Commodity'];
          sector = sector || row['القطاع'] || row['التصنيف'] || row['Sector'];
          price = price || row['السعر'] || row['Price'];
          previous_price = previous_price || row['السعر السابق'] || row['Previous Price'];
          high = high || row['الأعلى'] || row['High'];
          low = low || row['الأدنى'] || row['Low'];
          unit = unit || row['الوحدة'] || row['Unit'];
          source = source || row['المصدر'] || row['Source'];
          status = status || row['الحالة'] || row['Status'];
          is_visible = is_visible !== undefined ? is_visible : row['مرئي'];

          // Cleaning and Parsing
          const cleanSymbol = String(symbol || '').trim().toUpperCase();
          const cleanSector = String(sector || '').trim().toLowerCase();
          const cleanNameAr = String(name_ar || '').trim();
          const cleanNameEn = String(name_en || '').trim();
          const parsedPrice = typeof price === 'number' ? price : Number(String(price || 0).replace(/,/g, ''));
          
          // Validation
          if (!cleanSymbol) {
            invalidRows.push({ rowNumber, symbol: '', reason: 'Missing symbol' });
            return;
          }
          if (fileSymbols.has(cleanSymbol)) {
            invalidRows.push({ rowNumber, symbol: cleanSymbol, reason: 'Duplicate symbol within file' });
            return;
          }
          if (!cleanNameAr) {
            invalidRows.push({ rowNumber, symbol: cleanSymbol, reason: 'Missing Arabic name' });
            return;
          }
          if (!cleanSector) {
            invalidRows.push({ rowNumber, symbol: cleanSymbol, reason: 'Missing sector' });
            return;
          }
          if (isNaN(parsedPrice) || parsedPrice <= 0) {
            invalidRows.push({ rowNumber, symbol: cleanSymbol, reason: 'Invalid price' });
            return;
          }
          if (!validSectorCodes.has(cleanSector)) {
            invalidRows.push({ rowNumber, symbol: cleanSymbol, reason: 'Invalid sector' });
            return;
          }

          fileSymbols.add(cleanSymbol);

          // Defaults & Extra cleaning
          const parsedPrevPrice = previous_price !== undefined && previous_price !== '' ? Number(String(previous_price).replace(/,/g, '')) : parsedPrice;
          const parsedHigh = high !== undefined && high !== '' ? Number(String(high).replace(/,/g, '')) : parsedPrice;
          const parsedLow = low !== undefined && low !== '' ? Number(String(low).replace(/,/g, '')) : parsedPrice;
          
          // Calculations
          const change_value = parsedPrice - parsedPrevPrice;
          const change_percent = parsedPrevPrice > 0 ? ((parsedPrice - parsedPrevPrice) / parsedPrevPrice) * 100 : 0;
          let trend = 'neutral';
          if (parsedPrice > parsedPrevPrice) trend = 'up';
          else if (parsedPrice < parsedPrevPrice) trend = 'down';

          const payload = {
            symbol: cleanSymbol,
            name_ar: cleanNameAr,
            name_en: cleanNameEn || cleanNameAr,
            sector: cleanSector,
            price: parsedPrice,
            previous_price: isNaN(parsedPrevPrice) ? parsedPrice : parsedPrevPrice,
            change_value,
            change_percent,
            trend,
            high: isNaN(parsedHigh) ? parsedPrice : parsedHigh,
            low: isNaN(parsedLow) ? parsedPrice : parsedLow,
            unit: String(unit || '').trim(),
            source: String(source || 'Manual Entry').trim() || 'Manual Entry',
            status: String(status || 'active').trim() || 'active',
            is_visible: !(is_visible === false || is_visible === 'false' || is_visible === 0 || is_visible === '0'),
            updated_at: new Date().toISOString()
          };

          if (dbSymbols.has(cleanSymbol)) {
            updatedCount++;
          } else {
            addedCount++;
          }

          cleanedRows.push(payload);
          validRows.push(payload);
        });

        console.log("cleanedRows:", cleanedRows);
        console.log("validRows:", validRows);
        console.log("invalidRows:", invalidRows);

        if (validRows.length > 0) {
          const { data: supabaseResult, error: supabaseError } = await supabase
            .from('commodities')
            .upsert(validRows, { onConflict: 'symbol' });
          
          console.log("supabaseResult:", supabaseResult);
          if (supabaseError) {
            console.error("supabaseError:", supabaseError);
            throw supabaseError;
          }
        }

        const successMsgAr = `نتيجة الاستيراد: ${addedCount} سلعة مضافة، ${updatedCount} سلعة محدثة. الصفوف الفاشلة: ${invalidRows.length}`;
        const successMsgEn = `Import result: ${addedCount} added, ${updatedCount} updated. Failed rows: ${invalidRows.length}`;

        setImportFeedback({
          message: language === 'ar' ? successMsgAr : successMsgEn,
          errors: invalidRows.map(r => `Row ${r.rowNumber} (${r.symbol || '??'}): ${r.reason}`)
        });

        fetchData();
        setImportConfig({ ...importConfig, file: null });
        logUserActivity('استيراد بيانات', `استيراد من ملف: إضافات ${addedCount}، تحديثات ${updatedCount}، أخطاء ${invalidRows.length}`);

      } catch (err: any) {
        console.error("Import Exception:", err);
        setImportFeedback({ 
          message: language === 'ar' ? `حدث خطأ: ${err.message}` : `Error: ${err.message}`,
          errors: [err.message]
        });
      }
    };

    const reader = new FileReader();
    
    if (isExcelFile) {
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          await parseData(rawRows);
        } catch (err: any) {
          console.error("Excel Read Exception:", err);
          setImportFeedback({ 
            message: language === 'ar' ? `حدث خطأ: ${err.message}` : `Error: ${err.message}`,
            errors: [err.message]
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isCsvFile) {
      reader.onload = async (evt) => {
        try {
          const text = evt.target?.result as string;
          const rows: any[] = [];
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            // Basic CSV parser to handle simple quotes
            const splitCsvLine = (line: string) => {
              const res = [];
              let cur = '';
              let inQuote = false;
              for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') {
                  inQuote = !inQuote;
                } else if (line[i] === ',' && !inQuote) {
                  res.push(cur.trim());
                  cur = '';
                } else {
                  cur += line[i];
                }
              }
              res.push(cur.trim());
              return res;
            };

            const headers = splitCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
            for (let i = 1; i < lines.length; i++) {
              const values = splitCsvLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
              const rowObj: any = {};
              headers.forEach((h, idx) => {
                rowObj[h] = values[idx];
              });
              rows.push(rowObj);
            }
          }
          await parseData(rows);
        } catch (err: any) {
          console.error("CSV Read Exception:", err);
          setImportFeedback({ 
            message: language === 'ar' ? `حدث خطأ: ${err.message}` : `Error: ${err.message}`,
            errors: [err.message]
          });
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  // Chart Data Processing
  const getActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const activity = logs.filter(l => {
        if (!l.timestamp) return false;
        try {
          const d = new Date(l.timestamp);
          if (isNaN(d.getTime())) return false;
          return d.toISOString().split('T')[0] === date;
        } catch (e) {
          return false;
        }
      }).length;
      return { name: date, activity };
    });
  };

  const getSectorData = () => {
    const sectors: Record<string, number> = {};
    commodities.forEach(c => {
      const s = language === 'ar' ? c.sectorAr : c.sectorEn;
      sectors[s] = (sectors[s] || 0) + 1;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#D4AF37', '#1C2E5A', '#22C55E', '#A855F7', '#EF4444', '#3B82F6'];

  const testSupabaseSave = async () => {
    try {
      const payload = {
        symbol: 'DASHBOARDTEST',
        name_ar: 'اختبار من لوحة التحكم',
        name_en: 'Dashboard Test',
        sector: 'energy',
        price: 500,
        previous_price: 450,
        change_value: 50,
        change_percent: 11.11,
        trend: 'up',
        high: 520,
        low: 430,
        unit: 'unit',
        source: 'Admin Dashboard',
        status: 'active',
        is_visible: true,
        updated_at: new Date().toISOString()
      };

      console.log('SUPABASE TEST PAYLOAD:', payload);

      const { data, error } = await supabase
        .from('commodities')
        .upsert(payload, { onConflict: 'symbol' })
        .select();

      console.log('SUPABASE TEST DATA:', data);
      console.log('SUPABASE TEST ERROR:', error);

      if (error) {
        alert('Error: ' + error.message);
      } else {
        alert('تم الحفظ في Supabase بنجاح');
        await fetchData();
      }
    } catch (err: any) {
      console.error('SUPABASE CATCH ERROR:', err);
      alert('Exception: ' + err.message);
    }
  };

  const DashboardTab = () => (
    <div className="space-y-8">
      <div className="mb-4">
        <button 
          onClick={testSupabaseSave}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-2xl w-full md:w-auto shadow-xl"
        >
          {language === 'ar' ? 'اختبار الاتصال والحفظ في Supabase' : 'Test Supabase Connection & Save'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Users />} label={t('totalVisitors')} value={stats.totalVisitors} color="blue" />
        <StatsCard icon={<TrendingUp />} label={t('activeCommodities')} value={commodities.length} color="gold" />
        <StatsCard icon={<Newspaper />} label={t('newsItems')} value={news.length} color="emerald" />
        <StatsCard icon={<MessageSquare />} label={t('messagesReceived')} value={messages.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0A1128] p-6 rounded-2xl border border-[#1C2E5A] shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-[#D4AF37]" size={20} />
            {t('activityByDay')}
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getActivityData()}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2E5A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#4B5563" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(2).join('/')}
                />
                <YAxis stroke="#4B5563" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A1128', border: '1px solid #1C2E5A', borderRadius: '12px' }}
                  itemStyle={{ color: '#D4AF37' }}
                />
                <Area type="monotone" dataKey="activity" stroke="#D4AF37" fillOpacity={1} fill="url(#colorActivity)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A1128] p-6 rounded-2xl border border-[#1C2E5A] shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <History className="text-[#D4AF37]" size={20} />
            {t('recentActivity')}
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length > 0 ? logs.slice(0, 10).map((log) => (
              <div key={log.id} className="p-3 bg-[#121E3D] border border-[#1C2E5A] rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1C2E5A] flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-white font-bold text-xs uppercase">{log.action}</h4>
                    <span className="text-[10px] text-gray-500">{log.timestamp && new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{log.details}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500 italic uppercase tracking-widest text-xs">{t('noActivity')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const StatsCard = ({ icon, label, value, color }: any) => (
    <div className="bg-[#0A1128] p-6 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-all shadow-xl">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-[#121E3D] text-[#D4AF37] flex items-center justify-center shadow-inner border border-[#1C2E5A]`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
          <div className="text-2xl font-black text-white tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#050A18] text-white flex flex-col lg:flex-row relative ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-8 ${language === 'ar' ? 'left-8' : 'right-8'} z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-[#10B981] text-white border-[#10B981]/20' 
                : 'bg-red-500 text-white border-red-500/20'
            }`}
          >
            {toast.type === 'success' ? <Zap size={20} /> : <AlertTriangle size={20} />}
            <span className="font-bold text-sm uppercase tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-[60] bg-[#D4AF37] text-[#0A1128] p-3 rounded-xl shadow-2xl border border-white/20"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Static Sidebar */}
      <aside className={`fixed inset-y-0 ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} z-50 w-72 bg-[#0A1128] border-[#1C2E5A] transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : language === 'ar' ? 'translate-x-[102%]' : '-translate-x-[102%]'} lg:translate-x-0 shadow-2xl flex flex-col`}>
        <div className="h-24 flex items-center gap-4 px-8 border-b border-[#1C2E5A] bg-[#121E3D]/30 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-lg relative z-10">
            <img src={siteSettings?.siteLogo || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col relative z-10">
            <span className="text-lg font-black tracking-tighter uppercase text-white leading-none">Admin</span>
            <span className="text-[9px] font-black text-[#D4AF37] tracking-[0.3em] uppercase leading-none mt-1.5 font-sans">Command Center</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-1">
          <div className="mb-6">
            <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
              {language === 'ar' ? 'الرئيسية' : 'Core'}
            </p>
            <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard />} label={t('dashboard' as any)} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} language={language} />
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_prices) && (
              <NavItem active={activeTab === 'commodities'} icon={<Database />} label={language === 'ar' ? 'إدارة السلع والأسعار' : 'Commodities'} onClick={() => { setActiveTab('commodities'); setIsMobileMenuOpen(false); }} language={language} />
            )}
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_sectors) && (
              <NavItem active={activeTab === 'sectors'} icon={<Briefcase />} label={language === 'ar' ? 'إدارة القطاعات' : 'Sectors'} onClick={() => { setActiveTab('sectors'); setIsMobileMenuOpen(false); }} language={language} />
            )}
          </div>

          <div className="mb-6">
            <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
              {language === 'ar' ? 'المحتوى' : 'Content'}
            </p>
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_news) && (
              <NavItem active={activeTab === 'news'} icon={<Newspaper />} label={language === 'ar' ? 'إدارة الأخبار' : 'News'} onClick={() => { setActiveTab('news'); setIsMobileMenuOpen(false); }} language={language} />
            )}
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_analysis) && (
              <NavItem active={activeTab === 'analyses'} icon={<FileBarChart />} label={language === 'ar' ? 'إدارة التحليلات' : 'Analyses'} onClick={() => { setActiveTab('analyses'); setIsMobileMenuOpen(false); }} language={language} />
            )}
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_admins || adminUser?.can_manage_prices) && (
              <NavItem active={activeTab === 'messages'} icon={<MessageSquare />} label={language === 'ar' ? 'صندوق الرسائل' : 'Messages'} onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }} language={language} >
                {messages.filter(m => !m.is_read).length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto">
                    {messages.filter(m => !m.is_read).length}
                  </span>
                )}
              </NavItem>
            )}
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_admins) && (
              <NavItem active={activeTab === 'admin_users'} icon={<Shield />} label={language === 'ar' ? 'إدارة الأدمن' : 'Admin Users'} onClick={() => { setActiveTab('admin_users'); setIsMobileMenuOpen(false); }} language={language} />
            )}
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_admins) && (
              <NavItem active={activeTab === 'platform_users'} icon={<Users />} label={language === 'ar' ? 'إدارة مستخدمي المنصة' : 'Platform Users'} onClick={() => { setActiveTab('platform_users'); setIsMobileMenuOpen(false); }} language={language} />
            )}
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_admins) && (
              <NavItem active={activeTab === 'platform_settings'} icon={<Settings />} label={language === 'ar' ? 'إعدادات المنصة' : 'Platform Settings'} onClick={() => { setActiveTab('platform_settings'); setIsMobileMenuOpen(false); }} language={language} />
            )}
          </div>

          <div className="mb-6">
            <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
              {language === 'ar' ? 'أدوات' : 'Tools'}
            </p>
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_prices) && (
              <>
                <NavItem active={activeTab === 'import_csv'} icon={<FileSpreadsheet />} label={language === 'ar' ? 'استيراد CSV' : 'Import CSV'} onClick={() => { setActiveTab('import_csv'); setIsMobileMenuOpen(false); }} language={language} />
                <NavItem active={activeTab === 'import_excel'} icon={<FileSpreadsheet />} label={language === 'ar' ? 'استيراد Excel' : 'Import Excel'} onClick={() => { setActiveTab('import_excel'); setIsMobileMenuOpen(false); }} language={language} />
                <NavItem active={activeTab === 'api_sources'} icon={<Database />} label={language === 'ar' ? 'مصادر البيانات API' : 'Price Data API'} onClick={() => { setActiveTab('api_sources'); setIsMobileMenuOpen(false); }} language={language} />
              </>
            )}
          </div>

          <div className="pt-6 border-t border-[#1C2E5A]/50">
            {(adminUser?.role === 'super_admin' || adminUser?.can_manage_admins) && (
                <>
                <NavItem active={activeTab === 'settings'} icon={<Settings />} label={language === 'ar' ? 'إعدادات المنصة' : 'Settings'} onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} language={language} />
                <NavItem active={activeTab === 'platform_status'} icon={<ShieldAlert />} label={language === 'ar' ? 'فتح وإغلاق المنصة' : 'Platform Status'} onClick={() => { setActiveTab('platform_status'); setIsMobileMenuOpen(false); }} language={language} />
                </>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-[#1C2E5A] bg-[#121E3D]/30 shrink-0">
          <div className="flex items-center gap-3 mb-6 p-3 bg-[#0A1128]/50 rounded-2xl border border-[#1C2E5A]">
            <img src={user?.photoURL || ''} alt="Admin" className="w-10 h-10 rounded-xl object-cover border border-[#D4AF37]/30" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{user?.displayName}</p>
              <p className="text-[8px] text-[#D4AF37] font-black uppercase tracking-widest mt-0.5">Super Admin</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black py-3.5 rounded-xl transition-all border border-red-500/20 text-[10px] uppercase tracking-widest"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${language === 'ar' ? 'lg:mr-72' : 'lg:ml-72'} min-h-screen flex flex-col`}>
        <header className="h-24 bg-[#0A1128] border-b border-[#1C2E5A] px-10 flex items-center justify-between sticky top-0 z-40 bg-opacity-90 backdrop-blur-md">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <span className="text-[#D4AF37] select-none">/</span>
              {t(activeTab as any) || activeTab}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
                {language === 'ar' ? 'إدارة المنصة' : 'Management Console'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="px-6 h-12 flex items-center gap-3 bg-[#121E3D] hover:bg-[#1C2E5A] text-gray-400 hover:text-[#D4AF37] rounded-xl transition-all border border-[#1C2E5A] font-black text-[10px] uppercase tracking-widest shadow-inner shadow-black/20"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">{language === 'ar' ? 'الموقع' : 'Site'}</span>
            </button>
          </div>
        </header>

        <div className="p-10 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'platform_status' && <StatusTab />}
              {activeTab === 'commodities' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight">
                      <Database className="text-[#D4AF37]" />
                      {t('manageCommodities')}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                          type="text" 
                          placeholder={t('searchCommodity')} 
                          className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl py-3 pl-10 pr-4 text-sm focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-600 shadow-inner"
                          value={commoditySearch}
                          onChange={(e) => setCommoditySearch(e.target.value)}
                        />
                      </div>
                      <select 
                        className="bg-[#121E3D] border border-[#1C2E5A] rounded-xl py-3 px-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white font-bold"
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                      >
                        <option value="all">{language === 'ar' ? 'جميع القطاعات' : 'All Sectors'}</option>
                        {sectors.map(s => (
                          <option key={s.id} value={s.nameAr}>{language === 'ar' ? s.nameAr : s.nameEn}</option>
                        ))}
                      </select>
                      <select 
                        className="bg-[#121E3D] border border-[#1C2E5A] rounded-xl py-3 px-4 text-sm focus:border-[#D4AF37] outline-none transition-all text-white font-bold"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">{language === 'ar' ? 'الكل (الحالة)' : 'All States'}</option>
                        <option value="visible">{language === 'ar' ? 'مرئي' : 'Visible'}</option>
                        <option value="hidden">{language === 'ar' ? 'مخفي' : 'Hidden'}</option>
                      </select>
                      <div className="flex gap-2">
                        <button 
                           onClick={() => setActiveTab('import_csv')}
                           className="flex items-center gap-2 bg-[#1C2E5A] text-white px-5 py-3 rounded-xl font-black hover:bg-[#25396D] transition-all cursor-pointer text-[10px] uppercase tracking-widest border border-[#2A4075]"
                         >
                           <FileSpreadsheet size={18} /> {language === 'ar' ? 'استيراد CSV' : 'Import CSV'}
                        </button>
                        <button 
                           onClick={() => setActiveTab('import_excel')}
                           className="flex items-center gap-2 bg-[#175C34] text-white px-5 py-3 rounded-xl font-black hover:bg-[#1C7342] transition-all cursor-pointer text-[10px] uppercase tracking-widest border border-[#1B5733]"
                         >
                           <FileSpreadsheet size={18} /> {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          if (!enforcePermission('can_manage_prices', 'الأسعار')) return;
                          setEditingItem({ 
                            type: 'commodity', 
                            data: { 
                              nameAr: '', nameEn: '', symbol: '', sectorAr: sectors[0]?.nameAr || 'الطاقة', sectorEn: sectors[0]?.nameEn || 'Energy', 
                              price: 0, changePercent: 0, trend: 'neutral', 
                              high: 0, low: 0, unit: '', source: '', isVisible: true
                            } 
                          })
                        }}
                        className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-5 py-3 rounded-xl font-black hover:bg-[#E5C158] transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10"
                      >
                        <Plus size={18} /> {t('addNew')}
                      </button>
                    </div>
                  </div>

                  {importFeedback && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl border ${importFeedback.errors.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {importFeedback.errors.length > 0 ? <AlertTriangle className="text-red-500" /> : <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                          <h4 className={`text-lg font-black uppercase tracking-tight ${importFeedback.errors.length > 0 ? 'text-red-500' : 'text-green-500'}`}>{importFeedback.message}</h4>
                        </div>
                        <button onClick={() => setImportFeedback(null)} className="text-gray-500 hover:text-white transition-all">
                          <X size={20} />
                        </button>
                      </div>
                      
                      {importFeedback.errors.length > 0 && (
                        <div className="mt-4 bg-[#0A1128] rounded-xl p-4 border border-[#1C2E5A] max-h-48 overflow-y-auto custom-scrollbar">
                          <ul className="space-y-2">
                            {importFeedback.errors.map((err, i) => (
                              <li key={i} className="text-sm font-mono text-gray-500 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span> {err}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-[2rem] overflow-hidden shadow-2xl border-white/5">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right" dir="rtl">
                        <thead>
                          <tr className="bg-[#121E3D]/50 text-gray-500 text-[9px] uppercase font-black tracking-[0.2em] border-b border-[#1C2E5A]">
                            <th className="p-6 text-right font-black uppercase text-[#D4AF37]">{t('commodity')}</th>
                            <th className="p-6 text-right font-black uppercase">{t('sector')}</th>
                            <th className="p-6 text-right font-black uppercase">{t('currentPrice')}</th>
                            <th className="p-6 text-right font-black uppercase">{t('changePercent')}</th>
                            <th className="p-6 text-center font-black uppercase">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C2E5A]/50">
                          {commodities
                            .filter(item => {
                              const matchesSearch = 
                                (language === 'ar' ? item.nameAr : item.nameEn).toLowerCase().includes(commoditySearch.toLowerCase()) ||
                                item.symbol.toLowerCase().includes(commoditySearch.toLowerCase());
                              
                              const matchesSector = sectorFilter === 'all' || item.sectorAr === sectorFilter;
                              const matchesStatus = statusFilter === 'all' || (statusFilter === 'visible' && item.isVisible) || (statusFilter === 'hidden' && !item.isVisible);

                              return matchesSearch && matchesSector && matchesStatus;
                            })
                            .map(item => (
                            <motion.tr layout key={item.id} className="hover:bg-[#121E3D]/30 transition-colors group">
                              <td className="p-6">
                                <div className="font-black text-white uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{language === 'ar' ? item.nameAr : item.nameEn}</div>
                                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1.5">{item.symbol}</div>
                              </td>
                              <td className="p-6">
                                <span className="px-3 py-1 rounded-lg bg-[#1C2E5A] text-[9px] font-black uppercase text-gray-400 border border-[#2A4075] tracking-tighter">
                                  {language === 'ar' ? item.sectorAr : item.sectorEn}
                                </span>
                              </td>
                              <td className="p-6 font-mono text-sm font-bold text-white tabular-nums">${item.price.toLocaleString()}</td>
                              <td className="p-6">
                                <div className={`flex items-center justify-start gap-1.5 font-mono text-xs font-black ${item.trend === 'up' ? 'text-green-500' : item.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                  {item.trend === 'up' ? <TrendingUp size={14} /> : item.trend === 'down' ? <TrendingUp size={14} className="rotate-180" /> : <TrendingUp size={14} className="text-transparent" />}
                                  {item.changePercent}%
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={async () => {
                                      if (!enforcePermission('can_manage_prices', 'الأسعار')) return;
                                      try {
                                        const { error } = await supabase.from('commodities').update({ is_visible: !item.isVisible }).eq('id', item.id);
                                        if (error) throw error;
                                        showToast(language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully');
                                        fetchData();
                                      } catch (err: any) {
                                        showToast(err.message, 'error');
                                      }
                                    }}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${item.isVisible ? 'text-green-500 hover:bg-green-500/10 border-transparent hover:border-green-500/20' : 'text-gray-500 hover:bg-gray-500/10 border-transparent hover:border-gray-500/20'}`}
                                  >
                                    {item.isVisible ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                  </button>
                                  <button onClick={() => setEditingItem({ type: 'commodity', data: item })} className="w-10 h-10 flex items-center justify-center text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all border border-transparent hover:border-blue-400/20"><Settings size={18} /></button>
                                  <button onClick={async () => { 
                                    if (!enforcePermission('can_manage_prices', 'الأسعار')) return;
                                    if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) { 
                                      try {
                                        const { error } = await supabase.from('commodities').delete().eq('id', item.id);
                                        if (error) throw error;
                                        showToast(language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
                                        fetchData();
                                      } catch (err: any) {
                                        showToast(err.message, 'error');
                                      }
                                    } 
                                  }} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"><Trash2 size={18} /></button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                          
                          {commodities.filter(item => {
                            const matchesSearch = 
                              (language === 'ar' ? item.nameAr : item.nameEn).toLowerCase().includes(commoditySearch.toLowerCase()) ||
                              item.symbol.toLowerCase().includes(commoditySearch.toLowerCase());
                            const matchesSector = sectorFilter === 'all' || item.sectorAr === sectorFilter;
                            const matchesStatus = statusFilter === 'all' || (statusFilter === 'visible' && item.isVisible) || (statusFilter === 'hidden' && !item.isVisible);
                            return matchesSearch && matchesSector && matchesStatus;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-16 text-center">
                                <div className="inline-flex flex-col items-center justify-center gap-4 text-gray-500">
                                  <Database size={48} className="opacity-20" />
                                  <p className="font-bold text-lg">{language === 'ar' ? 'لا توجد سلع مطابقة' : 'No commodities found'}</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'news' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-[#0A1128] p-8 rounded-[2rem] border border-[#1C2E5A] shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                        <Newspaper className="text-[#D4AF37]" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('news')}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('manageTickerNews' as any)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!enforcePermission('can_manage_news', 'الأخبار')) return;
                        setEditingItem({ 
                          type: 'news', 
                          data: { text_ar: '', text_en: '', active: true } 
                        })
                      }}
                      className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-6 py-4 rounded-xl font-black hover:bg-[#E5C158] transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10"
                    >
                      <Plus size={18} /> {t('addNews')}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {news.length === 0 ? (
                      <div className="bg-[#0A1128] p-16 rounded-[2rem] border border-[#1C2E5A] flex flex-col items-center justify-center text-gray-500 shadow-xl">
                        <Newspaper size={48} className="opacity-20 mb-4" />
                        <p className="font-bold text-lg">{language === 'ar' ? 'لا توجد أخبار' : 'No news found'}</p>
                      </div>
                    ) : (
                      news.map(item => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={item.id} 
                          className="bg-[#0A1128] p-6 rounded-[2rem] border border-[#1C2E5A] flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all shadow-lg"
                        >
                        <div className="flex-1 text-right rtl:text-right ltr:text-left flex items-start gap-4">
                           <div className={`w-3 h-3 rounded-full mt-2 shrink-0 ${item.active ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-gray-700'}`}></div>
                           <div className="flex-1 min-w-0">
                            <div className="text-white font-black text-lg uppercase tracking-tight mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-2">{item.text_ar}</div>
                            <div className="text-gray-500 text-[10px] font-bold uppercase italic tracking-wide">{item.text_en}</div>
                           </div>
                        </div>
                         <div className="flex items-center gap-4 mr-4">
                           <button 
                             onClick={async () => {
                               if (!enforcePermission('can_manage_news', 'الأخبار')) return;
                               try {
                                 const newIsVisible = !item.is_visible;
                                 const { error } = await supabase.from('news').update({ is_visible: newIsVisible }).eq('id', item.id);
                                 if (error) throw error;
                                 showToast(language === 'ar' ? 'تم تحديث حالة الخبر' : 'News status updated');
                                 fetchData();
                               } catch (err: any) {
                                 showToast(err.message, 'error');
                               }
                             }}
                             className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${item.is_visible ? 'text-green-500 bg-green-500/5 border-green-500/20' : 'text-gray-500 bg-gray-500/5 border-gray-500/20'}`}
                           >
                             {item.is_visible ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                           </button>
                           <button onClick={() => {
                             if (!enforcePermission('can_manage_news', 'الأخبار')) return;
                             setEditingItem({ type: 'news', data: item })
                           }} className="w-12 h-12 flex items-center justify-center bg-[#121E3D] text-blue-400 border border-[#1C2E5A] rounded-2xl hover:border-blue-400/30 transition-all"><Settings size={18} /></button>
                           <button 
                              onClick={async () => {
                               if (!enforcePermission('can_manage_news', 'الأخبار')) return;
                               if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) {
                                 try {
                                   const { error } = await supabase.from('news').delete().eq('id', item.id);
                                   if (error) throw error;
                                   showToast(language === 'ar' ? 'تم حذف الخبر' : 'News deleted');
                                   fetchData();
                                 } catch (err: any) {
                                   showToast(err.message, 'error');
                                 }
                               }
                             }}
                             className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                           >
                             <Trash2 size={20} />
                           </button>
                         </div>
                      </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'analyses' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-[#0A1128] p-8 rounded-[2rem] border border-[#1C2E5A] shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                        <FileBarChart className="text-[#D4AF37]" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{language === 'ar' ? 'إدارة التحليلات' : 'Analyses Management'}</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                          {language === 'ar' ? 'نشر التقارير والتحليلات للسوق' : 'Publish market reports and analyses'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!enforcePermission('can_manage_analysis', 'التحليلات')) return;
                        setEditingItem({ 
                          type: 'analysis', 
                          data: { titleAr: '', titleEn: '', contentAr: '', contentEn: '', status: 'published', is_visible: true, analysis_type: 'technical' } 
                        })
                      }}
                      className="flex items-center gap-2 bg-[#D4AF37] text-[#0A1128] px-6 py-4 rounded-xl font-black hover:bg-[#E5C158] transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10"
                    >
                      <Plus size={18} /> {language === 'ar' ? 'تحليل جديد' : 'New Analysis'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reports.length === 0 ? (
                       <div className="md:col-span-2 text-center py-20 bg-[#0A1128] rounded-[2.5rem] border border-[#1C2E5A] border-dashed">
                        <FileBarChart className="mx-auto text-gray-700 mb-4" size={48} />
                        <p className="text-gray-500 uppercase tracking-[0.3em] font-black text-xs">{language === 'ar' ? 'لا توجد تحليلات حاليا' : 'No analyses found'}</p>
                      </div>
                    ) : reports.map(report => (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={report.id} 
                        className="bg-[#0A1128] p-8 rounded-[2rem] border border-[#1C2E5A] group hover:border-[#D4AF37]/30 transition-all shadow-2xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#D4AF37] transition-colors flex-1 leading-tight">
                              {language === 'ar' ? report.titleAr : report.titleEn}
                            </h4>
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border ${report.status === 'published' ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20'} ml-4 shrink-0 shadow-sm`}>
                              {report.status === 'published' ? (language === 'ar' ? 'منشور' : 'Published') : (language === 'ar' ? 'مسودة' : 'Draft')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 italic mb-8 font-serif">
                            {language === 'ar' ? report.contentAr : report.contentEn}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-[#1C2E5A]/30">
                          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-black uppercase tracking-widest">
                            <Calendar size={12} className="text-[#D4AF37]/60" />
                            {new Date(report.publishedAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              if (!enforcePermission('can_manage_analysis', 'التحليلات')) return;
                              setEditingItem({ type: 'analysis', data: report })
                            }} className="w-11 h-11 flex items-center justify-center bg-[#121E3D] text-blue-400 border border-[#1C2E5A] rounded-xl hover:border-blue-400/30 transition-all"><Settings size={18} /></button>
                            <button onClick={async () => { 
                               if (!enforcePermission('can_manage_analysis', 'التحليلات')) return;
                               if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) {
                                 try {
                                   const { error } = await supabase.from('analyses').delete().eq('id', report.id);
                                   if (error) throw error;
                                   showToast(language === 'ar' ? 'تم حذف التحليل' : 'Analysis deleted');
                                   fetchData();
                                 } catch (err: any) {
                                   showToast(err.message, 'error');
                                 }
                               }
                            }} className="w-11 h-11 flex items-center justify-center bg-[#121E3D] text-red-500 border border-[#1C2E5A] rounded-xl hover:border-red-500/30 transition-all"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {reports.length === 0 && (
                      <div className="col-span-full text-center py-20 bg-[#0A1128] rounded-[2.5rem] border border-[#1C2E5A] border-dashed">
                        <FileBarChart className="mx-auto text-gray-700 mb-4" size={48} />
                        <p className="text-gray-500 uppercase tracking-[0.3em] font-black text-xs">{language === 'ar' ? 'لا توجد تقارير حالياً' : 'No reports available'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
               
              {activeTab === 'messages' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-[#0A1128] p-8 rounded-[2rem] border border-[#1C2E5A] shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                        <MessageSquare className="text-[#D4AF37]" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{language === 'ar' ? 'رسائل المستخدمين' : 'User Messages'}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                          {language === 'ar' ? 'إدارة الرسائل والشكاوى الواردة' : 'Manage received inquiries'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {messages.length === 0 ? (
                       <div className="text-center py-20 bg-[#0A1128] rounded-[2.5rem] border border-[#1C2E5A] border-dashed">
                        <MessageSquare className="mx-auto text-gray-700 mb-4" size={48} />
                        <p className="text-gray-500 uppercase tracking-[0.3em] font-black text-xs">{language === 'ar' ? 'لا توجد رسائل حالياً' : 'No messages found'}</p>
                      </div>
                    ) : messages.map(msg => (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`bg-[#0A1128] p-8 rounded-[2rem] border transition-all shadow-2xl relative overflow-hidden group ${msg.is_read ? 'border-[#1C2E5A]' : 'border-[#D4AF37]/50 ring-1 ring-[#D4AF37]/20 shadow-[#D4AF37]/5'}`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#121E3D] rounded-2xl flex items-center justify-center border border-[#1C2E5A] group-hover:border-[#D4AF37]/30 transition-all font-black text-[#D4AF37]">
                              {msg.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <h4 className="text-white font-black text-lg tracking-tight uppercase flex items-center gap-2">
                                {msg.full_name}
                                {!msg.is_read && <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>}
                              </h4>
                              <p className="text-[10px] text-gray-600 font-black tracking-widest uppercase mt-0.5">{msg.email}{msg.phone ? ` • ${msg.phone}` : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest px-2 py-1 bg-[#D4AF37]/5 rounded border border-[#D4AF37]/10">
                              {msg.subject}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6 bg-[#050A18] rounded-2xl border border-[#1C2E5A]/50 text-gray-300 leading-relaxed text-sm italic relative">
                          <div className="absolute top-4 right-4 opacity-5 pointer-events-none uppercase font-black text-6xl select-none">MSG</div>
                          {msg.message}
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                          {!msg.is_read && (
                            <button onClick={async () => { 
                              await supabase.from('messages').update({ is_read: true, status: 'read' }).eq('id', msg.id); 
                              fetchData();
                            }} className="px-6 py-3 bg-[#D4AF37] text-[#0A1128] text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-[#E5C158] transition-all shadow-lg shadow-[#D4AF37]/10">
                              {language === 'ar' ? 'تحديد كمقروءة' : 'Mark as Read'}
                            </button>
                          )}
                          <button onClick={async () => { 
                             if(confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) { 
                               await supabase.from('messages').delete().eq('id', msg.id); 
                               fetchData();
                             } 
                          }} className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-red-500/20 transition-all">
                            {language === 'ar' ? 'حذف الرسالة' : 'Delete Message'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              { (activeTab === 'import_csv' || activeTab === 'import_excel') && (
                <div className="bg-[#0A1128] p-10 rounded-3xl border border-[#1C2E5A] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
                    <h3 className="text-2xl font-black mb-10 flex items-center justify-between text-white uppercase tracking-tighter">
                      <div className="flex items-center gap-4">
                        <FileSpreadsheet className="text-[#D4AF37]" size={28} />
                        {language === 'ar' ? `استيراد السلع والأسعار عبر ملف ${activeTab === 'import_csv' ? 'CSV' : 'إكسل'}` : `Import Commodities via ${activeTab === 'import_csv' ? 'CSV' : 'Excel'}`}
                      </div>
                      <button 
                        onClick={downloadCSVTemplate}
                        className="flex items-center gap-2 bg-[#1C2E5A] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-[#25396D] transition-all"
                      >
                        <Download size={14} /> {language === 'ar' ? 'تحميل القالب' : 'Download Template'}
                      </button>
                    </h3>

                  <div className="max-w-2xl mx-auto space-y-8">
                    {!importConfig.file ? (
                      <div className="bg-[#121E3D] p-10 rounded-[2rem] border-2 border-dashed border-[#1C2E5A] text-center hover:bg-[#121E3D]/80 transition-all cursor-pointer" onClick={() => document.getElementById('csv-upload')?.click()}>
                        <div className="w-20 h-20 bg-[#0A1128] rounded-full flex items-center justify-center mx-auto mb-6">
                           <FileSpreadsheet size={32} className="text-[#D4AF37]" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                           {language === 'ar' ? `قم برفع ملف ${activeTab === 'import_csv' ? 'CSV' : 'Excel'}` : `Upload ${activeTab === 'import_csv' ? 'CSV' : 'Excel'} file`}
                        </h4>
                        <p className="text-gray-500 font-bold text-sm mb-8">
                          {language === 'ar' ? 'يجب أن يحتوي الملف على الأعمدة (مطلوب: symbol, name_ar, sector, price)' : 'File should contain columns (required: symbol, name_ar, sector, price)'}
                        </p>
                        <input id="csv-upload" type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setImportConfig({ ...importConfig, file });
                          e.target.value = '';
                        }} />
                        <button className="bg-[#D4AF37] text-[#0A1128] px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10">
                          {language === 'ar' ? 'اختيار ملف' : 'Select File'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#121E3D]/50 p-8 rounded-3xl border border-[#1C2E5A]">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1C2E5A]">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0A1128] rounded-xl flex items-center justify-center border border-[#1C2E5A]">
                              <FileSpreadsheet size={24} className="text-[#D4AF37]" />
                            </div>
                            <div>
                               <p className="font-black text-white">{importConfig.file.name}</p>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{(importConfig.file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button onClick={() => setImportConfig({...importConfig, file: null})} className="text-gray-500 hover:text-red-500 transition-colors p-2 bg-[#0A1128] rounded-lg border border-[#1C2E5A]">
                            <X size={16} />
                          </button>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-6">
                          {language === 'ar' 
                            ? `يرجى التأكد من أن ملف الـ ${activeTab === 'import_csv' ? 'CSV' : 'إكسل'} يحتوي على الأعمدة المطلوبة. سيتم التحقق من الرموز والقطاعات قبل الحفظ.` 
                            : `Please ensure your ${activeTab === 'import_csv' ? 'CSV' : 'Excel'} file contains the required columns. Symbols and sectors will be validated before saving.`}
                        </p>
                        
                        <div className="bg-[#0A1128] p-6 rounded-2xl border border-[#1C2E5A] space-y-4">
                           <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                             <span>{language === 'ar' ? 'الأعمدة المطلوبة' : 'Required Columns'}</span>
                             <span className="text-[#D4AF37]">symbol, name_ar, sector, price</span>
                           </div>
                           <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                             <span>{language === 'ar' ? 'أعمدة اختيارية' : 'Optional Columns'}</span>
                             <span className="text-blue-400">previous_price, high, low, unit, source, status, is_visible</span>
                           </div>
                           <div className="p-4 bg-[#121E3D] rounded-xl text-[10px] text-gray-400 border border-[#1C2E5A] border-dashed">
                             {language === 'ar' 
                               ? '* ملاحظة: يجب أن يتطابق حقل sector مع كود القطاع (Sector Code) الموجود في المشرفة.' 
                               : '* Note: the sector field must match the Sector Code defined in the platform.'}
                           </div>
                        </div>

                        <button 
                          onClick={processExcelImport}
                          className="w-full bg-[#D4AF37] text-[#0A1128] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#E5C158] transition-all mt-8 shadow-xl shadow-[#D4AF37]/10"
                        >
                          {language === 'ar' ? 'تأكيد واستيراد' : 'Confirm & Import'}
                        </button>
                      </div>
                    )}

                    {importFeedback && (
                      <div className={`p-8 rounded-3xl border ${importFeedback.errors.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${importFeedback.errors.length > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                             {importFeedback.errors.length > 0 ? <AlertTriangle size={24} /> : <Zap size={24} />}
                           </div>
                           <div>
                             <h4 className="font-black text-white uppercase tracking-tight">{language === 'ar' ? 'نتيجة الاستيراد' : 'Import Result'}</h4>
                             <p className={`text-sm font-bold ${importFeedback.errors.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{importFeedback.message}</p>
                           </div>
                        </div>

                        {importFeedback.errors.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                                  <th className="py-2 px-4">{language === 'ar' ? 'رقم الصف' : 'Row'}</th>
                                  <th className="py-2 px-4">{language === 'ar' ? 'الرمز' : 'Symbol'}</th>
                                  <th className="py-2 px-4">{language === 'ar' ? 'السبب' : 'Reason'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {importFeedback.errors.map((error, idx) => {
                                  // Map string errors back to table rows if they follow the format "Row X (SYM): Reason"
                                  const rowMatch = error.match(/Row (\d+) \((.*?)\): (.*)/);
                                  if (rowMatch) {
                                    return (
                                      <tr key={idx} className="text-xs text-gray-400">
                                        <td className="py-3 px-4 font-mono">{rowMatch[1]}</td>
                                        <td className="py-3 px-4 font-bold text-white">{rowMatch[2]}</td>
                                        <td className="py-3 px-4 text-red-400">{rowMatch[3]}</td>
                                      </tr>
                                    );
                                  }
                                  return (
                                    <tr key={idx} className="text-xs text-red-400">
                                      <td colSpan={3} className="py-3 px-4">{error}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setImportFeedback(null)}
                          className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all flex items-center gap-2"
                        >
                          {language === 'ar' ? 'إغلاق التقرير' : 'Close Report'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="bg-[#0A1128] p-10 rounded-3xl border border-[#1C2E5A] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
                   <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-white uppercase tracking-tighter">
                    <Settings className="text-[#D4AF37]" size={28} />
                    {t('platformSettings')}
                  </h3>
                  {siteSettings && (
                    <div className="space-y-10">
                      {/* Branding Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <h4 className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <ImageIcon size={14} /> {t('branding')}
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('siteNameAr')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.siteNameAr || ''} onChange={(e) => setSiteSettings({...siteSettings, siteNameAr: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('siteNameEn')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.siteNameEn || ''} onChange={(e) => setSiteSettings({...siteSettings, siteNameEn: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('descriptionAr')}</label>
                          <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold h-24" 
                            value={siteSettings.descriptionAr || ''} onChange={(e) => setSiteSettings({...siteSettings, descriptionAr: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('descriptionEn')}</label>
                          <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold h-24 italic" 
                            value={siteSettings.descriptionEn || ''} onChange={(e) => setSiteSettings({...siteSettings, descriptionEn: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('siteLogo')}</label>
                          <div className="flex gap-4">
                            <input className="flex-1 bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                              value={siteSettings.siteLogo || ''} onChange={(e) => setSiteSettings({...siteSettings, siteLogo: e.target.value})} />
                            {siteSettings.siteLogo && (
                              <div className="w-16 h-16 bg-[#121E3D] rounded-2xl border border-[#1C2E5A] flex items-center justify-center p-2">
                                <img src={siteSettings.siteLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#1C2E5A]/50">
                        <div className="md:col-span-2">
                          <h4 className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <Mail size={14} /> {t('contactDetails')}
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('contactEmail')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.contactEmail || ''} onChange={(e) => setSiteSettings({...siteSettings, contactEmail: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('contactPhone')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.contactPhone || ''} onChange={(e) => setSiteSettings({...siteSettings, contactPhone: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('contactAddressAr')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.contactAddressAr || ''} onChange={(e) => setSiteSettings({...siteSettings, contactAddressAr: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('contactAddressEn')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.contactAddressEn || ''} onChange={(e) => setSiteSettings({...siteSettings, contactAddressEn: e.target.value})} />
                        </div>
                      </div>

                      {/* Social Links Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#1C2E5A]/50">
                        <div className="md:col-span-3">
                          <h4 className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <Zap size={14} /> {t('socialLinks')}
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('facebookUrl')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.facebookUrl || ''} onChange={(e) => setSiteSettings({...siteSettings, facebookUrl: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('twitterUrl')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.twitterUrl || ''} onChange={(e) => setSiteSettings({...siteSettings, twitterUrl: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('linkedinUrl')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A]/50 transition-all font-bold" 
                            value={siteSettings.linkedinUrl || ''} onChange={(e) => setSiteSettings({...siteSettings, linkedinUrl: e.target.value})} />
                        </div>
                      </div>

                      <button 
                        onClick={async () => {
                          const keys = ['facebook_url', 'twitter_url', 'linkedin_url', 'contact_email', 'contact_phone', 'platform_name'];
                          const values = [
                            siteSettings.facebookUrl, 
                            siteSettings.twitterUrl, 
                            siteSettings.linkedinUrl,
                            siteSettings.contactEmail,
                            siteSettings.contactPhone,
                            siteSettings.platformName
                          ];
                          
                          for (let i = 0; i < keys.length; i++) {
                            await supabase.from('platform_settings').upsert({ key: keys[i], value: values[i] }, { onConflict: 'key' });
                          }
                          
                          showToast(t('settingsSaved'));
                          logUserActivity('تحديث الإعدادات', 'تم تحديث إعدادات المنصة بالكامل');
                          fetchData();
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-[#D4AF37] text-[#0A1128] font-black py-5 rounded-2xl hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10 text-sm uppercase tracking-widest"
                      >
                        <Save size={20} /> {t('updateConfig')}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'platform_status' && (
                <div className="bg-[#0A1128] p-10 rounded-3xl border border-[#1C2E5A] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                   <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-white uppercase tracking-tighter">
                    <ShieldAlert className="text-red-500" size={28} />
                    {language === 'ar' ? 'فتح وإغلاق المنصة' : 'Platform Status'}
                  </h3>
                  {siteSettings && (
                    <div className="space-y-8">
                       <div className="bg-[#121E3D]/50 p-8 rounded-3xl border border-[#1C2E5A]">
                          <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#1C2E5A]/50">
                            <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${siteSettings.isSiteActive ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <Globe className={siteSettings.isSiteActive ? 'text-green-500' : 'text-red-500'} size={32} />
                              </div>
                              <div>
                                <p className="text-xl font-black text-white uppercase tracking-tight">{t('platformActive')}</p>
                                <p className="text-sm text-gray-500 font-bold uppercase mt-1">{t('controlPublicAccess')}</p>
                              </div>
                            </div>
                            <button onClick={async () => {
                              const newActive = !siteSettings.isSiteActive;
                              const updatedSettings = { ...siteSettings, isSiteActive: newActive };
                              setSiteSettings(updatedSettings);
                              
                              const statusValue = newActive ? 'open' : 'maintenance';
                              const { error } = await supabase
                                .from('platform_settings')
                                .upsert({ key: 'platform_status', value: statusValue }, { onConflict: 'key' });
                                
                              if (error) {
                                console.error('Error updating platform status in Supabase:', error);
                              }
                              
                              await supabase.from('platform_settings').upsert({ key: 'is_site_active', value: newActive ? 'open' : 'maintenance' }, { onConflict: 'key' });
                              logUserActivity('تحديث حالة المنصة', `تم ${newActive ? 'فتح' : 'إغلاق'} المنصة`);
                            }} className={`transition-transform hover:scale-110 active:scale-95 ${siteSettings.isSiteActive ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>
                              {siteSettings.isSiteActive ? <ToggleRight size={80}/> : <ToggleLeft size={80}/>}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('maintenanceMessageAr')}</label>
                              <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 text-white focus:border-red-500 outline-none transition-all font-bold h-32 leading-relaxed" 
                                value={siteSettings.maintenanceMessageAr || ''} onChange={(e) => setSiteSettings({...siteSettings, maintenanceMessageAr: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('maintenanceMessageEn')}</label>
                              <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-6 text-white focus:border-red-500 outline-none transition-all font-bold h-32 italic leading-relaxed" 
                                value={siteSettings.maintenanceMessageEn || ''} onChange={(e) => setSiteSettings({...siteSettings, maintenanceMessageEn: e.target.value})} />
                            </div>
                          </div>
                       </div>
                       
                       <button 
                        onClick={async () => {
                          const keys = ['maintenance_message_ar', 'maintenance_message_en'];
                          const values = [siteSettings.maintenanceMessageAr, siteSettings.maintenanceMessageEn];
                          
                          for (let i = 0; i < keys.length; i++) {
                            await supabase.from('platform_settings').upsert({ key: keys[i], value: values[i] }, { onConflict: 'key' });
                          }
                          
                          showToast(t('settingsSaved'));
                          fetchData();
                        }}
                        className="w-full bg-red-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/10 flex items-center justify-center gap-3"
                      >
                        <Save size={20} /> {language === 'ar' ? 'حفظ الرسالة' : 'Save Message'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'logs' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                        <History className="text-[#D4AF37]" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('adminLogs' as any) || t('logs' as any)}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('trackSystemActivity' as any)}</p>
                      </div>
                    </div>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                      <input 
                        type="text" 
                        placeholder={t('searchLogs')} 
                        className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl py-3 pl-10 pr-4 text-sm focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-700 shadow-inner"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-[#0A1128] border border-[#1C2E5A] rounded-[2rem] overflow-hidden shadow-2xl border-white/5">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right" dir="rtl">
                        <thead>
                          <tr className="bg-[#121E3D]/50 text-gray-500 text-[9px] uppercase font-black tracking-[0.2em] border-b border-[#1C2E5A]">
                            <th className="p-6 text-right font-black uppercase text-[#D4AF37]">{t('timestamp')}</th>
                            <th className="p-6 text-right font-black uppercase">{t('admin')}</th>
                            <th className="p-6 text-right font-black uppercase">{t('actions')}</th>
                            <th className="p-6 text-right font-black uppercase">{t('details')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C2E5A]/50">
                          {logs
                            .filter(log => 
                              log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                              log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
                              log.userEmail.toLowerCase().includes(logSearch.toLowerCase())
                            )
                            .map(log => (
                            <tr key={log.id} className="text-xs hover:bg-[#121E3D]/30 transition-colors group">
                              <td className="p-6 whitespace-nowrap">
                                <div className="text-gray-200 font-black uppercase tracking-tight">
                                  {log.timestamp && new Date(log.timestamp).toLocaleDateString(language === 'ar' ? 'ar-LY' : 'en-US')}
                                </div>
                                <div className="text-gray-600 text-[9px] font-black uppercase mt-1">
                                  {log.timestamp && new Date(log.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-LY' : 'en-US')}
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center border border-[#D4AF37]/30">
                                    <User size={12} className="text-[#D4AF37]" />
                                  </div>
                                  <span className="font-black text-white/80 uppercase tracking-tight text-[10px]">{log.userEmail}</span>
                                </div>
                              </td>
                              <td className="p-6">
                                <span className={`px-2.5 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest border ${
                                  log.action.includes('حذف') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                  log.action.includes('تعديل') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  'bg-green-500/10 text-green-500 border-green-500/20'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-6 text-gray-500 leading-relaxed font-medium italic group-hover:text-gray-300 transition-colors max-w-xs truncate">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'sectors' && <SectorsTab adminUser={adminUser} />}
              {activeTab === 'dataSources' && <DataSourcesTab />}
              {activeTab === 'exchangeRates' && <ExchangeRatesTab />}
              {activeTab === 'admin_users' && <AdminUsersTab currentUser={user} adminUser={adminUser} />}
              {activeTab === 'platform_users' && (adminUser?.role === 'super_admin' || adminUser?.can_manage_admins) && <PlatformUsersTab adminUser={adminUser} />}
              {activeTab === 'platform_settings' && (adminUser?.role === 'super_admin' || adminUser?.can_manage_admins) && <PlatformSettingsTab adminUser={adminUser} />}
              {activeTab === 'legal' && <LegalTab />}
              {activeTab === 'backup' && <BackupTab />}
              {activeTab === 'interface' && <InterfaceTab />}
              {activeTab === 'charts' && <ChartsTab />}
              {activeTab === 'alerts' && <AlertsTab />}
              {activeTab === 'api_sources' && <ApiSourcesTab />}
            </motion.div>
          </AnimatePresence>
        </div>

          {/* Import Configuration Modal */}
          <AnimatePresence>
            {showImportModal && importConfig.file && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImportModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-lg bg-[#0A1128] rounded-3xl border border-[#1C2E5A] shadow-2xl p-8 sm:p-10 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                  
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        {language === 'ar' ? 'إعدادات الاستيراد' : 'Import Settings'}
                      </h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">{importConfig.file.name}</p>
                    </div>
                    <button onClick={() => setShowImportModal(false)} className="w-10 h-10 flex items-center justify-center bg-[#121E3D] hover:bg-red-500/10 rounded-xl text-gray-500 hover:text-red-500 transition-all border border-[#1C2E5A]">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-gray-400 text-sm">
                      {language === 'ar' ? 'حدد الإعدادات الافتراضية التي سيتم تطبيقها على السلع في حال كانت غير محددة في ملف الإكسل.' : 'Select default settings to be applied if missing in the Excel file.'}
                    </p>
                    <div className="space-y-4 text-right">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'القطاع (الافتراضي AR)' : 'Sector (Default AR)'}</label>
                        <select 
                          className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-bold appearance-none"
                          value={importConfig.sectorAr}
                          onChange={e => setImportConfig({...importConfig, sectorAr: e.target.value})}
                        >
                          <option value="">{language === 'ar' ? '-- اختر القطاع --' : '-- Select Sector --'}</option>
                          {sectors.map((s: any) => (
                            <option key={s.id} value={s.nameAr}>{s.nameAr}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'القطاع (الافتراضي EN)' : 'Sector (Default EN)'}</label>
                        <select 
                          className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-bold appearance-none"
                          value={importConfig.sectorEn}
                          onChange={e => setImportConfig({...importConfig, sectorEn: e.target.value})}
                        >
                          <option value="">{language === 'ar' ? '-- اختر القطاع --' : '-- Select Sector --'}</option>
                          {sectors.map((s: any) => (
                            <option key={s.id} value={s.nameEn}>{s.nameEn}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'العملة (الافتراضية)' : 'Currency (Default)'}</label>
                        <select 
                          className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-bold appearance-none"
                          value={importConfig.currency}
                          onChange={e => setImportConfig({...importConfig, currency: e.target.value})}
                        >
                           <option value="USD">USD - دولار</option>
                           <option value="EUR">EUR - يورو</option>
                           <option value="LYD">LYD - دينار ليبي</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={processExcelImport}
                      className="w-full bg-[#D4AF37] text-[#0A1128] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#E5C158] transition-all"
                    >
                      {language === 'ar' ? 'تأكيد واستيراد' : 'Confirm & Import'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Modal */}
          <AnimatePresence>
            {editingItem && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingItem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                  className="relative bg-[#0A1128] border border-[#1C2E5A] rounded-[2.5rem] p-10 w-full max-w-2xl shadow-[0_0_50px_-12px_rgba(212,175,55,0.2)] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                  
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{t('edit')} {editingItem.type}</h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Management Console</p>
                    </div>
                    <button onClick={() => setEditingItem(null)} className="w-12 h-12 flex items-center justify-center bg-[#121E3D] hover:bg-red-500/10 rounded-2xl text-gray-500 hover:text-red-500 transition-all border border-[#1C2E5A] hover:border-red-500/20">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-8 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
                    {editingItem.type === 'commodity' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('nameAr')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-black text-sm" value={editingItem.data.nameAr || ''} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, nameAr: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('nameEn')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-black text-sm" value={editingItem.data.nameEn || ''} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, nameEn: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('symbol')}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-mono font-black text-sm" value={editingItem.data.symbol || ''} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, symbol: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('currentPrice')}</label>
                          <input type="number" className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-mono font-black text-sm" value={editingItem.data.price || 0} onChange={(e) => {
                             const p = Number(e.target.value);
                             const pp = Number(editingItem.data.previousPrice || 0);
                             const cv = pp > 0 ? (p - pp) : 0;
                             const cp = pp > 0 ? ((p - pp) / pp) * 100 : 0;
                             const tr = p > pp ? 'up' : (p < pp ? 'down' : 'neutral');
                             setEditingItem({...editingItem, data: {...editingItem.data, price: p, changeValue: cv, changePercent: Number(cp.toFixed(2)), trend: tr}});
                          }} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'السعر السابق' : 'Previous Price'}</label>
                          <input type="number" className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-mono font-black text-sm" value={editingItem.data.previousPrice || 0} onChange={(e) => {
                             const pp = Number(e.target.value);
                             const p = Number(editingItem.data.price || 0);
                             const cv = pp > 0 ? (p - pp) : 0;
                             const cp = pp > 0 ? ((p - pp) / pp) * 100 : 0;
                             const tr = p > pp ? 'up' : (p < pp ? 'down' : 'neutral');
                             setEditingItem({...editingItem, data: {...editingItem.data, previousPrice: pp, changeValue: cv, changePercent: Number(cp.toFixed(2)), trend: tr}});
                          }} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('sector')} (AR)</label>
                          <select 
                            className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-black text-sm appearance-none"
                            value={editingItem.data.sectorAr}
                            onChange={(e) => {
                              const s = sectors.find(sec => sec.nameAr === e.target.value);
                              setEditingItem({...editingItem, data: {...editingItem.data, sectorAr: e.target.value, sectorEn: s?.nameEn || ''}});
                            }}
                          >
                            {sectors.map(s => <option key={s.id} value={s.nameAr}>{s.nameAr}</option>)}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('high' as any) || 'High'}</label>
                          <input type="number" className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-mono font-black text-sm" value={editingItem.data.high || 0} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, high: Number(e.target.value)}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('low' as any) || 'Low'}</label>
                          <input type="number" className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-mono font-black text-sm" value={editingItem.data.low || 0} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, low: Number(e.target.value)}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('unit' as any) || 'Unit'}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-black text-sm" value={editingItem.data.unit || ''} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, unit: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('source' as any) || 'Source'}</label>
                          <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all font-black text-sm" value={editingItem.data.source || ''} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, source: e.target.value}})} />
                        </div>
                      </div>
                    )}

                    {editingItem.type === 'news' && (
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('newsAr')}</label>
                          <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-3xl p-6 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all min-h-[150px] font-black text-lg" value={editingItem.data.text_ar} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, text_ar: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('newsEn')}</label>
                          <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-3xl p-6 text-white focus:border-[#D4AF37] outline-none hover:bg-[#1C2E5A] transition-all min-h-[150px] font-black text-sm italic" value={editingItem.data.text_en} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, text_en: e.target.value}})} />
                        </div>
                        <div className="flex gap-8">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 accent-[#D4AF37]" checked={editingItem.data.is_breaking || false} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, is_breaking: e.target.checked}})} />
                            <span className="font-bold text-white text-sm">{language === 'ar' ? 'خبر عاجل' : 'Breaking News'}</span>
                          </label>
                          <div className="space-y-3 flex-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                            <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 text-white focus:border-[#D4AF37] outline-none transition-all font-black text-sm" value={editingItem.data.category || 'general'} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, category: e.target.value}})} />
                          </div>
                        </div>
                      </div>
                    )}

                    {editingItem.type === 'report' && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'العنوان (عربي)' : 'Title (AR)'}</label>
                            <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none font-black text-lg" value={editingItem.data.titleAr} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, titleAr: e.target.value}})} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label>
                            <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none font-black text-lg italic" value={editingItem.data.titleEn} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, titleEn: e.target.value}})} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'نوع التحليل' : 'Analysis Type'}</label>
                            <select className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none font-black text-sm" value={editingItem.data.analysis_type} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, analysis_type: e.target.value}})}>
                              <option value="technical">{language === 'ar' ? 'تقني' : 'Technical'}</option>
                              <option value="fundamental">{language === 'ar' ? 'أساسي' : 'Fundamental'}</option>
                              <option value="daily">{language === 'ar' ? 'تحليل يومي' : 'Daily'}</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'الرمز المرتبط' : 'Related Symbol'}</label>
                            <input className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-5 text-white focus:border-[#D4AF37] outline-none font-black text-sm" value={editingItem.data.related_symbol || ''} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, related_symbol: e.target.value.toUpperCase()}})} placeholder="GOLD, OIL, etc." />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'المحتوى (عربي)' : 'Content (AR)'}</label>
                          <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-3xl p-6 text-white focus:border-[#D4AF37] outline-none min-h-[250px] font-serif leading-relaxed" value={editingItem.data.contentAr} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, contentAr: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{language === 'ar' ? 'المحتوى (إنجليزي)' : 'Content (EN)'}</label>
                          <textarea className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-3xl p-6 text-white focus:border-[#D4AF37] outline-none min-h-[250px] font-serif leading-relaxed italic" value={editingItem.data.contentEn} onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, contentEn: e.target.value}})} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mt-12 bg-[#121E3D]/50 p-6 -mx-10 -mb-10 border-t border-[#1C2E5A]">
                    <button onClick={async () => {
                      if (editingItem.type === 'commodity' && !enforcePermission('can_manage_prices', 'الأسعار')) return;
                      if (editingItem.type === 'news' && !enforcePermission('can_manage_news', 'الأخبار')) return;
                      if ((editingItem.type === 'report' || editingItem.type === 'analysis') && !enforcePermission('can_manage_analysis', 'التحليلات')) return;
                      console.log('Save button clicked');
                      const { id, ...data } = editingItem.data;
                      let collectionName = '';
                      if (editingItem.type === 'news') collectionName = 'news_ticker';
                      else if (editingItem.type === 'commodity') collectionName = 'commodities';
                      else collectionName = editingItem.type + 's';

                      if (editingItem.type === 'commodity') {
                        if (!data.symbol || String(data.symbol).trim() === '') {
                          showToast(language === 'ar' ? 'يجب إدخال الرمز' : 'Symbol is required', 'error');
                          return;
                        }
                        if (!data.nameAr || String(data.nameAr).trim() === '') {
                          showToast(language === 'ar' ? 'يجب إدخال الاسم العربي' : 'Arabic Name is required', 'error');
                          return;
                        }
                        if (!data.sectorAr && !data.sector) {
                          showToast(language === 'ar' ? 'يجب إدخال القطاع' : 'Sector is required', 'error');
                          return;
                        }

                        const symbol = String(data.symbol).trim().toUpperCase();
                        const newPrice = Number(data.price) || 0;
                        
                        // Default previousPrice, high, low to newPrice if not provided or 0
                        const previousPrice = Number(data.previousPrice) || newPrice;
                        const high = Number(data.high) || newPrice;
                        const low = Number(data.low) || newPrice;
                        
                        // Calculations
                        const changeValue = newPrice - previousPrice;
                        const changePercent = previousPrice > 0 ? ((newPrice - previousPrice) / previousPrice) * 100 : 0;
                        let trend = 'neutral';
                        if (newPrice > previousPrice) trend = 'up';
                        else if (newPrice < previousPrice) trend = 'down';
                        
                        // Find sector code if possible
                        const sectorData = sectors.find(s => s.nameAr === data.sectorAr);
                        const sectorVal = sectorData?.code || data.sectorAr || data.sector;
                        
                        const supabaseData: any = {
                          symbol: symbol,
                          name_ar: data.nameAr,
                          name_en: data.nameEn || data.nameAr,
                          sector: sectorVal,
                          price: newPrice,
                          previous_price: previousPrice,
                          change_value: changeValue,
                          change_percent: changePercent,
                          trend: trend,
                          high: high,
                          low: low,
                          unit: data.unit || '',
                          source: data.source || 'Manual Entry',
                          status: data.status || 'active',
                          is_visible: data.isVisible !== false,
                          updated_at: new Date().toISOString()
                        };

                        try {
                          console.log('Commodity payload:', supabaseData);
                          const { data: savedData, error } = await supabase
                            .from('commodities')
                            .upsert(supabaseData, { onConflict: 'symbol' })
                            .select();
                          
                          console.log('Supabase save result:', savedData);
                          console.log('Supabase save error:', error);
                          
                          if (error) throw error;
                          
                          showToast(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
                          logUserActivity(id ? 'تعديل' : 'إضافة', `حفظ سلعة: ${data.nameAr} (${symbol})`);
                          setEditingItem(null);
                          fetchData();
                        } catch (err: any) {
                          console.error('Supabase Error:', err);
                          showToast(language === 'ar' ? `فشلت العملية: ${err.message}` : `Operation failed: ${err.message}`, 'error');
                        }
                        return;
                      }

                      if (editingItem.type === 'news') {
                        const newsData = {
                          title_ar: data.text_ar || data.title_ar,
                          title_en: data.text_en || data.title_en,
                          content_ar: data.content_ar || data.text_ar,
                          content_en: data.content_en || data.text_en,
                          is_breaking: data.is_breaking || false,
                          status: 'published',
                          is_visible: data.active !== false,
                          category: data.category || 'general',
                          updated_at: new Date().toISOString()
                        };

                        try {
                          if (id) {
                            const { error } = await supabase.from('news').update(newsData).eq('id', id);
                            if (error) throw error;
                          } else {
                            const { error } = await supabase.from('news').insert([{...newsData, created_at: new Date().toISOString()}]);
                            if (error) throw error;
                          }
                          showToast(language === 'ar' ? 'تم حفظ الخبر بنجاح' : 'News saved successfully');
                          logUserActivity(id ? 'تعديل' : 'إضافة', `تعديل خبر: ${newsData.title_ar}`);
                          setEditingItem(null);
                          fetchData();
                        } catch (err: any) {
                           console.error("Supabase Error:", err);
                           showToast(language === 'ar' ? `فشلت العملية: ${err.message}` : `Operation failed: ${err.message}`, 'error');
                        }
                        return;
                      }

                       if (editingItem.type === 'report' || editingItem.type === 'analysis') {
                         const reportData: any = {
                           title_ar: data.titleAr,
                           title_en: data.titleEn,
                           content_ar: data.contentAr,
                           content_en: data.contentEn,
                           analysis_type: data.analysis_type || 'technical',
                           sector: data.sector || 'ENERGY',
                           related_symbol: data.related_symbol || '',
                           is_visible: data.is_visible !== false,
                           status: data.status || 'published',
                           updated_at: new Date().toISOString()
                         };
                         
                         try {
                           if (id) {
                             const { error } = await supabase.from('analyses').update(reportData).eq('id', id);
                             if (error) throw error;
                           } else {
                             const { error } = await supabase.from('analyses').insert([{...reportData, created_at: new Date().toISOString()}]);
                             if (error) throw error;
                           }
                           showToast(language === 'ar' ? 'تم حفظ التحليل بنجاح' : 'Analysis saved successfully');
                           logUserActivity(id ? 'تعديل' : 'إضافة', `تعديل تحليل: ${data.titleAr}`);
                           setEditingItem(null);
                           fetchData();
                         } catch (err: any) {
                           console.error("Supabase Error:", err);
                           showToast(language === 'ar' ? `فشلت العملية: ${err.message}` : `Operation failed: ${err.message}`, 'error');
                         }
                         return;
                       }

                       if (id) {
                         const { error } = await supabase.from(collectionName).update(data).eq('id', id);
                         if (error) { console.error(error); alert('Error saving to Supabase'); return; }
                       } else {
                         const { error } = await supabase.from(collectionName).insert([data]);
                         if (error) { console.error(error); alert('Error inserting to Supabase'); return; }
                       }
                       setEditingItem(null);
                       fetchData();
                    }} className="flex-1 bg-[#D4AF37] text-[#0A1128] font-black py-5 rounded-2xl hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10 uppercase tracking-widest text-xs">{t('saveChanges')}</button>
                    <button onClick={() => setEditingItem(null)} className="flex-1 bg-[#1C2E5A] text-white font-black py-5 rounded-2xl hover:bg-[#25396D] transition-all uppercase tracking-widest text-xs border border-[#2A4075]">{t('cancel')}</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
};

const NavItem = ({ active, icon, label, onClick, language, children }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group ${active ? 'text-[#0A1128] font-black' : 'text-gray-500 hover:text-white hover:bg-[#121E3D]'}`}
  >
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="absolute inset-0 bg-[#D4AF37] rounded-2xl z-0 shadow-xl shadow-[#D4AF37]/10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <div className={`relative z-10 flex items-center gap-4 w-full ${language === 'ar' ? 'flex-row' : 'flex-row'}`}>
      <div className={`shrink-0 transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:text-[#D4AF37]'}`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <span className={`text-[11px] font-black uppercase tracking-tight truncate flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{label}</span>
      {children}
      {active && (
        <div className={`w-1.5 h-1.5 rounded-full bg-white shadow-sm absolute ${language === 'ar' ? '-right-1' : '-left-1'}`}></div>
      )}
    </div>
  </button>
);
