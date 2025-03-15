import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LayoutWrapper from "../_components/LayoutWrapper";
import TeacherSidebar from "../_components/TeacherSidebar";
import DashboardContent from "./DashboardContent";

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
    <LayoutWrapper 
      sidebar={<TeacherSidebar />}
      firstName={firstName}
      userRole={userRole}
    >
      <DashboardContent />
    </LayoutWrapper>
  );
}
