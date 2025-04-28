'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
  enabled?: boolean;
}

export default function TextToSpeech({ text, enabled = true }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    };
  }, []);

  const generateSpeech = async () => {
    if (!text.trim() || isPlaying || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create API request to ElevenLabs
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_turbo_v2_5', // Flash v.2.5 model with Norwegian support
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate speech');
      }
      
      // Get audio blob from response
      const audioBlob = await response.blob();
      
      // Create object URL from blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
        });
      } else {
        // If it exists, clean up previous audio URL
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      // Set the audio source and play
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error generating speech:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) {
      generateSpeech();
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        // If play fails, try regenerating the speech
        generateSpeech();
      });
      setIsPlaying(true);
    }
  };

  if (!enabled || !text.trim()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 my-2">
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlayback}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isPlaying ? 'Stop Text-to-Speech' : 'Listen to Text'}
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-xs text-destructive">Error: {error}</p>
      )}
    </div>
  );
} 