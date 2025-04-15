'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';
import { generateColorFromString } from '@/lib/menu-list';

interface Course {
  id: string;
  title: string;
}

export function CourseNavigation({ isTeacher = false }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = useSupabase();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchCourses() {
      if (!user || !supabase) return;
      
      try {
        let query = supabase
          .from('courses')
          .select('id, title');
          
        // If teacher, only show their courses
        if (isTeacher) {
          query = query.eq('teacher_id', user.id);
        }
        
        const { data, error } = await query.order('title');
          
        if (error) throw error;
        
        setCourses(data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourses();
  }, [user, supabase, isTeacher]);

  const baseUrl = isTeacher ? '/teacher/courses' : '/student/courses';

  if (loading) {
    return <div className="py-2 px-3 text-sm text-muted-foreground">Loading courses...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="py-2 px-3 text-sm text-muted-foreground">
        {isTeacher ? 'No courses created yet' : 'No courses available'}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {courses.map((course) => {
        // Use consistent color generation based on course title
        const courseColor = generateColorFromString(course.title);
        
        return (
          <Link
            key={course.id}
            href={`${baseUrl}/${course.id}`}
            className={cn(
              "flex items-center py-2 px-3 text-sm relative rounded-md",
              pathname.includes(`${baseUrl}/${course.id}`) 
                ? "bg-indigo-100 text-foreground font-medium hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" 
                : "hover:bg-accent/50"
            )}
          >
            <div 
              className="absolute left-3 h-full w-[3px] rounded-full" 
              style={{ backgroundColor: courseColor }}
            />
            <span className="pl-4 truncate">{course.title}</span>
          </Link>
        );
      })}
    </div>
  );
} 