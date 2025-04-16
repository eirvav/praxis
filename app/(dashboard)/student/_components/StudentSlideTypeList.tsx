'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { FileText, Video, ListTodo, Camera, MoveHorizontal, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// Simple Skeleton component if the UI one isn't available
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-muted ${className}`}></div>
);

// Slide configuration interfaces
interface BaseSlideConfig {
  title?: string;
}

interface TextSlideConfig extends BaseSlideConfig {
  content: string;
}

interface VideoSlideConfig extends BaseSlideConfig {
  url?: string;
}

interface QuizSlideConfig extends BaseSlideConfig {
  question: string;
  options?: string[];
}

interface StudentResponseConfig extends BaseSlideConfig {
  prompt?: string;
}

interface SliderQuestion {
  question: string;
  min?: number;
  max?: number;
  labels?: { start?: string; end?: string };
}

interface SliderSlideConfig extends BaseSlideConfig {
  sliders: SliderQuestion[];
}

interface ContextSlideConfig extends BaseSlideConfig {
  content?: string;
}

type SlideConfig = 
  | TextSlideConfig 
  | VideoSlideConfig 
  | QuizSlideConfig 
  | StudentResponseConfig 
  | SliderSlideConfig 
  | ContextSlideConfig;

interface Slide {
  id: string;
  module_id?: string;
  position: number;
  slide_type: 'text' | 'video' | 'quiz' | 'student_response' | 'slider' | 'context';
  config: SlideConfig;
  created_at?: string;
}

interface SlideTypeListProps {
  moduleId: string;
}

export default function StudentSlideTypeList({ moduleId }: SlideTypeListProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();
  const t = useTranslations();

  // Load slides
  useEffect(() => {
    async function loadSlides() {
      if (!supabase || !moduleId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('slides')
          .select('id, position, slide_type, config')
          .eq('module_id', moduleId)
          .order('position', { ascending: true });
        
        if (error) throw error;
        
        // Explicitly cast the data to the expected type
        setSlides(data as Slide[] || []);
      } catch (err) {
        console.error('Error loading slides:', err);
        toast.error('Failed to load module content');
      } finally {
        setLoading(false);
      }
    }
    
    loadSlides();
  }, [supabase, moduleId]);

  // Get slide type information with icon and label
  const getSlideTypeInfo = (type: Slide['slide_type'], config: SlideConfig) => {
    switch (type) {
      case 'text':
        return {
          icon: <FileText className="h-4 w-4 text-blue-600" />,
          label: config.title || t('slides.common.textSlide') || getSlideTitle(config, 'Text')
        };
      case 'video':
        return {
          icon: <Video className="h-4 w-4 text-purple-600" />,
          label: config.title || t('slides.common.videoSlide') || getSlideTitle(config, 'Video')
        };
      case 'quiz':
        return {
          icon: <ListTodo className="h-4 w-4 text-amber-600" />,
          label: config.title || t('slides.common.quizSlide') || getSlideTitle(config, 'Quiz')
        };
      case 'student_response':
        return {
          icon: <Camera className="h-4 w-4 text-rose-600" />,
          label: t('slides.common.videoResponse') || getSlideTitle(config, 'Video Response')
        };
      case 'slider':
        return {
          icon: <MoveHorizontal className="h-4 w-4 text-indigo-600" />,
          label: t('slides.common.slider') || t('slides.common.scaleRating') || getSlideTitle(config, 'Scale Rating')
        };
      case 'context':
        return {
          icon: <MessageSquare className="h-4 w-4 text-teal-600" />,
          label: t('slides.common.contextSlide') || getSlideTitle(config, 'Context')
        };
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          label: t('slides.common.unknownSlide') || 'Slide'
        };
    }
  };

  // Type guard functions
  const isQuizSlide = (config: SlideConfig): config is QuizSlideConfig => {
    return 'question' in config;
  };

  const isTextSlide = (config: SlideConfig): config is TextSlideConfig => {
    return 'content' in config;
  };

  const isSliderSlide = (config: SlideConfig): config is SliderSlideConfig => {
    return 'sliders' in config;
  };

  // Update the getSlideTitle function with proper type checking
  const getSlideTitle = (config: SlideConfig, fallback: string) => {
    if (!config) return fallback;
    
    // For slides with direct title property
    if (config.title) return config.title;
    
    // For quiz slides, use the question (truncated)
    if (isQuizSlide(config)) {
      const question = config.question;
      return question.length > 30 ? question.substring(0, 27) + '...' : question;
    }
    
    // For text slides with content, extract the first few words
    if (isTextSlide(config)) {
      // Strip HTML tags and get first 30 characters
      const text = config.content.replace(/<[^>]*>/g, '');
      const cleanText = text.trim();
      if (cleanText.length > 0) {
        return cleanText.length > 30 ? cleanText.substring(0, 27) + '...' : cleanText;
      }
    }

    // For slider slides with a question in the first slider
    if (isSliderSlide(config) && config.sliders.length > 0) {
      const firstSlider = config.sliders[0];
      if (firstSlider && firstSlider.question) {
        const question = firstSlider.question;
        return question.length > 30 ? question.substring(0, 27) + '...' : question;
      }
    }
    
    return fallback;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>No content available in this module yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {slides.map((slide, index) => {
          const typeInfo = getSlideTypeInfo(slide.slide_type, slide.config);
          return (
            <div 
              key={slide.id} 
              className="flex items-center gap-3 hover:bg-muted/30 p-3 rounded-md transition-colors hover:scale-[1.02] duration-200"
            >
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-muted text-xs font-medium shadow-sm">
                {index + 1}
              </div>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex-shrink-0 p-1.5 rounded-md bg-muted/50">
                  {typeInfo.icon}
                </div>
                <span className="font-medium text-sm truncate">
                  {typeInfo.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 