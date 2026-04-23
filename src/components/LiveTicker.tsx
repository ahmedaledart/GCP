import React from 'react';
import { useMarketData } from '../context/MarketContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PriceDisplay } from './PriceDisplay';

export const LiveTicker = () => {
  const { data } = useMarketData();
  const { language } = useLanguage();
  // Duplicate data to create a seamless loop
  const tickerItems = [...data, ...data];

  return (
    <div className="bg-[#121E3D] border-b border-[#1C2E5A] overflow-hidden whitespace-nowrap py-2 flex items-center">
      <div className="flex animate-ticker">
        {tickerItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex items-center gap-3 px-6 border-l border-[#1C2E5A] last:border-none">
            <span className="text-sm font-medium text-gray-200">{language === 'ar' ? item.nameAr : item.nameEn}</span>
            <div className="flex items-center gap-1" dir="ltr">
              <span className="text-xs text-gray-500 font-sans font-normal">
                {item.currency === 'LYD' ? 'د.ل' : item.currency === 'EUR' ? '€' : item.currency === 'USD' ? '$' : (item.currency || '$')}
              </span>
              <PriceDisplay price={item.price} className="text-sm font-bold text-white" />
            </div>
            <div className={`flex items-center text-xs font-bold ${item.trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'}`} dir="ltr">
              {item.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{Math.abs(item.changePercent || 0).toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
