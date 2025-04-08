'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash, Video, ListTodo, Settings, Grip, AlignLeft, BarChart3, MessageSquare, MoveHorizontal, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

// Import slide type components
import TextSlideContent, { TextSlideTypeBadge, createDefaultTextSlideConfig } from './slide_types/TextSlide';
import VideoSlideContent, { VideoSlideTypeBadge, createDefaultVideoSlideConfig } from './slide_types/VideoSlide';
import QuizSlideContent, { QuizSlideTypeBadge, createDefaultQuizSlideConfig } from './slide_types/QuizSlide';
import StudentResponseSlideContent, { StudentResponseSlideTypeBadge, createDefaultStudentResponseConfig } from './slide_types/StudentResponseSlide';
import SliderSlideContent, { SliderSlideTypeBadge, createDefaultSliderConfig } from './slide_types/SliderSlide';

export interface Slide {
  id?: string;
  module_id: string;
  slide_type: 'text' | 'video' | 'quiz' | 'student_response' | 'slider';
  position: number;
  config: SlideConfig;
  created_at?: string;
  updated_at?: string;
}

// Define the individual slide config types
export interface TextSlideConfig {
  type: 'text';
  content: string;
}

export interface VideoSlideConfig {
  type: 'video';
  title?: string;
  videoUrl?: string;
  videoFileName?: string;
  context?: string;
  allowReplay?: boolean;
  maxReplays?: number;
}

export interface QuizSlideConfig {
  type: 'quiz';
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanations?: string[];
  optionImages?: string[];
  points?: number;
  timeLimit?: number;
  shuffleOptions?: boolean;
  multipleCorrect?: boolean;
  correctOptionIndices?: number[];
}

export interface StudentResponseSlideConfig {
  type: 'student_response';
  severalResponses: boolean;
  instantResponse: boolean;
  maxResponses: number;
  responseMaxDuration: number; // in seconds
}

