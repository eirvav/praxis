'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ArrowRight, Video, Mic, RefreshCw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PermissionRequestSlideProps {
  onPermissionsGranted: () => void;
}

export default function PermissionRequestSlide({ onPermissionsGranted }: PermissionRequestSlideProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTestingInterface, setShowTestingInterface] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<{
    camera: 'pending' | 'granted' | 'denied';
    microphone: 'pending' | 'granted' | 'denied';
  }>({
    camera: 'pending',
    microphone: 'pending',
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Check if we're in a secure context
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
  const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices;

  // Clean up resources
  const cleanupMediaResources = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Set up audio analysis to visualize microphone levels
  const setupAudioAnalysis = (mediaStream: MediaStream) => {
    try {
      // Create audio context with proper TypeScript typing
      const AudioContextClass = window.AudioContext || ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;
      
      // Create source from stream
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      
      // Create data array for analysis
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      // Start analyzing audio
      const analyzeAudio = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Calculate average volume level with more weight on speech frequencies
        const midRange = dataArrayRef.current.slice(10, 120);
        const average = midRange.reduce((sum, value) => sum + value, 0) / midRange.length;
        
        // Normalize to 0-100 range with better sensitivity
        setAudioLevel(Math.min(100, average * 1.5));
        
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };
      
      analyzeAudio();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      setErrorMessage('Error setting up microphone. Please try refreshing the page.');
    }
  };

  const initializeVideo = async (mediaStream: MediaStream) => {
    if (!videoRef.current) return;
    
    try {
      // Reset video element
      videoRef.current.srcObject = null;
      
      // Get video track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track found');
      }

      // Log track capabilities
      console.log('Video track capabilities:', videoTrack.getCapabilities());
      console.log('Video track settings:', videoTrack.getSettings());
      
      // Create a new MediaStream with only the video track
      const videoStream = new MediaStream([videoTrack]);
      
      // Set up video element
      videoRef.current.srcObject = videoStream;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      
      // Add event listeners for debugging
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        setIsVideoLoading(false);
      };
      
      videoRef.current.onplay = () => {
        console.log('Video playback started');
      };
      
      videoRef.current.onpause = () => {
        console.log('Video playback paused');
      };
      
      videoRef.current.onerror = (e) => {
        console.error('Video error:', e);
        setErrorMessage('Error displaying video feed');
      };

      // Attempt to play
      try {
        await videoRef.current.play();
        console.log('Video playing successfully');
      } catch (playError) {
        console.error('Play error:', playError);
        // Try playing again with user interaction
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Playback error, waiting for user interaction:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error initializing video:', error);
      setErrorMessage('Error initializing video feed. Please try refreshing.');
    }
  };

  // Request permissions and setup video/audio preview
  const requestPermissions = async () => {
    setShowTestingInterface(true);
    cleanupMediaResources();
    setErrorMessage(null);
    setIsVideoLoading(true);

    if (!isSecureContext) {
      setErrorMessage('This feature requires a secure (HTTPS) connection. Please ensure you are accessing the site via HTTPS.');
      return;
    }

    if (!hasMediaDevices) {
      setErrorMessage('Media devices are not supported in your browser. Please try using a modern browser.');
      return;
    }

    try {
      console.log('Requesting media permissions...');
      const constraints: MediaStreamConstraints = {
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
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Permissions granted, setting up stream');
      
      setStream(mediaStream);
      setPermissionStatus({
        camera: 'granted',
        microphone: 'granted'
      });

      // Initialize video separately
      await initializeVideo(mediaStream);
      
      // Set up audio analysis
      setupAudioAnalysis(mediaStream);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      handleMediaError(error);
    }
  };

  const handleMediaError = (error: unknown) => {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          setErrorMessage('Camera and microphone access denied. Please allow permissions in your browser settings and try again.');
          setPermissionStatus({
            camera: 'denied',
            microphone: 'denied'
          });
          break;
        case 'NotFoundError':
          setErrorMessage('Camera or microphone not found. Please check your device connections.');
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          setErrorMessage('Camera or microphone is already in use by another application.');
          break;
        case 'OverconstrainedError':
          // Fall back to lower quality constraints
          console.log('Falling back to lower quality constraints...');
          navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          }).then(fallbackStream => {
            setStream(fallbackStream);
            initializeVideo(fallbackStream);
            setPermissionStatus({
              camera: 'granted',
              microphone: 'granted'
            });
            setupAudioAnalysis(fallbackStream);
          }).catch(fallbackError => {
            console.error('Fallback error:', fallbackError);
            setErrorMessage('Could not access camera with current settings. Please try a different browser or device.');
          });
          break;
        default:
          setErrorMessage(`Error accessing media: ${error.message}`);
      }
    } else {
      setErrorMessage('An unexpected error occurred when trying to access your camera and microphone.');
    }
  };

  // Only set up initial state, don't request permissions automatically
  useEffect(() => {
    return () => {
      cleanupMediaResources();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle microphone test
  const testMicrophone = () => {
    setIsTestingMic(true);
    setTimeout(() => setIsTestingMic(false), 3000);
  };

  // Handle accepting permissions and continuing
  const handleAccept = () => {
    if (permissionStatus.camera === 'granted' && permissionStatus.microphone === 'granted') {
      onPermissionsGranted();
    } else {
      requestPermissions();
    }
  };

  // Handle declining and returning to dashboard
  const handleDecline = () => {
    router.push('/student/');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/5 overflow-y-auto">
      {!showTestingInterface ? (
        // Initial warning screen
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-lg w-full mx-4 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-6">
                <AlertTriangle className="h-20 w-20 text-yellow-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Camera & Microphone Access Required</h2>
              
              <p className="text-gray-600 mb-6">
                This module requires access to your camera and microphone for recording responses. 
                You will be prompted to allow access after clicking continue. Please ensure you:
              </p>
              
              <ul className="text-left text-gray-600 mb-8 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Are in a quiet environment
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Have good lighting on your face
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Have a stable internet connection
                </li>
              </ul>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDecline}
                  className="order-2 sm:order-1"
                >
                  Return to Dashboard
                </Button>
                <Button
                  size="lg"
                  onClick={async () => {
                    try {
                      // Request permissions first
                      await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                      });
                      
                      // If successful, proceed with full initialization
                      await requestPermissions();
                    } catch (error) {
                      console.error('Permission request failed:', error);
                      handleMediaError(error);
                      setShowTestingInterface(true); // Still show interface to allow retry
                    }
                  }}
                  className="group relative overflow-hidden order-1 sm:order-2 bg-primaryStyling hover:bg-indigo-700 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center">
                    Continue & Allow Access
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity"></span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Testing interface (existing UI)
        <div className="min-h-screen py-8 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto w-full mt-14">
            {!isSecureContext && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Error</AlertTitle>
                <AlertDescription>
                  This feature requires a secure (HTTPS) connection. Please ensure you are accessing the site via HTTPS.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Camera preview - modified */}
            <div className="mb-8 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Camera Preview:</h3>
                {permissionStatus.camera !== 'granted' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={requestPermissions} 
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry
                  </Button>
                )}
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4 shadow-md">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white bg-black/50 p-3 rounded">
                      {permissionStatus.camera === 'denied' 
                        ? 'Camera access denied. Please reset permissions and try again.' 
                        : 'Waiting for camera access...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Audio level indicator - improved */}
            <div className="mb-8 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Microphone Test:</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testMicrophone}
                  disabled={!stream}
                  className={isTestingMic ? "bg-green-100" : ""}
                >
                  {isTestingMic ? "Testing..." : "Test Microphone"}
                </Button>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                  <div 
                    className={`h-5 rounded-full transition-all duration-100 ${
                      audioLevel > 70 
                        ? 'bg-red-500' 
                        : audioLevel > 30 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                {isTestingMic ? (
                  <p className="text-sm font-medium text-green-600">Please speak now to test your microphone</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {stream 
                      ? 'Say something or click "Test Microphone" to check your audio' 
                      : 'Waiting for microphone access...'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Permission status */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border ${permissionStatus.camera === 'granted' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Video className={`h-5 w-5 ${permissionStatus.camera === 'granted' ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Camera</span>
                  {permissionStatus.camera === 'granted' && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${permissionStatus.microphone === 'granted' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Mic className={`h-5 w-5 ${permissionStatus.microphone === 'granted' ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium">Microphone</span>
                  {permissionStatus.microphone === 'granted' && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Error messages */}
            {errorMessage && (
              <div className="mb-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              </div>
            )}
            
            {permissionStatus.camera === 'denied' || permissionStatus.microphone === 'denied' ? (
              <div className="mb-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Permission Denied</AlertTitle>
                  <AlertDescription>
                    You must grant camera and microphone permissions to continue.
                    Please reset permissions in your browser settings and try again.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
            
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleDecline} className="px-6">
                Return to Dashboard
              </Button>
              
              <Button 
                onClick={handleAccept}
                disabled={permissionStatus.camera === 'denied' || permissionStatus.microphone === 'denied'}
                className="group relative overflow-hidden bg-primaryStyling hover:bg-indigo-700 px-6 cursor-pointer"
              >
                <span className="relative z-10 flex items-center">
                  {permissionStatus.camera === 'granted' && permissionStatus.microphone === 'granted'
                    ? 'Continue to Module'
                    : 'Grant Permissions'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity"></span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 