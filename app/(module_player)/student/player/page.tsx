'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { SupabaseProvider } from '@/app/(dashboard)/_components/SupabaseProvider';
import ModuleSlidePlayer from '../../_components/ModuleSlidePlayer';
import PlayerHeader from '../../_components/PlayerHeader';
import PermissionRequestSlide from '../../_components/PermissionRequestSlide';
import { toast } from 'sonner';
import { Slide } from '../../_components/slide_types/types';

interface ModuleDetails {
  id: string;
  title: string;
  description?: string;
  estimated_duration?: number;
  course_id: string;
}

interface Course {
  id: string;
  title: string;
}

export default function StudentModulePlayerPage() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId');
  const courseId = searchParams.get('courseId');

  const [moduleDetails, setModuleDetails] = useState<ModuleDetails | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const supabase = useSupabase();

  // Load module details, course info, and slides
  useEffect(() => {
    async function loadModuleData() {
      if (!supabase || !moduleId || !courseId) return;
      
      try {
        setLoading(true);
        
        // Fetch module details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .eq('course_id', courseId)
          .single();
        
        if (moduleError) throw moduleError;
        setModuleDetails(moduleData);

        // Fetch course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .single();
        
        if (courseError) throw courseError;
        setCourse(courseData);
        
        // Fetch slides
        const { data: slideData, error: slideError } = await supabase
          .from('slides')
          .select('*')
          .eq('module_id', moduleId)
          .order('position', { ascending: true });
        
        if (slideError) throw slideError;
        setSlides(slideData || []);
      } catch (err) {
        console.error('Error loading module data:', err);
        toast.error('Failed to load module content');
      } finally {
        setLoading(false);
      }
    }
    
    loadModuleData();
  }, [supabase, moduleId, courseId]);

  // Handle permissions being granted
  const handlePermissionsGranted = () => {
    setPermissionsGranted(true);
    toast.success('Permissions granted successfully');
  };

  // Navigation functions
  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  if (!moduleId || !courseId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Missing Required Information</h2>
            <p className="text-muted-foreground">Please provide both a module ID and course ID to view the content.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading module content...</p>
        </div>
      </div>
    );
  }

  // If permissions haven't been granted yet, show the permission request slide
  if (!permissionsGranted) {
    return (
      <SupabaseProvider>
        <div className="flex flex-col min-h-screen bg-sidebar">
          <div className="w-full bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b">
            <div className="w-full px-4 flex h-14 items-center justify-center">
              <h1 className="text-lg font-semibold">
                {moduleDetails?.title || 'Module Player'} - Permission Required
              </h1>
            </div>
          </div>
          <div className="flex-grow py-8">
            <div className="max-w-4xl mx-auto">
              <PermissionRequestSlide onPermissionsGranted={handlePermissionsGranted} />
            </div>
          </div>
        </div>
      </SupabaseProvider>
    );
  }

  return (
    <SupabaseProvider>
      <div className="flex flex-col min-h-screen bg-sidebar">
        {/* Header with navigation */}
        <PlayerHeader 
          moduleName={moduleDetails?.title || 'Module Player'}
          currentSlideIndex={currentSlideIndex}
          totalSlides={slides.length}
          goToPreviousSlide={goToPreviousSlide}
          goToNextSlide={goToNextSlide}
          disablePrevious={currentSlideIndex === 0}
          disableNext={currentSlideIndex === slides.length - 1}
          courseName={course?.title}
        />
        
        {/* Main Content Area */}
        <div className="flex-grow py-8">
          <div className="max-w-4xl mx-auto">
            <ModuleSlidePlayer 
              slides={slides}
              currentSlideIndex={currentSlideIndex}
            />
          </div>
        </div>
      </div>
    </SupabaseProvider>
  );
} 