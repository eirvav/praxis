'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoSlide, StudentResponseSlide } from './types';
import { Camera, CheckCircle, Play, Pause, Video, AlertCircle, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useVideoCompletionStore } from './VideoSlidePlayer';
import Image from 'next/image';
import TextToSpeech from '../TextToSpeech';
import VideoProgressBar from '../VideoProgressBar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Add interfaces for browser compatibility with fullscreen
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

interface CombinedVideoResponsePlayerProps {
  videoSlide: VideoSlide;
  responseSlide: StudentResponseSlide;
  goToNextSlide?: () => void;
}

// After imports, add localStorage constants
// Storage keys with module prefix to avoid conflicts between different modules
const VIDEO_VIEW_COUNT_KEY = 'praxis_video_view_count_';
const VIDEO_WATCHED_KEY = 'praxis_video_watched_';

// Add a persistent storage for recordings that won't be cleared on phase changes
interface PersistentRecording {
  id: number;
  blob: Blob;  // Store the actual blob, not just the URL
  url: string;
  timestamp: Date;
  duration: number;
}

export default function CombinedVideoResponsePlayer({
  videoSlide,
  responseSlide,
  goToNextSlide
}: CombinedVideoResponsePlayerProps) {
  const t = useTranslations('slides.common');
  
  // Get storage keys for this video
  const viewCountKey = `${VIDEO_VIEW_COUNT_KEY}${videoSlide.id}`;
  const watchedKey = `${VIDEO_WATCHED_KEY}${videoSlide.id}`;

  // Add video completion store access
  const setVideoCompleted = useVideoCompletionStore(state => state.setVideoCompleted);
  
  // Add state for the warning modal
  const [showInstantResponseWarning, setShowInstantResponseWarning] = useState(false);
  
  // Phase management
  const [phase, setPhase] = useState<'video' | 'prepare-response' | 'recording' | 'review'>('video');
  
  // Video player states
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [playCount, setPlayCount] = useState(() => {
    try {
      const stored = localStorage.getItem(viewCountKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isVideoPlayed, setIsVideoPlayed] = useState(() => {
    try {
      return localStorage.getItem(watchedKey) === 'true';
    } catch {
      return false;
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);
  const [countdown, setCountdown] = useState<number | string>(0);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTimeElapsed, setRecordingTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track multiple recordings with blob storage
  const [recordings, setRecordings] = useState<Array<PersistentRecording>>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | null>(null);
  
  // Video frame reference
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Get max duration from config with a default of 120 seconds (2 minutes)
  const maxDuration = responseSlide.config.responseMaxDuration || 120;
  
  // Calculate remaining time
  const timeRemaining = maxDuration - recordingTimeElapsed;
  
  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Try to fetch the video as a blob to handle CORS issues
  const fetchVideoAsBlob = useCallback(async (url: string) => {
    if (!url) return null;
    
    try {
      setIsDownloadingVideo(true);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideoBlob(blobUrl);
      setIsDownloadingVideo(false);
      return blobUrl;
    } catch (err) {
      console.error('Error fetching video as blob:', err);
      setIsDownloadingVideo(false);
      return null;
    }
  }, []);
  
  // Fullscreen handling
  const enterFullscreen = useCallback(() => {
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
  }, []);

  const exitFullscreen = useCallback(() => {
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
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  // Handle fullscreen change events
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
      
      // If exiting fullscreen, ensure controls are visible
      if (!isDocumentFullscreen && phase === 'video') {
        setShowCustomControls(true);
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
  }, [phase]);

  // Handle mouse movement to show/hide controls
  const handleMouseMove = useCallback(() => {
    if (phase !== 'video') return;
    
    setShowCustomControls(true);
    
    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds of inactivity, but only if video is playing
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && phase === 'video') {
        setShowCustomControls(false);
      }
    }, 3000);
  }, [isPlaying, phase]);

  // Initial video loading
  useEffect(() => {
    if (videoSlide.config.videoUrl && phase === 'video') {
      fetchVideoAsBlob(videoSlide.config.videoUrl)
        .catch(err => console.error('Failed to fetch video:', err));
    }
  }, [videoSlide.config.videoUrl, fetchVideoAsBlob, phase]);

  // Capture video thumbnail when video ends
  const captureVideoThumbnail = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setVideoThumbnail(dataUrl);
        console.log('Video thumbnail captured');
      }
    } catch (err) {
      console.error('Error capturing video thumbnail:', err);
    }
  }, []);

  // Start the video with warning check
  const playVideo = useCallback(() => {
    if (!videoRef.current) return;
    
    // Check if this is an instant response video and hasn't been played yet
    if (responseSlide.config.instantResponse === true && !isVideoPlayed && !videoEnded) {
      // Show the warning modal instead of playing right away
      setShowInstantResponseWarning(true);
      return;
    }
    
    // First try to enter fullscreen
    enterFullscreen();
    
    // Then play the video
    videoRef.current.play()
      .then(() => {
        setShowCustomControls(true);
        setIsPlaying(true);
        setVideoEnded(false);
      })
      .catch(err => {
        console.error('Error playing video:', err);
        setVideoError(true);
      });
  }, [enterFullscreen, responseSlide.config.instantResponse, isVideoPlayed, videoEnded]);

  // Add a function to proceed after warning
  const proceedAfterWarning = useCallback(() => {
    setShowInstantResponseWarning(false);
    
    if (!videoRef.current) return;
    
    // First try to enter fullscreen
    enterFullscreen();
    
    // Then play the video
    videoRef.current.play()
      .then(() => {
        setShowCustomControls(true);
        setIsPlaying(true);
        setVideoEnded(false);
      })
      .catch(err => {
        console.error('Error playing video:', err);
        setVideoError(true);
      });
  }, [enterFullscreen]);

  // Find supported MIME type
  const getSupportedMimeType = useCallback(() => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('MediaRecorder supports', type);
        return type;
      }
    }
    
    console.warn('No supported MIME types found, falling back to default');
    return '';  // Let browser pick default
  }, []);

  // Initialize camera stream
  const initializeCamera = useCallback(async () => {
    // Prevent multiple initializations
    if (isInitialized && streamRef.current) {
      console.log('Camera already initialized, skipping');
      return;
    }
    
    try {
      // Clean up any previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping previous track:', track.kind);
          track.stop();
        });
      }
      
      setError(null);
      console.log('Requesting media devices...');
      
      // Request camera and microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          aspectRatio: { ideal: 1.7777777778 },
          facingMode: "user",
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Store the stream in ref
      streamRef.current = mediaStream;
      setIsInitialized(true);
      
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera or microphone. Please ensure you have granted permission.');
      setIsInitialized(false);
    }
  }, [isInitialized]);
  
  // Update canRecordMore to allow at least one recording even when severalResponses=false
  const canRecordMore = useCallback(() => {
    // Get max responses count
    const maxResponses = responseSlide.config.maxResponses || 1;
    
    // Should be able to record if:
    // 1. We don't have any recordings yet (always allow at least 1 recording)
    // 2. OR if severalResponses is true AND we're under the limit
    const noRecordingsYet = recordings.length === 0;
    const underLimit = recordings.length < maxResponses;
    const allowMultiple = responseSlide.config.severalResponses === true;
    
    console.log(`Recording limit check: ${recordings.length}/${maxResponses}, allowMultiple: ${allowMultiple}, noRecordingsYet: ${noRecordingsYet}`);
    
    return noRecordingsYet || (allowMultiple && underLimit);
  }, [responseSlide.config.maxResponses, responseSlide.config.severalResponses, recordings.length]);

  // Now define handleVideoEnded (using canRecordMore)
  const handleVideoEnded = useCallback(() => {
    setVideoEnded(true);
    setIsPlaying(false);
    
    // Capture a thumbnail from the last frame of the video
    captureVideoThumbnail();
    
    // Mark as watched and increment play count
    setIsVideoPlayed(true);
    
    // Increment play count - first view sets to 1, subsequent views increment
    if (playCount === 0) {
      setPlayCount(1);
    } else {
      setPlayCount(prev => prev + 1);
    }
    
    // For instantResponse: explicitly move to recording phase with UI update
    // BUT only if we can still record more
    if (responseSlide.config.instantResponse === true && canRecordMore()) {
      console.log('instantResponse is true and can record more, moving to recording phase');
      setPhase('recording');
      
      // Initialize camera and start countdown
      initializeCamera().then(() => {
        console.log('Camera initialized for instant response');
        
        // Show the header immediately
        setCountdownHeader("Activating Video Recording!");
        
        // Set up the numeric countdown (3,2,1)
        const countdownDuration = 5000; // 5 seconds total
        const numberStart = 5;
        let timeRemaining = countdownDuration;
        const currentNumber = numberStart;
        
        setCountdown(currentNumber);
        
        const countdownInterval = setInterval(() => {
          timeRemaining -= 1000;
          
          // Update countdown number based on remaining time
          setCountdown(Math.max(Math.ceil(timeRemaining / 1000), 0));
          
          if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            setCountdownHeader(null);
            
            // After countdown, start recording directly
            if (streamRef.current) {
              console.log('Starting recording after instantResponse countdown');
              
              // Explicitly set recording state to ensure UI updates
              setIsRecording(true);
              setRecordingTimeElapsed(0);
              setIsPaused(false);
              // setRecordedChunks([]); // Intentionally removed, will be set after processing.
              
              // Get the supported MIME type
              const mimeType = getSupportedMimeType();
              const localInstantResponseChunks: Blob[] = []; // Initialize local chunk storage
              
              try {
                // Create and configure media recorder
                const recorder = new MediaRecorder(streamRef.current, {
                  mimeType,
                  videoBitsPerSecond: 2500000 // 2.5 Mbps
                });
                
                mediaRecorderRef.current = recorder;
                
                // Handle data available events
                recorder.ondataavailable = (e) => {
                  if (e.data && e.data.size > 0) {
                    console.log('Recording chunk received, size:', e.data.size);
                    localInstantResponseChunks.push(e.data); // Add to local array
                    setRecordedChunks(prev => [...prev, e.data]); // Keep state updated for UI if needed
                  }
                };
                
                // Handle recording stop
                recorder.onstop = () => {
                  console.log('Recording stopped after instantResponse, processing video');
                  
                  if (localInstantResponseChunks.length > 0) { // Use local array for check
                    const blob = new Blob(localInstantResponseChunks, { type: mimeType }); // Use local array for blob
                    const videoURL = URL.createObjectURL(blob);
                    
                    // Capture accurate duration from recording timer
                    const duration = recordingTimeElapsed;
                    console.log(`Recording duration: ${duration} seconds`);
                    
                    // Create a new recording entry
                    const newRecording: PersistentRecording = {
                      id: Date.now(),
                      blob: blob,
                      url: videoURL,
                      timestamp: new Date(),
                      duration: duration
                    };
                    
                    // Add to recordings list
                    setRecordings(prev => {
                      const updated = [...prev, newRecording];
                      return updated;
                    });
                    
                    setSelectedRecordingId(newRecording.id);
                    setRecordedVideo(videoURL);
                    
                    // Move to review phase
                    setTimeout(() => {
                      setPhase('review');
                      setRecordedChunks([]); // Clear state chunks after processing
                      
                      if (videoPreviewRef.current) {
                        videoPreviewRef.current.srcObject = null;
                        videoPreviewRef.current.src = videoURL;
                        videoPreviewRef.current.muted = false;
                        
                        videoPreviewRef.current.play().catch(err => {
                          console.error('Error playing recorded video:', err);
                        });
                      }
                    }, 100);
                  }
                  setIsRecording(false);
                };
                
                // Start recording
                recorder.start(1000);
                
                // Start timer
                intervalRef.current = setInterval(() => {
                  setRecordingTimeElapsed(prev => {
                    const newTime = prev + 1;
                    // Auto-stop recording when max duration is reached
                    if (newTime >= maxDuration) {
                      console.log('Max duration reached, stopping recording');
                      
                      // Inline stopping logic instead of calling stopRecording
                      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                        try {
                          mediaRecorderRef.current.stop();
                          console.log('MediaRecorder stopped successfully');
                        } catch (e) {
                          console.error('Error stopping MediaRecorder:', e);
                        }
                      }
                      
                      // Clear interval
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                      }
                      
                      setIsRecording(false);
                      setIsPaused(false);
                    }
                    return newTime;
                  });
                }, 1000);
              } catch (err) {
                console.error('Error creating MediaRecorder in instantResponse:', err);
                setError('Error creating recorder. Your browser may not support this feature.');
                setIsRecording(false);
              }
            } else {
              console.error('No stream available for recording after instantResponse');
              setError('Camera not initialized. Please try again.');
            }
          }
        }, 1000);
      }).catch(err => {
        console.error('Failed to initialize camera for instant response:', err);
        setError('Could not access camera. Please check your permissions.');
      });
    }
    // Otherwise, stay on the video phase with an overlay showing options
  }, [captureVideoThumbnail, initializeCamera, responseSlide.config.instantResponse, maxDuration, getSupportedMimeType, playCount, canRecordMore, recordingTimeElapsed]);

  // Replay video function
  const replayVideo = useCallback(() => {
    if (videoRef.current) {
      // Reset video state
      setVideoEnded(false);
      
      // Set video phase explicitly
      setPhase('video');
      
      // Reset video - make sure we do this only after returning to video phase
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          
          // Enter fullscreen first
          enterFullscreen();
          
          // Play the video with a slight delay to ensure DOM is ready
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(err => {
                console.error('Failed to play video:', err);
              });
            }
          }, 150);
        }
      }, 50);
    }
  }, [enterFullscreen]);

  // Stop recording with improved blob handling
  const stopRecording = useCallback(() => {
    console.log('Stopping recording');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder stopped successfully');
      } catch (e) {
        console.error('Error stopping MediaRecorder:', e);
      }
    }
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // Select a recording - improved to regenerate URL if needed
  const selectRecording = useCallback((id: number) => {
    setSelectedRecordingId(id);
    const recording = recordings.find(r => r.id === id);
    if (recording && videoPreviewRef.current) {
      console.log(`Selecting recording ${id}`);
      
      try {
        // Regenerate the URL if needed
        if (!recording.url.startsWith('blob:') || recording.url.includes('ERR_FILE_NOT_FOUND')) {
          console.log('Regenerating URL for recording', id);
          URL.revokeObjectURL(recording.url);
          const newUrl = URL.createObjectURL(recording.blob);
          
          // Update the recording with the new URL
          setRecordings(prev => 
            prev.map(r => r.id === id ? {...r, url: newUrl} : r)
          );
          
          // Add null check for videoPreviewRef.current
          if (videoPreviewRef.current) {
            videoPreviewRef.current.src = newUrl;
          }
        } else if (videoPreviewRef.current) { // Add null check
          videoPreviewRef.current.src = recording.url;
        }
        
        // Reset video preview state - with null check
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.currentTime = 0;
        }
        
        // Try to play with better error handling
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.play().catch(err => {
              console.error('Error playing selected recording:', err);
              
              // If there's an error, try regenerating the URL
              if (recording.blob && videoPreviewRef.current) { // Add null check
                console.log('Trying to regenerate URL after error');
                URL.revokeObjectURL(recording.url);
                const newUrl = URL.createObjectURL(recording.blob);
                
                // Update recording with new URL
                setRecordings(prev => 
                  prev.map(r => r.id === id ? {...r, url: newUrl} : r)
                );
                
                // Try again with new URL
                videoPreviewRef.current.src = newUrl;
                videoPreviewRef.current.play().catch(e => {
                  console.error('Still failed to play after URL regeneration:', e);
                });
              }
            });
          }
        }, 100);
      } catch (err) {
        console.error('Error selecting recording:', err);
      }
    }
  }, [recordings]);

  // Reset recording to start over - with improved limit checking and blob handling
  const resetRecording = useCallback(() => {
    // Enforce recording limit
    if (!canRecordMore()) {
      console.log('Cannot record more, maximum limit reached');
      return;
    }
    
    // Stop any active recording
    stopRecording();
    
    // Clear out any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset video preview
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.src = '';
    }
    
    // Reset state
    setIsPaused(false);
    setRecordingTimeElapsed(0);
    setRecordedChunks([]);
    
    // Re-initialize camera first
    initializeCamera().then(() => {
      // Then move to recording phase
      setPhase('recording');
      
      // Show the header immediately
      setCountdownHeader("Activating Video Recording!");
      
      // Set up the numeric countdown (3,2,1)
      const countdownDuration = 5000; // 5 seconds total
      const numberStart = 5;
      let timeRemaining = countdownDuration;
      const currentNumber = numberStart;
      
      setCountdown(currentNumber);
      
      const countdownInterval = setInterval(() => {
        timeRemaining -= 1000;
        
        // Update countdown number based on remaining time
        setCountdown(Math.max(Math.ceil(timeRemaining / 1000), 0));
        
        if (timeRemaining <= 0) {
          clearInterval(countdownInterval);
          setCountdownHeader(null);
          
          // Inline recording logic instead of calling beginRecording
          // First check recording limits
          const maxResponses = responseSlide.config.maxResponses || 1;
          if (recordings.length >= maxResponses) {
            console.log(`Maximum number of recordings (${maxResponses}) reached, cannot record more`);
            setError(`Maximum number of recordings (${maxResponses}) reached`);
            return;
          }

          // Make sure we have a stream
          if (!streamRef.current) {
            console.error('No media stream available');
            setError('Camera access is not available. Please check your browser permissions.');
            return;
          }
          
          console.log('Beginning recording...');
          
          // Reset recording state
          setIsRecording(true);
          setRecordingTimeElapsed(0);
          setIsPaused(false);
          setRecordedChunks([]);
          
          // Get the supported MIME type
          const mimeType = getSupportedMimeType();
          console.log('MediaRecorder supports', mimeType);
          
          // Keep a local array of chunks - important for reliability
          const chunks: Blob[] = [];
          
          try {
            // Create and configure media recorder
            const recorder = new MediaRecorder(streamRef.current, {
              mimeType,
              videoBitsPerSecond: 2500000 // 2.5 Mbps
            });
            
            mediaRecorderRef.current = recorder;
            
            // Handle data available events
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                console.log('Recording chunk received, size:', e.data.size);
                // Add to local array
                chunks.push(e.data);
                // Update state (for UI purposes)
                setRecordedChunks(prev => [...prev, e.data]);
              }
            };
            
            // Handle recording stop
            recorder.onstop = () => {
              console.log('Recording stopped, processing video...');
              
              // Use local chunks array instead of state
              console.log('Processing', chunks.length, 'chunks of recorded data');
              
              if (chunks.length > 0) {
                const blob = new Blob(chunks, { type: mimeType });
                const videoURL = URL.createObjectURL(blob);
                console.log('Video URL created:', videoURL.slice(0, 30) + '...');
                
                // Capture accurate duration from recording timer
                const duration = recordingTimeElapsed;
                console.log(`Recording duration: ${duration} seconds`);
                
                // Create a new recording entry with the blob stored
                const newRecording: PersistentRecording = {
                  id: Date.now(),
                  blob: blob,  // Store the actual blob
                  url: videoURL,
                  timestamp: new Date(),
                  duration: duration  // Use the tracked duration value
                };
                
                console.log('Adding new recording to list:', newRecording.id);
                
                // Add to recordings list - ensure we don't exceed maxResponses
                setRecordings(prev => {
                  const maxResponses = responseSlide.config.maxResponses || 1;
                  const updated = [...prev];
                  if (updated.length >= maxResponses) {
                    console.log(`Already at max recordings (${maxResponses}), replacing oldest`);
                    // Remove oldest recording and revoke its URL
                    const oldest = updated.shift();
                    if (oldest) {
                      URL.revokeObjectURL(oldest.url);
                    }
                  }
                  updated.push(newRecording);
                  return updated;
                });
                
                setSelectedRecordingId(newRecording.id);
                setRecordedVideo(videoURL);
                
                // Move to review phase (with a slight delay to ensure state updates)
                console.log('Transitioning to review phase...');
                setTimeout(() => {
                  setPhase('review');
                  console.log('Phase set to review');
                  
                  // Switch video preview to recorded video
                  if (videoPreviewRef.current) {
                    console.log('Setting video preview source to recorded video');
                    videoPreviewRef.current.srcObject = null;
                    videoPreviewRef.current.src = videoURL;
                    videoPreviewRef.current.muted = false;
                    
                    // Try to play the video
                    videoPreviewRef.current.play().catch(err => {
                      console.error('Error playing recorded video:', err);
                    });
                  } else {
                    console.error('Video preview ref is null, cannot display recording');
                  }
                }, 100);
              } else {
                console.error('No recorded chunks available');
                setError('No video data was captured. Please try again.');
              }
            };
            
            // Start recording
            recorder.start(1000); // Collect data in 1-second chunks
            console.log('MediaRecorder started with timeslice 1000ms');
            
            // Start timer
            intervalRef.current = setInterval(() => {
              setRecordingTimeElapsed(prev => {
                const newTime = prev + 1;
                // Auto-stop recording when max duration is reached
                if (newTime >= maxDuration) {
                  console.log('Max duration reached, stopping recording at', newTime, 'seconds');
                  stopRecording();
                }
                return newTime;
              });
            }, 1000);
            
          } catch (err) {
            console.error('Error creating MediaRecorder:', err);
            setError('Error creating recorder. Your browser may not support this feature.');
            setIsRecording(false);
          }
        }
      }, 1000);
    }).catch(err => {
      console.error('Failed to initialize camera for new recording:', err);
      setError('Could not access camera. Please check your permissions.');
    });
  }, [stopRecording, initializeCamera, canRecordMore, responseSlide.config.maxResponses, recordings.length, getSupportedMimeType, maxDuration, recordingTimeElapsed]);

  // Start recording with countdown
  const startRecording = useCallback(() => {
    // Move to recording phase first
    setPhase('recording');
    
    // Initialize camera
    initializeCamera().then(() => {
      console.log('Camera initialized after skip to recording');
      
      // Show the header immediately
      setCountdownHeader("Activating Video Recording!");
      
      // Set up the numeric countdown (3,2,1)
      const countdownDuration = 5000; // 5 seconds total
      const numberStart = 5;
      let timeRemaining = countdownDuration;
      const currentNumber = numberStart;
      
      setCountdown(currentNumber);
      
      const countdownInterval = setInterval(() => {
        timeRemaining -= 1000;
        
        // Update countdown number based on remaining time
        setCountdown(Math.max(Math.ceil(timeRemaining / 1000), 0));
        
        if (timeRemaining <= 0) {
          clearInterval(countdownInterval);
          setCountdownHeader(null);
          
          // After countdown, start recording with the same logic as before
          if (streamRef.current) {
            // Check recording limits first
            const maxResponses = responseSlide.config.maxResponses || 1;
            if (recordings.length >= maxResponses) {
              console.log(`Maximum number of recordings (${maxResponses}) reached, cannot record more`);
              setError(`Maximum number of recordings (${maxResponses}) reached`);
              return;
            }
            
            console.log('Beginning direct recording from startRecording');
            
            // Reset recording state
            setIsRecording(true);
            setRecordingTimeElapsed(0);
            setIsPaused(false);
            setRecordedChunks([]);
            
            // Get the supported MIME type
            const mimeType = getSupportedMimeType();
            
            try {
              // Create and configure media recorder
              const recorder = new MediaRecorder(streamRef.current, {
                mimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
              });
              
              mediaRecorderRef.current = recorder;
              
              // Handle data available events
              recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                  console.log('Recording chunk received, size:', e.data.size);
                  // Add to local array for state
                  setRecordedChunks(prev => [...prev, e.data]);
                }
              };
              
              // Setup recording completion 
              const chunks: Blob[] = [];
              recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                  chunks.push(e.data);
                  setRecordedChunks(prev => [...prev, e.data]);
                }
              };
              
              recorder.onstop = () => {
                console.log('Recording stopped, processing video...');
                
                if (chunks.length > 0) {
                  const blob = new Blob(chunks, { type: mimeType });
                  const videoURL = URL.createObjectURL(blob);
                  
                  // Capture accurate duration from recording timer
                  const duration = recordingTimeElapsed;
                  console.log(`Recording duration: ${duration} seconds`);
                  
                  // Create a new recording entry with the blob stored
                  const newRecording: PersistentRecording = {
                    id: Date.now(),
                    blob: blob,
                    url: videoURL,
                    timestamp: new Date(),
                    duration: duration
                  };
                  
                  // Add to recordings list - ensure we don't exceed maxResponses
                  setRecordings(prev => {
                    const maxResponses = responseSlide.config.maxResponses || 1;
                    const updated = [...prev];
                    if (updated.length >= maxResponses) {
                      console.log(`Already at max recordings (${maxResponses}), replacing oldest`);
                      // Remove oldest recording and revoke its URL
                      const oldest = updated.shift();
                      if (oldest) {
                        URL.revokeObjectURL(oldest.url);
                      }
                    }
                    updated.push(newRecording);
                    return updated;
                  });
                  
                  setSelectedRecordingId(newRecording.id);
                  setRecordedVideo(videoURL);
                  
                  // Move to review phase
                  setTimeout(() => {
                    setPhase('review');
                    
                    // Switch video preview to recorded video
                    if (videoPreviewRef.current) {
                      videoPreviewRef.current.srcObject = null;
                      videoPreviewRef.current.src = videoURL;
                      videoPreviewRef.current.muted = false;
                      
                      videoPreviewRef.current.play().catch(err => {
                        console.error('Error playing recorded video:', err);
                      });
                    }
                  }, 100);
                } else {
                  setError('No video data was captured. Please try again.');
                }
              };
              
              // Start recording
              recorder.start(1000);
              
              // Start timer
              intervalRef.current = setInterval(() => {
                setRecordingTimeElapsed(prev => {
                  const newTime = prev + 1;
                  if (newTime >= maxDuration) {
                    console.log('Max duration reached, stopping recording');
                    stopRecording();
                  }
                  return newTime;
                });
              }, 1000);
              
            } catch (err) {
              console.error('Error creating MediaRecorder:', err);
              setError('Error creating recorder. Your browser may not support this feature.');
              setIsRecording(false);
            }
          } else {
            console.error('No stream available for direct recording');
            setError('Camera not initialized. Please try again.');
          }
        }
      }, 1000);
    }).catch(err => {
      console.error('Failed to initialize camera:', err);
      setError('Could not access camera or microphone. Please check your permissions.');
    });
  }, [initializeCamera, getSupportedMimeType, stopRecording, maxDuration, responseSlide.config.maxResponses, recordings.length, recordingTimeElapsed]);
  
  // Skip to recording directly from video
  const skipToRecording = useCallback(() => {
    // Check if video is playing and pause it
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    
    // Capture thumbnail if we don't have it yet
    if (!videoThumbnail) {
      captureVideoThumbnail();
    }
    
    // Mark video as ended for tracking
    setVideoEnded(true);
    
    // Mark as watched and increment play count to properly track video viewing
    setIsVideoPlayed(true);
    
    // Increment play count - first view sets to 1, subsequent views increment
    if (playCount === 0) {
      setPlayCount(1);
    } else {
      setPlayCount(prev => prev + 1);
    }
    
    // Only start recording if we're allowed to make more recordings
    if (canRecordMore()) {
      console.log('Skipping to recording phase and starting countdown');
      
      // Move to recording phase
      setPhase('recording');
      
      // Initialize camera then start enhanced countdown
      initializeCamera().then(() => {
        console.log('Camera initialized after skip to recording');
        
        // Show the header immediately
        setCountdownHeader("Activating Video Recording!");
        
        // Set up the numeric countdown (3,2,1)
        const countdownDuration = 5000; // 5 seconds total
        const numberStart = 5;
        let timeRemaining = countdownDuration;
        const currentNumber = numberStart;
        
        setCountdown(currentNumber);
        
        const countdownInterval = setInterval(() => {
          timeRemaining -= 1000;
          
          // Update countdown number based on remaining time
          setCountdown(Math.max(Math.ceil(timeRemaining / 1000), 0));
          
          if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            setCountdownHeader(null);
            
            // After countdown, start recording directly
            if (streamRef.current) {
              console.log('Beginning recording after skip to recording countdown');
              
              // Reset recording state
              setIsRecording(true);
              setRecordingTimeElapsed(0);
              setIsPaused(false);
              setRecordedChunks([]);
              
              // Get the supported MIME type
              const mimeType = getSupportedMimeType();
              
              try {
                // Create and configure media recorder
                const recorder = new MediaRecorder(streamRef.current, {
                  mimeType,
                  videoBitsPerSecond: 2500000 // 2.5 Mbps
                });
                
                mediaRecorderRef.current = recorder;
                
                // Setup recording completion
                const chunks: Blob[] = [];
                recorder.ondataavailable = (e) => {
                  if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                    setRecordedChunks(prev => [...prev, e.data]);
                  }
                };
                
                recorder.onstop = () => {
                  console.log('Recording stopped after skip, processing video...');
                  
                  if (chunks.length > 0) {
                    const blob = new Blob(chunks, { type: mimeType });
                    const videoURL = URL.createObjectURL(blob);
                    
                    // Capture accurate duration from recording timer
                    const duration = recordingTimeElapsed;
                    console.log(`Recording duration: ${duration} seconds`);
                    
                    // Create a new recording entry
                    const newRecording: PersistentRecording = {
                      id: Date.now(),
                      blob: blob,
                      url: videoURL,
                      timestamp: new Date(),
                      duration: duration
                    };
                    
                    // Add to recordings list
                    setRecordings(prev => {
                      const updated = [...prev, newRecording];
                      return updated;
                    });
                    
                    setSelectedRecordingId(newRecording.id);
                    setRecordedVideo(videoURL);
                    
                    // Move to review phase
                    setTimeout(() => {
                      setPhase('review');
                      
                      if (videoPreviewRef.current) {
                        videoPreviewRef.current.srcObject = null;
                        videoPreviewRef.current.src = videoURL;
                        videoPreviewRef.current.muted = false;
                        
                        videoPreviewRef.current.play().catch(err => {
                          console.error('Error playing recorded video:', err);
                        });
                      }
                    }, 100);
                  } else {
                    setError('No video data was captured. Please try again.');
                  }
                };
                
                // Start recording
                recorder.start(1000);
                
                // Start timer
                intervalRef.current = setInterval(() => {
                  setRecordingTimeElapsed(prev => {
                    const newTime = prev + 1;
                    if (newTime >= maxDuration) {
                      console.log('Max duration reached, stopping recording');
                      stopRecording();
                    }
                    return newTime;
                  });
                }, 1000);
                
              } catch (err) {
                console.error('Error creating MediaRecorder after skip:', err);
                setError('Error creating recorder. Your browser may not support this feature.');
                setIsRecording(false);
              }
            } else {
              console.error('No stream available for recording after skip');
              setError('Camera not initialized. Please try again.');
            }
          }
        }, 1000);
      }).catch(err => {
        console.error('Failed to initialize camera after skip:', err);
        setError('Could not access camera. Please check your permissions.');
      });
    } else {
      // If we can't record more, go to the video phase with options
      console.log('Cannot record more after skip, staying on video with options');
      setPhase('video');
    }
  }, [videoThumbnail, captureVideoThumbnail, playCount, canRecordMore, initializeCamera, getSupportedMimeType, maxDuration, stopRecording, recordingTimeElapsed]);
  
  // Submit response and go to next slide
  const submitResponse = useCallback(async () => {
    // Exit fullscreen before proceeding
    exitFullscreen();
    
    // Clean up all media resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }

    // Clean up video preview
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.src = '';
    }

    // Clean up audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Clean up all recorded video URLs
    recordings.forEach(recording => {
      if (recording.url) {
        URL.revokeObjectURL(recording.url);
      }
    });
    
    // Clean up video blob
    if (videoBlob) {
      URL.revokeObjectURL(videoBlob);
    }

    // Reset all state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTimeElapsed(0);
    setIsInitialized(false);
    
    // Move to the slide after the response slide (skip both)
    if (goToNextSlide) {
      // Call goToNextSlide twice to skip both current and next slide
      goToNextSlide();
      // Use setTimeout to ensure first navigation completes
      setTimeout(() => {
        goToNextSlide();
      }, 50);
    }
  }, [exitFullscreen, goToNextSlide, recordings, videoBlob]);
  
  // Clean up resources when component unmounts - with improved blob cleanup
  useEffect(() => {
    return () => {
      // Clear intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Clean up all recorded video URLs
      recordings.forEach(recording => {
        if (recording.url) {
          URL.revokeObjectURL(recording.url);
        }
      });
      
      // Clean up video blob
      if (recordedVideo) {
        URL.revokeObjectURL(recordedVideo);
      }
      
      if (videoBlob) {
        URL.revokeObjectURL(videoBlob);
      }
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [recordedVideo, videoBlob, recordings]);
  
  // Effect to ensure controls and UI are visible in fullscreen
  useEffect(() => {
    // When entering review phase, make sure controls are visible
    if (phase === 'review') {
      console.log('Review phase detected, ensuring UI is visible');
      setShowCustomControls(true);
      
      // Ensure video preview is properly configured
      if (videoPreviewRef.current && selectedRecordingId) {
        const recording = recordings.find(r => r.id === selectedRecordingId);
        if (recording) {
          console.log('Setting video preview in review phase to recording ID:', selectedRecordingId);
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = recording.url;
          videoPreviewRef.current.play().catch(err => {
            console.error('Failed to play recorded video in review phase:', err);
          });
        }
      }
    }
    
    // When entering video phase, make sure controls are visible
    if (phase === 'video') {
      setShowCustomControls(true);
    }
  }, [phase, recordings, selectedRecordingId]);

  // Update localStorage when values change
  useEffect(() => {
    try {
      localStorage.setItem(viewCountKey, playCount.toString());
    } catch (error) {
      console.error('Error saving view count to localStorage:', error);
    }
  }, [playCount, viewCountKey]);

  // Update localStorage and store when video watched state changes
  useEffect(() => {
    try {
      localStorage.setItem(watchedKey, isVideoPlayed.toString());
      
      // Also update the global store to ensure navigation works
      setVideoCompleted(videoSlide.id, isVideoPlayed);
      console.log(`Updated video completion status in store: ${videoSlide.id} = ${isVideoPlayed}`);
    } catch (error) {
      console.error('Error saving watched status to localStorage:', error);
    }
  }, [isVideoPlayed, watchedKey, videoSlide.id, setVideoCompleted]);

  // Add state for tracking video current time and duration
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Handle video progress updates with improved store update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const progress = (video.currentTime / video.duration) * 100;
    
    // Update current time for progress bar
    setCurrentTime(video.currentTime);
    
    // Mark as completed when reaching near the end (98%)
    if (progress > 98 && !isVideoPlayed) {
      setIsVideoPlayed(true);
      // Also update the store immediately for good measure
      setVideoCompleted(videoSlide.id, true);
      console.log(`Video marked as watched at ${progress.toFixed(1)}% completion`);
    }
  };

  // Handler for video loaded metadata to get duration
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current?.duration || 0);
      setIsVideoLoading(false);
    }
  };

  // Add state for the countdown header text
  const [countdownHeader, setCountdownHeader] = useState<string | null>(null);

  // Add a new handler for clicks on the video container
  const handleVideoContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    console.log('[DEBUG] Video container clicked', e.target);
    
    if (phase !== 'video') return; // Only act in video phase

    // Check if the click target is a button or inside a button
    const target = e.target as HTMLElement;
    const isButtonClick = target.tagName === 'BUTTON' || target.closest('button');
    
    console.log('[DEBUG] Is button click?', isButtonClick);
    
    // If it's a button click, don't handle it here
    if (isButtonClick) {
      return;
    }

    // Condition for showing the instant response warning
    const shouldShowWarning = responseSlide.config.instantResponse === true && !isVideoPlayed && !videoEnded;

    if (shouldShowWarning) {
      setShowInstantResponseWarning(true);
    } else if (!isPlaying && !videoEnded && !isVideoLoading && videoRef.current) {
      // If warning is not needed, and video is in a playable state, try to play it.
      playVideo();
    }
    // If none of the above, the click does nothing specific here,
    // allowing other controls (like custom controls if visible) to handle clicks.
  }, [phase, responseSlide.config.instantResponse, isVideoPlayed, videoEnded, isPlaying, isVideoLoading, playVideo, setShowInstantResponseWarning]);

  // Render the response list panel
  const renderResponseListPanel = () => {
    console.log('Rendering response list panel, recordings:', recordings.length);
    
    // Always show panel even when empty, but with appropriate message
    return (
      <div className="absolute right-0 top-0 bottom-0 bg-black/80 w-64 z-50 border-l border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-white font-semibold">Recordings</h3>
          <p className="text-xs text-gray-400">
            {recordings.length} of {responseSlide.config.maxResponses || 1} 
            {(responseSlide.config.maxResponses || 1) > 1 ? ' responses' : ' response'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {recordings.length > 0 ? (
            recordings.map((recording, index) => (
              <div 
                key={recording.id}
                className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 flex items-center ${
                  selectedRecordingId === recording.id ? 'bg-gray-800' : ''
                }`}
                onClick={() => selectRecording(recording.id)}
              >
                <div className="mr-3 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  {selectedRecordingId === recording.id ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-white">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="text-sm text-white">Recording {index + 1}</div>
                  <div className="text-xs text-gray-400">
                    {recording.duration ? formatTime(recording.duration) : '0:00'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              No recordings yet
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-gray-700">
          {canRecordMore() && (
            <Button
              className="mb-2 w-full bg-rose-600 hover:bg-rose-700 text-white text-sm cursor-pointer"
              onClick={resetRecording}
            >
              <Camera className="h-3 w-3 mr-1" />
              Record New
            </Button>
          )}
          
          {recordings.length > 0 && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm cursor-pointer"
              onClick={submitResponse}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Submit Selected
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render different UI based on current phase
  const renderPhaseUI = () => {
    console.log('Rendering UI for phase:', phase);
    console.log('Current state:', {
      recordings: recordings.length,
      selectedRecordingId,
      isFullscreen,
      videoEnded,
      isRecording,
      hasRecordedChunks: recordedChunks.length
    });
    
    switch (phase) {
      case 'video':
        return (
          <div 
            ref={videoContainerRef}
            className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative"
            style={{ position: 'relative', touchAction: 'auto' }}
            onMouseMove={handleMouseMove}
            onClick={handleVideoContainerClick}
          >
            {/* Instant Response Warning Modal */}
            <Dialog open={showInstantResponseWarning} onOpenChange={setShowInstantResponseWarning}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-xl">
                    <AlertCircle className="h-6 w-6 text-amber-500 mr-2" />
                    Instant Response Video
                  </DialogTitle>
                </DialogHeader>
                
                <div className="p-4">
                  <DialogDescription className="mb-4 text-base">
                    <p className="font-semibold mb-2 text-amber-600">Important:</p>
                    <p className="mb-3">After this video finishes playing, you will <span className="font-bold">immediately</span> be prompted to record your response.</p>
                    <p>A countdown of <span className="font-bold">3-2-1</span> will begin, and then recording will start automatically.</p>
                  </DialogDescription>
                  
                  <div className="flex gap-4 justify-between border-t pt-4 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowInstantResponseWarning(false)}
                      className="flex-1 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primaryStyling hover:bg-indigo-700 text-white flex-1 cursor-pointer"
                      onClick={proceedAfterWarning}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      I Understand, Play Video
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Loading indicator */}
            {isVideoLoading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3"></div>
                  <div className="text-white text-sm">
                    {isDownloadingVideo ? 'Downloading video...' : 'Loading video...'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Video */}
            <video
              ref={videoRef}
              src={videoBlob || videoSlide.config.videoUrl}
              className="w-full h-full"
              controls={false}
              crossOrigin="anonymous"
              playsInline
              onLoadedData={() => setIsVideoLoading(false)}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              // Remove click to pause functionality
              onError={(e) => {
                console.error('Video error:', e);
                const videoElement = e.target as HTMLVideoElement;
                console.error('Video error code:', videoElement.error?.code);
                console.error('Video error message:', videoElement.error?.message);
                setVideoError(true);
                setIsVideoLoading(false);
              }}
            />
            
            {/* Add video progress bar */}
            {!videoEnded && !videoError && !isVideoLoading && (
              <VideoProgressBar 
                currentTime={currentTime} 
                duration={duration}
                isFullscreen={isFullscreen} 
              />
            )}
            
            {/* Custom video controls */}
            {showCustomControls && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center z-50" style={{ pointerEvents: 'auto' }}>
                <Button
                  variant="outline"
                  className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white hover:text-white border-none cursor-pointer relative"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    console.log('[DEBUG] Skip to Recording button clicked');
                    e.stopPropagation();
                    skipToRecording();
                  }}
                >
                  Skip to Recording
                  <Camera className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Add fullscreen button to top left */}
            {showCustomControls && (
              <div className="absolute top-4 left-4 z-50" style={{ pointerEvents: 'auto' }}>
                <Button
                  size="sm"
                  className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white hover:text-white cursor-pointer relative"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    console.log('[DEBUG] Fullscreen button clicked');
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            
            {/* Play overlay - Updated with instant response indicator if needed */}
            {!isPlaying && !videoEnded && !isVideoLoading && (
              <div 
                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer z-10"
              >
                <div className="rounded-full bg-primaryStyling hover:bg-indigo-700 p-4 transition-colors duration-300 shadow-lg">
                  <Play className="h-10 w-10 text-white" />
                </div>
                <p className="text-white mt-4">Click to Play</p>
                
                {responseSlide.config.instantResponse === true && (
                  <div className="flex items-center gap-2 mt-3 bg-amber-600/90 text-white py-2 px-4 rounded-full text-sm animate-pulse">
                    <AlertCircle className="h-4 w-4" />
                    <span>Instant response required after video</span>
                    <Camera className="h-4 w-4 ml-1" />
                  </div>
                )}
              </div>
            )}
            
            {/* Video ended overlay with options */}
            {videoEnded && !isVideoLoading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white mb-6">Video Complete</h3>
                  
                  <div className="flex flex-col gap-3 items-center">
                    {/* Replay option */}
                    {videoSlide.config.allowReplay && playCount < (videoSlide.config.maxReplays || 1) && (
                      <Button
                        variant="outline"
                        className="border-white w-full cursor-pointer"
                        onClick={replayVideo}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Replay Video
                        {videoSlide.config.maxReplays && (
                          <span className="ml-1 text-xs opacity-80">
                            ({playCount}/{videoSlide.config.maxReplays})
                          </span>
                        )}
                      </Button>
                    )}
                    
                    {/* Conditionally show either Start Recording or Submit buttons */}
                    {canRecordMore() ? (
                      /* Show Start Recording if we can record more */
                      <Button
                        className="bg-rose-600 hover:bg-rose-700 text-white w-full cursor-pointer"
                        onClick={startRecording}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    ) : recordings.length > 0 ? (
                      /* Show Submit Selected if max recordings reached but we have recordings */
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white w-full cursor-pointer"
                        onClick={submitResponse}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Selected
                      </Button>
                    ) : (
                      /* Show disabled button if max recordings reached and no recordings */
                      <Button
                        className="bg-gray-500 text-white w-full"
                        disabled={true}
                      >
                        Maximum Recordings Reached
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {videoError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-20">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <div className="mb-6">
                    <div className="font-medium text-lg mb-2 text-white">Video failed to load</div>
                    <div className="text-sm opacity-80 text-white">
                      This might be due to content security restrictions or a network issue.
                    </div>
                  </div>
                  <div className="flex justify-center gap-3">
                    {!isDownloadingVideo && !videoBlob && videoSlide.config.videoUrl && (
                      <Button
                        variant="outline"
                        className="border-white"
                        onClick={() => fetchVideoAsBlob(videoSlide.config.videoUrl || '')}
                        disabled={isDownloadingVideo}
                      >
                        {isDownloadingVideo ? 'Downloading...' : 'Try Alternative Method'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="border-white"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.load();
                          setVideoError(false);
                          setIsVideoLoading(true);
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'prepare-response':
        // Calculate if we can replay the video
        const allowReplay = videoSlide.config.allowReplay ?? false;
        const maxReplays = videoSlide.config.maxReplays ?? 1;
        const canReplay = allowReplay && (playCount < maxReplays);
        
        return (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Error message display */}
            {error && (
              <div className="absolute top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-md shadow-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Video thumbnail */}
            {videoThumbnail ? (
              <Image 
                src={videoThumbnail} 
                alt="Video thumbnail" 
                className="w-full h-full object-contain" 
                fill
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-white">Loading video frame...</div>
              </div>
            )}
            
            {/* Overlay with start recording button */}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <div className="text-center text-white mb-6">
                <h3 className="text-xl font-bold mb-2">Record Your Response</h3>
                <p className="max-w-md mx-auto text-sm opacity-80 mb-6">
                  Please record your response to what you just watched.
                  {responseSlide.config.responseMaxDuration && (
                    <span className="block mt-2">
                      Maximum recording time: {formatTime(maxDuration)}
                    </span>
                  )}
                </p>
                
                <div className="flex gap-3 justify-center">
                  {canReplay && (
                    <Button
                      variant="outline"
                      className="border-white text-black"
                      onClick={replayVideo}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Replay Video
                      {videoSlide.config.maxReplays && (
                        <span className="ml-1">
                          ({playCount}/{maxReplays})
                        </span>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    size="lg"
                    onClick={startRecording}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'recording':
        return (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Error message display */}
            {error && (
              <div className="absolute top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-md shadow-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {/* Always keep the video thumbnail visible in the background */}
            {videoThumbnail && (
              <div className="absolute inset-0 z-0">
                <Image 
                  src={videoThumbnail} 
                  alt="Video thumbnail" 
                  className="w-full h-full object-contain opacity-50" 
                  fill
                  priority
                />
              </div>
            )}
            
            {/* Recording overlay */}
            <div className="absolute inset-0 flex flex-col z-10">
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 z-20 bg-rose-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                  <span className="text-sm font-medium">
                    {isPaused ? 'Paused' : 'Recording'}: {formatTime(timeRemaining)} left
                  </span>
                </div>
              )}
              
              {/* Video preview (camera) */}
              {isInitialized && streamRef.current && (
                <div className="relative w-full h-full z-10">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror view
                    onLoadedMetadata={() => {
                      if (videoPreviewRef.current && streamRef.current) {
                        videoPreviewRef.current.srcObject = streamRef.current;
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Countdown overlay */}
              {(countdown || countdownHeader) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                  <div className="text-center">
                    {countdownHeader && (
                      <div className="text-4xl font-bold text-white mb-8 animate-pulse">
                        {countdownHeader}
                      </div>
                    )}
                    {countdown !== 0 && typeof countdown !== 'string' && (
                      <div className="text-8xl font-bold text-white animate-pulse">
                        {countdown}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Recording controls */}
              {isRecording && (
                <div className="mt-auto p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-end items-center z-20">
                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={stopRecording}
                      className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'review':
        console.log('Rendering review UI', { 
          recordedVideo: !!recordedVideo,
          recordings: recordings.length,
          selectedRecordingId,
          recordedChunks: recordedChunks.length
        });
        
        // If somehow we get to review phase without recordings, go back to recording
        if (recordings.length === 0) {
          console.error('Review phase with no recordings, resetting to recording phase');
          setTimeout(() => setPhase('recording'), 100);
          return <div className="flex items-center justify-center h-full">Preparing recording interface...</div>;
        }
        
        return (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Error message display */}
            {error && (
              <div className="absolute top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-md shadow-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Video thumbnail in background */}
            {videoThumbnail && (
              <div className="absolute inset-0 z-0">
                <Image 
                  src={videoThumbnail} 
                  alt="Video thumbnail" 
                  className="w-full h-full object-contain opacity-20" 
                  fill
                  priority
                />
              </div>
            )}
            
            {/* Recorded video - adjusted to not overlap with recordings panel */}
            {recordedVideo && (
              <div className="relative w-auto h-full z-10 flex items-center justify-center pr-64">
                <video
                  ref={videoPreviewRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                />
              </div>
            )}
            
            {/* Always show controls in review phase */}
            <div className="absolute bottom-0 left-0 right-64 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center gap-3 z-40">
              {/* Back to video button */}
              <Button
                variant="outline" 
                className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white hover:text-white border-none cursor-pointer"
                // Hide button if max replays reached
                style={{ 
                  display: videoSlide.config.maxReplays && playCount >= videoSlide.config.maxReplays ? 'none' : 'flex' 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Going back to video phase');
                  
                  // Clean up recording state but preserve recordings
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                  }
                  
                  // Reset recording state but don't clear recordings array
                  setIsRecording(false);
                  setIsPaused(false);
                  setRecordingTimeElapsed(0);
                  setError(null);
                  setIsInitialized(false);
                  setVideoError(false); // Reset any video errors
                  
                  // Go back to video phase
                  setPhase('video');
                  
                  // Reset video when available - with better error handling
                  if (videoRef.current) {
                    try {
                      // First reset any errors
                      setVideoError(false);
                      setIsVideoLoading(true);
                      
                      // Force reload the video source
                      const currentSrc = videoRef.current.src;
                      videoRef.current.pause();
                      videoRef.current.src = '';
                      videoRef.current.load();
                      videoRef.current.src = videoBlob || videoSlide.config.videoUrl || currentSrc;
                      videoRef.current.load();
                      videoRef.current.currentTime = 0;
                      
                      // Try to play the video again with a longer delay
                      setTimeout(() => {
                        if (videoRef.current) {
                          videoRef.current.play().catch(err => {
                            console.error('Failed to play video when going back:', err);
                            setVideoError(true);
                          });
                        }
                      }, 300);
                    } catch (err) {
                      console.error('Error resetting video:', err);
                      setVideoError(true);
                    }
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Back to Video
              </Button>
              
              <div className="flex items-center gap-3">
                
                {/* Submit button */}

              </div>
            </div>
            
            {/* Response list panel - always show in review phase */}
            {renderResponseListPanel()}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="border-rose-200 w-full flex-1">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            {phase === 'video' ? (
              <>
                <Video className="h-6 w-6 text-purple-600" />
                {t('videoSlide')}
              </>
            ) : (
              <>
                <Camera className="h-6 w-6 text-rose-600" />
                {t('videoResponse')}
              </>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        {/* Title */}
        {videoSlide.config.title && (
          <h1 className="text-3xl font-semibold mb-6">
            {phase === 'video' ? videoSlide.config.title : `Response to: ${videoSlide.config.title}`}
          </h1>
        )}

        {/* Context field with TextToSpeech */}
        {videoSlide.config.context && phase === 'video' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800 mb-6">
            <p className="text-sm">{videoSlide.config.context}</p>
            <TextToSpeech text={videoSlide.config.context} />
          </div>
        )}
        
        {/* Hidden canvas for capturing video frames */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }} 
        />
        
        {/* Main content area - changes based on phase */}
        {renderPhaseUI()}
      </CardContent>
    </Card>
  );
} 