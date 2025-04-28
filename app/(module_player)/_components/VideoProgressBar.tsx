'use client';

import { useEffect, useState } from 'react';

interface VideoProgressBarProps {
  currentTime: number;
  duration: number;
  isFullscreen?: boolean;
}

export default function VideoProgressBar({ 
  currentTime, 
  duration, 
  isFullscreen = false 
}: VideoProgressBarProps) {
  const [progress, setProgress] = useState(0);
  
  // Calculate progress percentage
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    } else {
      setProgress(0);
    }
  }, [currentTime, duration]);

  return (
    <div 
      className={`w-full ${isFullscreen ? 'absolute bottom-0 left-0 right-0 z-40' : 'relative'}`}
      style={{ height: '3px' }}
    >
      <div 
        className="h-full bg-gray-600 opacity-70"
        style={{ width: '100%' }}
      >
        <div 
          className="h-full bg-primaryStyling transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 