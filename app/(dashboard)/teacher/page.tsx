'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import RecentModules from "../_components/RecentModules";
import RecentCourses from "../_components/RecentCourses";
import { ContentLayout } from "@/components/navbar-components/content-layout";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, Users, BookOpenCheck, GraduationCap } from "lucide-react";
import { CreateCourseModal } from "../_components/CreateCourseModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboard() {
  const { user, isLoaded } = useUser();
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
      <div className="flex flex-col gap-8">
        {/* Overview Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Created modules</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg"
                className="flex items-center gap-2"
                onClick={() => setIsCourseModalOpen(true)}
              >
                <BookOpen className="h-5 w-5" />
                Create New Course
              </Button>
              <Link href="/teacher/modules/create">
                <Button 
                  size="lg"
                  variant="secondary" 
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-5 w-5" />
                  Create New Module
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <CreateCourseModal 
          isOpen={isCourseModalOpen} 
          onClose={() => setIsCourseModalOpen(false)} 
        />
        
        {/* Recent Content */}
        <div className="grid gap-6 md:grid-cols-2">
          <RecentCourses isTeacher={true} limit={2} />
          <RecentModules isTeacher={true} />
        </div>
      </div>
    </ContentLayout>
  );
}
