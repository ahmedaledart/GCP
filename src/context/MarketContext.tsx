import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Commodity, commoditiesData as mockData } from '../data/mockData';

interface MarketContextType {
  data: Commodity[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  latency: number | null;
  isMockData: boolean;
}

const MarketContext = createContext<MarketContextType>({ 
  data: mockData, 
  connected: false,
  loading: true,
  error: null,
  lastUpdate: null,
  latency: null,
  isMockData: true
});

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Commodity[]>([]); 
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const fetchCommodities = async () => {
      try {
        const fetchStart = Date.now();
        const { data: commodities, error: supaError } = await supabase
          .from('commodities')
          .select('*')
          .order('sector', { ascending: true }); // Make sure table is correctly ordered or mapped, we maps it later anyway

        if (supaError) {
          throw supaError;
        }

        if (isMounted) {
          setLatency(Date.now() - fetchStart);
          setLoading(false);
          setError(null);
          
          if (commodities && commodities.length > 0) {
            setIsMockData(false);
            // Map Supabase fields to the application's expected Commodity fields
            // Filter visible items
            const mappedCommodities = commodities
              .filter((c: any) => c.is_visible !== false)
              .map((c: any) => ({
                id: String(c.id),
                nameAr: c.name_ar,
                nameEn: c.name_en,
                symbol: c.symbol,
                sectorAr: c.sector, // If Supabase only has 'sector', mapping needs to be handled
                sectorEn: c.sector === 'الطاقة' ? 'Energy' : c.sector === 'المعادن' ? 'Metals' : c.sector === 'السلع الزراعية' ? 'Agriculture' : c.sector === 'المؤشرات' ? 'Indices' : 'Energy',
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
              })) as unknown as Commodity[];
            
            setData(mappedCommodities);
            setConnected(true);
            setLastUpdate(new Date());
          } else {
            setIsMockData(false);
            setData([]); // Empty state
            setConnected(true);
            setLastUpdate(new Date());
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Supabase fetch error:', err);
          setLoading(false);
          setError(err.message || 'فشل الاتصال بـ Supabase.');
          setConnected(false);
          setIsMockData(true);
          setData(mockData);
        }
      }
    };

    fetchCommodities();

    // Subscribe to realtime updates
    subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commodities' },
        (payload) => {
          setLatency(Math.floor(Math.random() * 50) + 10); // Simulated low latency for websockets
          fetchCommodities(); // Re-fetch on any change to ensure order and full data
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (isMounted) setConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          if (isMounted) {
            setConnected(false);
            setIsMockData(true);
            setError('Realtime channel error');
          }
        }
      });

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  return (
    <MarketContext.Provider value={{ data, connected, loading, error, lastUpdate, latency, isMockData }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketData = () => useContext(MarketContext);
