import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  is_active: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: any;
  platformUser: PlatformUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  statusMessage: { ar: string, en: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Session error:', error.message);
          // If getSession fails, just proceed as guest
        }
        
        const currentUser = session?.user ?? null;
        if (isMounted) setUser(currentUser);
        
        if (currentUser) {
          await fetchPlatformUser(currentUser.id, isMounted);
        } else {
          if (isMounted) setPlatformUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setUser(null);
          setPlatformUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchPlatformUser(currentUser.id, isMounted);
        } else {
          setPlatformUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchPlatformUser = async (userId: string, isMounted: boolean) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Platform user fetch timed out')), 5000)
      );
      
      const fetchPromise = supabase
        .from('platform_users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.warn('Platform user fetch warning:', error.message);
        if (isMounted) setPlatformUser(null);
      } else {
        if (isMounted) setPlatformUser(data);
      }
    } catch (err: any) {
      console.error('Error fetching platform user:', err.message || err);
      if (isMounted) setPlatformUser(null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Signout error:', err);
    } finally {
      setUser(null);
      setPlatformUser(null);
    }
  };

  const getStatusMessage = () => {
    if (!platformUser) return null;
    
    if (platformUser.approval_status === 'suspended' || !platformUser.is_active) {
      return {
        ar: 'تم إيقاف حسابك، يرجى التواصل مع إدارة المنصة',
        en: 'Your account has been suspended, please contact the platform management.'
      };
    }

    if (platformUser.approval_status === 'pending') {
      return {
        ar: 'حسابك قيد المراجعة ولم تتم الموافقة بعد',
        en: 'Your account is under review and has not been approved yet.'
      };
    }

    if (platformUser.approval_status === 'rejected') {
      return {
        ar: 'نعتذر، لم تتم الموافقة على طلب الوصول',
        en: 'We apologize, your access request has not been approved.'
      };
    }

    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      platformUser, 
      loading, 
      signOut,
      statusMessage: getStatusMessage()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

