'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';

interface Course {
  id: string;
  title: string;
}

export function CourseNavigation({ isTeacher = false }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
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
    <div className="py-2">
      <div 
        className="flex items-center px-3 py-2 cursor-pointer text-sm font-medium"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 mr-1" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-1" />
        )}
        <span>Courses</span>
      </div>
      
      {expanded && (
        <div className="ml-6 space-y-1 mt-1">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`${baseUrl}/${course.id}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                pathname.includes(`${baseUrl}/${course.id}`) 
                  ? "bg-accent text-accent-foreground font-medium" 
                  : "hover:bg-accent/50"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span className="truncate">{course.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 