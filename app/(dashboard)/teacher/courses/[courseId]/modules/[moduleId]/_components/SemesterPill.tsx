'use client';

import { getSemesterInfo, getTextColor } from '@/lib/pill-utils';

interface SemesterPillProps {
  deadline?: string; // Deadline of the course or module
}

export const SemesterPill = ({ deadline }: SemesterPillProps) => {
  const { code: semesterCode, color: semesterColor } = getSemesterInfo(deadline);

  if (semesterCode === 'N/A') {
    return null; // Don't render if semester info is not applicable
  }

  const pillTextColor = getTextColor(semesterColor);

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium ${pillTextColor}`}
      style={{ backgroundColor: semesterColor }}
    >
      {semesterCode}
    </div>
  );
}; 