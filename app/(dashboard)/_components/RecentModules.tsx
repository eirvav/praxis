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
  content?: string;
  description?: string;
  thumbnail_url?: string;
  updated_at: string;
  course_id: string;
}

const RecentModules = ({ isTeacher = false }: { isTeacher?: boolean }) => {
  const [modules, setModules] = useState<ModuleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = useSupabase();
  
  useEffect(() => {
    async function fetchRecentModules() {
      if (!supabase || !user) return;
      
      try {
        setLoading(true);
        
        // For teachers, fetch their own modules
        // For students, fetch all available modules
        const query = supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, course_id')
          .order('updated_at', { ascending: false })
          .limit(5);
          
        if (isTeacher) {
          query.eq('teacher_id', user.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setModules(data || []);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecentModules();
  }, [supabase, user, isTeacher]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Modules</h2>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse bg-gray-100 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Modules</h2>
        </div>
        <div className="text-center py-10">
          <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No modules found.</p>
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
            description={module.description}
            thumbnail_url={module.thumbnail_url}
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