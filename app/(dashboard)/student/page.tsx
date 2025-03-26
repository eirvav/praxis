'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import RecentModules from "../_components/RecentModules";
import RecentCourses from "../_components/RecentCourses";
import { ContentLayout } from "@/components/navbar-components/content-layout";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function StudentDashboard() {
  const { user, isLoaded } = useUser();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  // If no user is found, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // Get the user's role from publicMetadata
  const userRole = user.publicMetadata?.role as string | undefined;
  const firstName = user.firstName || user.username?.split('-')[0] || 'Student';

  // If user is not a student, redirect to their appropriate dashboard
  if (userRole === "teacher") {
    redirect("/teacher");
  }

  return (
    <ContentLayout title="Student Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{greeting}, {firstName}!</h1>
            <p className="text-gray-600 mt-2">Welcome to your student dashboard</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/student/courses">
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="space-y-6">
          <RecentCourses isTeacher={false} />
          <RecentModules isTeacher={false} />
        </div>
      </div>
    </ContentLayout>
  );
}
