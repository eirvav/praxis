'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowRight, Ban, GraduationCap } from 'lucide-react';
import ModuleCard, { ModuleCardProps } from './ModuleCard';
import { useSupabase } from './SupabaseProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Recent Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-[100px] animate-pulse bg-muted rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Recent Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No modules found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
          Recent Modules
        </CardTitle>
        <Link 
          href={isTeacher ? "/teacher/courses" : "/student/courses"} 
          className="text-sm text-primary flex items-center hover:underline"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default RecentModules; 