'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, X, BookOpen, ImageIcon, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import SlideEditor from '@/app/(dashboard)/_components/SlideEditor';
import SlideViewer from '@/app/(dashboard)/_components/SlideViewer';

interface Course {
  id: string;
  title: string;
}

export default function CreateModulePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [slidesSaved, setSlidesSaved] = useState(false);
  
  // Use a ref to prevent unnecessary reloads
  const dataLoadedRef = useRef(false);
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  // Fetch course details
  useEffect(() => {
    async function fetchCourse() {
      if (!user || !supabase || !courseId || dataLoadedRef.current) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .eq('teacher_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          toast.error('Course not found or you do not have permission to access it');
          router.push('/teacher/courses');
          return;
        }
        
        setCourse(data);
        dataLoadedRef.current = true;
      } catch (err) {
        console.error('Error fetching course:', err);
        toast.error('Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCourse();
  }, [user, supabase, courseId, router]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a module title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (!supabase || !user) {
        throw new Error('Authentication required');
      }

      if (!courseId) {
        throw new Error('Course ID is required');
      }

      // Check if we already have a module ID
      if (moduleId) {
        // Update existing module
        const { error: updateError } = await supabase
          .from('modules')
          .update({
            title: title.trim(),
            description: description.trim()
          })
          .eq('id', moduleId);

        if (updateError) {
          throw updateError;
        }

        toast.success('Module updated successfully!');
        setCurrentStep(2);
        return;
      }

      // Create new module
      const { data, error: insertError } = await supabase
        .from('modules')
        .insert({
          title: title.trim(),
          description: description.trim(),
          course_id: courseId,
          teacher_id: user.id
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      if (data && data.length > 0) {
        setModuleId(data[0].id);
        toast.success('Module created successfully! Now you can add slides.');
        setCurrentStep(2);
      } else {
        toast.success('Module created successfully');
        router.push(`/teacher/courses/${courseId}`);
        router.refresh();
      }
    } catch (err: any) {
      console.error('Error creating module:', err);
      setError(err.message || 'Failed to create module. Please try again.');
      toast.error('Failed to create module');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSlidesCreated = () => {
    setSlidesSaved(true);
    toast.success('Slides saved successfully');
    setCurrentStep(3);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      handleSubmit();
    } else if (currentStep === 2) {
      // Handled by SlideEditor's save function
    } else if (currentStep === 3) {
      router.push(`/teacher/courses/${courseId}`);
      router.refresh();
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/teacher/courses/${courseId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-center">
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <p className="mb-6">The course you're trying to add a module to doesn't exist or you don't have permission to access it.</p>
          <Link href="/teacher/courses">
            <Button>Go back to courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Create Module</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/teacher/courses/${courseId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button 
            onClick={nextStep}
            disabled={isSubmitting || (currentStep === 1 && !title.trim())}
          >
            {currentStep === 3 ? 'Finish' : currentStep === 2 ? 'Save & Preview' : 'Continue'}
            {currentStep < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="border-b bg-white px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border'}`}>
              1
            </div>
            <span className={currentStep >= 1 ? 'font-medium' : 'text-muted-foreground'}>Module Overview</span>
            <div className="h-0.5 flex-1 bg-muted mx-1 relative">
              <div className={`absolute inset-0 bg-primary transition-all ${currentStep > 1 ? 'w-full' : 'w-0'}`}></div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border'}`}>
              2
            </div>
            <span className={currentStep >= 2 ? 'font-medium' : 'text-muted-foreground'}>Add Content</span>
            <div className="h-0.5 flex-1 bg-muted mx-1 relative">
              <div className={`absolute inset-0 bg-primary transition-all ${currentStep > 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border'}`}>
              3
            </div>
            <span className={currentStep >= 3 ? 'font-medium' : 'text-muted-foreground'}>Preview & Confirm</span>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href={`/teacher/courses/${courseId}`} className="inline-flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {course.title}
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">Module Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a descriptive title"
                      disabled={isSubmitting}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">Module Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What will students learn in this module?"
                      rows={4}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-medium text-muted-foreground">About this module</h3>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-blue-100 p-1.5 rounded text-blue-700">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Part of {course.title}</p>
                    <p className="text-xs text-muted-foreground">This module will be added to this course</p>
                  </div>
                </div>
                
                <div className="h-px bg-muted my-2"></div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-amber-100 p-1.5 rounded text-amber-700">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Add slides in step 2</p>
                    <p className="text-xs text-muted-foreground">You can add text, video and quiz slides</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 2 && moduleId && (
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">{title}</h2>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            
            <SlideEditor 
              moduleId={moduleId} 
              onSave={handleSlidesCreated}
            />
          </div>
        )}
        
        {currentStep === 3 && moduleId && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold mb-2">{title}</h2>
                  {description && <p className="text-muted-foreground">{description}</p>}
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Ready to publish</span>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Module Preview</h3>
                <SlideViewer moduleId={moduleId} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 