'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleCard, { ModuleCardProps } from './ModuleCard';
import { useSupabase } from './SupabaseProvider';

type Module = Omit<ModuleCardProps, 'isTeacher'>;

const RecentModules = ({ isTeacher = false }: { isTeacher?: boolean }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = useSupabase();
  
  useEffect(() => {
    if (!user || !supabase) return;

    async function loadModules() {
      setLoading(true);
      
      // Query to get the 3 most recent modules
      const { data, error } = await supabase
        .from('modules')
        .select('*')
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
      <div className="mt-6">
        <p>Loading recent modules...</p>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 mb-2">No modules available yet</p>
        {isTeacher ? (
          <Link href="/teacher/modules/create">
            <Button variant="outline" size="sm">Create your first module</Button>
          </Link>
        ) : (
          <p className="text-sm text-gray-500">Check back later for content</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Modules</h2>
        <Link href={isTeacher ? "/teacher/modules" : "/student/modules"} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          View all modules
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard 
            key={module.id} 
            {...module} 
            isTeacher={isTeacher}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentModules; 