'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, LayoutGrid, List, BookOpen, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard from '@/app/(dashboard)/_components/ModuleCard';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  teacher_id: string;
  semester?: string;
}

interface Module {
  id: string;
  title: string;
  content: string;
  created_at: string;
  description: string;
  thumbnail_url: string;
  enrolled?: number;
  accuracy?: number;
  completion_rate?: number;
}

export default function CourseDetailPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'enrolled' | 'completion'>('date');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  // Mock semesters for demonstration - in real app, fetch from database
  const semesters = [
    { id: 'spring2024', label: 'Spring 2024' },
    { id: 'fall2023', label: 'Fall 2023' },
    { id: 'spring2023', label: 'Spring 2023' },
  ];

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
          router.push('/teacher/courses');
          return;
        }
        
        // Check if user is the course owner
        if (courseData.teacher_id !== user.id) {
          toast.error('You do not have permission to view this course');
          router.push('/teacher/courses');
          return;
        }
        
        setCourse(courseData);
        
        // Fetch modules for this course
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });
          
        if (modulesError) throw modulesError;
        
        // Add mock stats for demonstration
        const modulesWithStats = (modulesData || []).map(module => ({
          ...module,
          enrolled: Math.floor(Math.random() * 20) + 5,
          accuracy: Math.floor(Math.random() * 60) + 40,
          completion_rate: Math.floor(Math.random() * 40) + 60,
        }));
        
        setModules(modulesWithStats);
      } catch (err) {
        console.error('Error fetching course details:', err);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourseAndModules();
  }, [user, supabase, courseId, router]);

  async function handleDeleteCourse() {
    if (!supabase || !course) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);
        
      if (error) throw error;
      
      toast.success('Course deleted successfully');
      router.push('/teacher/courses');
      router.refresh();
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Link href="/teacher/courses">
          <Button>Go back to courses</Button>
        </Link>
      </div>
    );
  }

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 px-6 md:px-8 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              {course.description && (
                <p className="mt-1 text-muted-foreground">{course.description}</p>
              )}
            </div>
          </div>
          <Link href={`/teacher/courses/${course.id}/modules/create`}>
            <Button 
              size="lg" 
              className="flex items-center gap-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-5 w-5" />
              Nytt Arbeidskrav
            </Button>
          </Link>
        </div>

        {/* Semester Selection */}
        <div className="flex items-center gap-2 border-b pb-4">
          <span className="text-sm font-medium text-muted-foreground">Semester:</span>
          <div className="flex gap-2">
            <Button
              variant={selectedSemester === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSemester('all')}
              className="rounded-full"
            >
              All Semesters
            </Button>
            {semesters.map((sem) => (
              <Button
                key={sem.id}
                variant={selectedSemester === sem.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSemester(sem.id)}
                className="rounded-full"
              >
                {sem.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 
      <div className="border-b">
        <nav className="flex gap-6 -mb-px">
          <div 
            role="tab"
            aria-selected="true"
            className="group px-1 py-4 text-sm font-medium border-b-2 border-indigo-500 text-indigo-500 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Modules
            </div>
          </div>
          <div 
            role="tab"
            aria-selected="false"
            className="group px-1 py-4 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-gray-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Statistics
            </div>
          </div>
          <div 
            role="tab"
            aria-selected="false"
            className="group px-1 py-4 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-gray-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </div>
          </div>
        </nav>
      </div>
      */}
      {/* Search and Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            className="pl-10 bg-white dark:bg-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-white dark:bg-gray-800">
                <Filter className="h-4 w-4" />
                {sortBy === 'date' ? 'Date Created' : 
                 sortBy === 'name' ? 'Name' : 
                 sortBy === 'enrolled' ? 'Enrollment' : 
                 'Completion Rate'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Date Created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('enrolled')}>
                Enrollment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('completion')}>
                Completion Rate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="bg-background border rounded-lg p-1 flex gap-1 bg-white dark:bg-gray-800">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/50">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No modules yet</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first module for this course.</p>
          <Link href={`/teacher/courses/${course.id}/modules/create`}>
            <Button>Create Module</Button>
          </Link>
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
                case 'enrolled':
                  return (b.enrolled || 0) - (a.enrolled || 0);
                case 'completion':
                  return (b.completion_rate || 0) - (a.completion_rate || 0);
                default:
                  return 0;
              }
            })
            .map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                description={module.description}
                thumbnail_url={module.thumbnail_url}
                createdAt={module.created_at}
                href={`/teacher/courses/${course.id}/modules/${module.id}`}
                enrolled={module.enrolled}
                completion_rate={module.completion_rate}
                viewMode={viewMode}
              />
            ))
          }
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this course? This will also delete all modules in this course. This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 