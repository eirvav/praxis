'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import RecentModules from "../_components/RecentModules";
import RecentCourses from "../_components/RecentCourses";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle } from "lucide-react";
import { CreateCourseModal } from "../_components/CreateCourseModal";

export default function TeacherDashboard() {
  const { user, isLoaded, sessionClaims } = useUser();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  
  if (!isLoaded) {
    return <div>Loading...</div>;
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

  return (
    <ContentLayout title="Teacher Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <div className="flex gap-3">
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsCourseModalOpen(true)}
            >
              <BookOpen className="h-4 w-4" />
              Create Course
            </Button>
            <Link href="/teacher/modules/create">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Module
              </Button>
            </Link>
          </div>
        </div>
        
        <CreateCourseModal 
          isOpen={isCourseModalOpen} 
          onClose={() => setIsCourseModalOpen(false)} 
        />
        
        <div className="space-y-6">
          <RecentCourses isTeacher={true} />
          <RecentModules isTeacher={true} />
        </div>
      </div>
    </ContentLayout>
  );
}
