'use client';

import VideoSlidePlayer from './slide_types/VideoSlidePlayer';
import QuizSlidePlayer from './slide_types/QuizSlidePlayer';
import SlideSlidePlayer from './slide_types/TextResponseSlidePlayer';
import StudentResponseSlidePlayer from './slide_types/StudentVideoResponseSlidePlayer';
import ReflectionSlidePlayer from './slide_types/LikertScaleSlidePlayer';
import ContextSlidePlayer from './slide_types/ContextSlidePlayer';
import CombinedVideoResponsePlayer from './slide_types/CombinedVideoResponsePlayer';
import { 
  Slide,
  isTextSlide,
  isVideoSlide,
  isQuizSlide,
  isStudentResponseSlide,
  isSliderSlide,
  isContextSlide
} from './slide_types/types';
import { useState, useEffect } from 'react';

interface ModuleSlidePlayerProps {
  slides: Slide[];
  currentSlideIndex: number;
  goToNextSlide?: () => void;
}

export default function ModuleSlidePlayer({ slides, currentSlideIndex, goToNextSlide }: ModuleSlidePlayerProps) {
  // Check if this is a case of a video slide followed by a response slide
  const [isCombinedSlide, setIsCombinedSlide] = useState(false);
  
  useEffect(() => {
    // Check if current slide is a video slide and next slide is a response slide
    const isVideoWithResponse = 
      currentSlideIndex < slides.length - 1 && 
      isVideoSlide(slides[currentSlideIndex]) && 
      isStudentResponseSlide(slides[currentSlideIndex + 1]);
      
    setIsCombinedSlide(isVideoWithResponse);
  }, [currentSlideIndex, slides]);

  if (slides.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-10">No slides available in this module.</div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  
  // If this is a combined video+response slide, we need the next slide too
  const nextSlide = currentSlideIndex < slides.length - 1 ? slides[currentSlideIndex + 1] : null;

  const renderSlide = () => {
    // Handle the combined video+response slide case
    if (isCombinedSlide && nextSlide && isVideoSlide(currentSlide) && isStudentResponseSlide(nextSlide)) {
      return (
        <CombinedVideoResponsePlayer 
          videoSlide={currentSlide} 
          responseSlide={nextSlide}
          goToNextSlide={goToNextSlide}
        />
      );
    }
    
    // Skip response slides that follow video slides (they're handled in the combined view)
    if (
      isStudentResponseSlide(currentSlide) && 
      currentSlideIndex > 0 && 
      isVideoSlide(slides[currentSlideIndex - 1])
    ) {
      // Automatically move to the next slide
      if (goToNextSlide) {
        setTimeout(goToNextSlide, 0);
      }
      return <div className="animate-pulse">Loading next slide...</div>;
    }
    
    // Handle regular slides
    if (isVideoSlide(currentSlide)) {
      return <VideoSlidePlayer slide={currentSlide} goToNextSlide={goToNextSlide} />;
    } else if (isQuizSlide(currentSlide)) {
      return <QuizSlidePlayer slide={currentSlide} />;
    } else if (isTextSlide(currentSlide)) {
      return <SlideSlidePlayer slide={currentSlide} />;
    } else if (isStudentResponseSlide(currentSlide)) {
      return <StudentResponseSlidePlayer slide={currentSlide} />;
    } else if (isSliderSlide(currentSlide)) {
      return <ReflectionSlidePlayer slide={currentSlide} />;
    } else if (isContextSlide(currentSlide)) {
      return <ContextSlidePlayer slide={currentSlide} />;
    } else {
      return (
        <div>
          <div className="text-center py-10">Unknown slide type</div>
        </div>
      );
    }
  };

  return (
    <div>
      {renderSlide()}
    </div>
  );
} 