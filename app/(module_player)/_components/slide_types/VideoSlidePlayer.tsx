'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Video, RefreshCw, Eye, Play, CheckCircle, Lock, Maximize, Minimize, ArrowRight } from 'lucide-react';
import { VideoSlide } from './types';
import { useTranslations } from 'next-intl';
import { create } from 'zustand';
import { Button } from '@/components/ui/button';
import TextToSpeech from '../TextToSpeech';

// Storage keys with module prefix to avoid conflicts between different modules
const VIDEO_VIEW_COUNT_KEY = 'praxis_video_view_count_';
const VIDEO_WATCHED_KEY = 'praxis_video_watched_';

// Global store for managing video completion status
interface VideoCompletionStore {
  completedVideos: Record<string, boolean>;
  setVideoCompleted: (slideId: string, completed: boolean) => void;
}

// Create a store for video completion status
export const useVideoCompletionStore = create<VideoCompletionStore>((set) => ({
  completedVideos: {},
  setVideoCompleted: (slideId, completed) => 
    set((state) => ({
      completedVideos: {
        ...state.completedVideos,
        [slideId]: completed
      }
    }))
}));

interface VideoSlidePlayerProps {
  slide: VideoSlide;
  goToNextSlide?: () => void; // Optional function to go to the next slide
}

// Add these interfaces at the top of the file, after the imports
interface CustomDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface CustomHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export default function VideoSlidePlayer({ slide, goToNextSlide }: VideoSlidePlayerProps) {
  // Get storage keys for this video first
  const viewCountKey = `${VIDEO_VIEW_COUNT_KEY}${slide.id}`;
  const watchedKey = `${VIDEO_WATCHED_KEY}${slide.id}`;

  // Initialize state with values from localStorage immediately
  const [isVideoPlayed, setIsVideoPlayed] = useState(() => {
    try {
      return localStorage.getItem(watchedKey) === 'true';
    } catch {
      return false;
    }
  });
  
