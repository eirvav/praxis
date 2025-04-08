"use client";

import { cn } from "@/lib/utils";

interface ContentLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  hideNavbar?: boolean;
}

export function ContentLayout({ children, className, title }: ContentLayoutProps) {
  return (
    <div className={cn(
      "relative min-h-screen flex-1 bg-background p-8",
      "before:absolute before:left-0 before:top-0 before:h-full before:w-4 before:bg-gradient-to-r before:from-black/[0.03] before:to-transparent before:pointer-events-none dark:before:from-black/20",
      className
    )}>
      {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
      {children}
    </div>
  );
}
