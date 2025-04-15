'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowRight, Ban, GraduationCap } from 'lucide-react';
import ModuleCard from './ModuleCard';
import { useSupabase } from './SupabaseProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModuleWithCourse {
  id: string;
  title: string;
  content?: string;
  description?: string;
  thumbnail_url?: string;
  updated_at: string;
  course_id: string;
  course_title?: string;
  deadline?: string;
  teacher_id?: string;
  teacher_username?: string;
}

const RecentModules = ({ isTeacher = false }: { isTeacher?: boolean }) => {
  const [modules, setModules] = useState<ModuleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = useSupabase();
  
  useEffect(() => {
    async function fetchRecentModules() {
      if (!supabase || !user) return;
      
      try {
        setLoading(true);
        
        // First, fetch the recent modules
        const query = supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, course_id, deadline, teacher_id, users:teacher_id(username)')
          .order('updated_at', { ascending: false })
          .limit(5);
          
        if (isTeacher) {
          query.eq('teacher_id', user.id);
        }
        
        const { data: modulesData, error: modulesError } = await query;
        
        if (modulesError) throw modulesError;
        
        if (!modulesData || modulesData.length === 0) {
          setModules([]);
          setLoading(false);
          return;
        }
        
        // Get all unique course IDs
        const courseIds = [...new Set(modulesData.map(module => module.course_id))];
        
        // Fetch course names for these IDs
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);
          
        if (coursesError) throw coursesError;
        
        // Create a mapping of course IDs to titles
        const courseTitles = (coursesData || []).reduce((acc, course) => {
          acc[course.id] = course.title;
          return acc;
        }, {} as Record<string, string>);
        
        // Add course titles to modules
        const modulesWithCourses = modulesData.map(module => {
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
            course_title: courseTitles[module.course_id] || 'Unknown Course',
            teacher_username: teacherUsername
          };
        });
        
        setModules(modulesWithCourses);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecentModules();
  }, [supabase, user, isTeacher]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Recent Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-[100px] animate-pulse bg-muted rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Recent Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No modules found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
          Recent Modules
        </CardTitle>
        <Link 
          href={isTeacher ? "/teacher/courses" : "/student/courses"} 
          className="text-sm text-primary flex items-center hover:underline"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              title={module.title}
              description={module.description}
              thumbnail_url={module.thumbnail_url}
              updated_at={module.updated_at}
              courseId={module.course_id}
              courseName={module.course_title}
              deadline={module.deadline}
              teacherUsername={module.teacher_username}
              isTeacher={isTeacher}
              href={isTeacher 
                ? `/teacher/courses/${module.course_id}/modules/${module.id}`
                : `/student/courses/${module.course_id}/modules/${module.id}`
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentModules; 