'use client';

import { generateColorFromString, getTextColor } from '@/lib/pill-utils';

interface CoursePillProps {
  courseName?: string;
}

export const CoursePill = ({ courseName }: CoursePillProps) => {
  if (!courseName) {
    return null; // Don't render if no course name
  }

  const pillBg = generateColorFromString(courseName);
  const pillTextColor = getTextColor(pillBg);

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium ${pillTextColor}`}
      style={{ backgroundColor: pillBg }}
    >
      {courseName}
    </div>
  );
}; 