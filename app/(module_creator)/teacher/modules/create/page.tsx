'use client';

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, X, CheckCircle, FileImage, Camera, BookOpen, Plus, Edit2, FileText, Clock, Calendar, Users2, AlertCircle, ImageIcon, PencilLine, Timer, Eye } from 'lucide-react';
import Image from 'next/image';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { z } from "zod";
import { Label } from "@/components/ui/label";

import SlideEditor from '@/app/(module_creator)/_components/SlideEditor';
import SlideViewer from '@/app/(module_creator)/_components/SlideViewer';
import { CreateCourseModal } from '@/app/(dashboard)/_components/CreateCourseModal';
import ThumbnailPopover from '@/app/(module_creator)/_components/ThumbnailPopover';
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface Course {
  id: string;
  title: string;
}

interface Slide {
  id?: string;
  module_id: string;
  position: number;
  slide_type: 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context';
  config: SlideConfig;
}

interface SlideConfig {
  content?: string;
  title?: string;
  question?: string;
  options?: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
  videoUrl?: string;
  duration?: number;
  thumbnail?: string;
  responseType?: string;
  [key: string]: unknown;
}

// Add this after the imports

const moduleFormSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  deadline: z.string().min(1, "Module deadline is required"),
  courseId: z.string().min(1, "Please select a course"),
  description: z.string().optional(),
  publishDate: z.string().optional(),
  estimatedDuration: z.number().nullable().optional(),
});

type ModuleFormData = z.infer<typeof moduleFormSchema>;

// Add these helper functions at the top of the file after the imports
const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

