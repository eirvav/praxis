'use client';

import { createContext, useContext, useMemo, ReactNode, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

// Context type
type SupabaseContextType = {
  supabase: SupabaseClient | null;
};

// Create context
const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
});

// Provider component
export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const hasLoggedInstance = useRef(false);
  const clientInstanceId = useRef(Math.random().toString(36).substring(7));
  
  // Store session in ref to avoid dependency issues
  const sessionRef = useRef(session);
  
  // Update the ref when session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  
  // Only log session state once to reduce noise
  if (!hasLoggedInstance.current) {
    console.log('[SupabaseProvider] Initial session state:', !!session);
    hasLoggedInstance.current = true;
  }

  // Monitor window focus/blur events - just for debugging
  useEffect(() => {
    const handleFocus = () => {
      console.log('[SupabaseProvider] Window FOCUSED - No client recreation will happen');
    };
    
    const handleBlur = () => {
      console.log('[SupabaseProvider] Window BLURRED');
    };
    
    const handleVisibilityChange = () => {
      console.log('[SupabaseProvider] Visibility changed:', document.visibilityState);
    };
    
    // Add event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Log initial render
    console.log('[SupabaseProvider] Effect mounted, adding window event listeners');
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('[SupabaseProvider] Effect unmounted, removed window event listeners');
    };
  }, []);

  // Create the Supabase client with Clerk token
  const supabase = useMemo(() => {
    console.log(`[SupabaseProvider] Creating Supabase client instance ID: ${clientInstanceId.current}`);
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            // Use the ref to always get the latest session without causing dependency issues
            const clerkToken = await sessionRef.current?.getToken({
              template: 'supabase',
            });

            const headers = new Headers(options?.headers);
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`);
            }

            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
      }
    );
  }, []); // Empty dependency array since we're using the ref

  const value = {
    supabase,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to use the Supabase client
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context.supabase;
}; 