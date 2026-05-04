import { useEffect } from 'react';
import { 
  db, OperationType, handleFirestoreError,
  doc, updateDoc, increment, getDoc, setDoc 
} from '../lib/api';

export const VisitorTracker = () => {
  useEffect(() => {
    const trackVisitor = async () => {
      // Check if already tracked in this session
      const sessionTracked = sessionStorage.getItem('visitor_tracked');
      if (sessionTracked) return;

      const statsRef = doc(db, 'stats', 'global');
      
      try {
        const statsDoc = await getDoc(statsRef);
        
        if (!statsDoc.exists()) {
          // If the stats doc doesn't exist, we don't track but don't crash
          return;
        }

        await updateDoc(statsRef, {
          totalVisitors: increment(1)
        });
        
        sessionStorage.setItem('visitor_tracked', 'true');
      } catch (error: any) {
        // Handle common firestore errors silently for visitors but log internally
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          console.warn('Visitor tracking skipped: Backend is offline');
          return;
        }
        
        try {
          handleFirestoreError(error, OperationType.WRITE, 'stats/global');
        } catch (e) {
          console.error('Visitor tracking failed:', e);
        }
      }
    };

    trackVisitor();
  }, []);

  return null;
};
