'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import SlideViewer from '@/app/(module_creator)/_components/SlideViewer';
import Image from 'next/image';
import { FileImage } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  estimated_duration?: number | null;
}

export default function StudentCourseModuleDetailPage() {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useUser();
  const supabase = useSupabase();
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
      } catch (err: Error | unknown) {
        console.error('Error loading module:', err);
        setError(err instanceof Error ? err.message : 'Failed to load module.');
      } finally {
        setLoading(false);
      }
    }

    loadModule();
  }, [user, supabase, moduleId, courseId]);

  if (loading) {
    return (
      <ContentLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading module...</p>
        </div>
      </ContentLayout>
    );
  }

  if (error) {
    return (
      <ContentLayout>
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
      <ContentLayout>
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

  // Check if thumbnail_url is a color (starts with #)
  const isColorThumbnail = module.thumbnail_url?.startsWith('#');

  return (
    <ContentLayout>
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
      
      {/* Display thumbnail if available */}
      {module.thumbnail_url && (
        <div className="relative w-full h-64 md:h-80 mb-8 overflow-hidden rounded-lg border">
          {isColorThumbnail ? (
            <div 
              className="absolute inset-0 w-full h-full" 
              style={{ backgroundColor: module.thumbnail_url }}
            />
          ) : (
            <Image
              src={module.thumbnail_url}
              alt={module.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
        </div>
      )}

      {!module.thumbnail_url && (
        <div className="w-full h-40 md:h-60 bg-amber-50 rounded-lg mb-8 flex items-center justify-center">
          <div className="text-center">
            <FileImage className="h-12 w-12 text-amber-300 mx-auto mb-2" />
            <p className="text-amber-800">No cover image</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm p-6 border">
        <div className="mb-6 text-sm text-muted-foreground">
          Last updated: {new Date(module.updated_at).toLocaleString()}
        </div>
        
        <SlideViewer moduleId={moduleId} estimatedDuration={module.estimated_duration} />
      </div>
    </ContentLayout>
  );
} 