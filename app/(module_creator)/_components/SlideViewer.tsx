'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { FileText, Video, ListTodo, AlertCircle, MessageSquare, MoveHorizontal, Clock, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Slide, TextSlideConfig, VideoSlideConfig, QuizSlideConfig, StudentResponseSlideConfig, SliderSlideConfig, ContextSlideConfig } from './SlideEditor';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SlideViewerProps {
  moduleId: string;
  estimatedDuration?: number | null;
}

export default function SlideViewer({ moduleId, estimatedDuration }: SlideViewerProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResults, setQuizResults] = useState<Record<number, boolean>>({});
  const [videoPlayedOnce, setVideoPlayedOnce] = useState<Record<number, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const supabase = useSupabase();
  const t = useTranslations();

  // Type guards for slide configurations
  const isTextSlide = (slide: Slide): slide is Slide & { config: TextSlideConfig } => 
    slide.slide_type === 'text' && slide.config.type === 'text';
  
  const isVideoSlide = (slide: Slide): slide is Slide & { config: VideoSlideConfig } => 
    slide.slide_type === 'video' && slide.config.type === 'video';
  
  const isQuizSlide = (slide: Slide): slide is Slide & { config: QuizSlideConfig } => 
    slide.slide_type === 'quiz' && slide.config.type === 'quiz';
  
  const isStudentResponseSlide = (slide: Slide): slide is Slide & { config: StudentResponseSlideConfig } => 
    slide.slide_type === 'student_response' && slide.config.type === 'student_response';

  const isSliderSlide = (slide: Slide): slide is Slide & { config: SliderSlideConfig } => 
    slide.slide_type === 'slider' && slide.config.type === 'slider';

  const isContextSlide = (slide: Slide): slide is Slide & { config: ContextSlideConfig } => 
    slide.slide_type === 'context' && slide.config.type === 'context';

  // Load slides
  useEffect(() => {
    async function loadSlides() {
      if (!supabase || !moduleId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('slides')
          .select('*')
          .eq('module_id', moduleId)
          .order('position', { ascending: true });
        
        if (error) throw error;
        
        console.log('[SlideViewer] Loaded slides from database:', data);
        
        // Log all video URLs for debugging
        if (data) {
          const videoSlides = data.filter(slide => 
            slide.slide_type === 'video' && 
            slide.config.type === 'video' && 
            slide.config.videoUrl
          );
          
          console.log(`[SlideViewer] Found ${videoSlides.length} video slides`);
          videoSlides.forEach((slide, index) => {
            console.log(`[SlideViewer] Video ${index + 1} URL:`, slide.config.videoUrl);
            
            // Test video URL accessibility
            fetch(slide.config.videoUrl, { method: 'HEAD' })
              .then(response => {
                console.log(`[SlideViewer] Video URL test (${index + 1}) status:`, response.status);
              })
              .catch(err => {
                console.error(`[SlideViewer] Video URL test (${index + 1}) failed:`, err);
              });
          });
        }
        
        setSlides(data || []);
      } catch (err) {
        console.error('Error loading slides:', err);
        toast.error('Failed to load slides');
      } finally {
        setLoading(false);
      }
    }
    
    loadSlides();
  }, [supabase, moduleId]);

  // Handle quiz answer selection
  const selectQuizAnswer = (slideIndex: number, optionIndex: number) => {
    setQuizAnswers({
      ...quizAnswers,
      [slideIndex]: optionIndex
    });
  };

  // Check quiz answer
  const checkQuizAnswer = (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!isQuizSlide(slide)) return;
    
    const selectedAnswer = quizAnswers[slideIndex];
    const isCorrect = selectedAnswer === slide.config.correctOptionIndex;
    
    setQuizResults({
      ...quizResults,
      [slideIndex]: isCorrect
    });
    
    if (isCorrect) {
      toast.success('Correct answer!');
    } else {
      toast.error('Incorrect answer. Try again!');
    }
  };

  // Get slide type info
  const getSlideTypeInfo = (type: string) => {
    switch (type) {
      case 'text':
        return {
          icon: <FileText className="h-5 w-5" />,
          label: t('slides.common.textSlide'),
          color: 'text-blue-600'
        };
      case 'video':
        return {
          icon: <Video className="h-5 w-5" />,
          label: t('slides.common.videoSlide'),
          color: 'text-purple-600'
        };
      case 'quiz':
        return {
          icon: <ListTodo className="h-5 w-5" />,
          label: t('slides.common.quizSlide'),
          color: 'text-amber-600'
        };
      case 'student_response':
        return {
          icon: <Camera className="h-5 w-5" />,
          label: t('slides.common.videoResponse'),
          color: 'text-rose-600'
        };
      case 'slider':
        return {
          icon: <MoveHorizontal className="h-5 w-5" />,
          label: t('slides.common.scaleRating'),
          color: 'text-indigo-600'
        };
      case 'context':
        return {
          icon: <MessageSquare className="h-5 w-5" />,
          label: t('slides.common.contextSlide'),
          color: 'text-teal-600'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: 'Unknown',
          color: 'text-gray-600'
        };
    }
  };

  // Render the current slide
  const renderCurrentSlide = () => {
    if (slides.length === 0) {
      return (
        <div className="bg-white rounded-lg p-10">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t('slides.viewer.noSlides.title')}</p>
            <span className="text-sm text-gray-500">{t('slides.viewer.noSlides.subtitle')}</span>
          </div>
        </div>
      );
    }

    const currentSlide = slides[currentSlideIndex];
    console.log('[SlideViewer] Rendering slide:', currentSlide);
    const slideTypeInfo = getSlideTypeInfo(currentSlide.slide_type);

    switch (currentSlide.slide_type) {
      case 'text':
        if (!isTextSlide(currentSlide)) return <p>Invalid text slide configuration</p>;
        return (
          <div className="bg-white rounded-lg">
            <div className={`flex items-center gap-3 p-4 ${slideTypeInfo.color}`}>
              {slideTypeInfo.icon}
              <span className="font-medium">{slideTypeInfo.label}</span>
            </div>
            <div className="p-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: currentSlide.config.content }}
              />
            </div>
          </div>
        );
      
      case 'video':
        if (!isVideoSlide(currentSlide)) return <p>Invalid video slide configuration</p>;
        console.log('[SlideViewer] Video slide config:', currentSlide.config);
        const isVideoPlayed = videoPlayedOnce[currentSlideIndex] || false;
        const allowReplay = currentSlide.config.allowReplay !== false; // Default to true if not specified
        
        return (
          <div className="bg-white rounded-lg">
            <div className={`flex items-center gap-3 p-4 ${slideTypeInfo.color}`}>
              {slideTypeInfo.icon}
              <span className="font-medium">{currentSlide.config.title || slideTypeInfo.label}</span>
            </div>
            <div className="p-6 space-y-4">
              {/* Context field */}
              {currentSlide.config.context && (
                <div className="bg-blue-50 rounded-md p-3 text-blue-800">
                  <p className="text-sm">{currentSlide.config.context}</p>
                </div>
              )}
              
              <div className="aspect-video overflow-hidden rounded-md bg-muted relative">
                {currentSlide.config.videoUrl ? (
                  <>
                    <video 
                      ref={(el: HTMLVideoElement | null) => {
                        videoRefs.current[currentSlideIndex] = el;
                      }}
                      src={currentSlide.config.videoUrl} 
                      className="w-full h-full"
                      controls={!isVideoPlayed || allowReplay}
                      crossOrigin="anonymous"
                      preload="metadata"
                      playsInline
                      onPlay={() => {
                        console.log('[SlideViewer] Video playback started');
                        if (!videoPlayedOnce[currentSlideIndex]) {
                          // Track that this video has been played
                          setVideoPlayedOnce(prev => ({ ...prev, [currentSlideIndex]: true }));
                        }
                      }}
                      onError={(e) => {
                        console.error('[SlideViewer] Video load error:', e);
                        // Try to provide more details about the error
                        const videoElement = e.target as HTMLVideoElement;
                        console.error('[SlideViewer] Video error code:', videoElement.error?.code);
                        console.error('[SlideViewer] Video error message:', videoElement.error?.message);
                        setVideoErrors(prev => ({ ...prev, [currentSlideIndex]: true }));
                      }}
                      onLoadStart={() => console.log('[SlideViewer] Video load started')}
                      onLoadedData={() => {
                        console.log('[SlideViewer] Video data loaded successfully');
                        setVideoErrors(prev => ({ ...prev, [currentSlideIndex]: false }));
                      }}
                      onEnded={() => {
                        console.log('[SlideViewer] Video playback ended');
                        // Mark as played when the video ends
                        setVideoPlayedOnce(prev => ({ ...prev, [currentSlideIndex]: true }));
                      }}
                    />
                    
                    {/* Overlay for videos that can't be replayed */}
                    {isVideoPlayed && !allowReplay && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mb-3" />
                        <h3 className="text-xl font-bold mb-2">Video can only be played once</h3>
                        <p className="text-sm text-center max-w-md">
                          This video has been configured to only allow a single viewing.
                          Please continue to the next slide.
                        </p>
                      </div>
                    )}
                    
                    {/* Error overlay */}
                    {videoErrors[currentSlideIndex] && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                        <h3 className="text-xl font-bold mb-2">Video failed to load</h3>
                        <p className="text-sm text-center max-w-md mb-4">
                          There was a problem loading the video. This might be due to a network issue or an invalid video URL.
                        </p>
                        <button 
                          onClick={() => {
                            // Retry loading the video
                            setVideoErrors(prev => ({ ...prev, [currentSlideIndex]: false }));
                            if (videoRefs.current[currentSlideIndex]) {
                              videoRefs.current[currentSlideIndex]?.load();
                            }
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No video provided</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'quiz':
        if (!isQuizSlide(currentSlide)) return <p>Invalid quiz slide configuration</p>;
        return (
          <div className="bg-white rounded-lg">
            <div className={`flex items-center gap-3 p-4 ${slideTypeInfo.color}`}>
              {slideTypeInfo.icon}
              <span className="font-medium">{slideTypeInfo.label}</span>
            </div>
            <div className="p-6 space-y-6">
              <h3 className="text-xl font-medium">{currentSlide.config.question}</h3>
              
              <div className="space-y-3">
                {currentSlide.config.options.map((option: string, optionIndex: number) => (
                  <div key={optionIndex} className="flex">
                    <Button
                      type="button"
                      variant={quizAnswers[currentSlideIndex] === optionIndex ? "default" : "outline"}
                      className={`w-full justify-start text-left ${
                        quizResults[currentSlideIndex] !== undefined && 
                        currentSlide.config.correctOptionIndex === optionIndex
                          ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100 hover:text-green-800'
                          : ''
                      }`}
                      onClick={() => {
                        if (quizResults[currentSlideIndex] === undefined) {
                          selectQuizAnswer(currentSlideIndex, optionIndex);
                        }
                      }}
                      disabled={quizResults[currentSlideIndex] !== undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {String.fromCharCode(65 + optionIndex)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </Button>
                  </div>
                ))}
              </div>
              
              {quizAnswers[currentSlideIndex] !== undefined && quizResults[currentSlideIndex] === undefined && (
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={() => checkQuizAnswer(currentSlideIndex)}
                  >
                    Check Answer
                  </Button>
                </div>
              )}
              
              {quizResults[currentSlideIndex] !== undefined && (
                <div className={`p-4 rounded-md ${quizResults[currentSlideIndex] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {quizResults[currentSlideIndex]
                    ? 'Correct! Great job!'
                    : `Incorrect. The correct answer is: ${currentSlide.config.options[currentSlide.config.correctOptionIndex]}`
                  }
                </div>
              )}
            </div>
          </div>
        );
      
      case 'student_response':
        if (!isStudentResponseSlide(currentSlide)) return <p>Invalid student response slide configuration</p>;
        return (
          <div className="bg-white rounded-lg">
            <div className={`flex items-center gap-3 p-4 ${slideTypeInfo.color}`}>
              {slideTypeInfo.icon}
              <span className="font-medium">{slideTypeInfo.label}</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-rose-900">Record Your Response</h3>
                    <p className="text-sm text-rose-700">
                      {currentSlide.config.severalResponses 
                        ? "You can submit multiple video responses to this prompt."
                        : "Please record a single video response to this prompt."}
                    </p>
                    {currentSlide.config.instantResponse && (
                      <p className="text-sm text-rose-600 mt-1 font-medium">
                        You must respond immediately after the previous video ends.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Video recording interface will be implemented here */}
              <div className="aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                <div className="text-center p-6">
                  <Camera className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-slate-900 font-medium mb-1">Video Response</h3>
                  <p className="text-sm text-slate-500">
                    The recording interface will appear here when viewing as a student
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'slider':
        if (!isSliderSlide(currentSlide)) return <p>Invalid slider slide configuration</p>;
        return (
          <div className="bg-white rounded-lg">
            <div className={`flex items-center gap-3 p-4 ${slideTypeInfo.color}`}>
              {slideTypeInfo.icon}
              <span className="font-medium">{slideTypeInfo.label}</span>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                {currentSlide.config.sliders.map((slider) => {
                  const boxCount = slider.max - slider.min + 1;
                  return (
                    <div key={slider.id} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold">{slider.question}</h3>
                        {currentSlide.config.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {currentSlide.config.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-6">
                        <div className="relative">
                          <div className="flex justify-between absolute -top-6 w-full text-sm text-muted-foreground">
                            <span>{slider.minLabel}</span>
                            <span>{slider.midLabel}</span>
                            <span>{slider.maxLabel}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            {Array.from({ length: boxCount }, (_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex-1 flex items-center justify-center h-12 rounded-md border text-sm font-medium",
                                  "bg-white hover:bg-emerald-50 hover:border-emerald-200",
                                  "text-gray-700 hover:text-emerald-700"
                                )}
                              >
                                {slider.min + i}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'context':
        if (!isContextSlide(currentSlide)) return <p>Invalid context slide configuration</p>;
        return (
          <div className="bg-white rounded-lg">
            <div className={`flex items-center gap-3 p-4 ${slideTypeInfo.color}`}>
              {slideTypeInfo.icon}
              <span className="font-medium">{slideTypeInfo.label}</span>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: currentSlide.config.content }} />
              </div>
            </div>
          </div>
        );
      
      default:
        return <p>Unknown slide type</p>;
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading slides...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Module info */}
      {estimatedDuration && (
        <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{estimatedDuration} min</span>
        </div>
      )}
      
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Slide thumbnails sidebar */}
        <div className="hidden md:block md:col-span-4">
          <div className="bg-white rounded-lg">
            <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-1">
                {slides.map((slide, index) => {
                  const slideTypeInfo = getSlideTypeInfo(slide.slide_type);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        flex items-center p-2 rounded-md cursor-pointer
                        ${currentSlideIndex === index ? 
                          `bg-${slideTypeInfo.color.split('-')[1]}-50` : 
                          'hover:bg-gray-50'}
                      `}
                      onClick={() => setCurrentSlideIndex(index)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full 
                            bg-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <div className={`flex-shrink-0 ${currentSlideIndex === index ? slideTypeInfo.color : 'text-gray-500'}`}>
                            {slideTypeInfo.icon}
                          </div>
                          <span className={`text-sm truncate ${currentSlideIndex === index ? slideTypeInfo.color : 'text-gray-700'}`}>
                            {slideTypeInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Current slide content */}
        <div className="md:col-span-8">
          {renderCurrentSlide()}
        </div>
      </div>
      
      {/* Mobile slide navigation dots */}
      <div className="flex justify-center space-x-1 pt-4 md:hidden">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlideIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlideIndex ? 'bg-primary scale-125' : 'bg-muted-foreground/20'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 