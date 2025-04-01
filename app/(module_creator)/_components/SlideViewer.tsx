'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, FileText, Video, ListTodo, AlertCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Slide } from './SlideEditor';
import { Badge } from '@/components/ui/badge';

interface SlideViewerProps {
  moduleId: string;
}

export default function SlideViewer({ moduleId }: SlideViewerProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResults, setQuizResults] = useState<Record<number, boolean>>({});
  const [videoPlayedOnce, setVideoPlayedOnce] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const supabase = useSupabase();

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
        setSlides(data || []);
      } catch (err: any) {
        console.error('Error loading slides:', err);
        toast.error('Failed to load slides');
      } finally {
        setLoading(false);
      }
    }
    
    loadSlides();
  }, [supabase, moduleId]);

  // Navigation functions
  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

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
      case 'student_response':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200">
            <MessageSquare className="h-3 w-3 mr-1" /> Response
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render the current slide
  const renderCurrentSlide = () => {
    if (slides.length === 0) {
      return (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No slides available for this module.</p>
              <span className="text-sm text-gray-500">The instructor has not added any content yet.</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    const currentSlide = slides[currentSlideIndex];
    console.log('[SlideViewer] Rendering slide:', currentSlide);

    switch (currentSlide.slide_type) {
      case 'text':
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>Text Slide</CardTitle>
                {getSlideTypeBadge('text')}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="prose max-w-none">
                {currentSlide.config.content.split('\n').map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'video':
        console.log('[SlideViewer] Video slide config:', currentSlide.config);
        const isVideoPlayed = videoPlayedOnce[currentSlideIndex] || false;
        const allowReplay = currentSlide.config.allowReplay !== false; // Default to true if not specified
        
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>{currentSlide.config.title || 'Video Slide'}</CardTitle>
                {getSlideTypeBadge('video')}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Context field */}
              {currentSlide.config.context && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800">
                  <p className="text-sm">{currentSlide.config.context}</p>
                </div>
              )}
              
              <div className="aspect-video overflow-hidden rounded-md border bg-muted relative">
                {currentSlide.config.videoUrl ? (
                  <>
                    <video 
                      ref={(el: HTMLVideoElement | null) => {
                        videoRefs.current[currentSlideIndex] = el;
                      }}
                      src={currentSlide.config.videoUrl} 
                      className="w-full h-full"
                      controls={!isVideoPlayed || allowReplay}
                      preload="metadata"
                      onPlay={() => {
                        if (!videoPlayedOnce[currentSlideIndex]) {
                          // Track that this video has been played
                          setVideoPlayedOnce(prev => ({ ...prev, [currentSlideIndex]: true }));
                        }
                      }}
                      onEnded={() => {
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
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No video provided</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'quiz':
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>Quiz Question</CardTitle>
                {getSlideTypeBadge('quiz')}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
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
                <div className={`p-4 rounded-md ${quizResults[currentSlideIndex] ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {quizResults[currentSlideIndex]
                    ? 'Correct! Great job!'
                    : `Incorrect. The correct answer is: ${currentSlide.config.options[currentSlide.config.correctOptionIndex]}`
                  }
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 'student_response':
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>Video Response Required</CardTitle>
                {getSlideTypeBadge('student_response')}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-rose-600" />
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
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-slate-900 font-medium mb-1">Video Response</h3>
                  <p className="text-sm text-slate-500">
                    The recording interface will appear here when viewing as a student
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
      <div className="bg-muted/30 rounded-lg p-3 flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={goToPreviousSlide}
          disabled={currentSlideIndex === 0}
          size="sm"
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        <div className="text-sm font-medium">
          {slides.length > 0 ? `Slide ${currentSlideIndex + 1} of ${slides.length}` : 'No Slides'}
        </div>
        
        <Button 
          variant="outline" 
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          size="sm"
          className="h-8"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Slide thumbnails sidebar */}
        <div className="hidden md:block md:col-span-1">
          <div className="border rounded-lg bg-muted/30">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="text-sm font-medium">Slides ({slides.length})</h3>
            </div>
            <div className="p-2 max-h-[500px] overflow-y-auto">
              <div className="space-y-1">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-center p-2 rounded-md cursor-pointer text-sm 
                      ${currentSlideIndex === index ? 'bg-muted/80 border border-muted-foreground/20' : 'hover:bg-muted/50'}
                    `}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded bg-background border text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          {slide.slide_type === 'text' ? 
                            (slide.config.content?.slice(0, 20) || 'Text slide') : 
                           slide.slide_type === 'video' ? 
                            (slide.config.title || 'Video slide') : 
                           slide.slide_type === 'quiz' ? 
                            (slide.config.question || 'Quiz slide') :
                           slide.slide_type === 'student_response' ?
                            'Video Response' :
                            'Unknown slide'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getSlideTypeBadge(slide.slide_type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Current slide content */}
        <div className="md:col-span-3">
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