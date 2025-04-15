'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { CourseCard } from '@/app/(dashboard)/_components/CourseCard';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  module_count: number;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    // Get the user's role from publicMetadata
    const userRole = user.publicMetadata?.role as string | undefined;
    
    // If user is not a student, redirect to their appropriate dashboard
    if (userRole === 'teacher') {
      router.push('/teacher');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchCourses() {
      if (!user || !supabase) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            created_at,
            modules:modules(id)
          `)
          .order('created_at', { ascending: false });
          
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
  }, [user, supabase]);

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ContentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Available Courses</h1>
            <p className="text-muted-foreground mt-1">Browse and enroll in courses</p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[200px] animate-pulse bg-muted rounded-md"></div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center p-12 border rounded-md">
            {searchTerm ? (
              <div>
                <h3 className="text-lg font-medium">No matching courses found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search terms</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium">No courses available</h3>
                <p className="text-muted-foreground mt-2">Check back later for new courses</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                moduleCount={course.module_count}
                createdAt={course.created_at}
                href={`/student/courses/${course.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </ContentLayout>
  );
} 