import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RecentModules from "../_components/RecentModules";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function TeacherDashboard() {
  const { userId, sessionClaims } = await auth();
  
  // If no user is found, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  // Get the user's role from session claims
  const userRole = sessionClaims?.metadata?.role as string | undefined;
  const firstName = sessionClaims?.firstName as string | undefined;

  // If user is not a teacher, redirect to their appropriate dashboard
  if (userRole === "student") {
    redirect("/student");
  }

  return (
    <ContentLayout title="Teacher Dashboard">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <Link href="/teacher/modules/create">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Module
            </Button>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
          <RecentModules isTeacher={true} />
        </div>
      </div>
    </ContentLayout>
  );
}
