'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Module = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function StudentModuleDetailPage() {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

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
    if (!user || !moduleId) return;

    async function loadModule() {
      setLoading(true);
      setError('');
      
      const { data, error } = await client
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();
      
      if (error) {
        console.error('Error loading module:', error);
        setError('Failed to load module. It may not exist or you might not have permission to view it.');
      } else if (data) {
        setModule(data);
      }
      
      setLoading(false);
    }

    loadModule();
  }, [user, moduleId]);

  if (loading) {
    return (
      <div className="container py-8">
        <p>Loading module...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/student/modules" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/student/modules" className="flex items-center text-blue-500 hover:text-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Link>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          Module not found
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/student/modules" className="flex items-center text-blue-500 hover:text-blue-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">{module.title}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="mb-6 text-sm text-gray-500">
          Last updated: {new Date(module.updated_at).toLocaleString()}
        </div>
        
        <div className="prose max-w-none">
          {module.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
} 