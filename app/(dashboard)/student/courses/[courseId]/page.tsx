'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard from '@/app/(dashboard)/_components/ModuleCard';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface Module {
  id: string;
  title: string;
  content: string;
  created_at: string;
  description: string;
  thumbnail_url: string;
  deadline?: string;
  teacher_id?: string;
  teacher_username?: string;
}

export default function StudentCourseDetailPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  
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
          router.push('/student/courses');
          return;
        }
        
        setCourse(courseData);
        
        // Fetch modules for this course with teacher username
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*, users:teacher_id(username)')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });
          
        if (modulesError) throw modulesError;
        
        // Process the joined data
        const processedModules = (modulesData || []).map(module => {
          // Handle the users join result properly
          let teacherUsername;
          if (module.users) {
            // TypeScript doesn't know the structure of users from the join
            // Use type assertion to help TypeScript understand
            const usersData = module.users as { username: string } | { username: string }[];
            
            // Check if users is an array or an object
            if (Array.isArray(usersData)) {
              teacherUsername = usersData[0]?.username;
            } else {
              teacherUsername = usersData.username;
            }
          }
          
          return {
            ...module,
            teacher_username: teacherUsername
          };
        });
        
        setModules(processedModules);
      } catch (err) {
        console.error('Error fetching course details:', err);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourseAndModules();
  }, [user, supabase, courseId, router]);

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
          <Link href="/student/courses">
            <Button>Go back to courses</Button>
          </Link>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={course.title}>
      <div className="space-y-6">
        <div>
          <Link href="/student/courses" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </Link>
        </div>
        
        <div className="border rounded-md p-4">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Modules</h2>
          
          {modules.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/50">
              <p className="text-muted-foreground">No modules available in this course yet.</p>
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
                  href={`/student/courses/${course.id}/modules/${module.id}`}
                  courseName={course.title}
                  deadline={module.deadline}
                  teacherUsername={module.teacher_username}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
} 