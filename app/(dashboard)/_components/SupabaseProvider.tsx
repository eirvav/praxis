'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
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

  // Create the Supabase client with Clerk token
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken({
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
  }, [session]);

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