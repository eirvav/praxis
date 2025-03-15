import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LayoutWrapper from "../_components/LayoutWrapper";
import StudentSidebar from "../_components/StudentSidebar";
import DashboardContent from "./modules/_components/DashboardContent";

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
    <LayoutWrapper 
      sidebar={<StudentSidebar />}
      firstName={firstName}
      userRole={userRole}
    >
      <DashboardContent />
    </LayoutWrapper>
  );
}
