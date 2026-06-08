import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Save, Globe, Image as ImageIcon, Mail, Phone, MapPin, 
  Facebook, Linkedin, Twitter, FileText, Shield, Info,
  Loader2, CheckCircle2, AlertCircle, Monitor
} from 'lucide-react';
import { motion } from 'motion/react';

export const PlatformSettingsTab = ({ adminUser }: { adminUser?: any }) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const enforcePermission = (permissionKey: string, moduleName: string) => {
    if (adminUser?.role === 'super_admin') return true;
    if (adminUser && adminUser[permissionKey] === true) return true;
    alert(language === 'ar' ? `ليس لديك صلاحية لإدارة ${moduleName} المحددة.` : `You don't have permission to manage ${moduleName}.`);
    return false;
  };
  
  const [formData, setFormData] = useState<Record<string, string>>({
    platform_name_ar: '',
    platform_name_en: '',
    platform_description_ar: '',
    platform_description_en: '',
    platform_logo_url: '',
    platform_favicon_url: '',
    contact_email: '',
    contact_phone: '',
    contact_address_ar: '',
    contact_address_en: '',
    facebook_url: '',
    linkedin_url: '',
    x_url: '',
    footer_text_ar: '',
    footer_text_en: '',
    maintenance_title_ar: '',
    maintenance_message_ar: '',
    disclaimer_ar: '',
    privacy_policy_ar: '',
    terms_ar: '',
    platform_status: 'open'
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;
      
      if (data) {
        const mappedData: Record<string, string> = { ...formData };
        data.forEach((item: any) => {
          mappedData[item.key] = item.value;
        });
        setFormData(mappedData);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcePermission('can_manage_admins', 'الإعدادات')) return;
    setSaving(true);
    setMessage(null);

    try {
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('platform_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      
      setMessage({
        type: 'success',
        text: language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully'
      });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const InputGroup = ({ label, icon: Icon, name, type = 'text', placeholder = '' }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{label}</label>
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          <Icon size={18} />
        </div>
        {type === 'textarea' ? (
          <textarea
            className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold min-h-[100px]"
            value={formData[name]}
            onChange={e => setFormData({ ...formData, [name]: e.target.value })}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold"
            value={formData[name]}
            onChange={e => setFormData({ ...formData, [name]: e.target.value })}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0A1128] p-8 rounded-[2.5rem] border border-[#1C2E5A]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#121E3D] rounded-2xl flex items-center justify-center text-[#D4AF37] border border-[#1C2E5A]">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {language === 'ar' ? 'إعدادات المنصة' : 'Platform Settings'}
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              {language === 'ar' ? 'إدارة الهوية والمعلومات الأساسية' : 'Manage identity and basic info'}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#D4AF37] text-[#0A1128] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#E5C158] transition-all disabled:opacity-50 shadow-xl shadow-[#D4AF37]/10"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
            message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </motion.div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#0A1128]/50 p-10 rounded-[3rem] border border-[#1C2E5A]">
        <div className="col-span-1 md:col-span-2 mb-4">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
             <Info size={16} className="text-[#D4AF37]" />
             {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
           </h3>
        </div>
        <InputGroup label="اسم المنصة بالعربية" icon={Globe} name="platform_name_ar" />
        <InputGroup label="اسم المنصة بالإنجليزية" icon={Globe} name="platform_name_en" />
        <div className="col-span-1 md:col-span-2">
          <InputGroup label="وصف المنصة بالعربية" icon={FileText} name="platform_description_ar" type="textarea" />
        </div>
        <div className="col-span-1 md:col-span-2">
          <InputGroup label="وصف المنصة بالإنجليزية" icon={FileText} name="platform_description_en" type="textarea" />
        </div>
        <InputGroup label="رابط الشعار (Logo URL)" icon={ImageIcon} name="platform_logo_url" />
        <InputGroup label="رابط الأيقونة (Favicon URL)" icon={ImageIcon} name="platform_favicon_url" />
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">
            {language === 'ar' ? 'حالة المنصة' : 'Platform Status'}
          </label>
          <div className="relative">
            <Monitor className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <select
              className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-2xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-bold appearance-none"
              value={formData.platform_status}
              onChange={e => setFormData({ ...formData, platform_status: e.target.value })}
            >
              <option value="open">{language === 'ar' ? 'مفتوح (عام)' : 'Open (Public)'}</option>
              <option value="maintenance">{language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#0A1128]/50 p-10 rounded-[3rem] border border-[#1C2E5A]">
        <div className="col-span-1 md:col-span-2 mb-4">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
             <Mail size={16} className="text-[#D4AF37]" />
             {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
           </h3>
        </div>
        <InputGroup label="البريد الإلكتروني" icon={Mail} name="contact_email" type="email" />
        <InputGroup label="رقم الهاتف" icon={Phone} name="contact_phone" />
        <InputGroup label="العنوان بالعربية" icon={MapPin} name="contact_address_ar" />
        <InputGroup label="العنوان بالإنجليزية" icon={MapPin} name="contact_address_en" />
      </div>

      {/* Social Media */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-[#0A1128]/50 p-10 rounded-[3rem] border border-[#1C2E5A]">
        <div className="col-span-1 md:col-span-3 mb-4">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
             <Globe size={16} className="text-[#D4AF37]" />
             {language === 'ar' ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}
           </h3>
        </div>
        <InputGroup label="فيسبوك" icon={Facebook} name="facebook_url" />
        <InputGroup label="لينكدإن" icon={Linkedin} name="linkedin_url" />
        <InputGroup label="منصة إكس" icon={Twitter} name="x_url" />
      </div>

      {/* Footer and Legal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#0A1128]/50 p-10 rounded-[3rem] border border-[#1C2E5A]">
        <div className="col-span-1 md:col-span-2 mb-4">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
             <Shield size={16} className="text-[#D4AF37]" />
             {language === 'ar' ? 'النصوص القانونية والتذييل' : 'Legal Texts & Footer'}
           </h3>
        </div>
        <InputGroup label="نص التذييل (عربي)" icon={FileText} name="footer_text_ar" />
        <InputGroup label="نص التذييل (إنجليزي)" icon={FileText} name="footer_text_en" />
        <div className="col-span-1 md:col-span-2">
          <InputGroup label="رسالة الصيانة (عربي)" icon={Info} name="maintenance_message_ar" type="textarea" />
        </div>
        <div className="col-span-1 md:col-span-2">
          <InputGroup label="إخلاء المسؤولية (عربي)" icon={AlertCircle} name="disclaimer_ar" type="textarea" />
        </div>
        <div className="col-span-1 md:col-span-2">
          <InputGroup label="سياسة الخصوصية (عربي)" icon={Shield} name="privacy_policy_ar" type="textarea" />
        </div>
        <div className="col-span-1 md:col-span-2">
          <InputGroup label="شروط الاستخدام (عربي)" icon={FileText} name="terms_ar" type="textarea" />
        </div>
      </div>
    </form>
  );
};
