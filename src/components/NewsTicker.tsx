import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone } from 'lucide-react';

interface NewsItem {
  id: string;
  text_ar: string;
  text_en: string;
  active: boolean;
  createdAt: any;
}

export const NewsTicker = () => {
  const { language } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const path = 'news_ticker';
    const q = query(
      collection(db, path),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      setNews(newsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  if (news.length === 0) return null;

  // Duplicate news for seamless loop
  const displayNews = [...news, ...news, ...news];

  return (
    <div className="bg-[#1C2E5A] border-b border-[#D4AF37]/30 py-2 overflow-hidden relative flex items-center h-10">
      <div className="bg-[#D4AF37] text-[#0A1128] px-4 py-1 rounded-l-full text-xs font-bold whitespace-nowrap z-30 flex items-center gap-2 shadow-lg ml-0 relative">
        <Megaphone size={14} />
        <span>{language === 'ar' ? 'أخبار حية' : 'LIVE NEWS'}</span>
      </div>
      
      <div className="flex-grow overflow-hidden relative h-full flex items-center">
        <motion.div
          className="flex items-center gap-12 whitespace-nowrap px-8"
          animate={{
            x: language === 'ar' ? [0, 1000] : [0, -1000],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {displayNews.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]"></span>
              <p className="text-white text-sm font-medium tracking-wide">
                {language === 'ar' ? item.text_ar : item.text_en}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gradient overlays for smooth fade edges */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#1C2E5A] to-transparent z-20 pointer-events-none"></div>
      <div className="absolute left-24 top-0 bottom-0 w-20 bg-gradient-to-r from-[#1C2E5A] to-transparent z-20 pointer-events-none"></div>
    </div>
  );
};
