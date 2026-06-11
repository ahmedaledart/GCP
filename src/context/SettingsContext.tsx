import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  siteLogo: string;
  faviconUrl: string;
  isSiteActive: boolean;
  maintenanceTitleAr: string;
  maintenanceMessageAr: string;
  contactEmail: string;
  contactPhone: string;
  contactAddressAr: string;
  contactAddressEn: string;
  facebookUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  footerTextAr: string;
  footerTextEn: string;
  disclaimerAr: string;
  privacyPolicyAr: string;
  termsAr: string;
  adminPath: string;
}

const defaultSettings: SiteSettings = {
  siteNameAr: 'منصة تسعير السلع العالمية',
  siteNameEn: 'Global Commodities Platform',
  descriptionAr: 'المنصة الرائدة لتتبع أسعار السلع والمعادن العالمية لحظة بلحظة مع تحليلات دقيقة وتقارير حصرية.',
  descriptionEn: 'The leading platform for tracking global commodity and metal prices in real-time with accurate analytics and exclusive reports.',
  siteLogo: 'https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png',
  faviconUrl: '/favicon.ico',
  isSiteActive: true,
  maintenanceTitleAr: 'وضع الصيانة',
  maintenanceMessageAr: 'نعمل حاليًا على تحديث منصة الأسعار العالمية، يرجى العودة لاحقًا.',
  contactEmail: 'info@globalprices.com',
  contactPhone: '+1 234 567 890',
  contactAddressAr: 'شارع المال والأعمال، الطابق 15، لندن، المملكة المتحدة',
  contactAddressEn: 'Finance St, 15th Floor, London, UK',
  facebookUrl: '#',
  linkedinUrl: '#',
  twitterUrl: '#',
  footerTextAr: '© 2026 منصة الأسعار العالمية. جميع الحقوق محفوظة.',
  footerTextEn: '© 2026 World Prices Platform. All rights reserved.',
  disclaimerAr: 'جميع البيانات والتحاليل المقدمة في هذه المنصة هي لأغراض إعلامية فقط ولا تعتبر نصيحة استثمارية.',
  privacyPolicyAr: 'نحن نلتزم بحماية خصوصية بياناتك ومعلوماتك الشخصية.',
  termsAr: 'باستخدامك لهذه المنصة، فإنك توافق على الالتزام بشروط الاستخدام المعمول بها.',
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
    
    const fetchAllSettings = async () => {
      try {
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: null, error: new Error('Settings fetch timed out') }), 5000)
        );

        const { data, error } = await Promise.race([
          supabase.from('platform_settings').select('key, value'),
          timeoutPromise
        ]) as any;
          
        if (error) {
          console.warn('Could not load platform_settings from Supabase:', error);
          // Don't return, keep default settings
        }

        if (isMounted && data) {
          const settingsMap: any = {};
          data.forEach(item => {
            settingsMap[item.key] = item.value;
          });

          setSettings(prev => ({
            ...prev,
            siteNameAr: settingsMap.platform_name_ar || prev.siteNameAr,
            siteNameEn: settingsMap.platform_name_en || prev.siteNameEn,
            descriptionAr: settingsMap.platform_description_ar || prev.descriptionAr,
            descriptionEn: settingsMap.platform_description_en || prev.descriptionEn,
            siteLogo: settingsMap.platform_logo_url || prev.siteLogo,
            faviconUrl: settingsMap.platform_favicon_url || prev.faviconUrl,
            isSiteActive: settingsMap.platform_status === 'maintenance' ? false : true,
            maintenanceTitleAr: settingsMap.maintenance_title_ar || prev.maintenanceTitleAr,
            maintenanceMessageAr: settingsMap.maintenance_message_ar || prev.maintenanceMessageAr,
            contactEmail: settingsMap.contact_email || prev.contactEmail,
            contactPhone: settingsMap.contact_phone || prev.contactPhone,
            contactAddressAr: settingsMap.contact_address_ar || prev.contactAddressAr,
            contactAddressEn: settingsMap.contact_address_en || prev.contactAddressEn,
            facebookUrl: settingsMap.facebook_url || prev.facebookUrl,
            linkedinUrl: settingsMap.linkedin_url || prev.linkedinUrl,
            twitterUrl: settingsMap.x_url || prev.twitterUrl,
            footerTextAr: settingsMap.footer_text_ar || prev.footerTextAr,
            footerTextEn: settingsMap.footer_text_en || prev.footerTextEn,
            disclaimerAr: settingsMap.disclaimer_ar || prev.disclaimerAr,
            privacyPolicyAr: settingsMap.privacy_policy_ar || prev.privacyPolicyAr,
            termsAr: settingsMap.terms_ar || prev.termsAr,
          }));
        }
      } catch (err) {
        console.error('Error fetching platform settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllSettings();

    // subscription removed temporarily for performance
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Update favicon
    const link: any = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = settings.faviconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = settings.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(newLink);
    }
    
    // Update document title
    const lang = document.documentElement.lang || 'ar';
    document.title = lang === 'ar' ? settings.siteNameAr : settings.siteNameEn;
  }, [settings.siteNameAr, settings.siteNameEn, settings.faviconUrl]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

