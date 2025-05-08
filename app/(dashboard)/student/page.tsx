'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useSupabase } from "../_components/SupabaseProvider";
import { ContentLayout } from "@/components/navbar-components/content-layout";
import Link from "next/link";
import StudentModuleCard from "./_components/StudentModuleCard";
import dynamic from "next/dynamic";
import ModuleFilters, { 
  FilterItem,
  ModuleStatus,
  SortBy,
  ViewMode,
  FilterType
} from "./_components/ModuleFilters";

// Dynamically import ReactConfetti to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false
});

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  course_id: string;
  updated_at: string;
  created_at: string;
  course_title?: string;
  deadline?: string;
  teacher_id?: string;
  teacher_username?: string;
  isCompleted?: boolean;
  users?: { username: string } | { username: string }[];
}

interface Course {
  id: string;
  title: string;
}

export default function StudentDashboard() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [recentModules, setRecentModules] = useState<Module[]>([]);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const supabase = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>('all');
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<FilterItem[]>([]);
  // States for welcome message animation and DOM presence
  const [displayWelcomeMessage, setDisplayWelcomeMessage] = useState(true);
  const [animateWelcomeMessageOut, setAnimateWelcomeMessageOut] = useState(false);
  
  // Generate semester options from 2023 to current year
  const currentYear = new Date().getFullYear();
  const semesters = [];
  for (let year = 2023; year <= currentYear; year++) {
    semesters.push(`${year} Spring`);
    semesters.push(`${year} Fall`);
  }
  
  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  
  // Configure filter sections for the ModuleFilters component
  const filterSections = [
    {
      title: "Course",
      type: "course" as FilterType,
      options: courses.map(course => ({ value: course.id, label: course.title })),
      layout: "list" as const
    },
    {
      title: "Semester",
      type: "semester" as FilterType,
      options: semesters.map(semester => ({ value: semester, label: semester })),
      layout: "grid" as const
    }
  ];
  
  // Handle filter changes from the component
  const handleFilterChange = (type: FilterType, value: string | null) => {
    if (type === 'course') {
      setSelectedCourse(value);
      if (value) {
        const course = courses.find(c => c.id === value);
        setSelectedCourseTitle(course ? course.title : null);
      } else {
        setSelectedCourseTitle(null);
      }
    } else if (type === 'semester') {
      setSelectedSemester(value);
    }
  };
  
  // Handle clearing all filters
  const clearAllFilters = () => {
    setModuleStatus('all');
    setSearchQuery('');
    setSelectedCourse(null);
    setSelectedCourseTitle(null);
    setSelectedSemester(null);
    setSelectedFilters([]);
  };
  
  // Set window size for confetti
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const updateWindowSize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      
      updateWindowSize();
      window.addEventListener('resize', updateWindowSize);
      
      return () => window.removeEventListener('resize', updateWindowSize);
    }
  }, []);
  
  // Check for module completion flag
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const shouldShowConfetti = localStorage.getItem('showModuleCompletionConfetti') === 'true';
      const completedModuleName = localStorage.getItem('completedModuleName');
      
      if (shouldShowConfetti) {
        setShowConfetti(true);
        
        // Display completion message if module name available
        if (completedModuleName) {
          setCompletionMessage(`You've completed "${completedModuleName}"`);
        }
        
        // Clear the flag so it doesn't show again on refresh
        localStorage.removeItem('showModuleCompletionConfetti');
        localStorage.removeItem('completedModuleName');
        
        // Hide confetti after 6 seconds
        const timer = setTimeout(() => {
          setShowConfetti(false);
          
          // Hide message after confetti is gone
          setTimeout(() => {
            setCompletionMessage(null);
          }, 3000);
        }, 6000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);
  
  // Welcome message visibility, animation, and session storage
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const welcomeCompletedInSession = sessionStorage.getItem('studentDashboardWelcomeCompleted');

      if (welcomeCompletedInSession === 'true') {
        setDisplayWelcomeMessage(false); // Already completed in this session, so don't display
        return;
      }

      // Not completed yet, so ensure it's displayed and visible initially
      setDisplayWelcomeMessage(true);
      setAnimateWelcomeMessageOut(false);

      const visibilityTimer = setTimeout(() => {
        setAnimateWelcomeMessageOut(true); // Start fade out animation

        // Timer to remove from DOM after animation completes
        const removalTimer = setTimeout(() => {
          setDisplayWelcomeMessage(false); // Remove from DOM
          sessionStorage.setItem('studentDashboardWelcomeCompleted', 'true');
        }, 900); // Increased duration to 900ms (CSS animation is 800ms) for smoother DOM removal

        // Cleanup removalTimer if component unmounts during fade-out
        return () => clearTimeout(removalTimer);
      }, 5000); // 5 seconds to start hiding process

      // Cleanup visibilityTimer if component unmounts before it fires
      return () => clearTimeout(visibilityTimer);
    }
  }, []); // Empty dependency array ensures this runs only once on mount
  
  useEffect(() => {
    async function fetchUserData() {
      if (!supabase || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch recent modules (limit to 3 most recent for one row)
        const { data: recentModulesData, error: recentModulesError } = await supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, created_at, course_id, deadline, teacher_id, users:teacher_id(username)')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (recentModulesError) throw recentModulesError;
        
        // Fetch all modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, created_at, course_id, deadline, teacher_id, users:teacher_id(username)')
          .order('updated_at', { ascending: false });
          
        if (modulesError) throw modulesError;
        
        if (!modulesData || modulesData.length === 0) {
          setModules([]);
          setRecentModules([]);
          setLoading(false);
          return;
        }
        
        // Fetch all courses for the dropdown
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title');
          
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Get all unique course IDs
        const courseIds = [...new Set(modulesData.map(module => module.course_id))];
        
        // Fetch course names for these IDs
        const { data: courseNamesData, error: coursesError2 } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);
          
        if (coursesError2) throw coursesError2;
        
        // Create a mapping of course IDs to titles
        const courseTitles = (courseNamesData || []).reduce((acc, course) => {
          acc[course.id] = course.title;
          return acc;
        }, {} as Record<string, string>);
        
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
        
        // Process modules with additional info
        const processModules = (data: (Omit<Module, 'course_title' | 'teacher_username' | 'isCompleted'> & { users?: { username: string } | { username: string }[] })[]) => {
          return data.map(module => {
            // Handle the users join result properly
            let teacherUsername;
            if (module.users) {
              // Check if users is an array or an object
              if (Array.isArray(module.users)) {
                teacherUsername = module.users[0]?.username;
              } else {
                teacherUsername = module.users.username;
              }
            }
            
            return {
              ...module,
              course_title: courseTitles[module.course_id] || 'Unknown Course',
              teacher_username: teacherUsername,
              isCompleted: completedModuleIds.has(module.id)
            };
          });
        };
        
        // Process both module lists
        setModules(processModules(modulesData));
        setRecentModules(processModules(recentModulesData || []).slice(0, 3));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [supabase, user]);
  
  if (!isLoaded) {
    return (
      <ContentLayout>
        <div>Loading...</div>
      </ContentLayout>
    );
  }
  
  // If no user is found, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // Get the user's role from publicMetadata
  const userRole = user.publicMetadata?.role as string | undefined;

  // If user is not a student, redirect to their appropriate dashboard
  if (userRole === "teacher") {
    redirect("/teacher");
  }

  // Check if the student has any modules available
  const hasModules = modules.length > 0;

  // Filter modules based on all criteria
  const filteredModules = modules.filter(module => {
    // Status filter
    const statusMatch = 
      moduleStatus === 'all' || 
      (moduleStatus === 'completed' && module.isCompleted) || 
      (moduleStatus === 'not-started' && !module.isCompleted);
    
    // Course filter
    const courseMatch = !selectedCourse || module.course_id === selectedCourse;
    
    // Search query
    const searchMatch = 
      !searchQuery || 
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (module.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (module.course_title?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Semester filter - this would need to be implemented if modules have semester data
    // For now, just return true
    const semesterMatch = !selectedSemester || true;  // Replace with actual semester matching logic
    
    return statusMatch && courseMatch && searchMatch && semesterMatch;
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
      {/* Confetti celebration */}
      {showConfetti && (
        <>
          <ReactConfetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.2}
          />
        </>
      )}
      
      {/* Completion message */}
      <div className="space-y-8">
        {/* Animated Welcome Message Div - conditionally rendered and animated */}
        {displayWelcomeMessage && (
          <div
            className={`transition-all duration-800 ease-in-out overflow-hidden ${
              animateWelcomeMessageOut ? 'max-h-0 opacity-0' : 'max-h-28 opacity-100'
            }`}
          >
            <h1 className="text-5xl font-bold tracking-tight flex flex-col gap-3">
              <div>Welcome back,</div>
              <div>
                <span className="text-primaryStyling">
                  {(user.firstName || user.username || 'student')
                    .toLowerCase()
                    .replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="ml-1">👋</span>
              </div>
            </h1>
          </div>
        )}

        {/* Completion Message - now a direct child of space-y-8, flex flex-col removed */}
        {completionMessage && (
          <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 animate-pulse">
            {completionMessage}
          </div>
        )}

        {/* Most Recent Section */}
        {hasModules && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Most Recent</h2>
              <Link 
                href="" 
                className="text-primaryStyling relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-primaryStyling after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                View All
              </Link>
            </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[220px] animate-pulse bg-muted rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentModules.slice(0, 3).map((module) => (
                      <StudentModuleCard
                        key={module.id}
                        id={module.id}
                        title={module.title}
                        description={module.description}
                        thumbnail_url={module.thumbnail_url}
                        updated_at={module.updated_at}
                        courseId={module.course_id}
                        courseName={module.course_title}
                        viewMode="grid"
                        deadline={module.deadline}
                        teacherUsername={module.teacher_username}
                        href={`/student/courses/${module.course_id}/modules/${module.id}`}
                        isCompleted={module.isCompleted}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
        {/* All Modules Section with Advanced Filtering */}
        {hasModules && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              {selectedCourseTitle ? `${selectedCourseTitle} Materials` : 'All Materials'}
            </h2>
            
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
            
            {loading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`animate-pulse bg-muted rounded-xl ${
                    viewMode === 'grid' ? 'h-[220px]' : 'h-24'
                  }`} />
                ))}
              </div>
            ) : sortedModules.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm border">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-medium mb-2">No matching modules found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters to find what you're looking for.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {sortedModules.map((module) => (
                    <StudentModuleCard
                      key={module.id}
                      id={module.id}
                      title={module.title}
                      description={module.description}
                      thumbnail_url={module.thumbnail_url}
                      updated_at={module.updated_at}
                      courseId={module.course_id}
                      courseName={module.course_title}
                      viewMode={viewMode}
                      deadline={module.deadline}
                      teacherUsername={module.teacher_username}
                      href={`/student/courses/${module.course_id}/modules/${module.id}`}
                      isCompleted={module.isCompleted}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {!hasModules && !loading && (
          <div className="bg-white p-15 ">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Welcome to Your Dashboard</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Browse courses to enroll in learning modules.
              </p>
              <div className="pt-4">
                <Link href="/student/courses">
                  <Button 
                    size="lg"
                    className="bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Browse Available Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
