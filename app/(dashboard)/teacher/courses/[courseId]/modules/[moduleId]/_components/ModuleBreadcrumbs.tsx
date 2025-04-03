'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { ChevronRight } from 'lucide-react';

interface ModuleBreadcrumbsProps {
  courseId: string;
  moduleName: string;
}

export const ModuleBreadcrumbs = ({
  courseId,
  moduleName,
}: ModuleBreadcrumbsProps) => {
  const [courseName, setCourseName] = useState<string>("");
  const supabase = useSupabase();

  useEffect(() => {
    async function loadCourseName() {
      if (!supabase || !courseId) return;

      try {
        const { data, error } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        if (data) {
          setCourseName(data.title);
        }
      } catch (err) {
        console.error('Error loading course name:', err);
      }
    }

    loadCourseName();
  }, [supabase, courseId]);

  return (
    <div className="flex items-center gap-2 text-md">
      <Link 
        href={`/teacher/courses/${courseId}`}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        {courseName || 'Course'}
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">
        {moduleName}
      </span>
    </div>
  );
}; 

