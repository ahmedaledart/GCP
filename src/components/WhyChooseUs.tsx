import React from 'react';
import { Shield, Zap, BarChart3, Globe, Clock, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';

export const WhyChooseUs = () => {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: Shield,
      titleAr: 'أمان وموثوقية عالية',
      titleEn: 'High Security & Reliability',
      descAr: 'نستخدم أحدث تقنيات التشفير لضمان حماية بياناتك ومعلوماتك المالية.',
      descEn: 'We use the latest encryption technologies to ensure the protection of your data and financial information.',
    },
    {
      icon: Zap,
      titleAr: 'سرعة في التحديث',
      titleEn: 'Fast Updates',
      descAr: 'تحديثات لحظية للأسعار من كبرى البورصات العالمية لضمان الدقة.',
      descEn: 'Real-time price updates from major global exchanges to ensure accuracy.',
    },
    {
      icon: BarChart3,
      titleAr: 'تحليلات متقدمة',
      titleEn: 'Advanced Analytics',
      descAr: 'رسوم بيانية تفاعلية وتقارير تحليلية تساعدك على اتخاذ قرارات صائبة.',
      descEn: 'Interactive charts and analytical reports to help you make informed decisions.',
    },
    {
      icon: Globe,
      titleAr: 'تغطية عالمية',
      titleEn: 'Global Coverage',
      descAr: 'نغطي كافة الأسواق العالمية والسلع الأساسية في منصة واحدة.',
      descEn: 'We cover all global markets and essential commodities in one platform.',
    },
    {
      icon: Clock,
      titleAr: 'دعم فني 24/7',
      titleEn: '24/7 Support',
      descAr: 'فريق دعم متخصص متاح على مدار الساعة للإجابة على استفساراتكم.',
      descEn: 'A dedicated support team available around the clock to answer your inquiries.',
    },
    {
      icon: Award,
      titleAr: 'خبرة مؤسسية',
      titleEn: 'Institutional Expertise',
      descAr: 'مدعومة من شبكة ليبيا للتجارة لضمان أعلى معايير الجودة والمهنية.',
      descEn: 'Powered by Libya Trade Network to ensure the highest standards of quality and professionalism.',
    },
  ];

  return (
    <section className="py-24 bg-[#050A18] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1C2E5A] rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight"
          >
            {language === 'ar' ? 'لماذا تختار منصتنا؟' : 'Why Choose Our Platform?'}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg leading-relaxed"
          >
            {language === 'ar' 
              ? 'نحن نقدم حلولاً متكاملة لمتابعة الأسواق العالمية بدقة وموثوقية لا مثيل لها.' 
              : 'We provide integrated solutions for monitoring global markets with unparalleled accuracy and reliability.'}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#0A1128] border border-[#1C2E5A] p-8 rounded-3xl hover:border-[#D4AF37]/50 transition-all group hover:-translate-y-2 shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#121E3D] flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] group-hover:text-[#0A1128] transition-all text-[#D4AF37] shadow-lg">
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'ar' ? feature.titleAr : feature.titleEn}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {language === 'ar' ? feature.descAr : feature.descEn}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
