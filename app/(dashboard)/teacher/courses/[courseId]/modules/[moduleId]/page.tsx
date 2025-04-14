'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import SlideEditor from '@/app/(module_creator)/_components/SlideEditor';
import SlideViewer from '@/app/(module_creator)/_components/SlideViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHeader } from './_components/ModuleHeader';

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  teacher_id: string;
  deadline?: string;
  total_slides?: number;
  completion_rate?: number;
  estimated_duration?: number | null;
}

export default function CourseModuleDetailPage() {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingSlides, setIsEditingSlides] = useState(false);
  const [totalSlides, setTotalSlides] = useState(0);
  
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
        // Load module data
        const { data: moduleData, error: moduleError } = await supabase!
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .eq('course_id', courseId)
          .single();
        
        if (moduleError) throw moduleError;
        
        if (!moduleData) {
          setError('Module not found or you might not have permission to view it.');
          return;
        }
        
        // Check if the module belongs to the current teacher
        if (!user?.id || moduleData.teacher_id !== user.id) {
          setError('You do not have permission to view this module.');
          toast.error('You do not have permission to view this module.');
          router.push('/teacher');
          return;
        }
        
        // Load slides count
        const { count: slidesCount, error: slidesError } = await supabase!
          .from('slides')
          .select('*', { count: 'exact' })
          .eq('module_id', moduleId);

        if (slidesError) throw slidesError;
        
        setModule(moduleData);
        setTotalSlides(slidesCount || 0);
      } catch (err: unknown) {
        console.error('Error loading module:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to load module.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadModule();
  }, [user, supabase, moduleId, courseId, router]);

  async function deleteModule() {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    if (!supabase || !module) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);
      
      if (error) throw error;
      
      toast.success('Module deleted successfully');
      router.push(`/teacher/courses/${courseId}`);
      router.refresh();
    } catch (err: unknown) {
      console.error('Error deleting module:', err);
      toast.error(
        err instanceof Error 
          ? err.message 
          : 'Failed to delete module'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const handleSlidesUpdated = () => {
    toast.success('Slides updated successfully');
    setIsEditingSlides(false);
  };

  if (loading || error || !module) {
    return null;
  }

  return (
    <div className="space-y-8">
      

      <ModuleHeader
        title={module.title}
        description={module.description}
        thumbnailUrl={module.thumbnail_url}
        deadline={module.deadline}
        totalSlides={totalSlides}
        completionRate={module.completion_rate || 0}
        submissions={0} // This should come from your database
        avgCompletionTime="00:00" // This should come from your database
        onEdit={() => setIsEditingSlides(true)}
        onDelete={deleteModule}
        isDeleting={isDeleting}
      />

      <div className="bg-card rounded-lg shadow-sm p-6 border">
        <div className="mb-6 text-sm text-muted-foreground">
          Last updated: {new Date(module.updated_at).toLocaleString()}
        </div>
        
        {isEditingSlides ? (
          <SlideEditor moduleId={moduleId} onSave={handleSlidesUpdated} />
        ) : (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-0">
              <div className="bg-card rounded-lg shadow-sm p-6 border">
                <SlideViewer moduleId={moduleId} estimatedDuration={module?.estimated_duration} />
              </div>
            </TabsContent>
            
            <TabsContent value="edit">
              <SlideEditor moduleId={moduleId} onSave={handleSlidesUpdated} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
} 