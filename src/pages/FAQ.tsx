import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FAQ = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
  ];

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1C2E5A] mb-6">
            <HelpCircle size={32} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">{t('faqTitle')}</h1>
          <p className="text-gray-400">{t('faqSub')}</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-[#121E3D] border border-[#1C2E5A] rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-right hover:bg-[#1C2E5A] transition-colors"
              >
                <span className="text-lg font-semibold text-white">{faq.q}</span>
                {openIndex === index ? (
                  <ChevronUp size={20} className="text-[#D4AF37]" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 py-5 border-t border-[#1C2E5A] bg-[#0A1128]/50">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
