'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, X, CheckCircle, FileImage, BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import SlideEditor from '@/app/(fullscreen)/_components/SlideEditor';
import SlideViewer from '@/app/(fullscreen)/_components/SlideViewer';

interface Course {
  id: string;
  title: string;
}

interface ModuleData {
  id: string;
  title: string;
  description: string;
  course_id: string;
}

export default function CreateModulePage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slides, setSlides] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Update step when URL changes
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10);
      setStep(stepNumber);
      
      // If moving to step 3, refresh the slides data
      if (stepNumber === 3 && moduleId && supabase) {
        fetchSlides();
      }
    }
  }, [searchParams, moduleId, supabase]);
  
  // Function to fetch slides
  const fetchSlides = async () => {
    if (!moduleId || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        setSlides(data);
      }
    } catch (err) {
      console.error('Error fetching slides:', err);
      toast.error('Failed to load slides');
    }
  };
  
  // Initialize state from URL parameters
  useEffect(() => {
    const moduleIdParam = searchParams.get('moduleId');
    const stepParam = searchParams.get('step');
    const preselectedCourseId = searchParams.get('preselectedCourseId');
    
    if (moduleIdParam) {
      setModuleId(moduleIdParam);
    }
    
    if (stepParam) {
      setStep(parseInt(stepParam, 10));
    }

    if (preselectedCourseId) {
      setSelectedCourseId(preselectedCourseId);
    }
  }, [searchParams]);
  
  // Fetch module data if editing an existing module
  useEffect(() => {
    async function fetchModuleData() {
      if (!moduleId || !supabase) return;
      
      try {
        setIsLoading(true);
        
        // Fetch module data
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setSelectedCourseId(data.course_id);
        }
        
        // Fetch module slides
        const { data: slidesData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .eq('module_id', moduleId)
          .order('position', { ascending: true });
          
        if (slidesError) throw slidesError;
        
        if (slidesData) {
          setSlides(slidesData);
        }
      } catch (err) {
        console.error('Error fetching module data:', err);
        toast.error('Failed to load module data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchModuleData();
  }, [moduleId, supabase]);

  // Fetch teacher's courses
  useEffect(() => {
    async function fetchCourses() {
      if (!user || !supabase) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('teacher_id', user.id)
          .order('title', { ascending: true });
          
        if (error) throw error;
        
        setCourses(data || []);
        
        // Only auto-select first course if no course is selected and no preselectedCourseId
        const preselectedCourseId = searchParams.get('preselectedCourseId');
        if (data && data.length > 0 && !selectedCourseId && !preselectedCourseId) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        toast.error('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCourses();
  }, [user, supabase, selectedCourseId, searchParams]);

  // Step 1: Create initial module
  async function handleCreateModule() {
    if (!title.trim()) {
      setError('Please enter a module title');
      return;
    }

    if (!selectedCourseId) {
      setError('Please select a course for this module');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (!supabase || !user) {
        throw new Error('Authentication required');
      }

      let newModuleId = moduleId;

      // Create new module or update existing one
      if (moduleId) {
        // Update existing module
        const { error: updateError } = await supabase
          .from('modules')
          .update({
            title: title.trim(),
            description: description.trim(),
            course_id: selectedCourseId,
          })
          .eq('id', moduleId);

        if (updateError) {
          throw updateError;
        }
        
        toast.success('Module updated successfully!');
      } else {
        // Create new module
        const { data, error: insertError } = await supabase
          .from('modules')
          .insert({
            title: title.trim(),
            description: description.trim(),
            course_id: selectedCourseId,
            teacher_id: user.id
          })
          .select();

        if (insertError) {
          throw insertError;
        }

        if (data && data.length > 0) {
          newModuleId = data[0].id;
          setModuleId(newModuleId);
          toast.success('Module created successfully! Now you can add slides.');
        }
      }
      
      // Move to next step
      setStep(2);
      // Update URL with moduleId and step without navigation
      const params = new URLSearchParams(searchParams.toString());
      if (newModuleId) {
        params.set('moduleId', newModuleId);
      }
      params.set('step', '2');
      
      // Preserve preselectedCourseId if it exists
      const preselectedCourseId = searchParams.get('preselectedCourseId');
      if (preselectedCourseId) {
        params.set('preselectedCourseId', preselectedCourseId);
      }
      
      router.push(`/teacher/modules/create?${params.toString()}`);
      
    } catch (err: any) {
      console.error('Error creating/updating module:', err);
      const errorMessage = err.message || 'Failed to save module. Please try again.';
      console.log('Detailed error:', JSON.stringify(err));
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Step 3: Publish module
  async function handlePublishModule() {
    if (!moduleId) {
      toast.error('No module to publish');
      return;
    }
    
    try {
      setIsPublishing(true);
      
      // Since we don't have a published field, just consider the module published when it has slides
      if (slides.length > 0) {
        toast.success('Module published successfully!');
        // Redirect to course page
        router.push(`/teacher/courses/${selectedCourseId}`);
        return;
      } else {
        throw new Error('Cannot publish a module without slides');
      }
    } catch (err) {
      console.error('Error publishing module:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to publish module');
    } finally {
      setIsPublishing(false);
    }
  }

  const handleClose = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/teacher');
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      const newStep = step - 1;
      setStep(newStep);
      // Update URL with step
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', newStep.toString());
      router.push(`/teacher/modules/create?${params.toString()}`);
    }
  };
  
  // Get current step label
  const getStepLabel = () => {
    switch (step) {
      case 1:
        return "Module Overview";
      case 2:
        return "Add Content";
      case 3:
        return "Review & Publish";
      default:
        return "Module Overview";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Create Module</h1>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="bg-white border rounded-xl p-8 shadow-sm">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold">No Courses Available</h2>
              <p className="text-muted-foreground">You need to create a course before adding modules.</p>
              <div className="pt-4">
                <Link href="/teacher/courses">
                  <Button>Create Your First Course</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with integrated step indicator */}
      <div className="border-b bg-white">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Create Module</h1>
          </div>
          
          <div className="flex items-center text-lg">
            <span className="font-medium">Step {step}:</span>
            <span className="ml-2 text-gray-700">{getStepLabel()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            
            {step === 1 && (
              <Button 
                onClick={handleCreateModule}
                disabled={isSubmitting || !title.trim() || !selectedCourseId}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {step === 3 && (
              <Button 
                onClick={handlePublishModule}
                disabled={isPublishing || slides.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                Publish Module
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Thin progress line */}
        <div className="h-1 bg-gray-200 w-full">
          <div 
            className="h-1 bg-indigo-600 transition-all duration-300 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Module Overview */}
        {step === 1 && (
          <div>
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileImage className="h-16 w-16 text-indigo-500" />
              </div>
            </div>
            
            <div className="bg-white border rounded-xl p-8 shadow-sm space-y-8">
              <div className="space-y-3">
                <Label htmlFor="course" className="text-base font-medium">Course</Label>
                <Select 
                  value={selectedCourseId} 
                  onValueChange={setSelectedCourseId}
                >
                  <SelectTrigger className="p-3 h-12">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the course this module will belong to
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-medium">Module Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                  disabled={isSubmitting}
                  className="text-lg p-3 h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium">Module Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will students learn in this module?"
                  rows={5}
                  disabled={isSubmitting}
                  className="resize-none p-3 text-base"
                />
                <p className="text-sm text-gray-500 mt-1 flex justify-end">
                  {description.length}/400
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Add Content/Slides */}
        {step === 2 && moduleId && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <SlideEditor 
              moduleId={moduleId} 
              onSave={() => {
                // Move to next step after slides are saved
                setStep(3);
                // Update URL with step
                const params = new URLSearchParams(searchParams.toString());
                params.set('step', '3');
                if (moduleId) {
                  params.set('moduleId', moduleId);
                }
                router.push(`/teacher/modules/create?${params.toString()}`);
              }}
            />
          </div>
        )}
        
        {/* Step 3: Review & Publish */}
        {step === 3 && moduleId && (
          <div className="space-y-8">
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Module Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Title</p>
                    <p className="text-lg font-medium">{title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Course</p>
                    <p className="text-lg font-medium">
                      {courses.find(c => c.id === selectedCourseId)?.title || 'Unknown Course'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-base">{description}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Module Content</h2>
                <div className="text-sm text-gray-500">
                  {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
                </div>
              </div>
              
              {slides.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  <p>No slides have been added to this module yet. Go back to add content.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <SlideViewer moduleId={moduleId} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 