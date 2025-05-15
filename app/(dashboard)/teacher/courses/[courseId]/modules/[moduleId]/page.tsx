'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Radio, ChevronDown, MoreHorizontal, Play, Edit2, GraduationCap, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ModuleNavigation } from './_components/ModuleNavigation';
import { CoursePill } from '@/app/(dashboard)/teacher/courses/[courseId]/modules/[moduleId]/_components/CoursePill';
import { SemesterPill } from '@/app/(dashboard)/teacher/courses/[courseId]/modules/[moduleId]/_components/SemesterPill';
import { ModuleStatistics } from './_components/ModuleStatistics';
import { ModuleOverviewTab } from './_components/ModuleOverviewTab';
import { SubmissionStatusChart } from './_components/charts/SubmissionStatusChart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  teacher_id: string;
  deadline?: string;
  total_slides?: number;
  completion_rate?: number;
  estimated_duration?: number | null;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  teacher_id: string;
  deadline?: string;
}

export default function CourseModuleDetailPage() {
  const [module, setModule] = useState<Module | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // Default to overview tab (href: "")
  
  const chartData = [
    { date: 'Oct 1', Inprogress: 30, Completed: 10 },
    { date: 'Oct 2', Inprogress: 20, Completed: 40 },
    { date: 'Oct 3', Inprogress: 50, Completed: 60 },
    { date: 'Oct 4', Inprogress: 15, Completed: 25 },
    { date: 'Oct 5', Inprogress: 40, Completed: 50 },
    { date: 'Oct 6', Inprogress: 20, Completed: 30 },
    { date: 'Oct 7', Inprogress: 35, Completed: 20 },
  ];
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;

  useEffect(() => {
    if (!user || !supabase || !moduleId || !courseId) return;

    async function loadModuleAndCourseDetails() {
      setLoading(true);
      setError('');
      
      try {
        // Load module data
        const { data: moduleData, error: moduleError } = await supabase!
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .eq('course_id', courseId)
          .single();
        
        if (moduleError) throw moduleError;
        
        if (!moduleData) {
          setError('Module not found or you might not have permission to view it.');
          setLoading(false);
          return;
        }
        
        if (!user?.id || moduleData.teacher_id !== user.id) {
          setError('You do not have permission to view this module.');
          toast.error('You do not have permission to view this module.');
          router.push('/teacher');
          setLoading(false);
          return;
        }
        
        setModule(moduleData);
        
        // Log the course_id being used for the query
        console.log(`Fetching course with ID: ${moduleData.course_id}`);

        // Load course data
        const { data: courseData, error: courseError } = await supabase!
          .from('courses')
          .select('*')
          .eq('id', moduleData.course_id)
          .single();

        // Log the fetched course data and any error
        console.log('Fetched courseData:', courseData);
        if (courseError) {
          console.error('Error fetching course data:', courseError);
          throw courseError; // This should already lead to an error page if not caught
        }
        setCourse(courseData); // courseData might be null here if not found, leading to no pill
        
      } catch (err: unknown) {
        console.error('Error loading module/course details:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to load module details.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadModuleAndCourseDetails();
  }, [user, supabase, moduleId, courseId, router]);

  async function deleteModule() {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    if (!supabase || !module) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);
      
      if (error) throw error;
      
      toast.success('Module deleted successfully');
      router.push(`/teacher/courses/${courseId}`);
    } catch (err: unknown) {
      console.error('Error deleting module:', err);
      toast.error(
        err instanceof Error 
          ? err.message 
          : 'Failed to delete module'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading module details...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
  }

  if (!module) {
    return <div className="flex justify-center items-center h-screen"><p>Module not found.</p></div>;
  }

  const formattedCreationDate = format(new Date(module.created_at), 'MMM d, yyyy');
  const formattedEditDate = format(new Date(module.updated_at), 'MMM d, yyyy');
  const creatorUsername = user?.username || user?.firstName || 'Teacher';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-red-500">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Active</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold">{module.title}</h1>

              <div className="flex flex-wrap items-center gap-2">
                <CoursePill courseName={course?.title} />
                <SemesterPill deadline={course?.deadline || module.deadline} />
              </div>

              <p className="text-sm text-muted-foreground">
                Created by {creatorUsername} on {formattedCreationDate} - Edited {formattedEditDate}
              </p>
            </div>

            {module.thumbnail_url && (
              <div className="relative aspect-video w-full md:w-1/3 lg:w-1/2 xl:w-1/3 ml-0 md:ml-4 mt-4 md:mt-0 rounded-lg border overflow-hidden flex-shrink-0 self-center md:self-start">
                {module.thumbnail_url.startsWith('#') ? (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: module.thumbnail_url }}
                  />
                ) : (
                  <Image
                    src={module.thumbnail_url}
                    alt={module.title || 'Module thumbnail'}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            )}
          </div>

          {module.description && (
            <div className="py-4">
              <hr className="mt-2 mb-6 border-gray-200 dark:border-gray-700" />
              <p className="text-sm leading-relaxed">{module.description}</p>
            </div>
          )}

          {/* ModuleNavigation moved here */}
          <ModuleNavigation 
            moduleId={moduleId} 
            courseId={courseId} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>

        <div className="w-full lg:w-1/3 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show data in</span>
              <Button variant="ghost" size="sm" className="text-sm font-bold">
                Last 7 days
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Chart Placeholder */}
            <div className="w-full h-48" >
              <SubmissionStatusChart data={chartData} />
            </div>

            {/* Legend */}
            <div className="flex justify-around text-xs">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-yellow-400 rounded-full"></span>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Inprogress</p>
                  <p className="text-gray-500 dark:text-gray-400">12 <span className="text-xs text-gray-400 dark:text-gray-500">• 45%</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Completed</p>
                  <p className="text-gray-500 dark:text-gray-400">16 <span className="text-xs text-gray-400 dark:text-gray-500">• 55%</span></p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="lg" className="flex-grow h-11 bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer">
                <GraduationCap className="h-5 w-5 mr-2" />
                Grade Submissions
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 border-gray-300 dark:border-gray-600">
                    <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    variant="destructive"
                    onClick={deleteModule}
                    disabled={isDeleting}
                    className="text-red-600 focus:text-red-600 focus:bg-red-100"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Module"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex justify-center items-center pt-2">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-3"></div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => router.push(`/teacher/modules/create?moduleId=${moduleId}&courseId=${courseId}`)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional rendering for tab content */}
      <div className="mt-6">
        {activeTab === '' && module && (
          <ModuleOverviewTab 
            moduleId={moduleId} 
            moduleUpdatedAt={module.updated_at} 
            estimatedDuration={module.estimated_duration} 
          />
        )}

        {activeTab === '/statistics' && (
          <div className="p-4 md:p-6">
            <ModuleStatistics />
          </div>
        )}
      </div>
    </div>
  );
} 