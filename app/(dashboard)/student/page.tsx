import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import RecentModules from "../_components/RecentModules";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default async function StudentDashboard() {
  const { userId, sessionClaims } = await auth();
  
  // If no user is found, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  // Get the user's role from session claims
  const userRole = sessionClaims?.metadata?.role as string | undefined;
  const firstName = sessionClaims?.firstName as string | undefined;

  // If user is not a student, redirect to their appropriate dashboard
  if (userRole === "teacher") {
    redirect("/teacher");
  }

  return (
    <ContentLayout title="Student Dashboard">
      <div className="flex flex-col gap-4">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
          <RecentModules isTeacher={false} />
        </div>
      </div>
    </ContentLayout>
  );
}
