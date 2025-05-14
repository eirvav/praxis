'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { toast } from 'sonner';
import StudentModuleCard from "../../_components/StudentModuleCard";
import { useTranslations } from 'next-intl';
import ModuleFilters, { 
  FilterItem,
  ModuleStatus,
  SortBy,
  ViewMode,
  FilterType
} from '../../_components/ModuleFilters';
import { ChevronDown, Filter, LayoutGrid, Search } from 'lucide-react';

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
  isCompleted?: boolean;
}

export default function StudentCourseDetailPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>('all');
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<FilterItem[]>([]);
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const t = useTranslations();
  
  // Generate semester options from 2023 to current year
  const currentYear = new Date().getFullYear();
  const semesters = [];
  for (let year = 2023; year <= currentYear; year++) {
    semesters.push(`${year} Spring`);
    semesters.push(`${year} Fall`);
  }

  // Configure filter sections for the ModuleFilters component
  const filterSections = [
    {
      title: "Semester",
      type: "semester" as FilterType,
      options: semesters.map(semester => ({ value: semester, label: semester })),
      layout: "grid" as const
    }
  ];

  // Handle filter changes from the component
  const handleFilterChange = (type: FilterType, value: string | null) => {
    if (type === 'semester') {
      setSelectedSemester(value);
    }
  };

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
        
        // Fetch module completion status for the current user
        const { data: completedModules, error: completionError } = await supabase
          .from('module_completions')
          .select('module_id')
          .eq('user_id', user.id);
          
        if (completionError) {
          console.error('Error fetching module completion status:', completionError);
        }
        
        // Create a set of completed module IDs for faster lookup
        const completedModuleIds = new Set((completedModules || []).map(cm => cm.module_id));

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
            teacher_username: teacherUsername,
            isCompleted: completedModuleIds.has(module.id)
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
            <Button>{t('common.buttons.goBack')}</Button>
          </Link>
        </div>
      </ContentLayout>
    );
  }

  // Filter modules based on all criteria
  const filteredModules = modules.filter(module => {
    // Status filter
    const statusMatch = 
      moduleStatus === 'all' || 
      (moduleStatus === 'completed' && module.isCompleted) || 
      (moduleStatus === 'not-started' && !module.isCompleted);
      
    // Search query
    const searchMatch = 
      !searchQuery || 
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Semester filter - this would need to be implemented if modules have semester data
    // For now, just return true
    const semesterMatch = !selectedSemester || true;  // Replace with actual semester matching logic
      
    return statusMatch && searchMatch && semesterMatch;
  });
  
  // Sort filtered modules
  const sortedModules = [...filteredModules].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Module Filters Component */}
        <ModuleFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          moduleStatus={moduleStatus}
          setModuleStatus={setModuleStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          filterSections={filterSections}
          onFilterChange={handleFilterChange}
        />

        {modules.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">No modules available in this course yet.</p>
          </div>
        ) : sortedModules.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">No modules match your search criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setSearchQuery('');
                setModuleStatus('all');
                setSelectedSemester(null);
                setSelectedFilters([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {sortedModules.map((module) => (
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
                isCompleted={module.isCompleted}
              />
            ))}
          </div>
        )}
      </div>
    </ContentLayout>
  );
} 