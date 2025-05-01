'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, LayoutGrid, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StudentModuleCard from "../../_components/StudentModuleCard";
import { useTranslations } from 'next-intl';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const t = useTranslations();

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
      <ContentLayout>
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
      <ContentLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link href="/student/courses">
            <Button>Go back to courses</Button>
          </Link>
        </div>
      </ContentLayout>
    );
  }

  // Filter modules based on search query
  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ContentLayout>
      <div className="space-y-6">


        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground mt-1">{course.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {t('common.buttons.sort')} by: {sortBy}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('date')}>Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.inputs.searchCourse')}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {modules.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">No modules available in this course yet.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredModules
              .sort((a, b) => {
                switch (sortBy) {
                  case 'date':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  case 'name':
                    return a.title.localeCompare(b.title);
                  default:
                    return 0;
                }
              })
              .map((module) => (
                <StudentModuleCard
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description}
                  thumbnail_url={module.thumbnail_url}
                  createdAt={module.created_at}
                  href={`/student/courses/${course.id}/modules/${module.id}`}
                  courseName={course.title}
                  viewMode={viewMode}
                  deadline={module.deadline}
                  teacherUsername={module.teacher_username}
                />
              ))
            }
          </div>
        )}
      </div>
    </ContentLayout>
  );
} 