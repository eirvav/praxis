'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash } from 'lucide-react';

type Module = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function TeacherModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { session } = useSession();
  const router = useRouter();

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

  async function deleteModule(moduleId: string) {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    const { error } = await client
      .from('modules')
      .delete()
      .eq('id', moduleId);
    
    if (error) {
      console.error('Error deleting module:', error);
      return;
    }
    
    // Refresh the modules list
    setModules(modules.filter(module => module.id !== moduleId));
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Modules</h1>
        <Link href="/teacher/modules/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        </Link>
      </div>

      {loading && <p>Loading your modules...</p>}

      {!loading && modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">You haven't created any modules yet</p>
          <Link href="/teacher/modules/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Module
            </Button>
          </Link>
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
                  <div className="flex space-x-2">
                    <Link href={`/teacher/modules/${module.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/teacher/modules/${module.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteModule(module.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 