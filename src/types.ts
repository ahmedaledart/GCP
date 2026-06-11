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
  sector?: string;
  price: number;
  prevClose: number;
  changeAmount: number;
  changePercent: number;
  high: number;
  low: number;
  unitAr: string;
  unitEn: string;
  currency?: string;
  trend: Trend;
  statusAr: MarketStatus;
  statusEn: MarketStatusEn;
  lastUpdate: string;
  history: { time: string; price: number }[];
}
