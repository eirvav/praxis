'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { CreateCourseModal } from "../_components/CreateCourseModal";
import ModuleCard from "../_components/ModuleCard";
import { useSupabase } from "../_components/SupabaseProvider";
import { ContentLayout } from "@/components/navbar-components/content-layout";
import { useTranslations } from 'next-intl';
import { CreateFirstModule } from "../_components/createFirstModule";

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
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              {t("teacher.dashboard.welcomeBack")},
              <br />
              <span className="block mt-2 text-primaryStyling">
                {(user.firstName || user.username || t('teacher.dashboard.teacher'))
                  .toLowerCase()
                  .replace(/^./, str => str.toUpperCase())}
              </span>
            </h1>
          </div>

          <div className="flex gap-4">
            {/* Only show navigation buttons when there are modules */}
            {hasModules && !hasNoCourses && (
              <>
                {/*<Button 
                  size="lg"
                  className="flex items-center gap-2 bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
                  onClick={() => setIsCourseModalOpen(true)}
                >
                  <BookOpen className="h-5 w-5" />
                  {t('common.buttons.createCourse')}
                </Button>*/}
                {/*<Link href="/teacher/modules/create">
                  <Button 
                    size="lg"
                    className="flex items-center gap-2 bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <PlusCircle className="h-5 w-5" />
                    {t('common.buttons.createModule')}
                  </Button>
                </Link>*/}
              </>
            )}
          </div>
        </div>

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

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[300px] animate-pulse bg-muted rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
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
                    viewMode="grid"
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
