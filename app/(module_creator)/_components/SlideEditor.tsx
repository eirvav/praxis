'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash, Video, ListTodo, Settings, Grip, AlignLeft, MessageSquare, MoveHorizontal, Copy, X, Camera, AlertCircle } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import slide type components
import TextSlideContent, { TextSlideTypeBadge, createDefaultTextSlideConfig, TextSlideRef } from './slide_types/ReflectionSlide';
import VideoSlideContent, { VideoSlideTypeBadge, createDefaultVideoSlideConfig } from './slide_types/VideoSlide';
import QuizSlideContent, { QuizSlideTypeBadge, createDefaultQuizSlideConfig } from './slide_types/QuizSlide';
import StudentResponseSlideContent, { StudentResponseSlideTypeBadge, createDefaultStudentResponseConfig } from './slide_types/StudentResponseSlide';
import SliderSlideContent, { SliderSlideTypeBadge, createDefaultSliderConfig } from './slide_types/SliderSlide';
import ContextSlideContent, { ContextSlideTypeBadge, createDefaultContextSlideConfig, ContextSlideRef } from './slide_types/ContextSlide';

export interface Slide {
  id?: string;
  module_id: string;
  slide_type: 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context';
  position: number;
  config: SlideConfig;
  created_at?: string;
  updated_at?: string;
}

// Define the individual slide config types
export interface TextSlideConfig {
  type: 'text';
  content: string;
  isRequired: boolean;
  maxWords?: number;
}

export interface VideoSlideConfig {
  type: 'video';
  title: string;
  videoUrl: string;
  videoFileName: string;
  context: string;
  allowReplay: boolean;
  maxReplays: number;
  isRequired: boolean;
}

export interface QuizSlideConfig {
  type: 'quiz';
  question: string;
  description?: string;
  options: string[];
  correctOptionIndex: number;
  explanations?: string[];
  optionImages?: string[];
  shuffleOptions?: boolean;
  multipleCorrect?: boolean;
  correctOptionIndices?: number[];
  isRequired?: boolean;
}

export interface StudentResponseSlideConfig {
  type: 'student_response';
  severalResponses: boolean;
  instantResponse: boolean;
  maxResponses: number;
  responseMaxDuration: number; // in seconds
  isRequired: boolean;
}

export interface SliderSlideConfig {
  type: 'slider';
  description: string;
  sliders: Array<{
    id: string;
    title: string;
    question: string;
    minLabel: string;
    midLabel: string;
    maxLabel: string;
    min: number;
    max: number;
    step: number;
    required: boolean;
    defaultValue: number;
  }>;
  isRequired: boolean;
}

export interface ContextSlideConfig {
  type: 'context';
  content: string;
}

// Define a union type for all possible slide configurations
export type SlideConfig =
  | TextSlideConfig
  | VideoSlideConfig
  | QuizSlideConfig
  | StudentResponseSlideConfig
  | SliderSlideConfig
  | ContextSlideConfig;

// Type guard functions to check the slide type
function isTextSlide(config: SlideConfig): config is TextSlideConfig {
  return config.type === 'text';
}

function isVideoSlide(config: SlideConfig): config is VideoSlideConfig {
  return config.type === 'video';
}

function isQuizSlide(config: SlideConfig): config is QuizSlideConfig {
  return config.type === 'quiz';
}

function isStudentResponseSlide(config: SlideConfig): config is StudentResponseSlideConfig {
  return config.type === 'student_response';
}

function isSliderSlide(config: SlideConfig): config is SliderSlideConfig {
  return config.type === 'slider';
}

function isContextSlide(config: SlideConfig): config is ContextSlideConfig {
  return config.type === 'context';
}

interface SlideEditorProps {
  moduleId: string;
  onSave?: () => void;
}

const PreviewSlide = ({ type }: { type: string }) => {
  switch (type) {
    case 'text': {
      const config = createDefaultTextSlideConfig();
      return <TextSlideContent config={config} onConfigChange={() => { }} />;
    }
    case 'quiz': {
      const config = createDefaultQuizSlideConfig();
      return <QuizSlideContent config={config} onConfigChange={() => { }} />;
    }
    case 'video': {
      const config = createDefaultVideoSlideConfig();
      return <VideoSlideContent config={config} onConfigChange={() => { }} />;
    }
    case 'student_response': {
      const config = createDefaultStudentResponseConfig();
      return <StudentResponseSlideContent config={config} onConfigChange={() => { }} />;
    }
    case 'slider': {
      const config = createDefaultSliderConfig();
      return <SliderSlideContent config={config} onConfigChange={() => { }} />;
    }
    case 'context': {
      const config = createDefaultContextSlideConfig();
      return <ContextSlideContent config={config} onConfigChange={() => { }} />;
    }
    default:
      return null;
  }
};

