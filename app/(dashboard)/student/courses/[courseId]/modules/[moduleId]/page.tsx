'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/admin-panel/content-layout';
import SlideViewer from '@/app/(fullscreen)/_components/SlideViewer';

interface Module {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  course_id: string;
}

export default function StudentCourseModuleDetailPage() {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;

  useEffect(() => {
    if (!user || !supabase || !moduleId || !courseId) return;

    async function loadModule() {
      setLoading(true);
      setError('');
      
      try {
        const { data, error } = await supabase!
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .eq('course_id', courseId)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          setError('Module not found or you might not have permission to view it.');
          return;
        }
        
        setModule(data);
      } catch (err: any) {
        console.error('Error loading module:', err);
        setError(err.message || 'Failed to load module.');
      } finally {
        setLoading(false);
      }
    }

    loadModule();
  }, [user, supabase, moduleId, courseId]);

  if (loading) {
    return (
      <ContentLayout title="Module Details">
        <div className="flex items-center justify-center h-64">
          <p>Loading module...</p>
        </div>
      </ContentLayout>
    );
  }

  if (error) {
    return (
      <ContentLayout title="Error">
        <div className="mb-6">
          <Link href={`/student/courses/${courseId}`} className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </ContentLayout>
    );
  }

  if (!module) {
    return (
      <ContentLayout title="Module Not Found">
        <div className="mb-6">
          <Link href={`/student/courses/${courseId}`} className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          Module not found
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={module.title}>
      <div className="mb-6">
        <Link href={`/student/courses/${courseId}`} className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{module.title}</h1>
        {module.description && (
          <p className="text-muted-foreground mt-2">{module.description}</p>
        )}
      </div>
      
      <div className="bg-card rounded-lg shadow-sm p-6 border">
        <div className="mb-6 text-sm text-muted-foreground">
          Last updated: {new Date(module.updated_at).toLocaleString()}
        </div>
        
        <SlideViewer moduleId={moduleId} />
      </div>
    </ContentLayout>
  );
} 