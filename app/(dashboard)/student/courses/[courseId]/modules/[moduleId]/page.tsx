'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { FileImage, Calendar, Clock, ArrowRight, Layers } from 'lucide-react';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import StudentSlideTypeList from '@/app/(dashboard)/student/_components/StudentSlideTypeList';
import { useTranslations } from 'next-intl';

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  estimated_duration?: number | null;
  deadline?: string | null;
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
  const t = useTranslations();

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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </ContentLayout>
    );
  }

  if (!module) {
    return (
      <ContentLayout>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          Module not found
        </div>
      </ContentLayout>
    );
  }

  // Check if thumbnail_url is a color (starts with #)
  const isColorThumbnail = module.thumbnail_url?.startsWith('#');
  
  // Format deadline if available
  const formattedDeadline = module.deadline 
    ? new Date(module.deadline).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) + ', ' + new Date(module.deadline).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <ContentLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Display thumbnail if available */}
          <div className="animate-fadeIn">
            {module.thumbnail_url ? (
              <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-xl shadow-md">
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
                    className="transition-transform hover:scale-105 duration-700"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-56 md:h-72 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <FileImage className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <p className="text-amber-800 text-lg font-medium">No cover image</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4 animate-fadeIn">
            <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
            
            {module.description && (
              <p className="text-muted-foreground text-lg leading-relaxed">{module.description}</p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-5 pt-2">
              {formattedDeadline && (
                <div className="flex items-center gap-3 text-muted-foreground group">
                  <div className="p-2 rounded-full bg-rose-50 text-rose-500 group-hover:bg-rose-100 transition-colors">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-rose-600 block">Due Date</span>
                    <p className="font-medium">{formattedDeadline}</p>
                  </div>
                </div>
              )}
              
              {module.estimated_duration && (
                <div className="flex items-center gap-3 text-muted-foreground group">
                  <div className="p-2 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-600 block">Estimated Time</span>
                    <p className="font-medium">{module.estimated_duration} minutes</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-6">
              <Link href={`/student/player?courseId=${courseId}&moduleId=${moduleId}`}>
                <Button 
                  size="lg" 
                  className="group relative overflow-hidden w-full sm:w-auto transition-all duration-300 hover:pl-7 bg-primaryStyling hover:bg-indigo-700 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center">
                    {t('common.buttons.startModule') || 'Start Module'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity"></span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Slide Type List */}
        <div className="md:col-span-1 animate-fadeIn animation-delay-200">
          <div className="bg-card rounded-xl shadow-sm p-6 border sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">{t('common.navigation.contents') || 'Module Contents'}</h2>
            </div>
            <StudentSlideTypeList moduleId={moduleId} />
          </div>
        </div>
      </div>
    </ContentLayout>
  );
} 