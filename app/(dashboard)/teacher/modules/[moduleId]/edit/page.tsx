'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Module = {
  id: string;
  title: string;
  content: string;
  teacher_id: string;
};

export default function EditModulePage() {
  const [module, setModule] = useState<Module | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  
  const { user } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

  // Create a custom supabase client with Clerk token
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
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          setError('Failed to load module. You might not have permission to edit it.');
        }
      } else if (data) {
        setModule(data);
        setTitle(data.title);
        setContent(data.content);
        
        // Check if this user has permission to edit
        if (user && data.teacher_id !== user.id) {
          setError('You do not have permission to edit this module.');
        }
      }
      
      setLoading(false);
    }

    loadModule();
  }, [user, moduleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const { error: updateError } = await client
        .from('modules')
        .update({
          title: title.trim(),
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);

      if (updateError) {
        throw updateError;
      }

      router.push(`/teacher/modules/${moduleId}`);
    } catch (err: any) {
      console.error('Error updating module:', err);
      setError(err.message || 'Failed to update module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p>Loading module...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/teacher/modules" className="flex items-center text-blue-500 hover:text-blue-700">
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

  if (error) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/teacher/modules" className="flex items-center text-blue-500 hover:text-blue-700">
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

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/teacher/modules/${moduleId}`} className="flex items-center text-blue-500 hover:text-blue-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Module
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">Edit Module</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Module Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter module title"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Module Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter module content"
            rows={12}
            disabled={isSubmitting}
            className="min-h-[300px]"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Updating...' : 'Update Module'}
          </Button>
        </div>
      </form>
    </div>
  );
} 