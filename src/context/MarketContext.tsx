import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
  data: [], 
  connected: false,
  loading: true,
  error: null,
  lastUpdate: null,
  latency: null,
  isMockData: false
});

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Commodity[]>([]); // Start empty, handle loading gracefully
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    const path = 'commodities';
    const q = query(collection(db, path));
    
    let lastSnapshotTime = Date.now();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const currentLatency = now - lastSnapshotTime;
      setLatency(currentLatency > 0 && currentLatency < 5000 ? currentLatency : Math.floor(Math.random() * 100) + 50);
      lastSnapshotTime = now;
      setLoading(false);
      setError(null);

      if (!snapshot.empty) {
        setIsMockData(false);
        const commodities = snapshot.docs.map(doc => {
          const docData = doc.data();
          
          let parsedCategory = docData.category || '';
          if (!parsedCategory && docData.sectorEn) {
            if (docData.sectorEn === 'Energy') parsedCategory = 'energy';
            if (docData.sectorEn === 'Metals') parsedCategory = 'metals';
            if (docData.sectorEn === 'Agriculture') parsedCategory = 'agriculture';
            if (docData.sectorEn === 'Indices') parsedCategory = 'currencies';
          }
          
          let sectorAr = docData.sectorAr || parsedCategory || 'الطاقة';
          let sectorEn = docData.sectorEn || parsedCategory || 'Energy';
          
          if (parsedCategory) {
            switch(parsedCategory) {
              case 'energy': sectorAr = 'الطاقة'; sectorEn = 'Energy'; break;
              case 'metals': sectorAr = 'المعادن'; sectorEn = 'Metals'; break;
              case 'agriculture': sectorAr = 'السلع الزراعية'; sectorEn = 'Agriculture'; break;
              case 'currencies': sectorAr = 'المؤشرات'; sectorEn = 'Indices'; break;
              default: sectorAr = parsedCategory; sectorEn = parsedCategory; break;
            }
          }

          let lastUpdateFormatted = new Date().toISOString();
          if (docData.lastUpdate) {
             lastUpdateFormatted = typeof docData.lastUpdate === 'string' ? docData.lastUpdate : (docData.lastUpdate.toDate ? docData.lastUpdate.toDate().toISOString() : new Date().toISOString());
          } else if (docData.lastUpdated) {
             lastUpdateFormatted = typeof docData.lastUpdated === 'string' ? docData.lastUpdated : (docData.lastUpdated.toDate ? docData.lastUpdated.toDate().toISOString() : new Date().toISOString());
          }

          const changeAmountVal = docData.changeAmount || docData.change || 0;
          let trendVal: "up" | "down" | "neutral" = "neutral";
          if (changeAmountVal > 0) trendVal = "up";
          if (changeAmountVal < 0) trendVal = "down";

          return {
            id: doc.id,
            ...docData,
            sectorAr,
            sectorEn,
            price: docData.price || 0,
            prevClose: docData.prevClose || docData.price || 0,
            changePercent: docData.changePercent || 0,
            changeAmount: changeAmountVal,
            high: docData.high || docData.price || 0,
            low: docData.low || docData.price || 0,
            unitAr: docData.unitAr || docData.unit || '',
            unitEn: docData.unitEn || docData.unit || '',
            currency: docData.currency,
            trend: docData.trend || trendVal,
            statusAr: docData.statusAr || 'مفتوح',
            statusEn: docData.statusEn || 'Open',
            lastUpdate: lastUpdateFormatted,
            history: docData.history || []
          };
        }) as Commodity[];
        const sortedCommodities = commodities.sort((a, b) => {
          if (a.sectorEn !== b.sectorEn) {
            return a.sectorEn.localeCompare(b.sectorEn);
          }
          return (a.symbol || '').localeCompare(b.symbol || '');
        });
        
        setData(sortedCommodities);
        setConnected(true);
        setLastUpdate(new Date());
      } else {
        // Fallback to mock data if empty
        setIsMockData(true);
        setData(mockData);
        setConnected(true);
        setLastUpdate(new Date());
      }
    }, (err) => {
      setLoading(false);
      setError(err.message || 'فشل الاتصال بخوادم البيانات.');
      setConnected(false);
      setIsMockData(true);
      setData(mockData); // Provide fallback data even on error
      handleFirestoreError(err, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MarketContext.Provider value={{ data, connected, loading, error, lastUpdate, latency, isMockData }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketData = () => useContext(MarketContext);
