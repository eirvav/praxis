// Base slide interface
export interface BaseSlide {
  id: string;
  module_id: string;
  position: number;
  slide_type: string;
  created_at: string;
}

// Text Slide
export interface TextSlideConfig {
  type: 'text';
  content: string;
}

export interface TextSlide extends BaseSlide {
  slide_type: 'text';
  config: TextSlideConfig;
}

// Video Slide
export interface VideoSlideConfig {
  type: 'video';
  title?: string;
  videoUrl?: string;
  context?: string;
  allowReplay?: boolean;
}

export interface VideoSlide extends BaseSlide {
  slide_type: 'video';
  config: VideoSlideConfig;
}

// Quiz Slide
export interface QuizSlideConfig {
  type: 'quiz';
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface QuizSlide extends BaseSlide {
  slide_type: 'quiz';
  config: QuizSlideConfig;
}

// Student Response Slide
export interface StudentResponseSlideConfig {
  type: 'student_response';
  severalResponses?: boolean;
  instantResponse?: boolean;
}

export interface StudentResponseSlide extends BaseSlide {
  slide_type: 'student_response';
  config: StudentResponseSlideConfig;
}

// Slider/Reflection Slide
export interface SliderConfig {
  id: string;
  question: string;
  min: number;
  max: number;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
}

export interface SliderSlideConfig {
  type: 'slider';
  sliders: SliderConfig[];
  description?: string;
}

export interface SliderSlide extends BaseSlide {
  slide_type: 'slider';
  config: SliderSlideConfig;
}

// Context Slide
export interface ContextSlideConfig {
  type: 'context';
  title: string;
  content: string;
}

export interface ContextSlide extends BaseSlide {
  slide_type: 'context';
  config: ContextSlideConfig;
}

// Union type for all slide types
export type Slide = 
  | TextSlide 
  | VideoSlide 
  | QuizSlide 
  | StudentResponseSlide 
  | SliderSlide 
  | ContextSlide;

// Type guard functions
export const isTextSlide = (slide: Slide): slide is TextSlide => 
  slide.slide_type === 'text' && slide.config.type === 'text';

export const isVideoSlide = (slide: Slide): slide is VideoSlide => 
  slide.slide_type === 'video' && slide.config.type === 'video';

export const isQuizSlide = (slide: Slide): slide is QuizSlide => 
  slide.slide_type === 'quiz' && slide.config.type === 'quiz';

export const isStudentResponseSlide = (slide: Slide): slide is StudentResponseSlide => 
  slide.slide_type === 'student_response' && slide.config.type === 'student_response';

export const isSliderSlide = (slide: Slide): slide is SliderSlide => 
  slide.slide_type === 'slider' && slide.config.type === 'slider';

export const isContextSlide = (slide: Slide): slide is ContextSlide => 
  slide.slide_type === 'context' && slide.config.type === 'context'; 