  const [viewCount, setViewCount] = useState(() => {
    try {
      const stored = localStorage.getItem(viewCountKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('slides.common');
  const completedVideos = useVideoCompletionStore((state) => state.completedVideos);
  const setVideoCompleted = useVideoCompletionStore((state) => state.setVideoCompleted);

  // Extract config values with defaults
  const isRequired = slide.config.isRequired !== false; // Default to true if not specified
  const allowReplay = slide.config.allowReplay !== false; // Default to true if not specified
  const maxReplays = typeof slide.config.maxReplays === 'number' ? slide.config.maxReplays : Infinity;

  // Check if video playback is allowed
  const isPlaybackAllowed = useCallback(() => {
    // If video is set to not allow replay and has been played, block playback
    if (!allowReplay && isVideoPlayed) {
      return false;
    }
    
    // For maxReplays, we block when viewCount >= maxReplays
    if (maxReplays === 0) {
      // Special case: if maxReplays is 0, only allow first viewing
      return viewCount <= 1;
    } else if (viewCount >= maxReplays) {
      // For other cases, check if we've exceeded maxReplays
      return false;
    }
    
    return true;
  }, [allowReplay, isVideoPlayed, maxReplays, viewCount]);

  // Update store when component mounts
  useEffect(() => {
    // If the video has been played, update the global store
    if (isVideoPlayed) {
      setVideoCompleted(slide.id, true);
    }

  }, [slide.id, isVideoPlayed, viewCount, allowReplay, maxReplays, setVideoCompleted]);

  // Save to localStorage when values change
  useEffect(() => {
    try {
      localStorage.setItem(viewCountKey, viewCount.toString());
    } catch (error) {
      console.error('Error saving view count to localStorage:', error);
    }
  }, [viewCount, viewCountKey]);

  useEffect(() => {
    try {
      localStorage.setItem(watchedKey, isVideoPlayed.toString());
      
      // Also update the global store
      setVideoCompleted(slide.id, isVideoPlayed);
    } catch (error) {
      console.error('Error saving watched status to localStorage:', error);
    }
  }, [isVideoPlayed, watchedKey, slide.id, setVideoCompleted]);

  // Handle mouse movement to show/hide controls
  const handleMouseMove = useCallback(() => {
    if (!isPlaybackAllowed()) return;
    
    setShowCustomControls(true);
    
    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowCustomControls(false);
      }
    }, 3000);
  }, [isPlaybackAllowed, isPlaying]);

  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Update the fullscreen detection code
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as CustomDocument;
      const isDocumentFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      
      setIsFullscreen(isDocumentFullscreen);
      
      // If exiting fullscreen, make sure controls are showing
      if (!isDocumentFullscreen && videoRef.current) {
        setShowControls(true);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Debug logs on component mount
  useEffect(() => {
    console.log('[VideoSlidePlayer] Config:', { 
      isRequired, 
      allowReplay, 
      maxReplays,
      viewCount,
      isVideoPlayed,
      completedInStore: completedVideos[slide.id],
      isPlaybackAllowed: isPlaybackAllowed()
    });
    
    // Reset error state when video URL changes
    if (slide.config.videoUrl) {
      setVideoError(false);
    }
    
    return () => {
    };
  }, [slide.config.videoUrl, isRequired, allowReplay, maxReplays, viewCount, isVideoPlayed, slide.id, completedVideos, isPlaybackAllowed]);

  // Update to ensure video doesn't play when maximum views reached
  useEffect(() => {
    // If we've reached maximum views and video is playing, stop it
    if (!isPlaybackAllowed() && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [viewCount, isPlaybackAllowed]);

  // Setup play/pause state tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Handle video progress updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const progress = (video.currentTime / video.duration) * 100;
    
    // Mark as completed when reaching near the end (98%)
    if (progress > 98 && !isVideoPlayed) {
      setIsVideoPlayed(true);
    }
  };

  // Retry loading the video if there's an error
  const handleRetryVideo = () => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    
    setIsVideoPlayed(true);
    setIsVideoEnded(true);
    setIsPlaying(false);
    
    // Only increment view count when the video finishes playing
    // First video view sets it to 1, subsequent views increment it
    if (viewCount === 0) {
      setViewCount(1);
    } else if (viewCount < maxReplays) {
      // Increment for subsequent complete views, but don't exceed maxReplays+1
      setViewCount(prev => Math.min(prev + 1, maxReplays + 1));
    }
  };

  // Enter fullscreen
  const enterFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    try {
      const element = videoContainerRef.current as CustomHTMLElement;
      // Request fullscreen on the container to include overlays
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  // Exit fullscreen
  const exitFullscreen = () => {
    try {
      const doc = document as CustomDocument;
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsVideoEnded(false);
        })
        .catch(err => {
          console.error('Error playing video:', err);
          setVideoError(true);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Play video
  const playVideo = () => {
    if (videoRef.current && isPlaybackAllowed()) {
      // First try to enter fullscreen
      enterFullscreen();
      
      // Then play the video
      videoRef.current.play()
        .then(() => {
          setShowControls(true);
          setShowCustomControls(true);
          setIsVideoEnded(false);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error playing video:', err);
          setVideoError(true);
        });
    }
  };

  // Replay video - explicitly called when clicking replay button
  const replayVideo = () => {
    if (videoRef.current && isPlaybackAllowed()) {
      // DON'T increment view count here - only increment when video finishes
      // Just enter fullscreen and play the video
      
      // Enter fullscreen
      enterFullscreen();
      
      // Reset video to beginning
      videoRef.current.currentTime = 0;
      
      // Play
      videoRef.current.play()
        .then(() => {
          setShowControls(true);
          setShowCustomControls(true);
          setIsVideoEnded(false);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error replaying video:', err);
          setVideoError(true);
        });
    }
  };

  // Determine if we should show the play overlay
  const shouldShowPlayOverlay = () => {
    return !showControls && isPlaybackAllowed() && !isVideoEnded && !isPlaying;
  };

  // Determine if we should show the replay overlay
  const shouldShowReplayOverlay = () => {
    return isVideoEnded && viewCount < maxReplays && allowReplay;
  };

  // Determine if we should show the "maximum views reached" overlay
  const shouldShowMaxViewsOverlay = () => {
    // Show when: allowReplay is false and video is played OR we've reached/exceeded max views
    return (!allowReplay && isVideoPlayed) || (viewCount >= maxReplays);
  };

  // Calculate remaining views - now considers the first view "free"
  const getRemainingViews = () => {
    if (maxReplays === 0) {
      return viewCount === 0 ? 1 : 0; // If maxReplays=0, only first view is allowed
    }
    
    // Simply calculate maxReplays minus the current view count
    // But don't go below zero
    return Math.max(0, maxReplays - viewCount);
  };

  return (
    <Card className="border-purple-200 w-full flex-1">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Video className="h-6 w-6 text-purple-600" />
            {t('videoSlide')}
          </CardTitle>
          
          {/* Required Badge */}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        {/* Title */}
        {slide.config.title && (
          <h1 className="text-3xl font-semibold mb-6">{slide.config.title}</h1>
        )}

        {/* Context field with TextToSpeech */}
        {slide.config.context && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800 mb-6">
            <p className="text-sm">{slide.config.context}</p>
            <TextToSpeech text={slide.config.context} />
          </div>
        )}
        
        {/* Display remaining views */}
        {allowReplay && maxReplays !== Infinity && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {getRemainingViews() > 0 ? (
              <span>Remaining views: <strong>{getRemainingViews()}</strong> of {maxReplays}</span>
            ) : (
              <span className="text-red-500">No more views remaining</span>
            )}
          </div>
        )}
        
        {/* Completion status */}
        {isVideoPlayed && (
          <div className="flex items-center gap-2 mb-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Video watched</span>
          </div>
        )}
        
        <div 
          ref={videoContainerRef}
          className="aspect-video overflow-hidden relative"
          onMouseMove={handleMouseMove}
        >
          {slide.config.videoUrl ? (
            <>
              <video 
                ref={videoRef}
                src={slide.config.videoUrl} 
                className="w-full h-full"
                controls={false} // Disable native controls
                crossOrigin="anonymous"
                preload="metadata"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => {
                  setIsPlaying(true);
                  setShowControls(true);
                  setShowCustomControls(true);
                }}
                onPause={() => {
                  setIsPlaying(false);
                  setShowCustomControls(true);
                }}
                onError={(e) => {
                  console.error('[VideoSlidePlayer] Video error:', e);
                  const videoElement = e.target as HTMLVideoElement;
                  console.error('[VideoSlidePlayer] Video error code:', videoElement.error?.code);
                  console.error('[VideoSlidePlayer] Video error message:', videoElement.error?.message);
                  setVideoError(true);
                }}
                onLoadedData={() => {
                  setVideoError(false);
                }}
                onEnded={handleVideoEnd}
                onClick={() => {
                  if (isPlaybackAllowed()) {
                    togglePlay();
                  }
                }}
              />
              
              {/* Custom video controls */}
              {isPlaybackAllowed() && showCustomControls && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent" style={{ pointerEvents: 'auto' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    </div>
                    
                    {/* Fullscreen toggle */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }} 
                      className="text-white hover:text-primary-foreground transition relative"
                      style={{ pointerEvents: 'auto' }}
                    >
                      {isFullscreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Play button overlay */}
              {shouldShowPlayOverlay() && (
                <div 
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer"
                  onClick={playVideo}
                >
                  <div className="rounded-full bg-primaryStyling hover:bg-indigo-700 p-4 transition-colors duration-300 shadow-lg flex items-center gap-2">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                  
                  {isRequired && (
                    <div className="mt-4 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Required to continue
                    </div>
                  )}
                </div>
              )}
              
              {/* Replay button overlay */}
              {shouldShowReplayOverlay() && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <h3 className="text-xl font-bold mt-2 text-white">Video Complete</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {allowReplay && getRemainingViews() > 0 && (
                        <Button 
                          onClick={replayVideo}
                          className="px-5 py-6 bg-primaryStyling hover:bg-indigo-700 text-white rounded-md flex items-center gap-2"
                        >
                          <RefreshCw className="h-5 w-5" />
                          Watch Again 
                          <span className="text-sm opacity-80 ml-2">
                            ({getRemainingViews()} of {maxReplays} views remaining)
                          </span>
                        </Button>
                      )}
                      
                      {/* Next Step button */}
                      {goToNextSlide && (
                        <Button
                          onClick={goToNextSlide}
                          className="px-5 py-6 bg-primaryStyling hover:bg-indigo-700 text-white rounded-md flex items-center gap-2"
                        >
                          Next Step
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Overlay for videos that can't be played */}
              {shouldShowMaxViewsOverlay() && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mb-3" />
                  <h3 className="text-xl font-bold mb-2">
                    {!allowReplay && isVideoPlayed
                      ? "Video can only be played once"
                      : "Maximum views reached"}
                  </h3>
                  <p className="text-sm text-center max-w-md mb-6">
                    {!allowReplay && isVideoPlayed
                      ? "This video has been configured to only allow a single viewing."
                      : `You have viewed this video the maximum number of times (${maxReplays}).`}
                    <br />
                    Please continue to the next slide.
                  </p>
                  
                  {/* Next Step button */}
                  {goToNextSlide && (
                    <Button
                      onClick={goToNextSlide}
                      className="px-5 py-4 bg-primaryStyling hover:bg-indigo-700 text-white rounded-md flex items-center gap-2"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              
              {/* Error overlay */}
              {videoError && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                  <h3 className="text-xl font-bold mb-2">Video failed to load</h3>
                  <p className="text-sm text-center max-w-md mb-4">
                    There was a problem loading the video. This might be due to a network issue or an invalid video URL.
                  </p>
                  <button 
                    onClick={handleRetryVideo}
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
      </CardContent>
    </Card>
  );
}
