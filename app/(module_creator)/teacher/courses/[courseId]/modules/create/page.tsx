'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CourseSpecificModuleCreateRedirect() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  useEffect(() => {
    // Redirect to the centralized module creation page with course ID as a query parameter
    router.push(`/teacher/modules/create?preselectedCourseId=${courseId}`);
  }, [courseId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p>Redirecting to module creation page...</p>
      </div>
    </div>
  );
} 