import React from 'react';
import { Code2, Download, Star, HeadphonesIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';

export const Services = () => {
  const { language } = useLanguage();

  const services = [
    {
      icon: Code2,
      titleAr: 'الربط البرمجي (API)',
      titleEn: 'API Integration',
      descAr: 'نوفر خدمة الربط البرمجي المباشر لتمكين المؤسسات والمنصات الرقمية من سحب البيانات والأسعار العالمية بشكل آلي وآمن، مع تحديثات مستمرة تدعم التكامل مع الأنظمة الداخلية ولوحات المتابعة والتطبيقات المختلفة.',
      descEn: 'We provide direct API integration services to enable institutions and digital platforms to pull global data and prices automatically and securely, with continuous updates that support integration with internal systems, dashboards, and various applications.',
    },
    {
      icon: Download,
      titleAr: 'تصدير البيانات المخصصة',
      titleEn: 'Custom Data Export',
      descAr: 'إمكانية تصدير البيانات وفق احتياجات المستخدم بصيغ متعددة مثل Excel وPDF وCSV، مع تخصيص نطاق البيانات والفترات الزمنية ونوع السلع أو الخامات، بما يدعم أعمال التحليل وإعداد التقارير واتخاذ القرار.',
      descEn: 'The ability to export data according to user needs in multiple formats such as Excel, PDF, and CSV, with customization of data ranges, time periods, and types of commodities or raw materials, supporting analysis, reporting, and decision-making.',
    },
    {
      icon: Star,
      titleAr: 'الاشتراكات المميزة',
      titleEn: 'Premium Subscriptions',
      descAr: 'نقدم باقات اشتراك مميزة تتيح الوصول إلى مزايا إضافية تشمل بيانات أكثر تفصيلًا، تحديثات أسرع، محتوى تحليلي متخصص، أدوات مقارنة متقدمة، وتنبيهات ذكية للأسعار والتغيرات في الأسواق العالمية.',
      descEn: 'We offer premium subscription packages that provide access to additional benefits including more detailed data, faster updates, specialized analytical content, advanced comparison tools, and smart alerts for prices and changes in global markets.',
    },
    {
      icon: HeadphonesIcon,
      titleAr: 'الدعم الفني المتقدم',
      titleEn: 'Advanced Technical Support',
      descAr: 'فريق دعم فني متخصص لمتابعة احتياجات المشتركين وتقديم المساندة الفنية بشكل سريع واحترافي، مع خدمات المساعدة في الربط والتشغيل وحل المشكلات الفنية وضمان استمرارية الأداء بكفاءة عالية.',
      descEn: 'A specialized technical support team to monitor subscriber needs and provide technical assistance quickly and professionally, with services to assist in integration, operation, resolving technical issues, and ensuring continuous high-efficiency performance.',
    },
  ];

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#050A18]">
      <section className="py-12 relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37] rounded-full blur-[150px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight"
            >
              {language === 'ar' ? 'خدماتنا المميزة' : 'Our Premium Services'}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-lg leading-relaxed"
            >
              {language === 'ar' 
                ? 'نقدم مجموعة من الخدمات المتخصصة لتلبية احتياجات المؤسسات والأفراد في متابعة وتحليل الأسواق العالمية.' 
                : 'We offer a range of specialized services to meet the needs of institutions and individuals in monitoring and analyzing global markets.'}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#121E3D] border border-[#1C2E5A] p-8 md:p-10 rounded-3xl hover:border-[#D4AF37]/50 transition-all group shadow-xl flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#0A1128] flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-[#0A1128] transition-all text-[#D4AF37] shadow-lg border border-[#1C2E5A] group-hover:border-[#D4AF37]">
                  <service.icon size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#D4AF37] transition-colors">
                    {language === 'ar' ? service.titleAr : service.titleEn}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-base">
                    {language === 'ar' ? service.descAr : service.descEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
