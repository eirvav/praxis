'use client';

import SlideViewer from '@/app/(module_creator)/_components/SlideViewer';

interface ModuleOverviewTabProps {
  moduleId: string;
  moduleUpdatedAt: string;
  estimatedDuration?: number | null;
}

export const ModuleOverviewTab = ({
  moduleId,
  estimatedDuration,
}: ModuleOverviewTabProps) => {
  return (
    <div>
        <SlideViewer moduleId={moduleId} estimatedDuration={estimatedDuration} />
    </div>
  );
}; 