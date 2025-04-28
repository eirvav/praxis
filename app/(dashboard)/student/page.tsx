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
  course_title?: string;
  deadline?: string;
  teacher_id?: string;
  teacher_username?: string;
}

export default function StudentDashboard() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const supabase = useSupabase();
  
  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  
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
      
      if (shouldShowConfetti) {
        setShowConfetti(true);
        
        // Clear the flag so it doesn't show again on refresh
        localStorage.removeItem('showModuleCompletionConfetti');
        
        // Hide confetti after 6 seconds
        const timer = setTimeout(() => {
          setShowConfetti(false);
        }, 6000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);
  
  useEffect(() => {
    async function fetchUserData() {
      if (!supabase || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch recent modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, course_id, deadline, teacher_id, users:teacher_id(username)')
          .order('updated_at', { ascending: false });
          
        if (modulesError) throw modulesError;
        
        if (!modulesData || modulesData.length === 0) {
          setModules([]);
          setLoading(false);
          return;
        }
        
        // Get all unique course IDs
        const courseIds = [...new Set(modulesData.map(module => module.course_id))];
        
        // Fetch course names for these IDs
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);
          
        if (coursesError) throw coursesError;
        
        // Create a mapping of course IDs to titles
        const courseTitles = (coursesData || []).reduce((acc, course) => {
          acc[course.id] = course.title;
          return acc;
        }, {} as Record<string, string>);
        
        // Add course titles to modules
        const modulesWithCourses = modulesData.map(module => {
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
      
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome back,
              <br />
              <span className="block mt-2 text-primaryStyling">
                {(user.firstName || user.username || 'student')
                  .toLowerCase()
                  .replace(/^./, str => str.toUpperCase())}
              </span>
            </h1>
          </div>

          <div className="flex gap-4">
            <Link href="/student/courses">
              <Button 
                size="lg"
                className="flex items-center gap-2 bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
              >
                <BookOpen className="h-5 w-5" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Only show modules section if there are modules */}
        {hasModules && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Available Modules</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[300px] animate-pulse bg-muted rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
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
