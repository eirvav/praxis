'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash, FileImage } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import SlideEditor from '@/app/(module_creator)/_components/SlideEditor';
import SlideViewer from '@/app/(module_creator)/_components/SlideViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { ModuleNavigation } from './_components/ModuleNavigation';

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  teacher_id: string;
}

export default function CourseModuleDetailPage() {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingSlides, setIsEditingSlides] = useState(false);
  
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
    } catch (err: any) {
      console.error('Error deleting module:', err);
      toast.error('Failed to delete module');
    } finally {
      setIsDeleting(false);
    }
  }

  const handleSlidesUpdated = () => {
    toast.success('Slides updated successfully');
    setIsEditingSlides(false);
  };

  if (loading) {
    return (
      <ContentLayout title="Module Details" hideNavbar={true}>
        <div className="flex items-center justify-center h-64">
          <p>Loading module...</p>
        </div>
      </ContentLayout>
    );
  }

  if (error) {
    return (
      <ContentLayout title="Error" hideNavbar={true}>
        <div className="mb-6">
          <Link href={`/teacher/courses/${courseId}`} className="flex items-center text-blue-500 hover:text-blue-700">
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
      <ContentLayout title="Module Not Found" hideNavbar={true}>
        <div className="mb-6">
          <Link href={`/teacher/courses/${courseId}`} className="flex items-center text-blue-500 hover:text-blue-700">
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
    <ContentLayout title={module?.title || 'Module Details'} hideNavbar={true}>
      <div className="space-y-6 px-6 md:px-8 py-6">
        <div className="mb-6">
          <Link href={`/teacher/courses/${courseId}`} className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
        </div>

        <ModuleNavigation moduleId={moduleId} courseId={courseId} />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">{module?.title}</h1>
            {module?.description && (
              <p className="text-muted-foreground mt-2">{module.description}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            {!isEditingSlides && (
              <Button
                variant="outline"
                onClick={() => setIsEditingSlides(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Slides
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={deleteModule}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700"
            >
              <Trash className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Display thumbnail if available */}
        {module?.thumbnail_url && (
          <div className="relative w-full h-64 md:h-80 mb-8 overflow-hidden rounded-lg border">
            <Image
              src={module.thumbnail_url}
              alt={module.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        {!module?.thumbnail_url && (
          <div className="w-full h-40 md:h-60 bg-amber-50 rounded-lg mb-8 flex items-center justify-center">
            <div className="text-center">
              <FileImage className="h-12 w-12 text-amber-300 mx-auto mb-2" />
              <p className="text-amber-800">No cover image</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-sm p-6 border">
          <div className="mb-6 text-sm text-muted-foreground">
            Last updated: {module?.updated_at && new Date(module.updated_at).toLocaleString()}
          </div>
          
          {isEditingSlides ? (
            <SlideEditor moduleId={moduleId} onSave={handleSlidesUpdated} />
          ) : (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <SlideViewer moduleId={moduleId} />
              </TabsContent>
              
              <TabsContent value="edit">
                <SlideEditor moduleId={moduleId} onSave={handleSlidesUpdated} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </ContentLayout>
  );
} 