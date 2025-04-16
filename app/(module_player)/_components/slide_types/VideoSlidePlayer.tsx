'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Video } from 'lucide-react';
import { VideoSlide } from './types';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';

interface VideoSlidePlayerProps {
  slide: VideoSlide;
}

export default function VideoSlidePlayer({ slide }: VideoSlidePlayerProps) {
  const [isVideoPlayed, setIsVideoPlayed] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const supabase = useSupabase();
  const allowReplay = slide.config.allowReplay !== false; // Default to true if not specified

  // Save video progress to database
  const saveProgress = async (progress: number) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('slide_progress')
        .upsert({
          slide_id: slide.id,
          progress,
          completed: progress === 100,
          last_watched_at: new Date().toISOString()
        });

      if (error && error.code !== 'PGRST116') { // Ignore not found errors
        console.error('Error saving video progress:', error);
      }
    } catch (err) {
      console.error('Error saving video progress:', err);
    }
  };

  // Load saved progress
  useEffect(() => {
    async function loadProgress() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('slide_progress')
          .select('progress, completed')
          .eq('slide_id', slide.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

        if (error && error.code !== 'PGRST116') { // Ignore not found errors
          console.error('Error loading video progress:', error);
          return;
        }

        if (data) {
          setIsVideoPlayed(data.completed);
          setVideoProgress(data.progress);
        }
      } catch (err) {
        console.error('Error loading video progress:', err);
      }
    }

    loadProgress();
    setIsVideoPlayed(false); // Reset when slide changes
  }, [supabase, slide.id]);

  // Handle video progress updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(progress);
    
    // Save progress every 5 seconds
    if (Math.floor(video.currentTime) % 5 === 0) {
      saveProgress(progress);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>{slide.config.title || 'Video Slide'}</CardTitle>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
            <Video className="h-3 w-3 mr-1" /> Video Slide
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Context field */}
        {slide.config.context && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800">
            <p className="text-sm">{slide.config.context}</p>
          </div>
        )}
        
        <div className="aspect-video overflow-hidden rounded-md border bg-muted relative">
          {slide.config.videoUrl ? (
            <>
              <video 
                ref={videoRef}
                src={slide.config.videoUrl} 
                className="w-full h-full"
                controls={!isVideoPlayed || allowReplay}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => {
                  if (!isVideoPlayed) {
                    setIsVideoPlayed(true);
                  }
                }}
                onEnded={() => {
                  setIsVideoPlayed(true);
                  saveProgress(100);
                }}
              />
              
              {/* Progress indicator */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              
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
}
