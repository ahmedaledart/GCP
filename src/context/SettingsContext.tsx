import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  addressAr: string;
  addressEn: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  adminPath: string;
  sectorApis: {
    commodities: string;
    metals: string;
    energy: string;
    agriculture: string;
  };
  isSiteActive: boolean;
}

const defaultSettings: SiteSettings = {
  siteNameAr: 'المنصة الليبية لمتابعة الاقتصاد العالمي',
  siteNameEn: 'Libyan Platform for Global Economy Monitoring',
  descriptionAr: 'منصة رقمية متقدمة توفر بيانات لحظية وتحليلات دقيقة لأسعار السلع والمعادن والطاقة العالمية.',
  descriptionEn: 'An advanced digital platform providing real-time data and accurate analytics for global commodity, metal, and energy prices.',
  logoUrl: '',
  contactEmail: 'info@ltnet.ly',
  contactPhone: '0213607085',
  addressAr: 'طرابلس - بن عاشور أمام مسجد باقي',
  addressEn: 'Tripoli - Bin Ashour, opposite Baqi Mosque',
  socialLinks: {
    facebook: '#',
    twitter: '#',
    linkedin: '#',
    instagram: '#'
  },
  adminPath: '/admin-portal-secret-access-2024',
  sectorApis: {
    commodities: '',
    metals: '',
    energy: '',
    agriculture: ''
  },
  isSiteActive: true
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
    const path = 'settings/global';
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSettings, ...snapshot.data() } as SiteSettings);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
