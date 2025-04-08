'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';

interface Course {
  id: string;
  title: string;
}

// Array of nice-looking colors
const colors = [
  "#FF6B6B", // coral red
  "#4ECDC4", // turquoise
  "#45B7D1", // sky blue
  "#96CEB4", // sage green
  "#FFEEAD", // cream yellow
  "#D4A5A5", // dusty rose
  "#9B5DE5", // purple
  "#F15BB5", // pink
  "#00BBF9", // bright blue
  "#00F5D4", // mint
  "#FEE440", // yellow
  "#8338EC", // violet
  "#3A86FF", // royal blue
  "#38B000", // green
];

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
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
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
              className="absolute left-3 h-4 w-[3px] rounded-full" 
              style={{ backgroundColor: randomColor }}
            />
            <span className="pl-4 truncate">{course.title}</span>
          </Link>
        );
      })}
    </div>
  );
} 