export default function SlideEditor({ moduleId, onSave }: SlideEditorProps) {
  console.log('[SlideEditor] RENDERING with moduleId:', moduleId);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const initialFetchDoneRef = useRef(false);
  const supabase = useSupabase();
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [addSlidePreviewType, setAddSlidePreviewType] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null);
  const textSlideRef = useRef<TextSlideRef>(null);
  const contextSlideRef = useRef<ContextSlideRef>(null);
  const t = useTranslations();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Helper function to format duration in seconds to a readable format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    } else if (minutes === 1 && remainingSeconds === 0) {
      return `1 minute`;
    } else if (remainingSeconds === 0) {
      return `${minutes} minutes`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // Log the current slide state for debugging
  useEffect(() => {
    console.log('[SlideEditor] Current slides state:', slides);
  }, [slides]);

  // Track component mounting and unmounting
  useEffect(() => {
    console.log('[SlideEditor] Component MOUNTED');

    return () => {
      console.log('[SlideEditor] Component UNMOUNTED');
    };
  }, []);

  // Create a default slide
  const createDefaultSlide = useCallback((): Slide => {
    return {
      module_id: moduleId,
      slide_type: 'context',
      position: 0,
      config: { type: 'context', content: '' }
    };
  }, [moduleId]);

  // Save slides to localStorage for persistence
  useEffect(() => {
    if (slides.length > 0 && moduleId) {
      try {
        localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(slides));
      } catch (err) {
        console.error('Error saving slides to localStorage:', err);
      }
    }
  }, [slides, moduleId]);

  // Load existing slides only once - with localStorage fallback
  useEffect(() => {
    async function loadSlides() {
      if (!moduleId) return;

      setLoading(true);

      try {
        // Try to load from localStorage first for immediate display
        let cachedSlidesData = null;
        try {
          const cached = localStorage.getItem(`slides_cache_${moduleId}`);
          if (cached) {
            cachedSlidesData = JSON.parse(cached);
            console.log('Retrieved slides from localStorage cache');

            // If we have cached slides, set them immediately
            if (cachedSlidesData && cachedSlidesData.length > 0) {
              setSlides(cachedSlidesData);
              setActiveSlideIndex(0);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error('Error reading from localStorage:', err);
        }

        // Then always try to load from Supabase to get the latest
        if (supabase) {
          const { data, error } = await supabase
            .from('slides')
            .select('*')
            .eq('module_id', moduleId)
            .order('position', { ascending: true });

          if (error) throw error;

          if (data && data.length > 0) {
            setSlides(data);
            setActiveSlideIndex(0);
          } else if (!cachedSlidesData) {
            // If no slides from DB and no cached slides, create default
            const defaultSlide = createDefaultSlide();
            setSlides([defaultSlide]);
            setActiveSlideIndex(0);
          }
        }
      } catch (err: unknown) {
        console.error('Error loading slides:', err);
        toast.error('Failed to load slides');
        // Create a default slide since both DB and cache failed
        const defaultSlide = createDefaultSlide();
        setSlides([defaultSlide]);
        setActiveSlideIndex(0);
      } finally {
        setLoading(false);
        initialFetchDoneRef.current = true;
      }
    }

    loadSlides();
  }, [moduleId, supabase, createDefaultSlide]);

  // Remove a slide
  const removeSlide = useCallback((index: number) => {
    if (slides.length <= 1) {
      toast.error("You must have at least one slide");
      return;
    }

    const updatedSlides = [...slides];
    updatedSlides.splice(index, 1);

    // Update positions
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));

    setSlides(reorderedSlides);

    // Update active slide index
    if (activeSlideIndex === index) {
      if (reorderedSlides.length === 0) {
        setActiveSlideIndex(null);
      } else if (activeSlideIndex >= reorderedSlides.length) {
        setActiveSlideIndex(reorderedSlides.length - 1);
      }
    } else if (activeSlideIndex !== null && activeSlideIndex > index) {
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  }, [slides, activeSlideIndex]);

  // Add keyboard shortcut for deleting slides
  useEffect(() => {
    // Add keyboard event listener for backspace
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle backspace key
      if (e.key !== 'Backspace') return;

      // Check if we have an active slide
      if (activeSlideIndex === null) return;

      // Don't delete if we're typing in an input or contentEditable element
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.tagName === 'SELECT') {
        return;
      }

      // Don't delete if we only have one slide
      if (slides.length <= 1) {
        toast.error("You must have at least one slide");
        return;
      }

      // Remove the slide
      removeSlide(activeSlideIndex);
    };

    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Clean up the event listener
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSlideIndex, slides.length, removeSlide]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add some visual feedback
    e.currentTarget.classList.add('opacity-50');

    // Set the drag image
    try {
      const dragImage = document.createElement('div');
      dragImage.classList.add('w-20', 'h-12', 'bg-white', 'rounded', 'shadow-md', 'flex', 'items-center', 'justify-center');
      dragImage.innerHTML = `<div class="text-sm font-medium">Slide ${index + 1}</div>`;
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 10, 10);

      // Clean up the drag image after it's used
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    } catch (err) {
      console.error('Error setting drag image:', err);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Add visual indicator
    const target = e.currentTarget;

    // If we're dragging over a new target
    if (draggedSlideIndex !== null && draggedSlideIndex !== index) {
      // Highlight drop zone
      target.classList.add('bg-gray-100');

      // If dragging downward, add border to bottom
      if (draggedSlideIndex < index) {
        target.classList.add('border-b-2', 'border-indigo-500');
      } else {
        // If dragging upward, add border to top
        target.classList.add('border-t-2', 'border-indigo-500');
      }
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove visual indicators
    e.currentTarget.classList.remove('bg-gray-100', 'border-t-2', 'border-b-2', 'border-indigo-500');
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove visual indicators
    e.currentTarget.classList.remove('opacity-50');
    setDraggedSlideIndex(null);

    // Clean up any remaining highlight classes
    document.querySelectorAll('.slide-thumbnail').forEach(el => {
      el.classList.remove('bg-gray-100', 'border-t-2', 'border-b-2', 'border-indigo-500');
    });
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    // Remove visual indicators
    e.currentTarget.classList.remove('bg-gray-100', 'border-t-2', 'border-b-2', 'border-indigo-500');

    if (draggedSlideIndex === null || draggedSlideIndex === dropIndex) {
      return;
    }

    // Make a copy of slides
    const updatedSlides = [...slides];

    // Remove dragged item
    const [draggedSlide] = updatedSlides.splice(draggedSlideIndex, 1);

    // Insert it at the drop position
    updatedSlides.splice(dropIndex, 0, draggedSlide);

    // Update positions
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));

    // Update active slide index if needed
    if (activeSlideIndex === draggedSlideIndex) {
      setActiveSlideIndex(dropIndex);
    } else if (
      (activeSlideIndex !== null) &&
      ((draggedSlideIndex < activeSlideIndex && dropIndex >= activeSlideIndex) ||
        (draggedSlideIndex > activeSlideIndex && dropIndex <= activeSlideIndex))
    ) {
      // Adjust active slide index if the dragged slide crosses over it
      const offset = draggedSlideIndex < activeSlideIndex ? 1 : -1;
      setActiveSlideIndex(activeSlideIndex + offset);
    }

    // Update slides array
    setSlides(reorderedSlides);

    // Reset drag state
    setDraggedSlideIndex(null);

    // Also update localStorage immediately
    try {
      localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(reorderedSlides));
    } catch (err) {
      console.error('Error saving slides to localStorage after reordering:', err);
    }
  };

  // Handle slide type change
  const handleSlideTypeChange = (value: string, index: number) => {
    const updatedSlides = [...slides];
    const slideType = value as 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context';

    // Set default config based on type
    let config: SlideConfig;

    switch (slideType) {
      case 'text':
        config = createDefaultTextSlideConfig();
        break;
      case 'video':
        // Get any existing video fields if possible
        const videoUrl = isVideoSlide(updatedSlides[index].config) ? updatedSlides[index].config.videoUrl : '';
        const title = isVideoSlide(updatedSlides[index].config) ? updatedSlides[index].config.title : '';
        const videoFileName = isVideoSlide(updatedSlides[index].config) ? updatedSlides[index].config.videoFileName : '';

        config = {
          type: 'video',
          title,
          videoUrl,
          videoFileName,
          context: '',
          allowReplay: false,
          maxReplays: 3,
          isRequired: false
        };
        break;
      case 'quiz':
        config = createDefaultQuizSlideConfig();
        break;
      case 'student_response':
        config = createDefaultStudentResponseConfig();
        break;
      case 'slider':
        config = createDefaultSliderConfig();
        break;
      case 'context':
        config = createDefaultContextSlideConfig();
        break;
    }

    console.log(`Changing slide ${index} type to ${slideType} with config:`, config);

    updatedSlides[index] = {
      ...updatedSlides[index],
      slide_type: slideType,
      config
    };

    setSlides(updatedSlides);

    // Also update localStorage immediately
    try {
      localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(updatedSlides));
    } catch (err) {
      console.error('Error saving slides to localStorage after type change:', err);
    }
  };

  // Handle slide config change
  const updateSlideConfig = (index: number, configUpdate: Partial<SlideConfig>) => {
    const updatedSlides = [...slides];
    const currentConfig = updatedSlides[index].config;

    // Create a type-safe updated config based on the current config type
    let updatedConfig: SlideConfig;

    if (isTextSlide(currentConfig)) {
      updatedConfig = {
        ...currentConfig,
        ...configUpdate as Partial<TextSlideConfig>,
        type: 'text'
      };
    } else if (isVideoSlide(currentConfig)) {
      updatedConfig = {
        ...currentConfig,
        ...configUpdate as Partial<VideoSlideConfig>,
        type: 'video'
      };
    } else if (isQuizSlide(currentConfig)) {
      updatedConfig = {
        ...currentConfig,
        ...configUpdate as Partial<QuizSlideConfig>,
        type: 'quiz'
      };
    } else if (isStudentResponseSlide(currentConfig)) {
      updatedConfig = {
        ...currentConfig,
        ...configUpdate as Partial<StudentResponseSlideConfig>,
        type: 'student_response'
      };
    } else if (isSliderSlide(currentConfig)) {
      updatedConfig = {
        ...currentConfig,
        ...configUpdate as Partial<SliderSlideConfig>,
        type: 'slider'
      };
    } else if (isContextSlide(currentConfig)) {
      updatedConfig = {
        ...currentConfig,
        ...configUpdate as Partial<ContextSlideConfig>,
        type: 'context'
      };
    } else {
      // Fallback to default type if for some reason we have an invalid config
      updatedConfig = createDefaultTextSlideConfig();
    }

    updatedSlides[index] = {
      ...updatedSlides[index],
      config: updatedConfig
    };

    console.log(`Updating slide ${index} config:`, configUpdate);

    setSlides(updatedSlides);

    // Also update localStorage immediately 
    try {
      localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(updatedSlides));
    } catch (err) {
      console.error('Error saving slides to localStorage after config update:', err);
    }
  };

  // Replace the existing addVideoBeforeSlide function with this updated version
  const addVideoBeforeSlide = (slideIndex: number) => {
    const updatedSlides = [...slides];
    const newVideoSlide: Slide = {
      module_id: moduleId,
      slide_type: 'video',
      position: slideIndex,
      config: {
        type: 'video',
        title: '',
        videoUrl: '',
        videoFileName: '',
        context: '',
        allowReplay: false,
        maxReplays: 3,
        isRequired: false
      }
    };

    // Insert the video slide before the response slide
    updatedSlides.splice(slideIndex, 0, newVideoSlide);

    // Update positions
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));

    // First update the slides state
    setSlides(reorderedSlides);

    // Then update localStorage
    try {
      localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(reorderedSlides));
    } catch (err) {
      console.error('Error saving slides to localStorage:', err);
    }

    // Now revalidate with the updated slides
    const remainingErrors = reorderedSlides.reduce((errors: string[], slide, index) => {
      if (slide.slide_type === 'student_response') {
        const previousSlide = index > 0 ? reorderedSlides[index - 1] : null;
        const hasVideoImmediatelyBefore = previousSlide?.slide_type === 'video';

        if (!hasVideoImmediatelyBefore) {
          errors.push(`**Slide ${index + 1}** needs a **Video Slide**`);
        }
      }
      return errors;
    }, []);

    // Update validation state
    setValidationErrors(remainingErrors);

    // If no more errors, close the modal
    if (remainingErrors.length === 0) {
      setShowValidationModal(false);
    }

    // Set focus to the new video slide
    setActiveSlideIndex(slideIndex);

    // Show success toast
    toast.success(`Added Video Slide before Slide ${slideIndex + 2}`, {
      description: "You can now configure the video content"
    });
  };

  // Update the validateSlides function to return both isValid and errors
  const validateSlides = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    slides.forEach((slide, index) => {
      if (slide.slide_type === 'student_response') {
        const previousSlide = index > 0 ? slides[index - 1] : null;
        const hasVideoImmediatelyBefore = previousSlide?.slide_type === 'video';

        if (!hasVideoImmediatelyBefore) {
          errors.push(`**Slide ${index + 1}** needs a **Video Slide**`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Modify the saveSlides function
  const saveSlides = async () => {
    if (!supabase) return;

    // First validate the slides
    const { isValid, errors } = validateSlides();
    if (!isValid) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    setSaving(true);

    try {
      console.log('Saving all slides to database:', slides);

      // First, fetch existing slides to identify which ones need to be kept
      const { data: existingSlides, error: fetchError } = await supabase
        .from('slides')
        .select('id')
        .eq('module_id', moduleId);

      if (fetchError) throw fetchError;

      // Create a map of existing slide IDs for easy lookup
      const existingSlideIds = new Set((existingSlides || []).map(slide => slide.id));
      const newSlideIds = new Set(slides.filter(slide => slide.id).map(slide => slide.id));

      // Delete slides that exist in the database but not in our current state
      const slidesToDelete = Array.from(existingSlideIds).filter(id => !newSlideIds.has(id));

      if (slidesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('slides')
          .delete()
          .in('id', slidesToDelete);

        if (deleteError) throw deleteError;
      }

      // Insert or update slides
      for (const slide of slides) {
        if (slide.id) {
          // Update existing slide
          const { error: updateError } = await supabase
            .from('slides')
            .update({
              slide_type: slide.slide_type,
              position: slide.position,
              config: slide.config
            })
            .eq('id', slide.id);

          if (updateError) throw updateError;
        } else {
          // Insert new slide
          const { data: insertedSlide, error: insertError } = await supabase
            .from('slides')
            .insert({
              module_id: moduleId,
              slide_type: slide.slide_type,
              position: slide.position,
              config: slide.config
            })
            .select();

          if (insertError) throw insertError;

          // Update our local slides with the new IDs
          if (insertedSlide && insertedSlide.length > 0) {
            slide.id = insertedSlide[0].id;
          }
        }
      }

      // Update localStorage with the saved slides
      try {
        localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(slides));
      } catch (err) {
        console.error('Error saving slides to localStorage:', err);
      }

      // After successful save, update initialFetchDone to prevent reload
      initialFetchDoneRef.current = true;

      toast.success('Slides saved successfully');
      console.log('All slides saved successfully:', slides);

      // Trigger onSave callback if provided
      if (onSave) {
        onSave();
      }

      // Trigger the global save complete callback if it exists
      if (window.onSaveComplete && typeof window.onSaveComplete === 'function') {
        window.onSaveComplete();
      }
    } catch (err: unknown) {
      console.error('Error saving slides:', err);
      toast.error('Failed to save slides');
    } finally {
      setSaving(false);
    }
  };

  // Get slide type badge
  const getSlideTypeBadge = (type: string) => {
    switch (type) {
      case 'text':
        return <TextSlideTypeBadge />;
      case 'video':
        return <VideoSlideTypeBadge />;
      case 'quiz':
        return <QuizSlideTypeBadge />;
      case 'student_response':
        return <StudentResponseSlideTypeBadge />;
      case 'slider':
        return <SliderSlideTypeBadge />;
      case 'context':
        return <ContextSlideTypeBadge />;
      default:
        return null;
    }
  };

  // Render slide editor based on type
  const renderSlideEditor = (slide: Slide, index: number) => {
    console.log(`Rendering editor for slide ${index} of type ${slide.slide_type} with config:`, slide.config);

    switch (slide.slide_type) {
      case 'text':
        if (isTextSlide(slide.config)) {
          return (
            <TextSlideContent
              ref={textSlideRef}
              config={slide.config}
              onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)}
            />
          );
        }
        updateSlideConfig(index, createDefaultTextSlideConfig());
        return null;

      case 'video':
        if (isVideoSlide(slide.config)) {
          return <VideoSlideContent config={slide.config} onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)} />;
        }
        updateSlideConfig(index, createDefaultVideoSlideConfig());
        return null;

      case 'quiz':
        if (isQuizSlide(slide.config)) {
          return <QuizSlideContent config={slide.config} onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)} />;
        }
        updateSlideConfig(index, createDefaultQuizSlideConfig());
        return null;

      case 'student_response':
        if (isStudentResponseSlide(slide.config)) {
          return <StudentResponseSlideContent config={slide.config} onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)} />;
        }
        updateSlideConfig(index, createDefaultStudentResponseConfig());
        return null;

      case 'slider':
        if (isSliderSlide(slide.config)) {
          return <SliderSlideContent config={slide.config} onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)} />;
        }
        updateSlideConfig(index, createDefaultSliderConfig());
        return null;

      case 'context':
        if (isContextSlide(slide.config)) {
          return (
            <ContextSlideContent
              ref={contextSlideRef}
              config={slide.config}
              onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)}
            />
          );
        }
        updateSlideConfig(index, createDefaultContextSlideConfig());
        return null;

      default:
        return <p>Unknown slide type</p>;
    }
  };

  // Create a new slide of a specific type
  const createSlideOfType = async (type: 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context') => {
    console.log(`[SlideEditor] Creating new slide of type: ${type}`);

    const newSlide: Slide = {
      module_id: moduleId,
      slide_type: type,
      position: slides.length > 0 ? Math.max(...slides.map(slide => slide.position)) + 1 : 0,
      config: type === 'text' ? createDefaultTextSlideConfig() :
        type === 'video' ? createDefaultVideoSlideConfig() :
          type === 'quiz' ? createDefaultQuizSlideConfig() :
            type === 'slider' ? createDefaultSliderConfig() :
              type === 'context' ? createDefaultContextSlideConfig() :
                createDefaultStudentResponseConfig()
    };

    try {
      // First, insert the slide into the database
      if (supabase) {
        const { data: insertedSlide, error } = await supabase
          .from('slides')
          .insert({
            module_id: newSlide.module_id,
            slide_type: newSlide.slide_type,
            position: newSlide.position,
            config: newSlide.config
          })
          .select()
          .single();

        if (error) throw error;
        if (insertedSlide) {
          newSlide.id = insertedSlide.id;
        }
      }

      // Then update the local state
      const newSlides = [...slides, newSlide];

      // Clear states and close popover
      setPreviewType(null);
      setAddSlidePreviewType(null);
      setIsPopoverOpen(false);

      // Update slides and set active index
      setSlides(newSlides);
      setActiveSlideIndex(newSlides.length - 1);

      // Save to localStorage for persistence
      try {
        localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(newSlides));
      } catch (err) {
        console.error('Error saving slides to localStorage:', err);
      }

    } catch (err) {
      console.error('Error creating new slide:', err);
      toast.error('Failed to create new slide');
    }
  };

  // Add a duplicate slide function
  const duplicateSlide = (index: number) => {
    console.log(`[SlideEditor] Attempting to duplicate slide at index ${index}`);

    const slideToDuplicate = slides[index];
    if (!slideToDuplicate) {
      console.error('[SlideEditor] Cannot duplicate: invalid slide index');
      return;
    }

    // Create a new slide based on the one being duplicated
    const newSlide: Slide = {
      module_id: moduleId,
      slide_type: slideToDuplicate.slide_type,
      // Insert the new slide right after the current one
      position: slideToDuplicate.position + 1,
      // Deep clone the config to avoid reference issues
      config: JSON.parse(JSON.stringify(slideToDuplicate.config))
    };

    // Create a new array with the duplicate slide inserted
    const updatedSlides = [...slides];
    updatedSlides.splice(index + 1, 0, newSlide);

    // Update all positions to ensure they're sequential
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));

    console.log('[SlideEditor] Slide duplicated, new slides array:', reorderedSlides);

    // Update slides state
    setSlides(reorderedSlides);

    // Set the new slide as active
    setActiveSlideIndex(index + 1);

    // Update localStorage
    try {
      localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(reorderedSlides));
    } catch (err) {
      console.error('Error saving slides to localStorage after duplication:', err);
    }

    toast.success('Slide duplicated');
  };

  // Update the click handler for slide selection
  const handleSlideSelect = (index: number) => {
    console.log(`[SlideEditor] Selecting slide at index: ${index}`);
    setActiveSlideIndex(index);
    // Clear preview states when selecting a slide
    setPreviewType(null);
    setAddSlidePreviewType(null);
  };

  // Create a stable key for the slide editor
  const getSlideKey = useCallback((slide: Slide, index: number) => {
    return `slide-${slide.id || index}-${slide.slide_type}`;
  }, []);

  // Handle popover open
  const handlePopoverOpen = useCallback((open: boolean) => {
    console.log('[SlideEditor] Popover state changing to:', open);

    // If we're opening the popover
    if (open) {
      // First blur any Quill editor if it exists
      if (textSlideRef.current) {
        textSlideRef.current.blur();
      }
      if (contextSlideRef.current) {
        contextSlideRef.current.blur();
      }

      // Then blur any standard HTML element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    setIsPopoverOpen(open);
  }, []);

  // Handle Add Slide click
  const handleAddSlideClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure any active element is blurred
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Delay opening the popover slightly to ensure blur events are processed
    setTimeout(() => {
      handlePopoverOpen(true);
    }, 0);
  }, [handlePopoverOpen]);

  // Fix All Slides function
  const fixAllSlides = () => {
    const updatedSlides = [...slides];
    let insertCount = 0;

    slides.forEach((slide, index) => {
      if (slide.slide_type === 'student_response') {
        const adjustedIndex = index + insertCount;
        const previousSlide = adjustedIndex > 0 ? updatedSlides[adjustedIndex - 1] : null;

        if (previousSlide?.slide_type !== 'video') {
          const newVideoSlide: Slide = {
            module_id: moduleId,
            slide_type: 'video',
            position: adjustedIndex,
            config: {
              type: 'video',
              title: '',
              videoUrl: '',
              videoFileName: '',
              context: '',
              allowReplay: false,
              maxReplays: 3,
              isRequired: false
            }
          };

          updatedSlides.splice(adjustedIndex, 0, newVideoSlide);
          insertCount++;
        }
      }
    });

    // Update positions
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));

    setSlides(reorderedSlides);
    setShowValidationModal(false);

    // Show success toast
    toast.success("Added all required Video Slides", {
      description: "Your module structure has been updated"
    });

    // Update localStorage
    try {
      localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(reorderedSlides));
    } catch (err) {
      console.error('Error saving slides to localStorage:', err);
    }
  };

  if (loading) {
    return <p className="text-center py-8">Loading slides...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="hidden">
        <Button
          onClick={saveSlides}
          disabled={saving || slides.length === 0}
          className="bg-primaryStyling hover:bg-primaryStyling/90 text-white"
          data-slide-editor-save
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[2000px] mx-auto">
        {/* Slide list sidebar - LEFT COLUMN */}
        <div className="lg:col-span-2 sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-hidden flex flex-col">
          <div className="bg-transparent flex flex-col h-full">
            <div className="p-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-transparent"></div>
                <Popover
                  open={isPopoverOpen}
                  onOpenChange={handlePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      ref={popoverTriggerRef}
                      size="lg"
                      className="flex-grow rounded-full"
                      title="Add new slide"
                      onClick={handleAddSlideClick}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t('slides.common.addSlide')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[400px] p-0"
                    align="start"
                    alignOffset={-25}
                    sideOffset={8}
                    onInteractOutside={(e) => {
                      if (!popoverTriggerRef.current?.contains(e.target as Node)) {
                        handlePopoverOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between border-b p-3">
                      <span className="text-sm text-muted-foreground font-small">{t('slides.common.slideType')}</span>
                      <button
                        onClick={() => handlePopoverOpen(false)}
                        className="text-muted-foreground hover:text-foreground rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </button>
                    </div>

                    {/* Context Slides Section */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold mb-2 text-gray-900">{t('slides.common.contextCate')}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'context', value: 'context', icon: MessageSquare, color: 'teal', label: t('slides.common.contextSlide'), bgColor: 'bg-teal-100' },
                          { id: 'video', value: 'video', icon: Video, color: 'purple', label: t('slides.common.videoSlide'), bgColor: 'bg-purple-100' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="relative group outline-none"
                            onMouseEnter={() => setAddSlidePreviewType(item.value)}
                            onMouseLeave={() => setAddSlidePreviewType(null)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              createSlideOfType(item.value as 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context');
                            }}
                          >
                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                              </div>
                              <span className="font-medium text-sm text-left">{item.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t my-2"></div>
                    {/* Interactive Slides Section */}
                    <div className="p-3 space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-gray-900">{t('slides.common.interactiveCate')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'text', value: 'text', icon: AlignLeft, color: 'blue', label: t('slides.common.textSlide'), bgColor: 'bg-blue-100' },
                            { id: 'quiz', value: 'quiz', icon: ListTodo, color: 'amber', label: t('slides.common.quizSlide'), bgColor: 'bg-amber-100' },
                            { id: 'student_response', value: 'student_response', icon: Camera, color: 'rose', label: t('slides.common.videoResponse'), bgColor: 'bg-rose-100' },
                            { id: 'slider', value: 'slider', icon: MoveHorizontal, color: 'indigo', label: t('slides.common.scaleRating'), bgColor: 'bg-indigo-100' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className="relative group outline-none"
                              onMouseEnter={() => setAddSlidePreviewType(item.value)}
                              onMouseLeave={() => setAddSlidePreviewType(null)}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                createSlideOfType(item.value as 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context');
                              }}
                            >
                              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                                </div>
                                <span className="font-medium text-sm text-left">{item.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-4">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div
                          className={`
                            relative aspect-[16/9] rounded-lg cursor-grab group overflow-hidden flex-grow slide-thumbnail
                            ${activeSlideIndex === index ? 'ring-2 ring-indigo-500' : 'ring-1 ring-gray-200'}
                            bg-white hover:ring-2 hover:ring-indigo-400 transition-all
                          `}
                          onClick={() => handleSlideSelect(index)}
                          draggable
                          onDragStart={(e) => {
                            console.log(`[SlideEditor] Drag started on slide index: ${index}`);
                            handleDragStart(e, index);
                          }}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={(e) => {
                            console.log(`[SlideEditor] Drag ended for slide index: ${index}`);
                            handleDragEnd(e);
                          }}
                          onDrop={(e) => handleDrop(e, index)}
                          onContextMenu={(e) => {
                            console.log(`[SlideEditor] Context menu opened for slide index: ${index}`);
                            // Stop propagation to prevent default browser context menu
                            // (this shouldn't be needed with ContextMenu but adding as precaution)
                            e.stopPropagation();
                          }}
                        >
                          {/* Drag handle indicator */}
                          <div className="absolute top-1 left-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Grip className="h-3 w-3" />
                          </div>

                          {/* Centered Icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {slide.slide_type === 'text' && (
                              <AlignLeft className="h-6 w-6 text-blue-500" />
                            )}
                            {slide.slide_type === 'video' && (
                              <Video className="h-6 w-6 text-purple-500" />
                            )}
                            {slide.slide_type === 'quiz' && (
                              <ListTodo className="h-6 w-6 text-amber-500" />
                            )}
                            {slide.slide_type === 'student_response' && (
                              <Camera className="h-6 w-6 text-rose-500" />
                            )}
                            {slide.slide_type === 'slider' && (
                              <MoveHorizontal className="h-6 w-6 text-primaryStyling" />
                            )}
                            {slide.slide_type === 'context' && (
                              <MessageSquare className="h-6 w-6 text-teal-600" />
                            )}
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-40">
                        <ContextMenuItem
                          onClick={() => {
                            console.log(`[SlideEditor] Duplicate menu item clicked for slide index: ${index}`);
                            duplicateSlide(index);
                          }}
                          className="flex items-center cursor-pointer"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          <span>Duplicate</span>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            console.log(`[SlideEditor] Delete menu item clicked for slide index: ${index}`);
                            if (slides.length <= 1) {
                              toast.error("You must have at least one slide");
                              return;
                            }
                            removeSlide(index);
                          }}
                          className="flex items-center cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          disabled={slides.length <= 1}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          <span>Delete</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </div>
                ))}
              </div>
              {slides.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <p className="mb-2">No slides yet</p>
                  <Button
                    onClick={() => setIsPopoverOpen(true)}
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add your first slide
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active slide editor - MIDDLE COLUMN */}
        <div className={`lg:col-span-7 transition-all duration-300 ease-in-out ${isPopoverOpen ? 'lg:ml-[200px]' : ''}`}>
          {(previewType || addSlidePreviewType) ? (
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 py-3 border-b">
                <div className="space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      {t('slides.common.preview')}
                    </CardTitle>
                    {(previewType || addSlidePreviewType) === 'text' && <TextSlideTypeBadge />}
                    {(previewType || addSlidePreviewType) === 'video' && <VideoSlideTypeBadge />}
                    {(previewType || addSlidePreviewType) === 'quiz' && <QuizSlideTypeBadge />}
                    {(previewType || addSlidePreviewType) === 'student_response' && <StudentResponseSlideTypeBadge />}
                    {(previewType || addSlidePreviewType) === 'slider' && <SliderSlideTypeBadge />}
                    {(previewType || addSlidePreviewType) === 'context' && <ContextSlideTypeBadge />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <PreviewSlide type={previewType || addSlidePreviewType || ''} />
              </CardContent>
            </Card>
          ) : activeSlideIndex !== null && slides[activeSlideIndex] ? (
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 py-3 border-b">
                <div className="space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      Slide {activeSlideIndex + 1}
                    </CardTitle>
                    {getSlideTypeBadge(slides[activeSlideIndex].slide_type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className="p-4"
                key={getSlideKey(slides[activeSlideIndex], activeSlideIndex)}
              >
                {renderSlideEditor(slides[activeSlideIndex], activeSlideIndex)}
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] border rounded-lg bg-white flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-gray-500 mb-4">Select a slide to edit or create a new slide</p>
                <Button
                  onClick={() => setIsPopoverOpen(true)}
                  className="bg-primaryStyling hover:bg-primaryStyling/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> {t('slides.common.addSlide')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Settings panel - RIGHT COLUMN */}
        <div className="lg:col-span-3">
          {activeSlideIndex !== null && slides[activeSlideIndex] ? (
            <Card className="shadow-sm bg-white">
              <CardHeader className="py-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{t('slides.common.slideSetting')}</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-3" key={getSlideKey(slides[activeSlideIndex], activeSlideIndex)}>
                <div className="space-y-1 cursor-pointer">
                  <label className="text-sm font-medium">Slide Type</label>
                  <Select
                    value={slides[activeSlideIndex].slide_type}
                    onValueChange={(value) => {
                      handleSlideTypeChange(value, activeSlideIndex);
                      // Clear preview states when changing slide type
                      setPreviewType(null);
                      setAddSlidePreviewType(null);
                    }}
                  >
                    <SelectTrigger className="w-full bg-indigo-50 cursor-pointer">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="relative cursor-pointer">
                        {[
                          { value: 'text', icon: AlignLeft, color: 'text-blue-600', label: t('slides.common.textSlide') },
                          { value: 'video', icon: Video, color: 'text-purple-600', label: t('slides.common.videoSlide') },
                          { value: 'quiz', icon: ListTodo, color: 'text-amber-600', label: t('slides.common.quizSlide') },
                          { value: 'student_response', icon: Camera, color: 'text-rose-600', label: t('slides.common.videoResponse') },
                          { value: 'slider', icon: MoveHorizontal, color: 'text-indigo-600', label: t('slides.common.scaleRating') },
                          { value: 'context', icon: MessageSquare, color: 'text-teal-600', label: t('slides.common.contextSlide') }
                        ].map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            onMouseEnter={() => setPreviewType(item.value)}
                            onMouseLeave={() => setPreviewType(null)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <item.icon className={`h-4 w-4 ${item.color}`} />
                              <span>{item.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Video-specific settings */}
                {slides[activeSlideIndex].slide_type === 'video' && isVideoSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                          {t('slides.video.required')}
                        </Label>
                        <Switch
                          id="isRequired"
                          checked={slides[activeSlideIndex].config.isRequired ?? true}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { isRequired: checked });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="allowReplay" className="text-sm cursor-pointer">
                          {t('slides.video.replay')}
                        </Label>
                        <Switch
                          id="allowReplay"
                          checked={slides[activeSlideIndex].config.allowReplay ?? true}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { allowReplay: checked });
                          }}
                        />
                      </div>

                      {slides[activeSlideIndex].config.allowReplay && (
                        <div className="mt-3 pl-7 space-y-2">
                          <label htmlFor="maxReplays" className="text-sm font-medium">{t('slides.video.replayMax')}</label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="maxReplays"
                              type="number"
                              min="1"
                              max="99"
                              value={slides[activeSlideIndex].config.maxReplays ?? 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                const validValue = isNaN(value) ? 1 : Math.max(1, Math.min(99, value));
                                updateSlideConfig(activeSlideIndex, { maxReplays: validValue });
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">{t('slides.video.times')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('slides.video.desc')}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Quiz-specific settings */}
                {slides[activeSlideIndex].slide_type === 'quiz' && isQuizSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                          {t('slides.text.requiredSlide')}
                        </Label>
                        <Switch
                          id="isRequired"
                          checked={slides[activeSlideIndex].config.isRequired ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { isRequired: checked });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="multipleCorrect" className="text-sm cursor-pointer">
                          {t('slides.quiz.allowMulti')}
                        </Label>
                        <Switch
                          id="multipleCorrect"
                          checked={slides[activeSlideIndex].config.multipleCorrect ?? false}
                          onCheckedChange={(checked) => {
                            const quizConfig = slides[activeSlideIndex].config;
                            if (isQuizSlide(quizConfig)) {
                              if (checked) {
                                updateSlideConfig(activeSlideIndex, {
                                  multipleCorrect: true,
                                  correctOptionIndices: [quizConfig.correctOptionIndex],
                                });
                              } else {
                                const correctOptionIndices = quizConfig.correctOptionIndices || [];
                                updateSlideConfig(activeSlideIndex, {
                                  multipleCorrect: false,
                                  correctOptionIndex: correctOptionIndices.length > 0 ? correctOptionIndices[0] : 0,
                                });
                              }
                            }
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full mt-3">
                        <Label htmlFor="shuffleOptions" className="text-sm cursor-pointer">
                          {t('slides.quiz.optionShuffle')}
                        </Label>
                        <Switch
                          id="shuffleOptions"
                          checked={slides[activeSlideIndex].config.shuffleOptions ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { shuffleOptions: checked });
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Student Response-specific settings */}
                {slides[activeSlideIndex].slide_type === 'student_response' && isStudentResponseSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                          {t('slides.text.requiredSlide')}
                        </Label>
                        <Switch
                          id="isRequired"
                          checked={slides[activeSlideIndex].config.isRequired ?? true}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { isRequired: checked });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="severalResponses" className="text-sm cursor-pointer">
                          Allow multiple responses
                        </Label>
                        <Switch
                          id="severalResponses"
                          checked={slides[activeSlideIndex].config.severalResponses ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { severalResponses: checked });
                          }}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        If enabled, students can submit multiple responses
                      </p>

                      {slides[activeSlideIndex].config.severalResponses && (
                        <div className="mt-3 pl-7 space-y-2">
                          <label htmlFor="maxResponses" className="text-sm font-medium">Maximum responses allowed</label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="maxResponses"
                              type="number"
                              min="1"
                              max="99"
                              value={slides[activeSlideIndex].config.maxResponses ?? 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                const validValue = isNaN(value) ? 1 : Math.max(1, Math.min(99, value));
                                updateSlideConfig(activeSlideIndex, { maxResponses: validValue });
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">responses</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Set how many times students can record a response
                          </p>
                        </div>
                      )}

                      <div className="mt-4 space-y-2">
                        <label htmlFor="responseMaxDuration" className="text-sm font-medium">Maximum response duration</label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              id="responseMaxDuration"
                              min="10"
                              max="600"
                              step="10"
                              value={isStudentResponseSlide(slides[activeSlideIndex].config) ?
                                slides[activeSlideIndex].config.responseMaxDuration ?? 120 : 120}
                              onChange={(e) => {
                                if (isStudentResponseSlide(slides[activeSlideIndex].config)) {
                                  const value = parseInt(e.target.value);
                                  updateSlideConfig(activeSlideIndex, { responseMaxDuration: value });
                                }
                              }}
                              className="flex-1"
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium bg-indigo-100 px-2 py-1 rounded-md">
                              {formatDuration(isStudentResponseSlide(slides[activeSlideIndex].config) ?
                                slides[activeSlideIndex].config.responseMaxDuration ?? 120 : 120)}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (isStudentResponseSlide(slides[activeSlideIndex].config)) {
                                    const currentValue = slides[activeSlideIndex].config.responseMaxDuration ?? 120;
                                    updateSlideConfig(activeSlideIndex, {
                                      responseMaxDuration: Math.max(10, currentValue - 30)
                                    });
                                  }
                                }}
                              >
                                -30s
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (isStudentResponseSlide(slides[activeSlideIndex].config)) {
                                    const currentValue = slides[activeSlideIndex].config.responseMaxDuration ?? 120;
                                    updateSlideConfig(activeSlideIndex, {
                                      responseMaxDuration: Math.min(600, currentValue + 30)
                                    });
                                  }
                                }}
                              >
                                +30s
                              </Button>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Set the maximum length of video responses
                        </p>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="instantResponse" className="text-sm cursor-pointer text-red-500 font-bold">
                          Force instant response
                        </Label>
                        <Switch
                          id="instantResponse"
                          checked={slides[activeSlideIndex].config.instantResponse ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { instantResponse: checked });
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        If enabled, students must respond immediately after the video ends
                      </p>
                    </div>
                  </>
                )}

                {/* Slider-specific settings */}
                {slides[activeSlideIndex].slide_type === 'slider' && isSliderSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                          {t('slides.text.requiredSlide')}
                        </Label>
                        <Switch
                          id="isRequired"
                          checked={slides[activeSlideIndex].config.isRequired}
                          onCheckedChange={(checked) => {
                            if (isSliderSlide(slides[activeSlideIndex].config)) {
                              updateSlideConfig(activeSlideIndex, {
                                ...slides[activeSlideIndex].config,
                                isRequired: checked
                              } as SliderSlideConfig);
                            }
                          }}
                        />
                      </div>

                      {slides[activeSlideIndex].config.sliders.map((slider, sliderIndex) => (
                        <div key={slider.id} className="space-y-4 pt-2">
                          <Separator />
                          <h4 className="text-sm font-medium">Slider {sliderIndex + 1} Range</h4>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Minimum</Label>
                              <Select
                                value={slider.min.toString()}
                                onValueChange={(value) => {
                                  if (isSliderSlide(slides[activeSlideIndex].config)) {
                                    const updatedSliders = [...slides[activeSlideIndex].config.sliders];
                                    updatedSliders[sliderIndex] = {
                                      ...slider,
                                      min: parseInt(value),
                                      defaultValue: Math.max(parseInt(value), slider.defaultValue || 0)
                                    };
                                    updateSlideConfig(activeSlideIndex, {
                                      ...slides[activeSlideIndex].config,
                                      sliders: updatedSliders
                                    } as SliderSlideConfig);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select minimum" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0</SelectItem>
                                  <SelectItem value="1">1</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">Maximum</Label>
                              <Select
                                value={slider.max.toString()}
                                onValueChange={(value) => {
                                  if (isSliderSlide(slides[activeSlideIndex].config)) {
                                    const updatedSliders = [...slides[activeSlideIndex].config.sliders];
                                    updatedSliders[sliderIndex] = {
                                      ...slider,
                                      max: parseInt(value),
                                      defaultValue: Math.min(parseInt(value), slider.defaultValue || slider.max)
                                    };
                                    updateSlideConfig(activeSlideIndex, {
                                      ...slides[activeSlideIndex].config,
                                      sliders: updatedSliders
                                    } as SliderSlideConfig);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select maximum" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[5, 6, 7, 8, 9, 10].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Text-specific settings */}
                {slides[activeSlideIndex].slide_type === 'text' && isTextSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                          {t('slides.text.requiredSlide')}
                        </Label>
                        <Switch
                          id="isRequired"
                          checked={slides[activeSlideIndex].config.isRequired}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { isRequired: checked });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <Label htmlFor="hasMaxWords" className="text-sm cursor-pointer">
                          {t('slides.text.maxWords')}
                        </Label>
                        <Switch
                          id="hasMaxWords"
                          checked={slides[activeSlideIndex].config.maxWords !== undefined}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, {
                              maxWords: checked ? 100 : undefined
                            });
                          }}
                        />
                      </div>

                      {slides[activeSlideIndex].config.maxWords !== undefined && (
                        <div className="space-y-2 pl-7">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="maxWords"
                              type="number"
                              min="1"
                              max="1000"
                              value={slides[activeSlideIndex].config.maxWords}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                const validValue = isNaN(value) ? 100 : Math.max(1, Math.min(1000, value));
                                updateSlideConfig(activeSlideIndex, { maxWords: validValue });
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">{t('slides.text.words')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlide(activeSlideIndex)}
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 bg-white"
                    disabled={slides.length <= 1}
                  >
                    <Trash className="h-4 w-4 mr-1 bg-white" />
                    {t('slides.common.deleteSlide')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Add the validation modal */}
      <AlertDialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2 pb-2">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <span>Action Required</span>
            </AlertDialogTitle>
            <p className="text-sm text-slate-600 mb-4">You cannot proceed until you fix the following issues:</p>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {validationErrors.length > 0 ? (
                  <div className="bg-slate-50 border rounded-lg divide-y">
                    {validationErrors.map((error) => {
                      // Extract slide index from error message
                      const slideIndex = parseInt(error.match(/Slide (\d+)/)?.[1] || '0') - 1;

                      return (
                        <div
                          key={`error-${slideIndex}`}
                          className="p-4 flex items-center justify-between group animate-fadeIn"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Camera className="h-4 w-4 text-red-500" />
                            <span>
                              {error.split('**').map((part, i) => {
                                if (i % 2 === 1) {
                                  return <strong key={i}>{part}</strong>;
                                }
                                return part;
                              })}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addVideoBeforeSlide(slideIndex)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-primaryStyling hover:bg-indigo-700 text-white cursor-pointer"
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Fix
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500 animate-fadeIn">
                    All issues have been fixed! 🎉
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowValidationModal(false)}
              className="flex-1"
            >
              {validationErrors.length === 0 ? 'Close' : 'Cancel'}
            </Button>
            {validationErrors.length > 0 && (
              <Button
                onClick={fixAllSlides}
                className="flex-1 bg-primaryStyling hover:bg-indigo-700 text-white cursor-pointer"
              >
                Fix All Issues
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 