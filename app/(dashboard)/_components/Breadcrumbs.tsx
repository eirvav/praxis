'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSupabase } from './SupabaseProvider';
import { Separator } from '@/components/ui/separator';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const fetchBreadcrumbData = async () => {
      const paths = pathname.split('/').filter(Boolean);
      const breadcrumbItems: BreadcrumbItem[] = [];
      
      // Always start with Dashboard
      breadcrumbItems.push({
        label: 'Dashboard',
        href: '/teacher'
      });

      // If we're in a course route
      if (paths.includes('courses')) {
        const courseId = paths[paths.indexOf('courses') + 1];
        if (courseId) {
          const { data: courseData } = await supabase!
            .from('courses')
            .select('title')
            .eq('id', courseId)
            .single();

          if (courseData) {
            breadcrumbItems.push({
              label: courseData.title,
              href: `/teacher/courses/${courseId}`
            });
          }

          // If we're in a module route
          const moduleIndex = paths.indexOf('modules');
          if (moduleIndex !== -1) {
            const moduleId = paths[moduleIndex + 1];
            if (moduleId) {
              const { data: moduleData } = await supabase!
                .from('modules')
                .select('title')
                .eq('id', moduleId)
                .single();

              if (moduleData) {
                breadcrumbItems.push({
                  label: moduleData.title,
                  href: `/teacher/courses/${courseId}/modules/${moduleId}`
                });
              }
            }
          }
        }
      }

      setItems(breadcrumbItems);
    };

    fetchBreadcrumbData();
  }, [pathname, supabase]);

  return (
    <div className="flex items-center">
      <div className="h-6 w-[1px] bg-muted-foreground/25 mx-4" />
      <div className="flex items-center text-sm text-muted-foreground">
        {items.map((item, index) => (
          <div key={item.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
            <Link
              href={item.href}
              className={index === items.length - 1 
                ? "font-medium text-foreground text-primaryStyling bg-primaryStyling/10 px-2 py-1 rounded-sm"
                : "hover:text-foreground transition hover:underline"
              }
            >
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 