'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, FileText, Video, ListTodo } from 'lucide-react';
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
        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle>{currentSlide.config.title || 'Video Slide'}</CardTitle>
                {getSlideTypeBadge('video')}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="aspect-video overflow-hidden rounded-md border bg-muted">
                {currentSlide.config.videoUrl ? (
                  <video 
                    src={currentSlide.config.videoUrl} 
                    className="w-full h-full"
                    controls
                    preload="metadata"
                  />
                ) : currentSlide.config.url ? (
                  <iframe 
                    src={currentSlide.config.url} 
                    className="w-full h-full"
                    allowFullScreen
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
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
                            (slide.config.question || 'Quiz slide')}
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