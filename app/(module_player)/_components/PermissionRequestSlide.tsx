'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ArrowRight, Video, Mic, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PermissionRequestSlideProps {
  onPermissionsGranted: () => void;
}

export default function PermissionRequestSlide({ onPermissionsGranted }: PermissionRequestSlideProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Clean up resources
  const cleanupMediaResources = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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

  // Request permissions and setup video/audio preview
  const requestPermissions = async () => {
    // Clean up any existing media resources first
    cleanupMediaResources();
    
    setErrorMessage(null);
    
    try {
      console.log('Requesting media permissions...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }, 
        audio: true 
      });
      
      console.log('Permissions granted, setting up stream');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error('Error playing video:', e);
            setErrorMessage('Error playing video. Please try again.');
          });
        };
      }
      
      setPermissionStatus({
        camera: 'granted',
        microphone: 'granted'
      });

      setupAudioAnalysis(mediaStream);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionStatus({
            camera: 'denied',
            microphone: 'denied'
          });
          setErrorMessage('Camera and microphone access denied. Please allow permissions in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          setErrorMessage('Camera or microphone not found. Please check your device connections.');
        } else if (error.name === 'NotReadableError') {
          setErrorMessage('Camera or microphone is already in use by another application.');
        } else {
          setErrorMessage(`Error accessing media: ${error.message}`);
        }
      } else {
        setErrorMessage('An unexpected error occurred when trying to access your camera and microphone.');
      }
    }
  };

  // Request permissions and setup video/audio preview immediately
  useEffect(() => {
    let mounted = true;
    if (mounted) {
      requestPermissions();
    }
    return () => {
      mounted = false;
      cleanupMediaResources();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle microphone test
  const testMicrophone = () => {
    setIsTestingMic(true);
    // Reset after 3 seconds
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
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Camera & Microphone Required</h2>
      
      <Alert className="mb-6 border-blue-300 bg-blue-50">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-700">Important Information</AlertTitle>
        <AlertDescription className="text-blue-700">
          This module requires access to your camera and microphone for recording responses.
          You must grant these permissions to continue. Please ensure you are in a quiet environment with good lighting.
        </AlertDescription>
      </Alert>
      
      {/* Camera preview - made more prominent */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg border">
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
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white bg-black/50 p-3 rounded">
                {permissionStatus.camera === 'denied' 
                  ? 'Camera access denied. Please reset permissions and try again.' 
                  : 'Waiting for camera access...'}
              </p>
            </div>
          )}
        </div>
        
        {stream && (
          <div className="text-sm text-center text-green-600 font-medium">
            <CheckCircle className="h-4 w-4 inline mr-1" /> Camera is working properly
          </div>
        )}
      </div>
      
      {/* Audio level indicator - improved */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg border">
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
          className="bg-primaryStyling hover:bg-indigo-700 px-6"
        >
          {permissionStatus.camera === 'granted' && permissionStatus.microphone === 'granted'
            ? 'Continue to Module'
            : 'Grant Permissions'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 