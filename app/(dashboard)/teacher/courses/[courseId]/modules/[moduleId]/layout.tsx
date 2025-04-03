'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { ModuleNavigation } from './_components/ModuleNavigation';
import { ModuleBreadcrumbs } from './_components/ModuleBreadcrumbs';

interface LayoutProps {
  children: React.ReactNode;
}

interface ModuleData {
  title: string;
  description?: string;
}

export default function ModuleLayout({ children }: LayoutProps) {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;
  const [moduleName, setModuleName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const supabase = useSupabase();

  useEffect(() => {
    async function loadModuleData() {
      if (!supabase || !moduleId) return;

      try {
        setIsLoading(true);
        setError("");

        const { data, error } = await supabase
          .from('modules')
          .select('title')
          .eq('id', moduleId)
          .single();

        if (error) throw error;
        
        if (data) {
          setModuleName(data.title);
        }
      } catch (err: any) {
        console.error('Error loading module:', err);
        setError(err.message || 'Failed to load module');
      } finally {
        setIsLoading(false);
      }
    }

    loadModuleData();
  }, [supabase, moduleId]);

  if (error) {
    return (
      <ContentLayout title="Error" hideNavbar={true}>
        <div className="space-y-6 px-6 md:px-8 py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (isLoading) {
    return (
      <ContentLayout title="Loading..." hideNavbar={true}>
        <div className="space-y-6 px-6 md:px-8 py-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading module...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={moduleName || 'Module'} hideNavbar={true}>
      <div className="space-y-6 px-6 md:px-8 py-6">
        <div className="flex flex-col gap-6">
          <ModuleBreadcrumbs courseId={courseId} moduleName={moduleName} />
          <ModuleNavigation moduleId={moduleId} courseId={courseId} />
        </div>
        {children}
      </div>
    </ContentLayout>
  );
} 