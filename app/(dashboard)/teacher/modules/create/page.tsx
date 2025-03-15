'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateModulePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useUser();
  const { session } = useSession();
  const router = useRouter();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const { data, error: insertError } = await client
        .from('modules')
        .insert({
          title: title.trim(),
          content: content.trim(),
          teacher_id: user?.id
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      router.push('/teacher/modules');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating module:', err);
      setError(err.message || 'Failed to create module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/teacher/modules" className="flex items-center text-blue-500 hover:text-blue-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">Create New Module</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
            {isSubmitting ? 'Creating...' : 'Create Module'}
          </Button>
        </div>
      </form>
    </div>
  );
} 