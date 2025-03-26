'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, X, CheckCircle, FileImage, BookOpen, Plus, Upload, Edit2, Camera, FileText, Clock, Calendar, Users2 } from 'lucide-react';
import Image from 'next/image';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import SlideEditor from '@/app/(module_creator)/_components/SlideEditor';
import SlideViewer from '@/app/(module_creator)/_components/SlideViewer';
import { CreateCourseModal } from '@/app/(dashboard)/_components/CreateCourseModal';

interface Course {
  id: string;
  title: string;
}

interface ModuleData {
  id: string;
  title: string;
  description: string;
  course_id: string;
  thumbnail_url?: string;
  deadline: string;
  publish_date?: string;
}

export default function CreateModulePage() {
  console.log('[CreateModulePage] RENDERING component');
  
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slides, setSlides] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const pageInitializedRef = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedTeachers, setSelectedTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [searchTeachers, setSearchTeachers] = useState('');
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  
  // Mock teacher data - in production this would come from your API
  const mockTeachers = [
    { id: '1', name: 'John Smith', email: 'john@school.com' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@school.com' },
    { id: '3', name: 'Michael Brown', email: 'michael@school.com' },
    { id: '4', name: 'Emma Davis', email: 'emma@school.com' },
    { id: '5', name: 'James Wilson', email: 'james@school.com' },
  ];

  const filteredTeachers = mockTeachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTeachers.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTeachers.toLowerCase())
  ).filter(teacher => !selectedTeachers.some(selected => selected.id === teacher.id));
  
  // Track component mounting and unmounting
  useEffect(() => {
    console.log('[CreateModulePage] Component MOUNTED');
    
    return () => {
      console.log('[CreateModulePage] Component UNMOUNTED');
    };
  }, []);
  
  // Track router events
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      console.log('[CreateModulePage] Router event: route change start', url);
    };
    
    const handleRouteChangeComplete = (url: string) => {
      console.log('[CreateModulePage] Router event: route change complete', url);
    };
    
    const handleBeforeHistoryChange = (url: string) => {
      console.log('[CreateModulePage] Router event: before history change', url);
    };
    
    // @ts-ignore - Next.js types might be incomplete
    router.events?.on('routeChangeStart', handleRouteChangeStart);
    // @ts-ignore
    router.events?.on('routeChangeComplete', handleRouteChangeComplete);
    // @ts-ignore
    router.events?.on('beforeHistoryChange', handleBeforeHistoryChange);
    
    return () => {
      // @ts-ignore
      router.events?.off('routeChangeStart', handleRouteChangeStart);
      // @ts-ignore
      router.events?.off('routeChangeComplete', handleRouteChangeComplete);
      // @ts-ignore
      router.events?.off('beforeHistoryChange', handleBeforeHistoryChange);
    };
  }, [router]);
  
  // Handle file upload
  const uploadThumbnail = async (file: File) => {
    if (!file || !supabase || !user) return;
    
    console.log('[CreateModulePage] Starting thumbnail upload');
    try {
      setIsUploading(true);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload the image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('module-thumbnails')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data } = supabase.storage
        .from('module-thumbnails')
        .getPublicUrl(filePath);
        
      // Update thumbnail URL state
      setThumbnailUrl(data.publicUrl);
      
      // If we already have a module ID, update it with the thumbnail
      if (moduleId) {
        const { error: updateError } = await supabase
          .from('modules')
          .update({ thumbnail_url: data.publicUrl })
          .eq('id', moduleId);
          
        if (updateError) throw updateError;
      }
      
      console.log('[CreateModulePage] Thumbnail uploaded successfully:', data.publicUrl);
      toast.success('Thumbnail uploaded successfully');
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      toast.error('Failed to upload thumbnail');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      
      uploadThumbnail(file);
    }
  };
  
  // Trigger file input click
  const handleThumbnailClick = () => {
    fileInputRef.current?.click();
  };
  
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
  
  // Initialize state from URL parameters only once
  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    
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
    
    initialLoadDoneRef.current = true;
  }, [searchParams]);
  
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
          if (data.thumbnail_url) {
            setThumbnailUrl(data.thumbnail_url);
          }
          if (data.deadline) {
            setDeadline(data.deadline);
          }
          if (data.publish_date) {
            setPublishDate(data.publish_date);
          }
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

  // Fetch teacher's courses only once
  useEffect(() => {
    async function fetchCourses() {
      if (!user || !supabase || courses.length > 0) return;
      
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
  }, [user, supabase, selectedCourseId, searchParams, courses.length]);

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

    if (!deadline) {
      setError('Please set a module deadline');
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
            thumbnail_url: thumbnailUrl,
            deadline,
            publish_date: publishDate || null
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
            teacher_id: user.id,
            thumbnail_url: thumbnailUrl,
            deadline,
            publish_date: publishDate || null
          })
          .select();

        if (insertError) {
          throw insertError;
        }

        if (data && data.length > 0) {
          newModuleId = data[0].id;
          setModuleId(newModuleId);
          toast.success('Module created successfully!');
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

  // Add this after the Module Dates section and before the Description section
  const teacherSharingSection = (
    <div className="grid grid-cols-4 gap-6 items-start">
      <div className="col-span-1">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users2 className="h-4 w-4" />
          <span className="font-medium">Share With</span>
        </div>
      </div>
      <div className="col-span-3 space-y-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTeachers.map(teacher => (
            <Badge 
              key={teacher.id} 
              variant="secondary"
              className="flex items-center gap-1 pl-3 pr-2 py-1.5"
            >
              {teacher.name}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedTeachers(current => 
                    current.filter(t => t.id !== teacher.id)
                  );
                }}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={teacherSearchOpen}
              className="w-full justify-between"
            >
              <span>Search for teachers to share with...</span>
              <Users2 className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search teachers..."
                className="h-9"
                value={searchTeachers}
                onValueChange={setSearchTeachers}
              />
              <CommandEmpty>No teachers found.</CommandEmpty>
              <CommandGroup>
                {filteredTeachers.map(teacher => (
                  <CommandItem
                    key={teacher.id}
                    value={teacher.name}
                    onSelect={() => {
                      setSelectedTeachers(current => [...current, { id: teacher.id, name: teacher.name }]);
                      setTeacherSearchOpen(false);
                    }}
                  >
                    {teacher.name}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {teacher.email}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-sm text-gray-500">
          Share this module with other teachers to allow them to use it in their courses
        </p>
      </div>
    </div>
  );

  // Update the bottom continue button section with better styling
  const bottomContinueButton = (
    <div className="px-8 py-6 mt-8 border-t bg-gray-50">
      <div className="max-w-xl mx-auto">
        <Button 
          onClick={handleCreateModule}
          disabled={isSubmitting || !title.trim() || !selectedCourseId || !deadline}
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-6 text-lg relative group transition-all duration-200"
        >
          <span className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          Next Step
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <p className="text-sm text-gray-500 text-center mt-3">
          You'll be able to add slides and content in the next step
        </p>
      </div>
    </div>
  );

  // Add this function to handle course creation
  const handleCreateCourseClick = () => {
    setTeacherSearchOpen(false); // Close any open popovers
    setIsCourseModalOpen(true);
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
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
                disabled={isSubmitting || !title.trim() || !selectedCourseId || !deadline}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {step === 2 && moduleId && (
              <Button 
                onClick={() => {
                  const slideEditorSaveButton = document.querySelector('[data-slide-editor-save]') as HTMLButtonElement;
                  if (slideEditorSaveButton) {
                    slideEditorSaveButton.click();
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Save Changes
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
      
      {/* Content area with dynamic width based on step */}
      <div className={`mx-auto py-8 px-4 ${step === 1 ? 'max-w-3xl' : 'max-w-full container'} mt-[57px]`}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Module Overview */}
        {step === 1 && (
          <div>
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden font-sans">
              {/* Thumbnail Upload Section */}
              <div className="relative mx-auto w-full h-64 bg-slate-50 border-b">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                
                <div 
                  onClick={handleThumbnailClick}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                >
                  {thumbnailUrl ? (
                    <>
                      <Image 
                        src={thumbnailUrl} 
                        alt="Module thumbnail" 
                        fill 
                        style={{ objectFit: 'cover' }}
                        className="transition-opacity group-hover:opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <div className="bg-white p-3 rounded-full">
                          <Edit2 className="h-6 w-6 text-gray-800" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Camera className="h-10 w-10 text-slate-400" />
                        <span className="text-slate-600 font-medium">Click to add a cover image</span>
                        <span className="text-slate-500 text-sm">Recommended size: 1280×720</span>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="animate-pulse text-white">Uploading...</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Form Fields with improved hierarchy */}
              <div className="p-8 space-y-8">
                {/* Module Title - Made prominent */}
                <div className="space-y-4">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title..."
                    disabled={isSubmitting}
                    className="text-6xl leading-tight font-semibold w-full p-0 h-auto border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 bg-transparent placeholder:text-gray-400/70 outline-none"
                    style={{
                      fontSize: '32px'
                    }}
                  />
                </div>
                
                {/* Course Selection - Second most important */}
                <div className="grid grid-cols-4 gap-6 items-start">
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Select Course</span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Select 
                      value={selectedCourseId} 
                      onValueChange={(value) => {
                        if (value === 'create_new') {
                          setIsCourseModalOpen(true);
                        } else {
                          setSelectedCourseId(value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base">
                        <SelectValue placeholder="Select a course for this module" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem 
                            key={course.id} 
                            value={course.id}
                            className="py-2.5 text-base"
                          >
                            {course.title}
                          </SelectItem>
                        ))}
                        <div className="px-2 py-2 border-t">
                          <SelectItem 
                            value="create_new"
                            className="py-2.5 text-base text-indigo-600 font-medium cursor-pointer"
                          >
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Create new course
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Module Dates */}
                <div className="grid grid-cols-4 gap-6 items-start">
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Module Timing</span>
                    </div>
                  </div>
                  <div className="col-span-3 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Module Deadline<span className="text-red-500 ml-1">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-70"
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-500">Set when this module needs to be completed by students</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Publish Date
                          <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-70"
                        />
                      </div>
                      <p className="text-sm text-gray-500">Schedule when this module becomes available to students</p>
                    </div>
                  </div>
                </div>
                
                {/* Teacher Sharing */}
                {teacherSharingSection}
                
                {/* Divider */}
                <div className="border-t border-gray-100"></div>
                
                {/* Module Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Description</span>
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Let your learner know a little about the module"
                    rows={5}
                    disabled={isSubmitting}
                    className="resize-none p-0 text-base border-0 focus-visible:ring-0 placeholder:text-gray-400 font-normal"
                  />
                  <p className="text-sm text-gray-400 flex justify-end">
                    {description.length}/400
                  </p>
                </div>
              </div>
              
              {/* Bottom Continue Button */}
              {bottomContinueButton}
            </div>
          </div>
        )}
        
        {/* Step 2: Add Content/Slides */}
        {step === 2 && moduleId && (
          <div>
            <SlideEditor 
              moduleId={moduleId} 
              onSave={() => {
                console.log('[CreateModulePage] SlideEditor onSave callback triggered');
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
            <div className="bg-white border rounded-xl overflow-hidden">
              {thumbnailUrl ? (
                <div className="relative w-full h-48 md:h-64">
                  <Image 
                    src={thumbnailUrl} 
                    alt="Module thumbnail" 
                    fill 
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div className="w-full h-32 md:h-48 bg-amber-100 flex items-center justify-center">
                  <div className="text-center">
                    <FileImage className="h-10 w-10 text-amber-600 mx-auto mb-2" />
                    <p className="text-amber-800">No cover image</p>
                  </div>
                </div>
              )}
              
              <div className="p-6 space-y-4">
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
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deadline</p>
                    <p className="text-lg font-medium">
                      {new Date(deadline).toLocaleString('en-US', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  {publishDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Publish Date</p>
                      <p className="text-lg font-medium">
                        {new Date(publishDate).toLocaleString('en-US', {
                          dateStyle: 'long',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  )}
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
      <CreateCourseModal 
        isOpen={isCourseModalOpen} 
        onClose={async () => {
          setIsCourseModalOpen(false);
          // Fetch updated courses list
          if (user && supabase) {
            try {
              const { data, error } = await supabase
                .from('courses')
                .select('id, title')
                .eq('teacher_id', user.id)
                .order('title', { ascending: true });
                
              if (error) throw error;
              
              setCourses(data || []);
              // Select the most recently created course
              if (data && data.length > 0) {
                setSelectedCourseId(data[data.length - 1].id);
              }
            } catch (err) {
              console.error('Error fetching updated courses:', err);
              toast.error('Failed to refresh courses list');
            }
          }
        }} 
      />
    </div>
  );
} 