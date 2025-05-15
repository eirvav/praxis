'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { CreateCourseModal } from "../_components/CreateCourseModal";
import ModuleCard from "../_components/ModuleCard";
import { useSupabase } from "../_components/SupabaseProvider";
import { ContentLayout } from "@/components/navbar-components/content-layout";
import { useTranslations } from 'next-intl';
import { CreateFirstModule } from "../_components/createFirstModule";
import { ModuleFilters, FilterType, ModuleStatus, SortBy, ViewMode, FilterItem } from "../_components/ModuleFilters";

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  updated_at: string;
  course_id: string;
  course_title?: string;
  deadline?: string;
  teacher_username?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  created_at: string;
}

export default function TeacherDashboard() {
  const { user, isLoaded } = useUser();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();
  const t = useTranslations();
  // States for welcome message animation and DOM presence
  const [displayWelcomeMessage, setDisplayWelcomeMessage] = useState(true);
  const [animateWelcomeMessageOut, setAnimateWelcomeMessageOut] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFilters, setSelectedFilters] = useState<FilterItem[]>([]);

  // Create filter sections based on courses
  const filterSections = useMemo(() => {
    return [
      {
        title: 'Courses',
        type: 'course' as FilterType,
        options: courses.map(course => ({
          value: course.id,
          label: course.title
        })),
        layout: 'list' as 'list' | 'grid'
      }
    ];
  }, [courses]);

  // Welcome message visibility, animation, and session storage
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const welcomeCompletedInSession = sessionStorage.getItem('teacherDashboardWelcomeCompleted');

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
          sessionStorage.setItem('teacherDashboardWelcomeCompleted', 'true');
        }, 900); // Increased duration to 900ms (CSS animation is 800ms) for smoother DOM removal

        // Cleanup removalTimer if component unmounts during fade-out
        return () => clearTimeout(removalTimer);
      }, 5000); // 5 seconds to start hiding process

      // Cleanup visibilityTimer if component unmounts before it fires
      return () => clearTimeout(visibilityTimer);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter and sort modules based on selected filters
  const filteredModules = useMemo(() => {
    return modules
      .filter(module => {
        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            module.title.toLowerCase().includes(searchLower) ||
            module.description?.toLowerCase().includes(searchLower) ||
            module.course_title?.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Course filter
        const courseFilter = selectedFilters.find(f => f.type === 'course');
        if (courseFilter && module.course_id !== courseFilter.value) {
          return false;
        }

        // Status filter (you'll need to add a status field to your modules)
        if (moduleStatus !== 'all') {
          // Implement status filtering logic here when you add status to modules
          return true; // Placeholder
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        } else {
          return a.title.localeCompare(b.title);
        }
      });
  }, [modules, searchQuery, selectedFilters, moduleStatus, sortBy]);

  useEffect(() => {
    async function fetchUserData() {
      if (!supabase || !user) return;

      try {
        setLoading(true);

        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, description, created_at')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, course_id, deadline, teacher_id, users:teacher_id(username)')
          .eq('teacher_id', user.id)
          .order('updated_at', { ascending: false });

        if (modulesError) throw modulesError;

        // Create a mapping of course IDs to titles
        const courseTitles = (coursesData || []).reduce((acc, course) => {
          acc[course.id] = course.title;
          return acc;
        }, {} as Record<string, string>);

        // Add course titles to modules and handle teacher usernames
        const modulesWithCourses = (modulesData || []).map(module => {
          let teacherUsername;
          if (module.users) {
            const usersData = module.users as { username: string } | { username: string }[];
            if (Array.isArray(usersData)) {
              teacherUsername = usersData[0]?.username;
            } else {
              teacherUsername = usersData.username;
            }
          }

          return {
            ...module,
            course_title: courseTitles[module.course_id] || 'Unknown Course',
            teacher_username: teacherUsername
          };
        });

        setModules(modulesWithCourses);
      } catch (err) {
        console.error('Error fetching data:', err);
        setCourses([]);
        setModules([]);
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

  // If user is not a teacher, redirect to their appropriate dashboard
  if (userRole === "student") {
    redirect("/student");
  }

  // Helper function for handling course creation completion
  const handleCourseCreated = () => {
    setIsCourseModalOpen(false);
    // No longer need to refresh here since we handle it in the modal component
  };

  // Check if the teacher has no courses yet
  const hasNoCourses = courses.length === 0;
  // Check if the teacher has any modules
  const hasModules = modules.length > 0;

  return (
    <ContentLayout>
      <div className="space-y-8">
        {/* Wrap both welcome message and buttons in conditional rendering */}
        {displayWelcomeMessage ? (
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
            <div
              className={`transition-all duration-800 ease-in-out overflow-hidden ${
                animateWelcomeMessageOut ? 'max-h-0 opacity-0' : 'max-h-28 opacity-100'
              }`}
            >
              <h1 className="text-5xl font-bold tracking-tight">
                {t("teacher.dashboard.welcomeBack")},
                <br />
                <span className="block mt-2 text-primaryStyling">
                  {(user.firstName || user.username || t('teacher.dashboard.teacher')) 
                    .toLowerCase()
                    .replace(/^./, str => str.toUpperCase())} 👋
                </span>
              </h1>
            </div>

            <div className="flex gap-4">
              {/* Only show navigation buttons when there are modules */}
              {hasModules && !hasNoCourses && (
                <>
                </>
              )}
            </div>
          </div>
        ) : null}

        <CreateCourseModal
          isOpen={isCourseModalOpen}
          onClose={handleCourseCreated}
        />

        {/* Display create first course prompt if teacher has no courses */}
        {hasNoCourses && !loading && (
          <div className="bg-white p-15 ">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">{t('teacher.dashboard.welcomeText')}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('teacher.dashboard.getStarted')}
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={() => setIsCourseModalOpen(true)}
                  className="bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  {t('teacher.dashboard.buttonCourse')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Display "Create your first module" prompt if there are courses but no modules */}
        {!hasNoCourses && !hasModules && !loading && (
          <CreateFirstModule />
        )}

        {/* Only show modules section if teacher has modules */}
        {hasModules && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('teacher.dashboard.yourModules')}</h2>

            <div className="mb-6">
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
                role="teacher"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[300px] animate-pulse bg-muted rounded-xl" />
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
              }>
                {filteredModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    id={module.id}
                    title={module.title}
                    description={module.description}
                    thumbnail_url={module.thumbnail_url}
                    updated_at={module.updated_at}
                    courseId={module.course_id}
                    courseName={module.course_title}
                    isTeacher={true}
                    viewMode={viewMode}
                    deadline={module.deadline}
                    teacherUsername={module.teacher_username}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
