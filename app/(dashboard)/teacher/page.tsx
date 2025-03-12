import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function TeacherDashboard() {
  const { userId, sessionClaims } = await auth();
  
  // If no user is found, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  // Get the user's role from session claims
  const userRole = sessionClaims?.metadata?.role as string | undefined;

  // If user is not a teacher, redirect to student dashboard
  if (userRole !== "teacher") {
    redirect("/student");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
      {/* Add your teacher dashboard content here */}
    </div>
  );
}
