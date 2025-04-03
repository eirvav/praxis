'use client';

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle } from "lucide-react";
import { CreateCourseModal } from "../_components/CreateCourseModal";
import ModuleCard from "../_components/ModuleCard";
import { useSupabase } from "../_components/SupabaseProvider";

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  updated_at: string;
  course_id: string;
}

export default function TeacherDashboard() {
  const { user, isLoaded } = useUser();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();
  
  useEffect(() => {
    async function fetchAllModules() {
      if (!supabase || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('modules')
          .select('id, title, description, thumbnail_url, updated_at, course_id')
          .eq('teacher_id', user.id)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        
        setModules(data || []);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAllModules();
  }, [supabase, user]);
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  // If no user is found, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // Get the user's role from publicMetadata
  const userRole = user.publicMetadata?.role as string | undefined;

  // If user is not a teacher, redirect to their appropriate dashboard
  if (userRole === "student") {
    redirect("/student");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user.firstName || user.username || 'Teacher'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses and modules from your dashboard
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            size="lg"
            className="flex items-center gap-2 bg-indigo-600 text-white"
            onClick={() => setIsCourseModalOpen(true)}
          >
            <BookOpen className="h-5 w-5" />
            Create New Course
          </Button>
          <Link href="/teacher/modules/create">
            <Button 
              size="lg"
              className="flex items-center gap-2 bg-indigo-600 text-white"
            >
              <PlusCircle className="h-5 w-5" />
              Create New Module
            </Button>
          </Link>
        </div>
      </div>
      
      <CreateCourseModal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)} 
      />
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Modules</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse bg-muted rounded-xl" />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 rounded-xl">
            <p className="text-muted-foreground mb-4">You haven't created any modules yet.</p>
            <Link href="/teacher/modules/create">
              <Button>Create your first module</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                description={module.description}
                thumbnail_url={module.thumbnail_url}
                updated_at={module.updated_at}
                courseId={module.course_id}
                isTeacher={true}
                viewMode="grid"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
