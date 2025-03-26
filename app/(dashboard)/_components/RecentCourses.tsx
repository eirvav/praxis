'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { CourseCard } from './CourseCard';
import { useSupabase } from './SupabaseProvider';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          
        if (isTeacher) {
          query = query.eq('teacher_id', user.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Recent Courses
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

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Recent Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            {isTeacher 
              ? "You haven't created any courses yet." 
              : "No courses available at the moment."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          Recent Courses
        </CardTitle>
        {courses.length > 0 && (
          <Link 
            href={viewAllUrl}
            className="text-sm text-primary flex items-center hover:underline"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
} 