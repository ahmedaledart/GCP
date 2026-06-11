import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const useVisitorTracking = () => {
  const location = useLocation();
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackVisit = async () => {
      if (hasTracked.current) return;
      hasTracked.current = true;

      const path = location.pathname;
      
      // Fire and forget
      try {
        await supabase.from('site_visits').insert([{
          page_path: path,
          user_agent: navigator.userAgent
        }]);
      } catch (err) {
        console.warn('Failed to log site visit', err);
      }
    };

    trackVisit();
  }, []);
};
