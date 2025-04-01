'use client';

import { ContentLayout } from "@/components/navbar-components/content-layout";
import { ModuleNavigation } from "../_components/ModuleNavigation";
import { ModuleGrading } from "../_components/ModuleGrading";
import { useParams } from "next/navigation";

export default function ModuleGradingPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;

  return (
    <ContentLayout title="Module Grading" hideNavbar={true}>
      <div className="space-y-6 px-6 md:px-8 py-6">
        <ModuleNavigation moduleId={moduleId} courseId={courseId} />
        <ModuleGrading />
      </div>
    </ContentLayout>
  );
} 