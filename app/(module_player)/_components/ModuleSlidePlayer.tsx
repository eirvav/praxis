'use client';

import VideoSlidePlayer from './slide_types/VideoSlidePlayer';
import QuizSlidePlayer from './slide_types/QuizSlidePlayer';
import SlideSlidePlayer from './slide_types/TextSlidePlayer';
import StudentResponseSlidePlayer from './slide_types/StudentResponseSlidePlayer';
import ReflectionSlidePlayer from './slide_types/ReflectionSlidePlayer';
import ContextSlidePlayer from './slide_types/ContextSlidePlayer';
import { 
  Slide,
  isTextSlide,
  isVideoSlide,
  isQuizSlide,
  isStudentResponseSlide,
  isSliderSlide,
  isContextSlide
} from './slide_types/types';

interface ModuleSlidePlayerProps {
  slides: Slide[];
  currentSlideIndex: number;
}

export default function ModuleSlidePlayer({ slides, currentSlideIndex }: ModuleSlidePlayerProps) {
  if (slides.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-10">No slides available in this module.</div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  const renderSlide = () => {
    if (isVideoSlide(currentSlide)) {
      return <VideoSlidePlayer slide={currentSlide} />;
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