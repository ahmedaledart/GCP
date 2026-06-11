import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const useVisitorTracking = () => {
  const location = useLocation();
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    const trackVisit = async () => {
      const path = location.pathname;
      
      // Avoid tracking multiple times per session for the exact same path
      if (trackedPaths.current.has(path)) return;
      trackedPaths.current.add(path);

      try {
        await supabase.from('site_visits').insert([{
          page_path: path,
          user_agent: navigator.userAgent
        }]);
      } catch (err) {
        console.error('Failed to log site visit');
      }
    };

    trackVisit();
  }, [location.pathname]);
};
