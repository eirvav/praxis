'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, LayoutGrid, List, ChevronDown, Plus, Trash2, MoreVertical, Settings, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard from '@/app/(dashboard)/_components/ModuleCard';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ContentLayout } from '@/components/navbar-components/content-layout';
import { CreateFirstModule } from '@/app/(dashboard)/_components/createFirstModule';

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
  deadline?: string;
  teacher_id?: string;
  teacher_username?: string;
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  // Mock semesters for demonstration - in real app, fetch from database
  //const semesters = [
  //  { id: 'spring2024', label: 'Spring 2024' },
  //  { id: 'fall2023', label: 'Fall 2023' },
  //  { id: 'spring2023', label: 'Spring 2023' },
  //];

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
          .select('*, users:teacher_id(username)')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });
          
        if (modulesError) throw modulesError;
        
        // Add mock stats for demonstration and process teacher username
        const modulesWithStats = (modulesData || []).map(module => {
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
            enrolled: Math.floor(Math.random() * 20) + 5,
            accuracy: Math.floor(Math.random() * 60) + 40,
            completion_rate: Math.floor(Math.random() * 40) + 60,
            teacher_username: teacherUsername
          };
        });
        
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
      
      // First navigate to the courses page
      router.push('/teacher/courses');
      
      // Then refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  async function handleUpdateCourseTitle() {
    if (!supabase || !course || !newTitle.trim()) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('courses')
        .update({ title: newTitle.trim() })
        .eq('id', course.id);
        
      if (error) throw error;
      
      setCourse({ ...course, title: newTitle.trim() });
      setIsEditingTitle(false);
      toast.success('Course name updated successfully');
      
      // Refresh the page to update the sidebar navigation
      window.location.reload();
    } catch (err) {
      console.error('Error updating course name:', err);
      toast.error('Failed to update course name');
    } finally {
      setIsUpdating(false);
    }
  }

  if (loading) {
    return (
      <ContentLayout title="Loading...">
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
      <ContentLayout title="Course Not Found">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link href="/teacher/courses">
            <Button>Go back to courses</Button>
          </Link>
        </div>
      </ContentLayout>
    );
  }

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ContentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-bold h-auto py-1 w-[300px]"
                  placeholder="Enter course name"
                  disabled={isUpdating}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateCourseTitle}
                  disabled={isUpdating || !newTitle.trim()}
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setNewTitle(course?.title || '');
                  }}
                  disabled={isUpdating}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold">{course?.title}</h1>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Course actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    setNewTitle(course?.title || '');
                    setIsEditingTitle(true);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500 cursor-pointer"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort by: {sortBy}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('date')}>Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('enrolled')}>Enrolled</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('completion')}>Completion Rate</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
            
            {/* Only show Create Module button when modules already exist */}
            {modules.length > 0 && (
              <Link href={`/teacher/modules/create?preselectedCourseId=${course.id}`}>
                <Button className="gap-2 bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Create Module
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {modules.length === 0 ? (
          <CreateFirstModule courseId={course.id} />
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
                  courseName={course.title}
                  deadline={module.deadline}
                  teacherUsername={module.teacher_username}
                />
              ))
            }
          </div>
        )}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Delete Course</DialogTitle>
              <DialogDescription className="pt-2 text-base">
                Are you sure you want to delete <span className="font-semibold">{course.title}</span>? This action cannot be undone and all modules within this course will be inaccessible.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2 pb-4">
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> 
                This will delete all course data permanently.
              </p>
            </div>
            <DialogFooter className="flex sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="sm:w-auto flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="sm:w-auto flex-1 sm:flex-initial"
              >
                {isDeleting ? 'Deleting...' : 'Delete Course'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  );
} 