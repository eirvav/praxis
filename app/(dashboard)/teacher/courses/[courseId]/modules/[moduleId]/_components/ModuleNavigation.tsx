'use client';

import { BookOpen, ChartBar } from 'lucide-react';

interface ModuleNavigationProps {
  moduleId: string;
  courseId: string;
  activeTab: string;
  onTabChange: (tabHref: string) => void;
}

export const ModuleNavigation = ({
  activeTab,
  onTabChange,
}: ModuleNavigationProps) => {
  const isActive = (tabIdentifier: string) => {
    return activeTab === tabIdentifier;
  };

  const tabs = [
    {
      label: "#1 WORK IN PROGRESS",
      icon: BookOpen,
      href: "",
    },
    {
      label: "#2 WORK IN PROGRESS",
      icon: ChartBar,
      href: "/statistics",
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
            onClick={() => onTabChange(tab.href)}
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