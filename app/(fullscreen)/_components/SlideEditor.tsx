'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash, ArrowUp, ArrowDown, FileText, Video, ListTodo, Settings, Grip, X, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';

export interface Slide {
  id?: string;
  module_id: string;
  slide_type: 'text' | 'video' | 'quiz';
  position: number;
  config: any;
  created_at?: string;
  updated_at?: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useSupabase();
  const { user } = useUser();
  
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
      config: { content: 'Enter your content here...' }
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
      } catch (err: any) {
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

  // Add a new slide
  const addSlide = () => {
    const newPosition = slides.length > 0 
      ? Math.max(...slides.map(slide => slide.position)) + 1 
      : 0;
    
    const newSlide: Slide = {
      module_id: moduleId,
      slide_type: 'text',
      position: newPosition,
      config: { content: '' }
    };
    
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideIndex(newSlides.length - 1);
  };

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

  // Move slide up in order
  const moveSlideUp = (index: number) => {
    if (index === 0) return;
    
    const updatedSlides = [...slides];
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[index - 1];
    updatedSlides[index - 1] = temp;
    
    // Update positions
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));
    
    setSlides(reorderedSlides);
    
    // Update active slide index
    if (activeSlideIndex === index) {
      setActiveSlideIndex(index - 1);
    } else if (activeSlideIndex === index - 1) {
      setActiveSlideIndex(index);
    }
  };

  // Move slide down in order
  const moveSlideDown = (index: number) => {
    if (index === slides.length - 1) return;
    
    const updatedSlides = [...slides];
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[index + 1];
    updatedSlides[index + 1] = temp;
    
    // Update positions
    const reorderedSlides = updatedSlides.map((slide, idx) => ({
      ...slide,
      position: idx
    }));
    
    setSlides(reorderedSlides);
    
    // Update active slide index
    if (activeSlideIndex === index) {
      setActiveSlideIndex(index + 1);
    } else if (activeSlideIndex === index + 1) {
      setActiveSlideIndex(index);
    }
  };

  // Handle slide type change
  const handleSlideTypeChange = (value: string, index: number) => {
    const updatedSlides = [...slides];
    const slideType = value as 'text' | 'video' | 'quiz';
    
    // Set default config based on type
    let config = {};
    
    switch (slideType) {
      case 'text':
        config = { content: '' };
        break;
      case 'video':
        // Ensure we preserve any existing video URL if changing back to video type
        config = { 
          url: updatedSlides[index].config?.url || '', 
          title: updatedSlides[index].config?.title || '',
          videoUrl: updatedSlides[index].config?.videoUrl || '',
          videoFileName: updatedSlides[index].config?.videoFileName || '',
        };
        break;
      case 'quiz':
        config = { question: '', options: [''], correctOptionIndex: 0 };
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
  const updateSlideConfig = (index: number, configUpdate: any) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      config: {
        ...updatedSlides[index].config,
        ...configUpdate
      }
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
    } catch (err: any) {
      console.error('Error saving slides:', err);
      toast.error('Failed to save slides');
    } finally {
      setSaving(false);
    }
  };

  // Add a quiz option
  const addQuizOption = (slideIndex: number) => {
    const slide = slides[slideIndex];
    const updatedOptions = [...slide.config.options, ''];
    
    updateSlideConfig(slideIndex, {
      options: updatedOptions
    });
  };

  // Remove a quiz option
  const removeQuizOption = (slideIndex: number, optionIndex: number) => {
    const slide = slides[slideIndex];
    const updatedOptions = [...slide.config.options];
    updatedOptions.splice(optionIndex, 1);
    
    // Update correct option index if needed
    let correctOptionIndex = slide.config.correctOptionIndex;
    if (optionIndex === correctOptionIndex) {
      correctOptionIndex = 0;
    } else if (optionIndex < correctOptionIndex) {
      correctOptionIndex--;
    }
    
    updateSlideConfig(slideIndex, {
      options: updatedOptions,
      correctOptionIndex
    });
  };

  // Update a quiz option
  const updateQuizOption = (slideIndex: number, optionIndex: number, value: string) => {
    const slide = slides[slideIndex];
    const updatedOptions = [...slide.config.options];
    updatedOptions[optionIndex] = value;
    
    updateSlideConfig(slideIndex, {
      options: updatedOptions
    });
  };

  // Set correct quiz option
  const setCorrectQuizOption = (slideIndex: number, optionIndex: number) => {
    updateSlideConfig(slideIndex, {
      correctOptionIndex: optionIndex
    });
  };

  // Get slide type badge
  const getSlideTypeBadge = (type: string) => {
    switch (type) {
      case 'text':
        return (
          <Badge variant="outline" className="bg-red-50 text-blue-700 hover:bg-blue-50 border-blue-200">
            <FileText className="h-3 w-3 mr-1" /> Text
          </Badge>
        );
      case 'video':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
            <Video className="h-3 w-3 mr-1" /> Video
          </Badge>
        );
      case 'quiz':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
            <ListTodo className="h-3 w-3 mr-1" /> Quiz
          </Badge>
        );
      default:
        return null;
    }
  };

  // Upload video for slide
  const uploadVideo = async (file: File, slideIndex: number) => {
    if (!file || !supabase || !user) return;
    
    try {
      setIsUploading(true);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`[SlideEditor] Uploading video file '${fileName}' to path '${filePath}'`);
      
      // Upload the video to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('module-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from('module-videos')
        .getPublicUrl(filePath);
        
      console.log(`[SlideEditor] Video uploaded successfully, public URL: ${urlData.publicUrl}`);
      
      // Update slide config with video URL without resetting other slides
      const updatedSlides = [...slides];
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        config: {
          ...updatedSlides[slideIndex].config,
          videoUrl: urlData.publicUrl,
          videoFileName: file.name
        }
      };
      
      // Set slides state first
      setSlides(updatedSlides);
      
      // Then save to database immediately to ensure persistence
      try {
        console.log(`[SlideEditor] Saving slide ${slideIndex} with video to database`);
        
        const slideToSave = updatedSlides[slideIndex];
        
        if (slideToSave.id) {
          // Update existing slide
          const { error: updateError } = await supabase
            .from('slides')
            .update({
              slide_type: slideToSave.slide_type,
              position: slideToSave.position,
              config: slideToSave.config
            })
            .eq('id', slideToSave.id);
          
          if (updateError) {
            console.error('[SlideEditor] Error updating slide with video:', updateError);
            throw updateError;
          }
          
          console.log('[SlideEditor] Existing slide updated with video');
        } else {
          // Insert new slide
          const { data: insertedSlide, error: insertError } = await supabase
            .from('slides')
            .insert({
              module_id: moduleId,
              slide_type: slideToSave.slide_type,
              position: slideToSave.position,
              config: slideToSave.config
            })
            .select();
          
          if (insertError) {
            console.error('[SlideEditor] Error inserting slide with video:', insertError);
            throw insertError;
          }
          
          // Update the local slide with the new ID
          if (insertedSlide && insertedSlide.length > 0) {
            updatedSlides[slideIndex].id = insertedSlide[0].id;
            setSlides(updatedSlides);
            console.log(`[SlideEditor] New slide inserted with ID: ${insertedSlide[0].id}`);
          }
        }
        
        // Also update localStorage
        try {
          localStorage.setItem(`slides_cache_${moduleId}`, JSON.stringify(updatedSlides));
          console.log('[SlideEditor] Slides with video saved to localStorage');
        } catch (err) {
          console.error('[SlideEditor] Error saving to localStorage:', err);
        }
        
        toast.success('Video uploaded and saved successfully');
      } catch (err) {
        console.error('[SlideEditor] Error saving slide with video to database:', err);
        toast.error('Video uploaded but failed to save slide');
      }
    } catch (err) {
      console.error('[SlideEditor] Error uploading video:', err);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>, slideIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }
    
    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size should not exceed 100MB');
      return;
    }
    
    uploadVideo(file, slideIndex);
    
    // Clear the input value to allow uploading the same file again
    if (e.target) {
      e.target.value = '';
    }
  };
  
  // Trigger file input click
  const handleVideoUploadClick = () => {
    videoFileInputRef.current?.click();
  };

  // Render slide editor based on type
  const renderSlideEditor = (slide: Slide, index: number) => {
    console.log(`Rendering editor for slide ${index} of type ${slide.slide_type} with config:`, slide.config);
    
    switch (slide.slide_type) {
      case 'text':
        return (
          <Textarea
            placeholder="Enter slide content"
            className="min-h-[200px] resize-none"
            value={slide.config.content || ''}
            onChange={(e) => updateSlideConfig(index, { content: e.target.value })}
          />
        );
      
      case 'video':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Video Title</label>
              <Input
                placeholder="Enter a title for this video"
                value={slide.config.title || ''}
                onChange={(e) => updateSlideConfig(index, { title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Video</label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50 hover:bg-gray-100 transition cursor-pointer" onClick={() => {
                if (activeSlideIndex !== null) {
                  videoFileInputRef.current?.click();
                }
              }}>
                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideoFileChange(e, index)}
                />
                
                {isUploading ? (
                  <div className="text-center">
                    <div className="animate-pulse mb-2">Uploading...</div>
                    <p className="text-sm text-gray-500">Please wait while your video is being uploaded</p>
                  </div>
                ) : slide.config.videoUrl ? (
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <Video className="h-8 w-8 text-green-500 mr-2" />
                      <span className="font-medium text-green-600">Video uploaded</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{slide.config.videoFileName || 'Video file'}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        videoFileInputRef.current?.click();
                      }}
                    >
                      Replace video
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2 mx-auto" />
                    <p className="text-sm font-medium mb-1">Click to upload video</p>
                    <p className="text-xs text-gray-500">MP4, WebM, or MOV (max. 100MB)</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Or use external video URL</label>
              <Input
                placeholder="Paste YouTube, Vimeo or other video URL"
                value={slide.config.url || ''}
                onChange={(e) => updateSlideConfig(index, { url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Support for YouTube, Vimeo, and other embeddable video platforms
              </p>
            </div>
            
            {(slide.config.url || slide.config.videoUrl) && (
              <div className="border rounded-md p-2 bg-muted/20">
                <p className="text-xs font-medium mb-1">Preview:</p>
                <div className="aspect-video">
                  {slide.config.videoUrl ? (
                    <video 
                      src={slide.config.videoUrl} 
                      className="w-full h-full rounded"
                      controls
                    />
                  ) : slide.config.url ? (
                    <iframe 
                      src={slide.config.url} 
                      className="w-full h-full rounded"
                      allowFullScreen
                      frameBorder="0"
                    ></iframe>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Input
                placeholder="Enter your question"
                value={slide.config.question || ''}
                onChange={(e) => updateSlideConfig(index, { question: e.target.value })}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Options</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => addQuizOption(index)}
                  className="h-7 px-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                </Button>
              </div>
              
              {slide.config.options.map((option: string, optionIndex: number) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-md text-xs font-medium">
                    {optionIndex + 1}
                  </div>
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => updateQuizOption(index, optionIndex, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={slide.config.correctOptionIndex === optionIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCorrectQuizOption(index, optionIndex)}
                    className="h-8 px-2"
                  >
                    Correct
                  </Button>
                  {slide.config.options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuizOption(index, optionIndex)}
                      className="h-8 px-2 text-red-500 hover:text-red-600"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              
              <p className="text-xs text-muted-foreground">
                Mark one option as correct for the quiz
              </p>
            </div>
          </div>
        );
      
      default:
        return <p>Unknown slide type</p>;
    }
  };

  // Settings panel for the current slide
  const renderSlideSettings = () => {
    if (activeSlideIndex === null || !slides[activeSlideIndex]) return null;
    
    const slide = slides[activeSlideIndex];
    
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Slide Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Slide Type</label>
            <Select
              value={slide.slide_type}
              onValueChange={(value) => handleSlideTypeChange(value, activeSlideIndex)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Slide Position</label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => moveSlideUp(activeSlideIndex)}
                disabled={activeSlideIndex === 0}
              >
                <ArrowUp className="h-3.5 w-3.5 mr-1" /> Move Up
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => moveSlideDown(activeSlideIndex)}
                disabled={activeSlideIndex === slides.length - 1}
              >
                <ArrowDown className="h-3.5 w-3.5 mr-1" /> Move Down
              </Button>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => removeSlide(activeSlideIndex)}
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={slides.length <= 1}
            >
              <Trash className="h-4 w-4 mr-1" />
              Remove Slide
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render slide list sidebar
  const renderSlideList = () => {
    return (
      <div className="border rounded-lg bg-white">
        <div className="px-3 py-3 border-b flex justify-between items-center">
          <h3 className="text-sm font-medium">Slides</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addSlide}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[600px]">
          <div className="p-2 space-y-1">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`
                  flex items-center p-2 rounded-md cursor-pointer text-sm group
                  ${activeSlideIndex === index ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}
                `}
                onClick={() => setActiveSlideIndex(index)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full 
                    ${activeSlideIndex === index ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 border'} text-xs`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      {slide.slide_type === 'text' ? 
                        (slide.config.content?.slice(0, 20) || 'Text slide') : 
                       slide.slide_type === 'video' ? 
                        (slide.config.title || 'Video slide') : 
                        (slide.config.question || 'Quiz slide')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="px-2 py-2 border-t">
          <Button 
            onClick={addSlide}
            variant="outline" 
            className="w-full h-8 text-xs border-dashed border-slate-300"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Slide
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="text-center py-8">Loading slides...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Content</h2>
        <div className="flex space-x-2">
          <Button onClick={addSlide} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
          <Button 
            onClick={saveSlides} 
            disabled={saving || slides.length === 0}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slide list sidebar - LEFT COLUMN */}
        <div className="lg:col-span-3">
          {renderSlideList()}
        </div>
        
        {/* Active slide editor - MIDDLE COLUMN */}
        <div className="lg:col-span-6">
          {activeSlideIndex !== null && slides[activeSlideIndex] && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 pb-2 border-b">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">
                      Slide {activeSlideIndex + 1}
                    </CardTitle>
                    {getSlideTypeBadge(slides[activeSlideIndex].slide_type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {renderSlideEditor(slides[activeSlideIndex], activeSlideIndex)}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Settings panel - RIGHT COLUMN */}
        <div className="lg:col-span-3">
          {renderSlideSettings()}
        </div>
      </div>
    </div>
  );
} 