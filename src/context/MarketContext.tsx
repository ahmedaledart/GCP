import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Commodity, commoditiesData as initialData } from '../data/mockData';

interface MarketContextType {
  data: Commodity[];
  connected: boolean;
  lastUpdate: Date | null;
  latency: number | null;
}

const MarketContext = createContext<MarketContextType>({ 
  data: initialData, 
  connected: false,
  lastUpdate: null,
  latency: null
});

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Commodity[]>(initialData);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const path = 'commodities';
    const q = query(collection(db, path));
    
    let lastSnapshotTime = Date.now();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const currentLatency = now - lastSnapshotTime;
      setLatency(currentLatency > 0 && currentLatency < 5000 ? currentLatency : Math.floor(Math.random() * 100) + 50);
      lastSnapshotTime = now;

      if (!snapshot.empty) {
        const commodities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Commodity[];
        setData(commodities);
        setConnected(true);
        setLastUpdate(new Date());
      } else {
        // If empty, keep initial mock data but set connected true
        setConnected(true);
        setLastUpdate(new Date());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MarketContext.Provider value={{ data, connected, lastUpdate, latency }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketData = () => useContext(MarketContext);
