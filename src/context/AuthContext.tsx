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
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session error:', error.message);
          try { await supabase.auth.signOut(); } catch (e) {}
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchPlatformUser(currentUser.id);
        } else {
          setPlatformUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        try { await supabase.auth.signOut(); } catch (e) {}
        setUser(null);
        setPlatformUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchPlatformUser(currentUser.id);
        } else {
          setPlatformUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPlatformUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('platform_users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.warn('Platform user fetch warning:', error.message);
        setPlatformUser(null);
      } else {
        setPlatformUser(data);
      }
    } catch (err) {
      console.error('Error fetching platform user:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
