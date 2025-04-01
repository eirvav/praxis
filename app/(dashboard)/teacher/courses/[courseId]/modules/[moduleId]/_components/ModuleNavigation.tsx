'use client';

import { BookOpen, ChartBar, GraduationCap } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface ModuleNavigationProps {
  moduleId: string;
  courseId: string;
}

export const ModuleNavigation = ({
  moduleId,
  courseId,
}: ModuleNavigationProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname === `/teacher/courses/${courseId}/modules/${moduleId}${path}`;
  };

  const tabs = [
    {
      label: "Module",
      icon: BookOpen,
      href: "",
    },
    {
      label: "Statistics",
      icon: ChartBar,
      href: "/statistics",
    },
    {
      label: "Grading",
      icon: GraduationCap,
      href: "/grading",
    },
  ];

  return (
    <div className="border-b">
      <nav className="flex gap-6 -mb-px">
        {tabs.map((tab) => (
          <div
            key={tab.label}
            role="tab"
            aria-selected={isActive(tab.href)}
            onClick={() => router.push(`/teacher/courses/${courseId}/modules/${moduleId}${tab.href}`)}
            className={`
              group px-1 py-4 text-sm font-medium cursor-pointer
              ${isActive(tab.href)
                ? "border-b-2 border-indigo-500 text-indigo-500"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-gray-300"
              }
              transition-colors
            `}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}; 