import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Commodity, commoditiesData as mockData } from '../data/mockData';

interface MarketContextType {
  data: Commodity[];
  news: any[];
  analyses: any[];
  history: any[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  latency: number | null;
  isMockData: boolean;
  fetchCommodities: () => Promise<void>;
  fetchNews: () => Promise<void>;
  fetchAnalyses: () => Promise<void>;
  fetchHistory: (symbol?: string) => Promise<void>;
}

const MarketContext = createContext<MarketContextType>({ 
  data: mockData, 
  news: [],
  analyses: [],
  history: [],
  connected: false,
  loading: true,
  error: null,
  lastUpdate: null,
  latency: null,
  isMockData: true,
  fetchCommodities: async () => {},
  fetchNews: async () => {},
  fetchAnalyses: async () => {},
  fetchHistory: async () => {}
});

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Commodity[]>([]); 
  const [news, setNews] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const historySymbolRef = React.useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  const fetchCommodities = async () => {
    try {
      const fetchStart = Date.now();
      const { data: commodities, error: supaError } = await supabase
        .from('commodities')
        .select('*')
        .order('sector', { ascending: true }); 

      if (supaError) throw supaError;

      setLatency(Date.now() - fetchStart);
      setLoading(false);
      setError(null);
      
      if (commodities && commodities.length > 0) {
        setIsMockData(false);
        const mappedCommodities = commodities
          .filter((c: any) => c.is_visible !== false)
          .map((c: any) => {
            let secAr = c.sector;
            let secEn = c.sector;
            if (c.sector === 'energy' || c.sector === 'النفط' || c.sector === 'Energy') { secAr = 'الطاقة'; secEn = 'Energy'; }
            else if (c.sector === 'metals' || c.sector === 'المعادن' || c.sector === 'Metals') { secAr = 'المعادن'; secEn = 'Metals'; }
            else if (c.sector === 'commodities' || c.sector === 'agriculture' || c.sector === 'السلع الزراعية' || c.sector === 'السلع الأساسية' || c.sector === 'Agriculture') { secAr = 'السلع الأساسية'; secEn = 'Commodities'; }
            else if (c.sector === 'forex' || c.sector === 'العملات' || c.sector === 'Currencies') { secAr = 'العملات'; secEn = 'Currencies'; }
            else if (c.sector === 'indices' || c.sector === 'المؤشرات' || c.sector === 'Indices') { secAr = 'المؤشرات'; secEn = 'Indices'; }
            else if (c.sector === 'shipping' || c.sector === 'الشحن' || c.sector === 'Shipping') { secAr = 'الشحن'; secEn = 'Shipping'; }

            return {
              id: String(c.id),
              nameAr: c.name_ar,
              nameEn: c.name_en,
              symbol: c.symbol,
              sector: c.sector,
              sectorAr: secAr,
              sectorEn: secEn,
              price: c.price,
              changePercent: c.change_percent,
              trend: c.trend,
              high: c.high,
              low: c.low,
              unitAr: c.unit || '',
              unitEn: c.unit || '',
              source: c.source,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
              isVisible: c.is_visible,
              prevClose: c.previous_price,
              changeAmount: c.change_value,
              statusAr: c.status === 'active' ? 'مفتوح' : 'مغلق',
              statusEn: c.status === 'active' ? 'Open' : 'Closed',
              lastUpdate: c.updated_at || new Date().toISOString(),
              history: []
            };
          }) as unknown as Commodity[];
        
        setData(mappedCommodities);
        setConnected(true);
        setLastUpdate(new Date());
      } else {
        setIsMockData(false);
        setData([]); 
        setConnected(true);
        setLastUpdate(new Date());
      }
    } catch (err: any) {
      console.warn('Supabase commodities fetch error:', err);
      if (data.length === 0) {
        setError(err.message || 'فشل الاتصال بـ Supabase.');
        setConnected(false);
        setIsMockData(true);
        setData(mockData);
      }
    }
  };

  const fetchNews = async () => {
    try {
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      
      if (!newsError && newsData) {
        setNews(newsData);
      }
    } catch (err) {
      console.warn('Supabase news fetch error:', err);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (!analysesError && analysesData) {
        setAnalyses(analysesData);
      }
    } catch (err) {
      console.warn('Supabase analyses fetch error:', err);
    }
  };

  const fetchHistory = async (symbol?: string) => {
    const sym = symbol || historySymbolRef.current;
    if (!sym) return;
    historySymbolRef.current = sym;
    
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('commodity_price_history')
        .select('*')
        .eq('symbol', sym)
        .order('recorded_at', { ascending: true });
      
      if (!historyError && historyData) {
        setHistory(historyData);
      }
    } catch (err) {
      console.warn('Supabase history fetch error:', err);
    }
  };

  useEffect(() => {
    let commoditySubscription: any = null;
    let sectorSubscription: any = null;
    let newsSubscription: any = null;
    let analysesSubscription: any = null;
    let historySubscription: any = null;
    let isMounted = true;

    // Initial fetches
    fetchCommodities();
    fetchNews();
    fetchAnalyses();
    // fetchHistory(); // Don't fetch all history by default, wait for requests or just let it be empty

    // Subscriptions with robust fallback
    const handleSubscribe = (status: string) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime unavailable, using normal Supabase fetch');
      }
    };

    commoditySubscription = supabase.channel('commodities-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'commodities' }, () => fetchCommodities()).subscribe(handleSubscribe);
    sectorSubscription = supabase.channel('sectors-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'sectors' }, () => fetchCommodities()).subscribe(handleSubscribe);
    newsSubscription = supabase.channel('news-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => fetchNews()).subscribe(handleSubscribe);
    analysesSubscription = supabase.channel('analyses-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'analyses' }, () => fetchAnalyses()).subscribe(handleSubscribe);
    historySubscription = supabase.channel('history-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'commodity_price_history' }, () => {
      // Re-fetch current history if it exists
      if (historySymbolRef.current) {
        fetchHistory(historySymbolRef.current);
      }
    }).subscribe(handleSubscribe);

    return () => {
      isMounted = false;
      if (commoditySubscription) supabase.removeChannel(commoditySubscription);
      if (sectorSubscription) supabase.removeChannel(sectorSubscription);
      if (newsSubscription) supabase.removeChannel(newsSubscription);
      if (analysesSubscription) supabase.removeChannel(analysesSubscription);
      if (historySubscription) supabase.removeChannel(historySubscription);
    };
  }, []);

  return (
    <MarketContext.Provider value={{ 
      data, news, analyses, history, connected, loading, error, lastUpdate, latency, isMockData,
      fetchCommodities, fetchNews, fetchAnalyses, fetchHistory
    }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketData = () => useContext(MarketContext);
