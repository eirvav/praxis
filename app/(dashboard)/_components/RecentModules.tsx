'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard, { ModuleCardProps } from './ModuleCard';
import { useSupabase } from './SupabaseProvider';
import { Ban } from 'lucide-react';

interface ModuleWithCourse {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  course_id: string;
}

const RecentModules = ({ isTeacher = false }: { isTeacher?: boolean }) => {
  const [modules, setModules] = useState<ModuleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = useSupabase();
  
  useEffect(() => {
    if (!user || !supabase) return;

    async function loadModules() {
      setLoading(true);
      // Query to get the 3 most recent modules with course_id
      const { data, error } = await supabase!
        .from('modules')
        .select('id, title, content, updated_at, course_id')
        .order('updated_at', { ascending: false })
        .limit(3);
      
      if (!error && data) {
        setModules(data);
      } else {
        console.error('Error loading modules:', error);
      }
      
      setLoading(false);
    }

    loadModules();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Recent Modules</h2>
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">Loading recent modules...</p>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Recent Modules</h2>
        <div className="h-40 flex flex-col items-center justify-center text-center gap-2">
          <Ban className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No modules available yet.</p>
          {isTeacher && (
            <Link 
              href="/teacher/courses" 
              className="text-sm text-primary hover:underline"
            >
              Manage your courses
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Modules</h2>
        <Link 
          href={isTeacher ? "/teacher/courses" : "/student/courses"} 
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      
      <div className="space-y-4">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            id={module.id}
            title={module.title}
            content={module.content}
            updated_at={module.updated_at}
            courseId={module.course_id}
            href={isTeacher 
              ? `/teacher/courses/${module.course_id}/modules/${module.id}`
              : `/student/courses/${module.course_id}/modules/${module.id}`
            }
          />
        ))}
      </div>
    </div>
  );
};

export default RecentModules; 