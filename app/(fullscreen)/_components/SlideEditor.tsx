'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash, ArrowUp, ArrowDown, FileText, Video, ListTodo, Settings, Grip, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const supabase = useSupabase();

  // Create a default slide
  const createDefaultSlide = useCallback((): Slide => {
    return {
      module_id: moduleId,
      slide_type: 'text',
      position: 0,
      config: { content: 'Enter your content here...' }
    };
  }, [moduleId]);

  // Load existing slides only once
  useEffect(() => {
    async function loadSlides() {
      if (!supabase || !moduleId || initialFetchDone) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('slides')
          .select('*')
          .eq('module_id', moduleId)
          .order('position', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSlides(data);
          setActiveSlideIndex(0);
        } else {
          // Start with one default slide
          const defaultSlide = createDefaultSlide();
          setSlides([defaultSlide]);
          setActiveSlideIndex(0);
        }
      } catch (err: any) {
        console.error('Error loading slides:', err);
        toast.error('Failed to load slides');
        // Start with one default slide on error
        const defaultSlide = createDefaultSlide();
        setSlides([defaultSlide]);
        setActiveSlideIndex(0);
      } finally {
        setLoading(false);
        setInitialFetchDone(true);
      }
    }
    
    loadSlides();
  }, [supabase, moduleId, initialFetchDone, createDefaultSlide]);

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
        config = { url: '', title: '' };
        break;
      case 'quiz':
        config = { question: '', options: [''], correctOptionIndex: 0 };
        break;
    }
    
    updatedSlides[index] = {
      ...updatedSlides[index],
      slide_type: slideType,
      config
    };
    
    setSlides(updatedSlides);
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
    
    setSlides(updatedSlides);
  };

  // Save all slides
  const saveSlides = async () => {
    if (!supabase || !moduleId) return;
    
    try {
      setSaving(true);
      
      // First, delete all existing slides for this module
      const { error: deleteError } = await supabase
        .from('slides')
        .delete()
        .eq('module_id', moduleId);
      
      if (deleteError) throw deleteError;
      
      // Then insert all new slides
      if (slides.length > 0) {
        const { error: insertError } = await supabase
          .from('slides')
          .insert(slides.map((slide) => ({
            module_id: moduleId,
            slide_type: slide.slide_type,
            position: slide.position,
            config: slide.config
          })));
        
        if (insertError) throw insertError;
      }
      
      toast.success('Slides saved successfully');
      
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
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
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

  // Render slide editor based on type
  const renderSlideEditor = (slide: Slide, index: number) => {
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
              <label className="text-sm font-medium">Video URL</label>
              <Input
                placeholder="Paste YouTube, Vimeo or other video URL"
                value={slide.config.url || ''}
                onChange={(e) => updateSlideConfig(index, { url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Support for YouTube, Vimeo, and other embeddable video platforms
              </p>
            </div>
            
            {slide.config.url && (
              <div className="border rounded-md p-2 bg-muted/20">
                <p className="text-xs font-medium mb-1">Preview:</p>
                <div className="aspect-video">
                  <iframe 
                    src={slide.config.url} 
                    className="w-full h-full rounded"
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
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