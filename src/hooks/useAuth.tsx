import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.endsWith('iitr.ac.in')) {
        setSession(session);
        setUser(session.user);
      } else if (session?.user) {
        // Sign out if not IITR email
        supabase.auth.signOut();
        toast.error("Only IITR email addresses are allowed");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (session.user.email?.endsWith('iitr.ac.in')) {
            setSession(session);
            setUser(session.user);
          } else {
            toast.error("Only IITR email addresses (iitr.ac.in) are allowed");
            await supabase.auth.signOut();
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};
