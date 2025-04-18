'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface PlayerHeaderProps {
  moduleName: string;
  currentSlideIndex: number;
  totalSlides: number;
  goToPreviousSlide: () => void;
  goToNextSlide: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
  courseName?: string;
}

export default function PlayerHeader({
  moduleName,
  currentSlideIndex,
  totalSlides,
  goToPreviousSlide,
  goToNextSlide,
  disablePrevious,
  disableNext,
  courseName
}: PlayerHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full bg-background/95 backdrop-blur-sm border-b">
        <div className="w-full px-4 flex h-14 items-center justify-between">
          {/* Left Side - Exit Button */}
          <div className="flex-1 flex justify-start">
            <Button variant="ghost" size="sm" asChild
            className='text-base font-medium'>
              <Link href={`/student/`}>
                <X className="h-5 w-5" />
                Exit Player
              </Link>
            </Button>
          </div>

          {/* Center - Course and Module Name */}
          <div className="flex-1 flex justify-center items-center">
            <h1 className="text-base font-medium truncate max-w-[80%] flex items-center gap-2">
              {courseName && (
                <>
                  <span className="text-muted-foreground hidden min-[800px]:inline">{courseName}</span>
                  <span className="text-muted-foreground hidden min-[800px]:inline">/</span>
                </>
              )}
              <span className="font-semibold">{moduleName}</span>
            </h1>
          </div>

          {/* Right Side - Navigation */}
          <div className="flex-1 flex items-center justify-end gap-2">
            <div className="text-sm text-muted-foreground mr-2 hidden min-[830px]:block">
              {totalSlides > 0 ? `${currentSlideIndex + 1} of ${totalSlides}` : 'No slides'}
            </div>
            <Button 
              variant="outline" 
              onClick={goToPreviousSlide}
              disabled={disablePrevious}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button
              onClick={goToNextSlide}
              disabled={disableNext}
              className="bg-primaryStyling hover:bg-indigo-700 cursor-pointer"
            >
              Next Step 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-muted relative">
          <div 
            className="absolute top-0 left-0 h-full bg-primaryStyling transition-all duration-300"
            style={{
              width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
            }}
          />
          <div className="absolute top-0 left-0 w-full h-full flex">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <div
                key={index}
                className="flex-1 border-r border-background last:border-r-0"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
