export type Sector = 'الطاقة' | 'المعادن' | 'السلع الزراعية' | 'المؤشرات';
export type SectorEn = 'Energy' | 'Metals' | 'Agriculture' | 'Indices';
export type Trend = 'up' | 'down' | 'neutral';
export type MarketStatus = 'مفتوح' | 'مغلق';
export type MarketStatusEn = 'Open' | 'Closed';

export interface Commodity {
  id: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  sectorAr: Sector;
  sectorEn: SectorEn;
  price: number;
  prevClose: number;
  changeAmount: number;
  changePercent: number;
  high: number;
  low: number;
  unitAr: string;
  unitEn: string;
  trend: Trend;
  statusAr: MarketStatus;
  statusEn: MarketStatusEn;
  lastUpdate: string;
  history: { time: string; price: number }[];
}

const generateHistory = (basePrice: number, points: number = 24) => {
  const history = [];
  let currentPrice = basePrice;
  for (let i = points; i >= 0; i--) {
    const time = new Date(Date.now() - i * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const change = (Math.random() - 0.5) * (basePrice * 0.02);
    currentPrice += change;
    history.push({ time, price: Number(currentPrice.toFixed(2)) });
  }
  return history;
};

export const commoditiesData: Commodity[] = [
  // الطاقة (Updated with realistic Investing.com prices)
  {
    id: 'brent', nameAr: 'خام برنت', nameEn: 'Brent Crude', symbol: 'BRENT', sectorAr: 'الطاقة', sectorEn: 'Energy',
    price: 107.00, prevClose: 106.30, changeAmount: 0.70, changePercent: 0.66,
    high: 107.50, low: 106.00, unitAr: 'دولار / برميل', unitEn: 'USD / Barrel', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(107.00)
  },
  {
    id: 'wti', nameAr: 'خام غرب تكساس', nameEn: 'WTI Crude', symbol: 'WTI', sectorAr: 'الطاقة', sectorEn: 'Energy',
    price: 101.37, prevClose: 100.12, changeAmount: 1.25, changePercent: 1.25,
    high: 102.10, low: 99.80, unitAr: 'دولار / برميل', unitEn: 'USD / Barrel', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(101.37)
  },
  {
    id: 'ngas', nameAr: 'الغاز الطبيعي', nameEn: 'Natural Gas', symbol: 'NGAS', sectorAr: 'الطاقة', sectorEn: 'Energy',
    price: 1.85, prevClose: 1.90, changeAmount: -0.05, changePercent: -2.63,
    high: 1.92, low: 1.81, unitAr: 'دولار / مليون وحدة حرارية', unitEn: 'USD / MMBtu', trend: 'down', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(1.85)
  },
  {
    id: 'coal', nameAr: 'الفحم', nameEn: 'Coal', symbol: 'COAL', sectorAr: 'الطاقة', sectorEn: 'Energy',
    price: 135.50, prevClose: 135.00, changeAmount: 0.50, changePercent: 0.37,
    high: 136.20, low: 134.80, unitAr: 'دولار / طن', unitEn: 'USD / Ton', trend: 'up', statusAr: 'مغلق', statusEn: 'Closed',
    lastUpdate: new Date(Date.now() - 3600000).toISOString(), history: generateHistory(135.50)
  },
  
  // المعادن
  {
    id: 'gold', nameAr: 'الذهب', nameEn: 'Gold', symbol: 'XAU', sectorAr: 'المعادن', sectorEn: 'Metals',
    price: 2350.80, prevClose: 2345.50, changeAmount: 5.30, changePercent: 0.23,
    high: 2365.00, low: 2330.20, unitAr: 'دولار / أونصة', unitEn: 'USD / Ounce', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(2350.80)
  },
  {
    id: 'silver', nameAr: 'الفضة', nameEn: 'Silver', symbol: 'XAG', sectorAr: 'المعادن', sectorEn: 'Metals',
    price: 28.45, prevClose: 28.90, changeAmount: -0.45, changePercent: -1.56,
    high: 29.10, low: 28.20, unitAr: 'دولار / أونصة', unitEn: 'USD / Ounce', trend: 'down', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(28.45)
  },
  {
    id: 'copper', nameAr: 'النحاس', nameEn: 'Copper', symbol: 'COPPER', sectorAr: 'المعادن', sectorEn: 'Metals',
    price: 4.55, prevClose: 4.48, changeAmount: 0.07, changePercent: 1.56,
    high: 4.60, low: 4.45, unitAr: 'دولار / رطل', unitEn: 'USD / Lb', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(4.55)
  },
  {
    id: 'aluminum', nameAr: 'الألمنيوم', nameEn: 'Aluminum', symbol: 'ALUM', sectorAr: 'المعادن', sectorEn: 'Metals',
    price: 2550.00, prevClose: 2560.00, changeAmount: -10.00, changePercent: -0.39,
    high: 2580.00, low: 2540.00, unitAr: 'دولار / طن', unitEn: 'USD / Ton', trend: 'down', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(2550.00)
  },
  {
    id: 'iron', nameAr: 'خام الحديد', nameEn: 'Iron Ore', symbol: 'IRON', sectorAr: 'المعادن', sectorEn: 'Metals',
    price: 115.50, prevClose: 112.80, changeAmount: 2.70, changePercent: 2.39,
    high: 116.00, low: 111.50, unitAr: 'دولار / طن', unitEn: 'USD / Ton', trend: 'up', statusAr: 'مغلق', statusEn: 'Closed',
    lastUpdate: new Date(Date.now() - 7200000).toISOString(), history: generateHistory(115.50)
  },
  {
    id: 'platinum', nameAr: 'البلاتين', nameEn: 'Platinum', symbol: 'PLAT', sectorAr: 'المعادن', sectorEn: 'Metals',
    price: 985.20, prevClose: 995.50, changeAmount: -10.30, changePercent: -1.03,
    high: 1005.00, low: 980.00, unitAr: 'دولار / أونصة', unitEn: 'USD / Ounce', trend: 'down', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(985.20)
  },

  // السلع الزراعية
  {
    id: 'wheat', nameAr: 'القمح', nameEn: 'Wheat', symbol: 'WHEAT', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 620.50, prevClose: 615.25, changeAmount: 5.25, changePercent: 0.85,
    high: 625.00, low: 610.00, unitAr: 'سنت / بوشل', unitEn: 'Cent / Bushel', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(620.50)
  },
  {
    id: 'corn', nameAr: 'الذرة', nameEn: 'Corn', symbol: 'CORN', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 450.25, prevClose: 455.50, changeAmount: -5.25, changePercent: -1.15,
    high: 458.00, low: 448.00, unitAr: 'سنت / بوشل', unitEn: 'Cent / Bushel', trend: 'down', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(450.25)
  },
  {
    id: 'rice', nameAr: 'الأرز الخام', nameEn: 'Rough Rice', symbol: 'RICE', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 18.45, prevClose: 18.20, changeAmount: 0.25, changePercent: 1.37,
    high: 18.60, low: 18.10, unitAr: 'دولار / قنطار', unitEn: 'USD / Cwt', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(18.45)
  },
  {
    id: 'sugar', nameAr: 'السكر', nameEn: 'Sugar', symbol: 'SUGAR', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 22.15, prevClose: 22.05, changeAmount: 0.10, changePercent: 0.45,
    high: 22.30, low: 21.90, unitAr: 'سنت / رطل', unitEn: 'Cent / Lb', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(22.15)
  },
  {
    id: 'coffee', nameAr: 'القهوة', nameEn: 'Coffee', symbol: 'COFFEE', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 215.80, prevClose: 210.50, changeAmount: 5.30, changePercent: 2.52,
    high: 218.00, low: 208.00, unitAr: 'سنت / رطل', unitEn: 'Cent / Lb', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(215.80)
  },
  {
    id: 'cocoa', nameAr: 'الكاكاو', nameEn: 'Cocoa', symbol: 'COCOA', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 8500.00, prevClose: 8750.00, changeAmount: -250.00, changePercent: -2.86,
    high: 8800.00, low: 8400.00, unitAr: 'دولار / طن', unitEn: 'USD / Ton', trend: 'down', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(8500.00)
  },
  {
    id: 'soybeans', nameAr: 'فول الصويا', nameEn: 'Soybeans', symbol: 'SOY', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 1180.50, prevClose: 1175.00, changeAmount: 5.50, changePercent: 0.47,
    high: 1185.00, low: 1170.00, unitAr: 'سنت / بوشل', unitEn: 'Cent / Bushel', trend: 'up', statusAr: 'مفتوح', statusEn: 'Open',
    lastUpdate: new Date().toISOString(), history: generateHistory(1180.50)
  },
  {
    id: 'palmoil', nameAr: 'زيت النخيل', nameEn: 'Palm Oil', symbol: 'PALM', sectorAr: 'السلع الزراعية', sectorEn: 'Agriculture',
    price: 3950.00, prevClose: 3980.00, changeAmount: -30.00, changePercent: -0.75,
    high: 4000.00, low: 3920.00, unitAr: 'رينغيت / طن', unitEn: 'MYR / Ton', trend: 'down', statusAr: 'مغلق', statusEn: 'Closed',
    lastUpdate: new Date(Date.now() - 14400000).toISOString(), history: generateHistory(3950.00)
  }
];

export const marketNews = [
  { id: 1, titleAr: 'ارتفاع أسعار الذهب وسط توترات جيوسياسية', titleEn: 'Gold prices rise amid geopolitical tensions', timeAr: 'منذ 15 دقيقة', timeEn: '15 mins ago', typeAr: 'عاجل', typeEn: 'Breaking' },
  { id: 2, titleAr: 'تراجع مخزونات النفط الأمريكية بأكثر من المتوقع', titleEn: 'US oil inventories fall more than expected', timeAr: 'منذ ساعة', timeEn: '1 hour ago', typeAr: 'تحليل', typeEn: 'Analysis' },
  { id: 3, titleAr: 'أسعار الكاكاو تسجل مستويات قياسية جديدة بسبب نقص الإمدادات', titleEn: 'Cocoa prices hit new record highs due to supply shortages', timeAr: 'منذ ساعتين', timeEn: '2 hours ago', typeAr: 'سوق', typeEn: 'Market' },
  { id: 4, titleAr: 'توقعات بزيادة الطلب على النحاس مع نمو قطاع السيارات الكهربائية', titleEn: 'Expectations of increased copper demand with EV sector growth', timeAr: 'منذ 3 ساعات', timeEn: '3 hours ago', typeAr: 'تقرير', typeEn: 'Report' },
];