const formatTimeForInput = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const createDateFromInputs = (dateStr: string, timeStr: string): Date => {
  if (!dateStr || !timeStr) return new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// This is the client component that uses useSearchParams
function CreateModulePageContent() {
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
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const [isLoadingPredefinedThumbnails, setIsLoadingPredefinedThumbnails] = useState(false);
  const [predefinedThumbnails, setPredefinedThumbnails] = useState<Array<{ type: 'color' | 'illustration', url: string }>>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ModuleFormData, string>>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTeachers, setSelectedTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [searchTeachers, setSearchTeachers] = useState('');
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const t = useTranslations();
  // Predefined solid colors for thumbnails
  const predefinedColors = useMemo(() => [
    "#4F39F6", // Purple
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#6366F1", // Indigo
    "#14B8A6", // Teal
  ], []);

  // Function to select a predefined thumbnail
  const selectPredefinedThumbnail = async (item: { type: 'color' | 'illustration', url: string }) => {
    setSelectedThumbnail(item.url);
  };

  // Create memoized color thumbnails
  const colorThumbnails = useMemo(() =>
    predefinedColors.map(color => ({
      type: 'color' as const,
      url: color
    }))
    , [predefinedColors]);

  // Memoize fallback illustrations
  const fallbackIllustrations = useMemo(() => [
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZWR1Y2F0aW9ufGVufDB8fDB8fHww",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGVkdWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2NpZW5jZXxlbnwwfHwwfHx8MA%3D%3D"
  ], []);

  // Load predefined thumbnails
  useEffect(() => {
    const loadPredefinedThumbnails = async () => {
      if (!supabase) return;

      console.log('[Thumbnails] Starting to load thumbnails...');
      setIsLoadingPredefinedThumbnails(true);
      try {
        console.log('[Thumbnails] Loading predefined thumbnails...');

        // Always include colors - these don't need to be in Supabase
        console.log('[Thumbnails] Loaded color thumbnails:', colorThumbnails.length);

        try {
          // First, check if the bucket exists
          console.log('[Thumbnails] Checking if module-thumbnails bucket exists...');
          const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

          if (bucketsError) {
            console.error('[Thumbnails] Error checking buckets:', bucketsError);
            throw bucketsError;
          }

          const bucketExists = buckets?.some(bucket => bucket.name === 'module-thumbnails');
          console.log('[Thumbnails] Bucket exists:', bucketExists);

          // Try to list the contents of the thumbnails subfolder in module-thumbnails bucket
          console.log('[Thumbnails] Attempting to list contents from thumbnails subfolder...');
          const { data: thumbnailFiles, error: thumbnailError } = await supabase.storage
            .from('module-thumbnails')
            .list('thumbnails', {
              limit: 20,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (thumbnailError) {
            console.error('[Thumbnails] Error listing thumbnails subfolder:', thumbnailError);
            throw thumbnailError;
          }

          console.log('[Thumbnails] Files found in thumbnails subfolder:', thumbnailFiles?.length || 0);
          console.log('[Thumbnails] Files details:', thumbnailFiles);

          let illustrationUrls: Array<{ type: 'illustration', url: string }> = [];

          // If we have images in the thumbnails subfolder, use those
          if (thumbnailFiles && thumbnailFiles.length > 0) {
            console.log('[Thumbnails] Using images from thumbnails subfolder');

            // Check each file more thoroughly
            thumbnailFiles.forEach(file => {
              console.log(`[Thumbnails] File: ${file.name}, type:`, file);
            });

            const imageFiles = thumbnailFiles.filter(file => {
              const lowerName = file.name.toLowerCase();
              const isImageByExtension =
                lowerName.endsWith('.jpg') ||
                lowerName.endsWith('.jpeg') ||
                lowerName.endsWith('.png') ||
                lowerName.endsWith('.webp') ||
                lowerName.endsWith('.gif');

              // Consider folders as potential container for images too
              const isFolder = file.metadata?.mimetype === null || file.metadata?.mimetype === undefined;

              return isImageByExtension || isFolder;
            });

            console.log('[Thumbnails] Filtered image files:', imageFiles.length);

            // If filtering found no images, try using all files as a fallback
            const filesToUse = imageFiles.length > 0 ? imageFiles : thumbnailFiles;
            console.log('[Thumbnails] Files to use for thumbnails:', filesToUse.length);

            illustrationUrls = await Promise.all(
              filesToUse.map(async (file) => {
                const { data: urlData } = supabase.storage
                  .from('module-thumbnails')
                  .getPublicUrl(`thumbnails/${file.name}`);

                console.log(`[Thumbnails] Generated public URL for thumbnails/${file.name}:`, urlData.publicUrl);

                return {
                  type: 'illustration' as const,
                  url: urlData.publicUrl
                };
              })
            );

            console.log('[Thumbnails] Final illustration URLs:', illustrationUrls.length);
          }
          // If no images found, use fallback for testing
          else {
            console.log('[Thumbnails] No images found in thumbnails subfolder, using fallback illustrations');

            illustrationUrls = fallbackIllustrations.map(url => ({
              type: 'illustration' as const,
              url
            }));

            console.log('[Thumbnails] Using fallback illustration URLs:', illustrationUrls.length);
          }

          // Combine colors and illustrations
          const allThumbnails = [...colorThumbnails, ...illustrationUrls];
          console.log('[Thumbnails] Setting all thumbnails:', allThumbnails.length);
          setPredefinedThumbnails(allThumbnails);

        } catch (err) {
          console.error('[Thumbnails] Error with Supabase storage operations:', err);

          // Use fallback illustrations for testing
          console.log('[Thumbnails] Using fallback illustrations due to error');
          const fallbackUrls = fallbackIllustrations.map(url => ({
            type: 'illustration' as const,
            url
          }));

          setPredefinedThumbnails([...colorThumbnails, ...fallbackUrls]);
        }
      } catch (err) {
        console.error('[Thumbnails] Error loading predefined thumbnails:', err);
        // Fallback to colors only
        setPredefinedThumbnails(colorThumbnails);
      } finally {
        setIsLoadingPredefinedThumbnails(false);
        console.log('[Thumbnails] Finished loading thumbnails');
      }
    };

    loadPredefinedThumbnails();
  }, [supabase, colorThumbnails, fallbackIllustrations]);

  // Initialize selectedThumbnail when thumbnailUrl changes
  useEffect(() => {
    setSelectedThumbnail(thumbnailUrl);
  }, [thumbnailUrl]);

  // Function to fetch slides wrapped in useCallback
  const fetchSlides = useCallback(async () => {
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
  }, [moduleId, supabase]);

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

    // @ts-expect-error - Next.js types might be incomplete
    router.events?.on('routeChangeStart', handleRouteChangeStart);
    // @ts-expect-error - Next.js types might be incomplete
    router.events?.on('routeChangeComplete', handleRouteChangeComplete);
    // @ts-expect-error - Next.js types might be incomplete
    router.events?.on('beforeHistoryChange', handleBeforeHistoryChange);

    return () => {
      // @ts-expect-error - Next.js types might be incomplete
      router.events?.off('routeChangeStart', handleRouteChangeStart);
      // @ts-expect-error - Next.js types might be incomplete
      router.events?.off('routeChangeComplete', handleRouteChangeComplete);
      // @ts-expect-error - Next.js types might be incomplete
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
      setSelectedThumbnail(data.publicUrl);

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
  }, [searchParams, moduleId, supabase, fetchSlides]);

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

        // Check for preselectedCourseId
        const preselectedCourseId = searchParams.get('preselectedCourseId');
        if (preselectedCourseId) {
          setSelectedCourseId(preselectedCourseId);
        }
        // If no preselected course and no course is currently selected, select the first one
        else if (data && data.length > 0 && !selectedCourseId) {
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
  }, [user, supabase, searchParams, selectedCourseId]);

  // Handle form validation
  const validateForm = (): boolean => {
    try {
      moduleFormSchema.parse({
        title,
        deadline,
        courseId: selectedCourseId,
        description,
        publishDate,
        estimatedDuration,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Partial<Record<keyof ModuleFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as keyof ModuleFormData] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  // Update handleCreateModule to use validation
  async function handleCreateModule() {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
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
            publish_date: publishDate || null,
            estimated_duration: estimatedDuration,
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
            publish_date: publishDate || null,
            estimated_duration: estimatedDuration,
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

    } catch (err: unknown) {
      console.error('Error creating/updating module:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save module. Please try again.';
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

    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    try {
      setIsPublishing(true);

      // Since we're not using a published field, just consider the module published when it has slides
      if (slides.length > 0) {
        // Save all current module data
        const { error: updateError } = await supabase
          .from('modules')
          .update({
            title,
            description,
            course_id: selectedCourseId,
            thumbnail_url: thumbnailUrl,
            deadline,
            publish_date: publishDate || null,
            estimated_duration: estimatedDuration,
            updated_at: new Date().toISOString()
          })
          .eq('id', moduleId);

        if (updateError) {
          throw updateError;
        }

        setIsPublishModalOpen(false); // Close the modal
        toast.success('Module published successfully!');
        // Redirect to course page
        router.push(`/teacher/courses/${selectedCourseId}`);
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
      // If on step 2, trigger save before navigating back
      if (step === 2 && moduleId) {
        // Find the save button and click it
        const slideEditorSaveButton = document.querySelector('[data-slide-editor-save]') as HTMLButtonElement;

        if (slideEditorSaveButton) {
          // Set loading state to prevent multiple clicks
          setIsSubmitting(true);

          // Create a temporary function to handle successful save
          const originalOnSave = window.onSaveComplete;

          // Define a promise to wait for save completion
          const savePromise = new Promise<void>((resolve) => {
            // Set up a temporary global function to capture save completion
            window.onSaveComplete = () => {
              resolve();
              // Restore original handler if it existed
              window.onSaveComplete = originalOnSave;
            };

            // Click the save button to trigger the save
            slideEditorSaveButton.click();

            // Add a fallback timeout in case the save callback doesn't fire
            setTimeout(() => {
              resolve();
              window.onSaveComplete = originalOnSave;
            }, 2000);
          });

          // After saving is complete, navigate back
          savePromise.then(() => {
            const newStep = step - 1;
            setStep(newStep);

            // Update URL with step
            const params = new URLSearchParams(searchParams.toString());
            params.set('step', newStep.toString());
            router.push(`/teacher/modules/create?${params.toString()}`);

            setIsSubmitting(false);
          });

          return;
        }
      }

      // Default behavior for other steps
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
        return t('teacher.modules.create.pageOverview');
      case 2:
        return t('teacher.modules.create.pageContent');
      case 3:
        return t('teacher.modules.create.pageReview');
      default:
        return t('teacher.modules.create.pageOverview');
    }
  };

  // Add this after the Module Dates section and before the Description section
  const teacherSharingSection = (
    <div className="grid grid-cols-4 gap-6 items-start">
      <div className="col-span-1">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users2 className="h-4 w-4" />
          <span className="font-medium">{t('teacher.modules.create.share')}</span>
        </div>
      </div>
      <div className="col-span-3 space-y-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTeachers.map(teacher => (
            <Button
              key={teacher.id}
              variant="secondary"
              className="text-base font-medium px-3 py-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          ))}
        </div>

        <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={teacherSearchOpen}
              className="w-full justify-between bg-white"
            >
              <span>{t('teacher.modules.create.shareInp')}</span>
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
          <Users2 className="h-4 w-4 inline-block mr-1 relative -top-[1px]" />
          {t('teacher.modules.create.shareTxt')}

        </p>
      </div>
    </div>
  );

  // bottom continue button section styling
  const bottomContinueButton = (
    <div className="px-8 py-6 mt-8 border-t bg-gray-50">
      <div className="max-w-xl mx-auto">
        <Button
          onClick={handleCreateModule}
          disabled={isSubmitting}
          className="bg-primaryStyling hover:bg-primaryStyling/90 text-white w-full py-6 text-lg relative group transition-all duration-200"
        >
          <span className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          {t('common.buttons.nextStep')}
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <p className="text-sm text-gray-500 text-center mt-3">
          {t('common.buttons.nextStepDes')}
        </p>
      </div>
    </div>
  );

  // Fix the thumbnail display in both the main UI and step 3
  const renderThumbnail = (url: string | null, showDefault: boolean = true) => {
    if (!url) {
      if (showDefault) {
        return (
          <ThumbnailPopover
            trigger={
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-primaryStyling cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Camera className="h-10 w-10 text-white" />
                  <span className="text-white font-medium">{t('teacher.modules.create.imageTxt')}</span>
                  <span className="text-white text-sm">{t('teacher.modules.create.imageSize')}</span>
                </div>
              </div>
            }
            thumbnailUrl={thumbnailUrl}
            selectedThumbnail={selectedThumbnail}
            setSelectedThumbnail={setSelectedThumbnail}
            setThumbnailUrl={setThumbnailUrl}
            moduleId={moduleId}
            predefinedThumbnails={predefinedThumbnails}
            isLoadingPredefinedThumbnails={isLoadingPredefinedThumbnails}
            selectPredefinedThumbnail={selectPredefinedThumbnail}
            fileInputRef={fileInputRef}
            align="center"
          />
        );
      }

      return (
        <div className="w-full h-64 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <FileImage className="h-12 w-12 text-amber-600/80 mx-auto mb-3" />
            <p className="text-amber-900/80 font-medium">No cover image</p>
          </div>
        </div>
      );
    }

    if (url.startsWith('#')) {
      console.log('[Thumbnail] Rendering color thumbnail:', url);
      return (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: url }}
        />
      );
    }

    console.log('[Thumbnail] Rendering image thumbnail:', url);
    return (
      <Image
        src={url}
        alt="Module thumbnail"
        fill
        style={{ objectFit: 'cover' }}
        className="transition-opacity group-hover:opacity-80"
      />
    );
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
              <h1 className="text-lg font-semibold">{t('common.button.createModule')}</h1>
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
                <Button
                  onClick={() => setIsCourseModalOpen(true)}
                  className="bg-primaryStyling text-white hover:bg-indigo-700"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CreateCourseModal
          isOpen={isCourseModalOpen}
          onClose={() => {
            setIsCourseModalOpen(false);
            // Only refresh courses list without page reload
            if (user && supabase) {
              supabase
                .from('courses')
                .select('id, title')
                .eq('teacher_id', user.id)
                .order('title', { ascending: true })
                .then(({ data, error }) => {
                  if (error) {
                    console.error('Error fetching updated courses:', error);
                    toast.error('Failed to refresh courses list');
                    return;
                  }

                  setCourses(data || []);
                  if (data && data.length > 0) {
                    setSelectedCourseId(data[data.length - 1].id);
                  }
                });
            }
          }}
        />
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
            <h1 className="text-lg font-semibold">
              {step === 1 ? t('common.buttons.createModule') : title || "Module"}
            </h1>
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
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                {isSubmitting && step === 2 ? 'Saving...' : 'Back'}
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={handleCreateModule}
                disabled={isSubmitting}
                className="bg-primaryStyling hover:bg-primaryStyling/90"
              >
                {t('common.buttons.nextStep')}
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
                className="bg-primaryStyling hover:bg-primaryStyling/90"
              >
                {t('common.buttons.nextStep')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={() => setIsPublishModalOpen(true)}
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
            className="h-1 bg-primaryStyling transition-all duration-300 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Content area with dynamic width based on step */}
      <div className={cn("mx-auto py-8 px-4", step === 1 ? 'max-w-3xl' : step === 2 ? 'max-w-full container' : 'max-w-4xl', "mt-[57px]")}>
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

                <div className="absolute inset-0 flex items-center justify-center group">
                  {renderThumbnail(thumbnailUrl)}

                  {/* Overlay for existing thumbnails */}
                  {thumbnailUrl && (
                    <ThumbnailPopover
                      trigger={
                        <div className="absolute inset-0 cursor-pointer">
                          {thumbnailUrl.startsWith('#') ? (
                            <div style={{ backgroundColor: thumbnailUrl }} className="w-full h-full" />
                          ) : (
                            <Image
                              src={thumbnailUrl}
                              alt="Module thumbnail"
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                          <div className="absolute top-3 right-3 bg-black/80 text-white p-1 rounded-md">
                            <PencilLine className="h-4 w-4" />
                          </div>
                        </div>
                      }
                      thumbnailUrl={thumbnailUrl}
                      selectedThumbnail={selectedThumbnail}
                      setSelectedThumbnail={setSelectedThumbnail}
                      setThumbnailUrl={setThumbnailUrl}
                      moduleId={moduleId}
                      predefinedThumbnails={predefinedThumbnails}
                      isLoadingPredefinedThumbnails={isLoadingPredefinedThumbnails}
                      selectPredefinedThumbnail={selectPredefinedThumbnail}
                      fileInputRef={fileInputRef}
                      align="center"
                    />
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="animate-pulse text-white">Uploading...</div>
                    </div>
                  )}

                  {/* Update Thumbnail button */}
                  <div className="absolute bottom-4 right-4">
                    <ThumbnailPopover
                      trigger={
                        <Button
                          className="shadow-md bg-white text-gray-800 border border-gray-200 cursor-pointer"
                          variant="secondary"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {t('common.buttons.image')}
                        </Button>
                      }
                      thumbnailUrl={thumbnailUrl}
                      selectedThumbnail={selectedThumbnail}
                      setSelectedThumbnail={setSelectedThumbnail}
                      setThumbnailUrl={setThumbnailUrl}
                      moduleId={moduleId}
                      predefinedThumbnails={predefinedThumbnails}
                      isLoadingPredefinedThumbnails={isLoadingPredefinedThumbnails}
                      selectPredefinedThumbnail={selectPredefinedThumbnail}
                      fileInputRef={fileInputRef}
                      align="start"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields with improved hierarchy */}
              <div className="p-8 space-y-8">
                {/* Module Title - Made prominent */}
                <div className="space-y-4">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) {
                        setErrors({ ...errors, title: undefined });
                      }
                    }}
                    placeholder={t('teacher.modules.create.title')}
                    disabled={isSubmitting}
                    style={{ fontSize: '32px' }}
                    className={cn(
                      "text-6xl leading-tight font-semibold w-full p-0 h-auto border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 bg-transparent outline-none",
                      "placeholder:text-gray-400/70",
                      errors.title && "placeholder:text-red-500/70 text-red-500",
                      "text-[32px]"
                    )}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Course Selection - Second most important */}
                <div className="grid grid-cols-4 gap-6 items-start">
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">{t('teacher.modules.create.select')}</span>
                      <span className="text-red-500">*</span>
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
                          if (errors.courseId) {
                            setErrors({ ...errors, courseId: undefined });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className={cn(
                        "h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling text-base",
                        errors.courseId && "border-red-500 ring-red-500"
                      )}>
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
                            className="py-2.5 text-base text-primaryStyling font-medium cursor-pointer"
                          >
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              {t('common.buttons.createCourse')}
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                    {errors.courseId && (
                      <p className="text-sm text-red-500 mt-1">{errors.courseId}</p>
                    )}
                  </div>
                </div>

                {/* Module Deadline */}
                <div className="grid grid-cols-4 gap-6 items-start">
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{t('teacher.modules.create.time')}</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </div>
                  <div className="col-span-3 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">{t('teacher.modules.create.deadline')}</label>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="flex gap-2">
                        <div
                          className="relative flex-1 cursor-pointer"
                          onClick={() => {
                            const input = document.querySelector('input[name="deadline-date"]') as HTMLInputElement;
                            if (input) input.showPicker();
                          }}
                        >
                          <input
                            type="date"
                            name="deadline-date"
                            value={deadline ? deadline.split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value;
                              const time = deadline ? deadline.split('T')[1] : '00:00';
                              const newDeadline = `${date}T${time}`;

                              const selectedDate = new Date(newDeadline);
                              const now = new Date();
                              now.setSeconds(0);
                              now.setMilliseconds(0);

                              if (selectedDate <= now) {
                                toast.error("Deadline must be in the future");
                                return;
                              }

                              setDeadline(newDeadline);
                              if (errors.deadline) {
                                setErrors({ ...errors, deadline: undefined });
                              }
                            }}
                            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                            className={cn(
                              "w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling sm:text-sm cursor-pointer",
                              errors.deadline && "border-red-500 ring-red-500"
                            )}
                            required
                          />
                        </div>
                        <input
                          type="time"
                          name="deadline-time"
                          value={deadline ? deadline.split('T')[1] : '00:00'}
                          onChange={(e) => {
                            const date = deadline ? deadline.split('T')[0] : new Date().toISOString().split('T')[0];
                            const newDeadline = `${date}T${e.target.value}`;

                            const selectedDate = new Date(newDeadline);
                            const now = new Date();
                            now.setSeconds(0);
                            now.setMilliseconds(0);

                            if (selectedDate <= now) {
                              toast.error("Deadline must be in the future");
                              return;
                            }

                            setDeadline(newDeadline);
                            if (errors.deadline) {
                              setErrors({ ...errors, deadline: undefined });
                            }
                          }}
                          className={cn(
                            "w-32 h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling sm:text-sm",
                            errors.deadline && "border-red-500 ring-red-500"
                          )}
                          required
                        />
                      </div>
                      {errors.deadline && (
                        <p className="text-sm text-red-500">{errors.deadline}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        <Clock className="h-4 w-4 inline-block mr-1 relative -top-[1px]" />
                        {t('teacher.modules.create.deadlineTxt')}
                      </p>
                    </div>


                    {/* Publish Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">{t('teacher.modules.create.publish')}</label>
                        <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                      </div>
                      <div className="flex gap-2">
                        <div
                          className="relative flex-1"
                          onClick={() => {
                            const input = document.querySelector('input[name="publish-date"]') as HTMLInputElement;
                            if (input) input.showPicker();
                          }}
                        >
                          <input
                            type="date"
                            name="publish-date"
                            value={publishDate ? publishDate.split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value;
                              const time = publishDate ? publishDate.split('T')[1] : '00:00';
                              setPublishDate(`${date}T${time}`);
                            }}
                            className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling sm:text-sm cursor-pointer"
                          />
                        </div>
                        <input
                          type="time"
                          name="publish-time"
                          value={publishDate ? publishDate.split('T')[1] : '00:00'}
                          onChange={(e) => {
                            const date = publishDate ? publishDate.split('T')[0] : new Date().toISOString().split('T')[0];
                            setPublishDate(`${date}T${e.target.value}`);
                          }}
                          className="w-32 h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling sm:text-sm"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        <Calendar className="h-4 w-4 inline-block mr-1 relative -top-[1px]" />
                        {t('teacher.modules.create.publishTxt')}
                      </p>
                    </div>

                    {/* Estimated Duration */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">{t('teacher.modules.create.estimate')}</label>
                        <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={estimatedDuration || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setEstimatedDuration(value);
                              } else {
                                setEstimatedDuration(null);
                              }
                            }}
                            placeholder={t('teacher.modules.create.estimateInp')}
                            className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Module estimated duration in minutes"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Clock className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium min-w-[60px]">{t('teacher.modules.create.minutes')}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        <Timer className="h-4 w-4 inline-block mr-1 relative -top-[1px]" />
                        {t('teacher.modules.create.estimateTxt')}
                      </p>
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
                    <span className="font-medium">{t('teacher.modules.create.description.label')}</span>
                  </div>
                  <Textarea
                    placeholder={t('teacher.modules.create.description.placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] resize-none bg-white"
                  />
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
          <div>
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              {/* Cover Image */}
              <div className="relative w-full h-64">
                {thumbnailUrl ? (
                  <>
                    {thumbnailUrl.startsWith('#') ? (
                      // Render solid color
                      <div className="absolute inset-0" style={{ backgroundColor: thumbnailUrl }}></div>
                    ) : (
                      // Render image
                      <>
                        <Image
                          src={thumbnailUrl}
                          alt="Module thumbnail"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="transition-all duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </>
                    )}
                  </>
                ) : (
                  // Render default (no thumbnail)
                  <div className="w-full h-64 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                    <div className="text-center">
                      <FileImage className="h-12 w-12 text-amber-600/80 mx-auto mb-3" />
                      <p className="text-amber-900/80 font-medium">No cover image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Module Details */}
              <div className="p-8 space-y-8">
                {/* Title and Course */}
                <div className="space-y-4">
                  <div className="group relative inline-flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="group cursor-pointer flex items-center gap-2">
                          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-title">Module Title</Label>
                            <Input
                              id="edit-title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Enter module title"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="group relative inline-flex items-center gap-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="h-5 w-5 text-primaryStyling" />
                      <span className="font-medium">
                        {courses.find(c => c.id === selectedCourseId)?.title || 'Unknown Course'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setStep(1);
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('step', '1');
                        router.push(`/teacher/modules/create?${params.toString()}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {description && (
                  <div className="group relative flex items-start gap-2 max-w-full">
                    <div className="prose max-w-full flex-grow overflow-hidden">
                      <p className="text-gray-600 break-words">{description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setStep(1);
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('step', '1');
                        router.push(`/teacher/modules/create?${params.toString()}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full flex-shrink-0 mt-1"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                )}

                {/* Timing Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="group relative inline-flex items-start gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="group cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Deadline</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-base text-gray-900">
                                {deadline ? new Date(deadline).toLocaleString('en-GB', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }) : 'Not set'}
                              </p>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="h-4 w-4 text-gray-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={formatDateForInput(new Date(deadline))}
                              onChange={(e) => {
                                const newDate = createDateFromInputs(
                                  e.target.value,
                                  formatTimeForInput(new Date(deadline))
                                );
                                setDeadline(newDate.toISOString());
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                              type="time"
                              value={formatTimeForInput(new Date(deadline))}
                              onChange={(e) => {
                                const newDate = createDateFromInputs(
                                  formatDateForInput(new Date(deadline)),
                                  e.target.value
                                );
                                setDeadline(newDate.toISOString());
                              }}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {publishDate && (
                    <div className="group relative inline-flex items-start gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="group cursor-pointer">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{t('teacher.modules.create.publish')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-base text-gray-900">
                                  {publishDate ? new Date(publishDate).toLocaleString('en-GB', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  }) : 'Not set'}
                                </p>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 className="h-4 w-4 text-gray-600" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-4 space-y-4">
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={formatDateForInput(new Date(publishDate))}
                                onChange={(e) => {
                                  const newDate = createDateFromInputs(
                                    e.target.value,
                                    formatTimeForInput(new Date(publishDate))
                                  );
                                  setPublishDate(newDate.toISOString());
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Time</Label>
                              <Input
                                type="time"
                                value={formatTimeForInput(new Date(publishDate))}
                                onChange={(e) => {
                                  const newDate = createDateFromInputs(
                                    formatDateForInput(new Date(publishDate)),
                                    e.target.value
                                  );
                                  setPublishDate(newDate.toISOString());
                                }}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {estimatedDuration !== null && (
                    <div className="group relative inline-flex items-start gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="group cursor-pointer">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Timer className="h-4 w-4" />
                                <span className="font-medium">Estimated Duration</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-base text-gray-900">
                                  {estimatedDuration} minutes
                                </p>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 className="h-4 w-4 text-gray-600" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Estimated Duration (minutes)</Label>
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={estimatedDuration || ''}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (!isNaN(value) && value > 0) {
                                        setEstimatedDuration(value);
                                      } else {
                                        setEstimatedDuration(null);
                                      }
                                    }}
                                    placeholder={t('teacher.modules.create.estimateInp')}
                                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryStyling focus:border-primaryStyling sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                                <span className="text-sm text-gray-600 font-medium min-w-[60px]">minutes</span>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Content Summary */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primaryStyling" />
                      <h2 className="text-lg font-semibold text-gray-900">Module Content</h2>
                    </div>
                    <Button className="text-base font-medium px-3 h-10 bg-primaryStyling text-white cursor-pointer hover:bg-indigo-700 transition-all duration-200">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Module
                    </Button>
                  </div>

                  {slides.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-amber-800">No Content Added</h3>
                          <p className="mt-1 text-sm text-amber-700">
                            This module doesn&apos;t have any content yet. Go back to step 2 to add slides.
                          </p>
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBack}
                              className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                            >
                              <ArrowLeft className="h-4 w-4 mr-1" />
                              Back to Content Editor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y bg-white">
                      <SlideViewer moduleId={moduleId} estimatedDuration={estimatedDuration} />
                    </div>
                  )}
                </div>
              </div>

              {/* Publishing Section */}
              <div className="bg-gray-50 border-t px-8 py-6">
                <div className="max-w-xl mx-auto">
                  <Button
                    onClick={() => setIsPublishModalOpen(true)}
                    disabled={isPublishing || slides.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white w-full py-6 text-lg relative group transition-all duration-200"
                  >
                    <span className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {isPublishing ? 'Publishing...' : 'Publish Module'}
                    <CheckCircle className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Publish Confirmation Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Module</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to publish this module{publishDate ? ` on ${new Date(publishDate).toLocaleDateString()}` : " now"}?
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsPublishModalOpen(false)}
              className="mr-2"
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              onClick={handlePublishModule}
              disabled={isPublishing || slides.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? 'Publishing...' : 'Yes, Publish Module'}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          // Only refresh courses list without page reload
          if (user && supabase) {
            supabase
              .from('courses')
              .select('id, title')
              .eq('teacher_id', user.id)
              .order('title', { ascending: true })
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching updated courses:', error);
                  toast.error('Failed to refresh courses list');
                  return;
                }

                setCourses(data || []);
                if (data && data.length > 0) {
                  setSelectedCourseId(data[data.length - 1].id);
                }
              });
          }
        }}
      />
    </div>
  );
}

// Export the page with Suspense boundary
export default function CreateModulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CreateModulePageContent />
    </Suspense>
  );
}

// Add TypeScript declaration for the window.onSaveComplete property
declare global {
  interface Window {
    onSaveComplete?: () => void;
  }
} 