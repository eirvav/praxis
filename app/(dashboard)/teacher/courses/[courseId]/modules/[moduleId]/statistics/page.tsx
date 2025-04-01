'use client';

import { ContentLayout } from "@/components/navbar-components/content-layout";
import { ModuleNavigation } from "../_components/ModuleNavigation";
import { ModuleStatistics } from "../_components/ModuleStatistics";
import { useParams } from "next/navigation";

export default function ModuleStatisticsPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;

  return (
    <ContentLayout title="Module Statistics" hideNavbar={true}>
      <div className="space-y-6 px-6 md:px-8 py-6">
        <ModuleNavigation moduleId={moduleId} courseId={courseId} />
        <ModuleStatistics />
      </div>
    </ContentLayout>
  );
} 