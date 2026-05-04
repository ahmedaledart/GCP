import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  siteLogo: string;
  isSiteActive: boolean;
  maintenanceMessageAr: string;
  maintenanceMessageEn: string;
  contactEmail: string;
  contactPhone: string;
  contactAddressAr: string;
  contactAddressEn: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  adminPath: string;
}

const defaultSettings: SiteSettings = {
  siteNameAr: 'منصة تسعير السلع العالمية',
  siteNameEn: 'Global Commodities Platform',
  descriptionAr: 'المنصة الرائدة لتتبع أسعار السلع والمعادن العالمية لحظة بلحظة مع تحليلات دقيقة وتقارير حصرية.',
  descriptionEn: 'The leading platform for tracking global commodity and metal prices in real-time with accurate analytics and exclusive reports.',
  siteLogo: 'https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png',
  isSiteActive: true,
  maintenanceMessageAr: 'نعمل حاليًا على تحديث منصة الأسعار العالمية، يرجى العودة لاحقًا.',
  maintenanceMessageEn: 'We are currently updating the global pricing platform, please check back later.',
  contactEmail: 'info@globalprices.com',
  contactPhone: '+1 234 567 890',
  contactAddressAr: 'شارع المال والأعمال، الطابق 15، لندن، المملكة المتحدة',
  contactAddressEn: 'Finance St, 15th Floor, London, UK',
  facebookUrl: '#',
  twitterUrl: '#',
  linkedinUrl: '#',
  adminPath: '/admin',
};

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Fallback: Also try to read from local API if needed or just use default data
    const fetchPlatformStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'platform_status')
          .single();
          
        if (error) {
          console.warn('Could not load platform_status from Supabase:', error);
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted && data) {
          setSettings(prev => ({
            ...prev,
            isSiteActive: data.value === 'open'
          }));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching platform settings:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchPlatformStatus();

    // Subscribe to platform_settings changes
    const subscription = supabase
      .channel('platform-settings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, (payload) => {
        if (payload.new && (payload.new as any).key === 'platform_status') {
          setSettings(prev => ({
            ...prev,
            isSiteActive: (payload.new as any).value === 'open'
          }));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

