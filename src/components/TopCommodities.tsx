import React from 'react';
import { useMarketData } from '../context/MarketContext';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { PriceDisplay } from './PriceDisplay';

export const TopCommodities = () => {
  const { data } = useMarketData();
  const { t, language } = useLanguage();
  // Select key commodities to highlight
  const highlights = data.filter(c => ['brent', 'gold', 'wheat', 'copper'].includes(c.id));

  return (
    <section className="py-12 bg-[#0A1128]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="text-[#D4AF37]" />
            {t('topCommoditiesTitle')}
          </h2>
          <a href="#table" className="text-[#D4AF37] hover:text-[#E5C158] text-sm font-medium flex items-center gap-1 transition-colors">
            {t('viewAll')}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map(item => {
            const isUp = item.trend === 'up';
            const color = isUp ? '#10B981' : '#EF4444';
            const bgColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const name = language === 'ar' ? item.nameAr : item.nameEn;
            const sector = language === 'ar' ? item.sectorAr : item.sectorEn;
            const unit = language === 'ar' ? item.unitAr : item.unitEn;

            return (
              <div key={item.id} className="bg-[#121E3D] rounded-2xl p-6 border border-[#1C2E5A] hover:border-[#2A4075] transition-all group relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full mix-blend-screen filter blur-3xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: color }}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.symbol} • {sector}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1`} style={{ backgroundColor: bgColor, color: color }} dir="ltr">
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(item.changePercent).toFixed(2)}%
                  </div>
                </div>

                <div className="mb-4 relative z-10">
                  <PriceDisplay price={item.price} className="text-3xl font-black text-white block" />
                  <div className="text-sm text-gray-400 mt-1">
                    {unit}
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="h-16 w-full mt-4 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.history}>
                      <defs>
                        <linearGradient id={`gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis domain={['dataMin', 'dataMax']} hide />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={color} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={`url(#gradient-${item.id})`} 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
