import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { Textarea } from '@/components/ui/textarea';

interface VideoSlideProps {
  config: {
    title?: string;
    videoUrl?: string;
    videoFileName?: string;
    context?: string;
    allowReplay?: boolean;
  };
  onConfigChange: (configUpdate: any) => void;
  slideIndex: number;
}

export const VideoSlideContent = ({ config, onConfigChange, slideIndex }: VideoSlideProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useSupabase();
  const { user } = useUser();

  // Upload video for slide
  const uploadVideo = async (file: File) => {
    if (!file || !supabase || !user) return;
    
    try {
      setIsUploading(true);
      
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
          upsert: false,
          contentType: file.type
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from('module-videos')
        .getPublicUrl(filePath);
        
      console.log(`[VideoSlide] Video uploaded successfully, public URL: ${urlData.publicUrl}`);
      
      // Update slide config with video URL
      onConfigChange({
        videoUrl: urlData.publicUrl,
        videoFileName: file.name
      });
      
      toast.success('Video uploaded successfully');
    } catch (err) {
      console.error('[VideoSlide] Error uploading video:', err);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }
    
    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size should not exceed 100MB');
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
    videoFileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Video Title</label>
        <Input
          placeholder="Enter a title for this video"
          value={config.title || ''}
          onChange={(e) => onConfigChange({ title: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Video Context (Optional)</label>
        <Textarea
          placeholder="Provide context about what the video is about"
          value={config.context || ''}
          onChange={(e) => onConfigChange({ context: e.target.value })}
          className="min-h-[80px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          This context will be shown to students to help them understand what to focus on
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Video</label>
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
              <div className="animate-pulse mb-2">Uploading...</div>
              <p className="text-sm text-gray-500">Please wait while your video is being uploaded</p>
            </div>
          ) : config.videoUrl ? (
            <div className="relative">
              {/* Video Preview */}
              <div className="aspect-video">
                <video 
                  src={config.videoUrl} 
                  className="w-full h-full"
                  controls
                />
              </div>
              
              {/* Replace Video Button Overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  videoFileInputRef.current?.click();
                }}
              >
                <Button 
                  variant="outline" 
                  className="bg-white/90 hover:bg-white"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Replace Video
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10">
              <Upload className="h-10 w-10 text-gray-400 mb-2 mx-auto" />
              <p className="text-sm font-medium mb-1">Click to upload video</p>
              <p className="text-xs text-gray-500">MP4, WebM, or MOV (max. 100MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VideoSlideTypeBadge = () => {
  return (
    <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
      <Video className="h-3 w-3 mr-1" /> Video
    </Badge>
  );
};

export const createDefaultVideoSlideConfig = () => {
  return { 
    title: '', 
    videoUrl: '', 
    videoFileName: '',
    context: '',
    allowReplay: true
  };
};

export default VideoSlideContent;
