'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard from '@/app/(dashboard)/_components/ModuleCard';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  teacher_id: string;
}

interface Module {
  id: string;
  title: string;
  content: string;
  created_at: string;
  description: string;
  thumbnail_url: string;
}

export default function CourseDetailPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  useEffect(() => {
    async function fetchCourseAndModules() {
      if (!user || !supabase || !courseId) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
          
        if (courseError) throw courseError;
        
        if (!courseData) {
          toast.error('Course not found');
          router.push('/teacher/courses');
          return;
        }
        
        // Check if user is the course owner
        if (courseData.teacher_id !== user.id) {
          toast.error('You do not have permission to view this course');
          router.push('/teacher/courses');
          return;
        }
        
        setCourse(courseData);
        
        // Fetch modules for this course
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });
          
        if (modulesError) throw modulesError;
        
        setModules(modulesData || []);
      } catch (err) {
        console.error('Error fetching course details:', err);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourseAndModules();
  }, [user, supabase, courseId, router]);

  async function handleDeleteCourse() {
    if (!supabase || !course) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the course (modules will be cascade deleted by Supabase)
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);
        
      if (error) throw error;
      
      toast.success('Course deleted successfully');
      router.push('/teacher/courses');
      router.refresh();
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  if (loading) {
    return (
      <ContentLayout title="Course Details">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-center">
            <p>Loading course details...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (!course) {
    return (
      <ContentLayout title="Course Not Found">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link href="/teacher/courses">
            <Button>Go back to courses</Button>
          </Link>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={course.title}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/teacher/courses" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href={`/teacher/courses/${course.id}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Edit Course
              </Button>
            </Link>
            
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Modules</h2>
            <Link href={`/teacher/courses/${course.id}/modules/create`}>
              <Button size="sm" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Module
              </Button>
            </Link>
          </div>
          
          {modules.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/50">
              <p className="text-muted-foreground">No modules in this course yet.</p>
              <p className="text-muted-foreground">Click the "Add Module" button to create your first module.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description}
                  thumbnail_url={module.thumbnail_url}
                  createdAt={module.created_at}
                  href={`/teacher/courses/${course.id}/modules/${module.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this course? This will also delete all modules in this course. This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
} 