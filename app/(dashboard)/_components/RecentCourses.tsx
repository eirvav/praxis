'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { CourseCard } from './CourseCard';
import { useSupabase } from './SupabaseProvider';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  module_count?: number;
}

interface RecentCoursesProps {
  isTeacher?: boolean;
  limit?: number;
}

export default function RecentCourses({ isTeacher = false, limit = 3 }: RecentCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = useSupabase();

  useEffect(() => {
    async function fetchCourses() {
      if (!user || !supabase) return;
      
      try {
        setLoading(true);
        
        // Get base query for courses
        let query = supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            created_at,
            modules:modules(id)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        // Filter by teacher if needed
        if (isTeacher) {
          query = query.eq('teacher_id', user.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Transform data to include module count
        const formattedData = data?.map(course => ({
          ...course,
          module_count: Array.isArray(course.modules) ? course.modules.length : 0,
        })) || [];
        
        setCourses(formattedData);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourses();
  }, [user, supabase, isTeacher, limit]);

  const baseUrl = isTeacher ? '/teacher/courses' : '/student/courses';
  const viewAllUrl = `${baseUrl}`;
  
  if (loading) {
    return (
      <div className="w-full p-4 rounded-md border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Courses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[200px] animate-pulse bg-gray-100 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="w-full p-4 rounded-md border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Courses</h2>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          {isTeacher 
            ? "You haven't created any courses yet." 
            : "No courses available at the moment."}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-md border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Courses</h2>
        {courses.length > 0 && (
          <Link 
            href={viewAllUrl}
            className="text-sm text-primary flex items-center hover:underline"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            description={course.description}
            moduleCount={course.module_count}
            createdAt={course.created_at}
            href={`${baseUrl}/${course.id}`}
          />
        ))}
      </div>
    </div>
  );
} 