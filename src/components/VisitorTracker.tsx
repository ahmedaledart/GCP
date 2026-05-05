import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const VisitorTracker = () => {
  useEffect(() => {
    const trackVisitor = async () => {
      // Check if already tracked in this session
      const sessionTracked = sessionStorage.getItem('visitor_tracked');
      if (sessionTracked) return;

      try {
        // Increment visitor count in platform_settings
        // We'll fetch, increment, then upsert for simplicity since Supabase increment needs RPC usually
        const { data: settings } = await supabase.from('platform_settings').select('*').eq('key', 'total_visitors').single();
        
        let currentCount = 0;
        if (settings) {
          currentCount = parseInt(settings.value as string) || 0;
        }

        await supabase.from('platform_settings').upsert({
          key: 'total_visitors',
          value: (currentCount + 1).toString()
        }, { onConflict: 'key' });
        
        sessionStorage.setItem('visitor_tracked', 'true');
      } catch (error: any) {
        console.error('Visitor tracking failed:', error);
      }
    };

    trackVisitor();
  }, []);

  return null;
};
