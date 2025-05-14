import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';

export interface VideoSlideConfig {
  type: 'video';
  title: string;
  videoUrl: string;
  videoFileName: string;
  context: string;
  allowReplay: boolean;
  maxReplays: number;
  isRequired: boolean;
}

interface VideoSlideProps {
  config: VideoSlideConfig;
  onConfigChange: (configUpdate: Partial<VideoSlideConfig>) => void;
}

export const VideoSlideContent = ({ config, onConfigChange }: VideoSlideProps) => {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = useSupabase();
  const { user } = useUser();
  
  
  // Add an error handler to the window for tracking unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[VideoSlide] Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Add logging on component mount and when config changes
  useEffect(() => {
    console.log('[VideoSlide] Component mounted with config:', config);
    console.log('[VideoSlide] videoUrl:', config.videoUrl);
    
    // Reset error state when video URL changes
    if (config.videoUrl) {
      setVideoError(false);
    }
    
    return () => {
      console.log('[VideoSlide] Component unmounted');
    };
  }, [config]);

  // Upload video for slide
  const uploadVideo = async (file: File) => {
    if (!file || !supabase || !user) return;
    
    try {
      setIsUploading(true);
      console.log(`[VideoSlide] Starting upload process for file: ${file.name}`);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`[VideoSlide] Uploading video file '${fileName}' to path '${filePath}'`);
      
      // Upload the video to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('module-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from('module-videos')
        .getPublicUrl(filePath);
        
      // Ensure the URL is correctly formatted
      console.log(`[VideoSlide] Video uploaded successfully, public URL: ${urlData.publicUrl}`);
      
      // Test the URL is accessible
      try {
        const testResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log(`[VideoSlide] URL test response status: ${testResponse.status}`);
      } catch (testError) {
        console.warn(`[VideoSlide] URL test failed: ${testError}`);
      }
      
      // Update slide config with video URL
      onConfigChange({
        videoUrl: urlData.publicUrl,
        videoFileName: file.name
      });
      
      // Log the config update
      console.log(`[VideoSlide] Config updated with videoUrl: ${urlData.publicUrl}`);
      
      toast.success(t('slides.video.errors.uploadSuccess'));
    } catch (err) {
      console.error('[VideoSlide] Error uploading video:', err);
      toast.error(t('slides.video.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
      console.log('[VideoSlide] Upload process completed, isUploading set to false');
    }
  };
  
  // Handle file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log(`[VideoSlide] File selected: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error(t('slides.video.errors.videoOnly'));
      return;
    }
    
    // Check file size (max 100MB)
    if (file.size > 200 * 1024 * 1024) {
      toast.error(t('slides.video.errors.fileSize'));
      return;
    }
    
    uploadVideo(file);
    
    // Clear the input value to allow uploading the same file again
    if (e.target) {
      e.target.value = '';
    }
  };
  
  // Trigger file input click
  const handleVideoUploadClick = () => {
    console.log('[VideoSlide] Video upload area clicked');
    videoFileInputRef.current?.click();
  };

  // Log the rendering conditions
  console.log('[VideoSlide] Render conditions:', { 
    isUploading, 
    hasVideoUrl: !!config.videoUrl, 
    videoUrl: config.videoUrl 
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('slides.video.videoTitle')}</label>
        <Input
          placeholder={t('slides.video.titlePlaceholder')}
          value={config.title || ''}
          onChange={(e) => onConfigChange({ title: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('slides.video.context')}</label>
        <Textarea
          placeholder={t('slides.video.contextPlaceholder')}
          value={config.context || ''}
          onChange={(e) => onConfigChange({ context: e.target.value })}
          className="min-h-[80px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {t('slides.video.contextHelp')}
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('slides.video.uploadVideo')}</label>
        <div 
          className="relative border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition cursor-pointer overflow-hidden" 
          onClick={handleVideoUploadClick}
        >
          <input
            type="file"
            ref={videoFileInputRef}
            accept="video/*"
            className="hidden"
            onChange={handleVideoFileChange}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <div className="animate-pulse mb-2">{t('slides.video.uploading')}</div>
              <p className="text-sm text-gray-500">{t('slides.video.uploadWait')}</p>
            </div>
          ) : config.videoUrl ? (
            <div className="relative">
              {/* Video Preview */}
              <div className="max-w-[500px] mx-auto aspect-video relative">
                <video 
                  src={config.videoUrl} 
                  className="w-full h-full"
                  controls
                  ref={videoRef}
                  crossOrigin="anonymous"
                  preload="metadata"
                  playsInline
                  onError={(e) => {
                    console.error('[VideoSlide] Video load error:', e);
                    // Try to provide more details about the error
                    const videoElement = e.target as HTMLVideoElement;
                    console.error('[VideoSlide] Video error code:', videoElement.error?.code);
                    console.error('[VideoSlide] Video error message:', videoElement.error?.message);
                    setVideoError(true);
                  }}
                  onLoadStart={() => console.log('[VideoSlide] Video load started')}
                  onLoadedData={() => {
                    console.log('[VideoSlide] Video data loaded successfully');
                    setVideoError(false);
                  }}
                />
                
                {/* Fallback in case of video error */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-white p-3 rounded-md shadow-md text-center">
                      <p className="text-red-600 font-medium">Unable to load video</p>
                      <p className="text-sm text-gray-600">Try uploading again</p>
                    </div>
                  </div>
                )}
                
                {/* Replace Video Button - positioned in top right corner */}
                <div className="absolute top-2 right-2 z-20">
                  <Button 
                    variant="outline" 
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      videoFileInputRef.current?.click();
                    }}
                    size="sm"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    {t('slides.video.replaceVideo')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10">
              <Upload className="h-10 w-10 text-gray-400 mb-2 mx-auto" />
              <p className="text-sm font-medium mb-1">{t('slides.video.clickToUpload')}</p>
              <p className="text-xs text-gray-500">{t('slides.video.videoFormats')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VideoSlideTypeBadge = () => {
  const t = useTranslations();
  return (
    <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
      <Video className="h-3 w-3 mr-1" /> {t('slides.common.videoSlide')}
    </Badge>
  );
};

// Get default config with translations
export const getDefaultVideoSlideConfig = (): VideoSlideConfig => {
  console.log('[VideoSlide] Creating default config');
  return { 
    type: 'video',
    title: '', 
    videoUrl: '', 
    videoFileName: '',
    context: '',
    allowReplay: false,
    maxReplays: 3,
    isRequired: true
  };
};

// Create default config
export const createDefaultVideoSlideConfig = (): VideoSlideConfig => {
  return getDefaultVideoSlideConfig();
};

export default VideoSlideContent;