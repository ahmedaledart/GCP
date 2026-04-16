import React from 'react';
import { TrendingUp, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

export const Footer = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();

  return (
    <footer className="bg-[#0A1128] border-t border-[#1C2E5A] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={settings.logoUrl || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png"} 
                alt="Logo" 
                className="w-12 h-12 object-contain" 
                referrerPolicy="no-referrer" 
              />
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}
                </h2>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {language === 'ar' ? settings.descriptionAr : settings.descriptionEn}
            </p>
            <div className="flex items-center gap-4">
              {settings.socialLinks.twitter && (
                <a href={settings.socialLinks.twitter} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Twitter size={18} />
                </a>
              )}
              {settings.socialLinks.linkedin && (
                <a href={settings.socialLinks.linkedin} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Linkedin size={18} />
                </a>
              )}
              {settings.socialLinks.facebook && (
                <a href={settings.socialLinks.facebook} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Facebook size={18} />
                </a>
              )}
              {settings.socialLinks.instagram && (
                <a href={settings.socialLinks.instagram} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Instagram size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#1C2E5A] pb-2 inline-block">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('home')}</Link></li>
              <li><Link to="/markets" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('energyPrices')}</Link></li>
              <li><Link to="/markets" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('metalsPrices')}</Link></li>
              <li><Link to="/markets" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('agriPrices')}</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('faq')}</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#1C2E5A] pb-2 inline-block">{t('corporateServices')}</h3>
            <ul className="space-y-3">
              <li><Link to="/services" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('apiIntegration')}</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('customExport')}</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('premiumSubs')}</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('techSupport')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#1C2E5A] pb-2 inline-block">
              {t('aboutUs')} & {t('phoneTitle')}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#D4AF37] mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{language === 'ar' ? settings.addressAr : settings.addressEn}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm" dir="ltr">{settings.contactPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm">{settings.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#1C2E5A] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}. {t('rights')}
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{t('terms')}</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{t('privacy')}</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{t('disclaimer')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