export interface SliderSlideConfig {
  type: 'slider';
  sliders: Array<{
    id: string;
    title: string;
    description: string;
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

// Define a union type for all possible slide configurations
export type SlideConfig = 
  | TextSlideConfig 
  | VideoSlideConfig 
  | QuizSlideConfig 
  | StudentResponseSlideConfig
  | SliderSlideConfig;

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

interface SlideEditorProps {
  moduleId: string;
  onSave?: () => void;
}

export default function SlideEditor({ moduleId, onSave }: SlideEditorProps) {
  console.log('[SlideEditor] RENDERING with moduleId:', moduleId);
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const initialFetchDoneRef = useRef(false);
  const supabase = useSupabase();
  const [showSlideTypeSelector, setShowSlideTypeSelector] = useState(false);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  
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
      slide_type: 'text',
      position: 0,
      config: { type: 'text', content: '' }
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
  const removeSlide = (index: number) => {
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
  };

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
    const slideType = value as 'text' | 'video' | 'quiz' | 'student_response' | 'slider';
    
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
          maxReplays: 3
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

  // Save all slides
  const saveSlides = async () => {
    if (!supabase || !moduleId) return;
    
    try {
      setSaving(true);
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
      
      if (onSave) {
        onSave();
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
          return <TextSlideContent config={slide.config} onConfigChange={(configUpdate) => updateSlideConfig(index, configUpdate)} />;
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
      
      default:
        return <p>Unknown slide type</p>;
    }
  };

  // Create a new slide of a specific type
  const createSlideOfType = (type: 'text' | 'video' | 'quiz' | 'student_response' | 'slider') => {
    const newSlide: Slide = {
      module_id: moduleId,
      slide_type: type,
      position: slides.length > 0 ? Math.max(...slides.map(slide => slide.position)) + 1 : 0,
      config: type === 'text' ? createDefaultTextSlideConfig() : 
              type === 'video' ? createDefaultVideoSlideConfig() : 
              type === 'quiz' ? createDefaultQuizSlideConfig() :
              type === 'slider' ? createDefaultSliderConfig() :
              createDefaultStudentResponseConfig()
    };
    
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideIndex(newSlides.length - 1);
    setShowSlideTypeSelector(false);
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
      
      {/* Slide Type Selector Modal */}
      <Dialog open={showSlideTypeSelector} onOpenChange={setShowSlideTypeSelector}>
        <DialogContent className="sm:max-w-[720px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Select slide type</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {/* TEXT SLIDE */}
            <div 
              className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => createSlideOfType('text')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlignLeft className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Text</h3>
                  <p className="text-xs text-gray-500">Simple text content slide</p>
                </div>
              </div>
            </div>
            
            {/* VIDEO SLIDE */}
            <div 
              className="border rounded-lg p-4 hover:border-purple-500 cursor-pointer hover:bg-purple-50 transition-colors"
              onClick={() => createSlideOfType('video')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Video className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Video</h3>
                  <p className="text-xs text-gray-500">Add video content</p>
                </div>
              </div>
            </div>
            
            {/* QUIZ SLIDE */}
            <div 
              className="border rounded-lg p-4 hover:border-amber-500 cursor-pointer hover:bg-amber-50 transition-colors"
              onClick={() => createSlideOfType('quiz')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Quiz</h3>
                  <p className="text-xs text-gray-500">Multiple choice questions</p>
                </div>
              </div>
            </div>

            <div 
              className="border rounded-lg p-4 hover:border-rose-500 cursor-pointer hover:bg-rose-50 transition-colors"
              onClick={() => createSlideOfType('student_response')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Response to Video</h3>
                  <p className="text-xs text-gray-500">Video Responses</p>
                </div>
              </div>
            </div>

            <div 
              className="border rounded-lg p-4 hover:border-primaryStyling cursor-pointer hover:bg-primaryStyling/10 transition-colors"
              onClick={() => createSlideOfType('slider')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <MoveHorizontal className="h-6 w-6 text-primaryStyling" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Slider</h3>
                  <p className="text-xs text-gray-500">Scale-based feedback</p>
                </div>
              </div>
            </div>

            {/* DECORATIVE OPTIONS (Creates text slides) */}
            <div 
              className="border rounded-lg p-4 hover:border-emerald-500 cursor-pointer hover:bg-emerald-50 transition-colors"
              onClick={() => createSlideOfType('text')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Poll</h3>
                  <p className="text-xs text-gray-500">Get learner opinions</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[2000px] mx-auto">
        {/* Slide list sidebar - LEFT COLUMN */}
        <div className="lg:col-span-2">
          <div className="bg-transparent">
            <div className="p-2">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-transparent"></div>
                <Button 
                  size="lg" 
                  className="flex-grow rounded-full" 
                  onClick={() => setShowSlideTypeSelector(true)}
                  title="Add new slide"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Slide
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[600px]">
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
                          onClick={() => {
                            console.log(`[SlideEditor] Slide thumbnail clicked, index: ${index}`);
                            setActiveSlideIndex(index);
                          }}
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
                              <MessageSquare className="h-6 w-6 text-rose-500" />
                            )}
                             {slide.slide_type === 'slider' && (
                              <MoveHorizontal className="h-6 w-6 text-primaryStyling" />
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
            </ScrollArea>
            {slides.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <p className="mb-2">No slides yet</p>
                <Button 
                  onClick={() => setShowSlideTypeSelector(true)} 
                  size="sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add your first slide
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Active slide editor - MIDDLE COLUMN */}
        <div className="lg:col-span-7">
          {activeSlideIndex !== null && slides[activeSlideIndex] ? (
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
              <CardContent className="p-4">
                {renderSlideEditor(slides[activeSlideIndex], activeSlideIndex)}
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] border rounded-lg bg-white flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-gray-500 mb-4">Select a slide to edit or create a new slide</p>
                <Button 
                  onClick={() => setShowSlideTypeSelector(true)} 
                  className="bg-primaryStyling hover:bg-primaryStyling/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Slide
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
                  <CardTitle className="text-base font-medium">Slide Settings</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Slide Type</label>
                  <Select
                    value={slides[activeSlideIndex].slide_type}
                    onValueChange={(value) => handleSlideTypeChange(value, activeSlideIndex)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="student_response">Student Response</SelectItem>
                      <SelectItem value="slider">Slider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Video-specific settings */}
                {slides[activeSlideIndex].slide_type === 'video' && isVideoSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Video Settings</h3>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="allowReplay" 
                          checked={slides[activeSlideIndex].config.allowReplay ?? true}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { allowReplay: checked });
                          }}
                        />
                        <Label htmlFor="allowReplay" className="text-sm cursor-pointer">
                          Allow students to replay the video
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">
                        If disabled, students will only be able to play the video once
                      </p>
                      
                      {slides[activeSlideIndex].config.allowReplay && (
                        <div className="mt-3 pl-7 space-y-2">
                          <label htmlFor="maxReplays" className="text-sm font-medium">Maximum replays allowed</label>
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
                            <span className="text-sm text-gray-500">times</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Set how many times students can replay this video
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Quiz-specific settings */}
                {slides[activeSlideIndex].slide_type === 'quiz' && isQuizSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Quiz Settings</h3>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="multipleCorrect" 
                          checked={slides[activeSlideIndex].config.multipleCorrect ?? false}
                          onCheckedChange={(checked) => {
                            const quizConfig = slides[activeSlideIndex].config;
                            if (isQuizSlide(quizConfig)) {
                              if (checked) {
                                // Convert from single to multiple correct
                                updateSlideConfig(activeSlideIndex, { 
                                  multipleCorrect: true,
                                  correctOptionIndices: [quizConfig.correctOptionIndex],
                                });
                              } else {
                                // Convert from multiple to single correct
                                const correctOptionIndices = quizConfig.correctOptionIndices || [];
                                updateSlideConfig(activeSlideIndex, { 
                                  multipleCorrect: false,
                                  correctOptionIndex: correctOptionIndices.length > 0 ? correctOptionIndices[0] : 0,
                                });
                              }
                            }
                          }}
                        />
                        <Label htmlFor="multipleCorrect" className="text-sm cursor-pointer">
                          Allow multiple correct answers
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">
                        Students can select more than one correct answer
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <Switch 
                          id="shuffleOptions" 
                          checked={slides[activeSlideIndex].config.shuffleOptions ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { shuffleOptions: checked });
                          }}
                        />
                        <Label htmlFor="shuffleOptions" className="text-sm cursor-pointer">
                          Shuffle options for students
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">
                        Options will appear in random order for each student
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        <label htmlFor="points" className="text-sm font-medium">Points</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="points"
                            type="number"
                            min="1"
                            max="100"
                            value={slides[activeSlideIndex].config.points ?? 10}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              const validValue = isNaN(value) ? 10 : Math.max(1, Math.min(100, value));
                              updateSlideConfig(activeSlideIndex, { points: validValue });
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">points</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Points awarded for correct answer(s)
                        </p>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <label htmlFor="timeLimit" className="text-sm font-medium">Time Limit (seconds)</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="timeLimit"
                            type="number"
                            min="0"
                            max="600"
                            value={slides[activeSlideIndex].config.timeLimit ?? 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              const validValue = isNaN(value) ? 0 : Math.max(0, Math.min(600, value));
                              updateSlideConfig(activeSlideIndex, { timeLimit: validValue });
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">seconds</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {slides[activeSlideIndex].config.timeLimit ? 
                            `Students have ${slides[activeSlideIndex].config.timeLimit} seconds to answer` : 
                            'No time limit for this question'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Student Response-specific settings */}
                {slides[activeSlideIndex].slide_type === 'student_response' && isStudentResponseSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Response Settings</h3>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="severalResponses" 
                          checked={slides[activeSlideIndex].config.severalResponses ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { severalResponses: checked });
                          }}
                        />
                        <Label htmlFor="severalResponses" className="text-sm cursor-pointer">
                          Allow multiple responses
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">
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
                            <span className="font-medium">
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
                          Set the maximum length of student video responses (10 seconds to 10 minutes)
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 mt-4">
                        <Switch 
                          id="instantResponse" 
                          checked={slides[activeSlideIndex].config.instantResponse ?? false}
                          onCheckedChange={(checked) => {
                            updateSlideConfig(activeSlideIndex, { instantResponse: checked });
                          }}
                        />
                        <Label htmlFor="instantResponse" className="text-sm cursor-pointer text-red-500 font-bold">
                          Force instant response
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">
                        If enabled, students must respond immediately after the video ends
                      </p>
                    </div>
                  </>
                )}
                
                {/* Slider-specific settings */}
                {slides[activeSlideIndex].slide_type === 'slider' && isSliderSlide(slides[activeSlideIndex].config) && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Slider Settings</h3>
                      
                      <div className="flex items-center space-x-2">
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
                        <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                          Required slide
                        </Label>
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
                
                <div className="pt-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlide(activeSlideIndex)}
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 bg-white"
                    disabled={slides.length <= 1}
                  >
                    <Trash className="h-4 w-4 mr-1 bg-white" />
                    Delete Slide
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-10"></div>
          )}
        </div>
      </div>
    </div>
  );
} 