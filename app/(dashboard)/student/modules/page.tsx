'use client';

import { useEffect, useState } from 'react';
import { useUser, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book } from 'lucide-react';

type Module = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function StudentModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { session } = useSession();

  // Create a custom supabase client that injects the Clerk Supabase token
  function createClerkSupabaseClient() {
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
            headers.set('Authorization', `Bearer ${clerkToken}`);

            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
      }
    );
  }

  const client = createClerkSupabaseClient();

  useEffect(() => {
    if (!user) return;

    async function loadModules() {
      setLoading(true);
      const { data, error } = await client.from('modules').select('*');
      
      if (!error) {
        setModules(data);
      } else {
        console.error('Error loading modules:', error);
      }
      
      setLoading(false);
    }

    loadModules();
  }, [user]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Available Modules</h1>

      {loading && <p>Loading modules...</p>}

      {!loading && modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No modules available yet</p>
          <p className="text-gray-500">Check back later for new content from your teachers</p>
        </div>
      )}

      {!loading && modules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 truncate">{module.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{module.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(module.updated_at).toLocaleDateString()}
                  </span>
                  <Link href={`/student/modules/${module.id}`}>
                    <Button>
                      <Book className="mr-2 h-4 w-4" />
                      Read
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 