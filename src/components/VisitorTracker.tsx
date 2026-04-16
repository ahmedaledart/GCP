import { useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';

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
          // Initialize stats if it doesn't exist (this might fail due to rules, but admin can create it)
          // Actually, rules allow create only for admin, so we should handle that.
          // For now, assume it exists or admin will create it.
          console.warn('Stats document does not exist. Visitor tracking skipped.');
          return;
        }

        await updateDoc(statsRef, {
          totalVisitors: increment(1)
        });
        
        sessionStorage.setItem('visitor_tracked', 'true');
      } catch (error) {
        // Silently fail or log for debugging
        console.error('Error tracking visitor:', error);
      }
    };

    trackVisitor();
  }, []);

  return null;
};
