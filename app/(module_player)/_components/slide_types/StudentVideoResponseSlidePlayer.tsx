'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Clock, CheckCircle, RefreshCw, Pause, Play, AlertCircle } from 'lucide-react';
import { StudentResponseSlide } from './types';
import { useTranslations } from 'next-intl';

interface StudentResponseSlidePlayerProps {
  slide: StudentResponseSlide;
}

export default function StudentResponseSlidePlayer({ slide }: StudentResponseSlidePlayerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTimeElapsed, setRecordingTimeElapsed] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedVideoUrlRef = useRef<string | null>(null);
  const t = useTranslations('slides.common');
  
  // Get max duration from config with a default of 120 seconds (2 minutes)
  const maxDuration = slide.config.responseMaxDuration || 120;
  
  // Calculate remaining time
  const timeRemaining = maxDuration - recordingTimeElapsed;
  
  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Find supported MIME type - Not dependent on state, so define outside useCallback
  const getSupportedMimeType = () => {
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
  };

  // Initialize video with a stream
  const initializeVideo = useCallback(async (mediaStream: MediaStream) => {
    if (!videoPreviewRef.current) return;
    
    try {
      setIsVideoLoading(true);
      
      // Reset video element
      videoPreviewRef.current.srcObject = null;
      
      // Apply the stream to the video element
      videoPreviewRef.current.srcObject = mediaStream;
      videoPreviewRef.current.playsInline = true;
      videoPreviewRef.current.muted = true;
      
      // Add event listeners
      videoPreviewRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        setIsVideoLoading(false);
      };
      
      videoPreviewRef.current.onerror = (e) => {
        console.error('Video error:', e);
        setError('Error displaying video feed');
      };
      
      // Attempt to play
      try {
        await videoPreviewRef.current.play();
        console.log('Video playing successfully');
      } catch (playError) {
        console.error('Play error:', playError);
        // Try again with user interaction
        const playPromise = videoPreviewRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Playback error, waiting for user interaction:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error initializing video:', error);
      setError('Error initializing video feed. Please try refreshing.');
    }
  }, []);
  
  // Initialize camera stream - defined outside useEffect to avoid recreating on every render
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
      setIsVideoLoading(true);
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
      
      // Store the stream in both state and ref
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsInitialized(true);
      
      // Initialize video element with the stream
      await initializeVideo(mediaStream);
      
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera or microphone. Please ensure you have granted permission.');
      setIsInitialized(false);
    }
  }, [initializeVideo, isInitialized]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('Stopping recording');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
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
  
  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      console.error('No stream available for recording');
      return;
    }
    
    // Reset recording state
    setRecordedChunks([]);
    setRecordedVideo(null);
    setRecordingTimeElapsed(0);
    setIsRecording(true);
    setIsPaused(false);
    
    // Get appropriate MIME type
    const mimeType = getSupportedMimeType();
    
    try {
      // Create MediaRecorder
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;
      
      // Handle data available event
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks(prev => [...prev, e.data]);
        }
      };
      
      // Handle recording stop
      recorder.onstop = () => {
        console.log('Recording stopped');
        
        // Create blob from all chunks
        const chunks = recordedChunks;
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          const videoURL = URL.createObjectURL(blob);
          setRecordedVideo(videoURL);
          
          // Switch video preview to recorded video
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
            videoPreviewRef.current.src = videoURL;
            videoPreviewRef.current.muted = false;
          }
        }
      };
      
      // Log state
      recorder.onstart = () => console.log('MediaRecorder started');
      recorder.onpause = () => console.log('MediaRecorder paused');
      recorder.onresume = () => console.log('MediaRecorder resumed');
      recorder.onerror = (e) => console.error('MediaRecorder error:', e);
      
      // Start recording
      recorder.start(1000); // Collect data in 1-second chunks
      console.log('MediaRecorder started with timeslice 1000ms');
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTimeElapsed(prev => {
          const newTime = prev + 1;
          // Auto-stop recording when max duration is reached
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
  }, [maxDuration, recordedChunks, stopRecording]);
  
  // Pause/resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      // Resume recording
      mediaRecorderRef.current.resume();
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setRecordingTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      setIsPaused(false);
    } else {
      // Pause recording
      mediaRecorderRef.current.pause();
      
      // Pause timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsPaused(true);
    }
  }, [isPaused, maxDuration, stopRecording]);
  
  // Reset recording to start over
  const resetRecording = useCallback(() => {
    // Stop any active recording
    stopRecording();
    
    // Clear recorded video
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
      setRecordedVideo(null);
    }
    
    setRecordedChunks([]);
    setRecordingTimeElapsed(0);
    
    // Re-show the live camera feed
    if (streamRef.current && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = streamRef.current;
      videoPreviewRef.current.play().catch(e => console.error('Error playing video after reset:', e));
    }
  }, [stopRecording, recordedVideo]);
  
  // Update recordedVideoUrlRef when recordedVideo changes
  useEffect(() => {
    recordedVideoUrlRef.current = recordedVideo;
  }, [recordedVideo]);

  // Initialize camera only once when component mounts
  useEffect(() => {
    console.log('Component mounted, initializing camera');
    initializeCamera();
    
    // Cleanup when component unmounts
    return () => {
      console.log('Component unmounting, cleaning up resources');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Clean up recorded video URL using ref
      if (recordedVideoUrlRef.current) {
        URL.revokeObjectURL(recordedVideoUrlRef.current);
        recordedVideoUrlRef.current = null;
      }
      
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track on unmount:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, [initializeCamera]); // Only depend on initializeCamera which is stable due to useCallback
  
  return (
    <Card className="border-rose-200 w-full flex-1">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Camera className="h-6 w-6 text-rose-600" />
            {t('videoResponse')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        {/* Video recording interface */}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
          {/* Loading spinner */}
          {isVideoLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center text-white p-6">
              <div className="max-w-md text-center">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">Camera Error</h3>
                <p className="text-sm mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={initializeCamera}
                  className="bg-rose-600 text-white hover:bg-rose-700 border-0"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          {/* Video preview */}
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted={isRecording || !recordedVideo} // Only mute during recording or live preview
            className={`w-full h-full object-cover ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              <span className="text-sm font-medium">
                {isPaused ? 'Paused' : 'Recording'}: {formatTime(timeRemaining)} left
              </span>
            </div>
          )}
          
          
          {/* Recording controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-center">
            {/* Timer */}
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">
                {isRecording ? formatTime(recordingTimeElapsed) : formatTime(0)} / {formatTime(maxDuration)}
              </span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {!isRecording && !recordedVideo && (
                <Button
                  onClick={startRecording}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
                  disabled={!stream || isVideoLoading}
                >
                  <Camera className="h-4 w-4" />
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <>
                  <Button
                    onClick={togglePause}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20 hover:text-white"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    onClick={stopRecording}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Stop Recording
                  </Button>
                </>
              )}
              
              {recordedVideo && (
                <>
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                    className="border-white text-white hover:bg-white/20 hover:text-white gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Record Again
                  </Button>
                  
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Submit Response
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Center play button for recorded video */}
          {recordedVideo && !isRecording && videoPreviewRef.current?.paused && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => videoPreviewRef.current?.play()}
            >
              <div className="h-16 w-16 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
