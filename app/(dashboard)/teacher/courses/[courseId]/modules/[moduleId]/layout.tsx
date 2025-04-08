'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { ModuleNavigation } from './_components/ModuleNavigation';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ModuleLayout({ children }: LayoutProps) {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;
  const [moduleName, setModuleName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const supabase = useSupabase();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    async function loadModuleData() {
      if (!supabase || !moduleId || !user) return;

      try {
        setIsLoading(true);
        setError("");

        const { data, error } = await supabase
          .from('modules')
          .select('title, teacher_id')
          .eq('id', moduleId)
          .single();

        if (error) throw error;
        
        if (!data) {
          setError('Module not found');
          return;
        }

        // Check if the module belongs to the current teacher
        if (!user.id || data.teacher_id !== user.id) {
          setError('You do not have permission to view this module.');
          toast.error('You do not have permission to view this course');
          router.push('/teacher');
          return;
        }
        
        if (data) {
          setModuleName(data.title);
        }
      } catch (err: unknown) {
        console.error('Error loading module:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to load module'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadModuleData();
  }, [supabase, moduleId, user, router]);

  if (error) {
    return (
      <ContentLayout title="Error" hideNavbar={true}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </ContentLayout>
    );
  }

  if (isLoading) {
    return (
      <ContentLayout title="Loading..." hideNavbar={true}>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={moduleName || 'Module'} hideNavbar={true}>
      <div className="space-y-6">
        <ModuleNavigation moduleId={moduleId} courseId={courseId} />
        {children}
      </div>
    </ContentLayout>
  );
} 