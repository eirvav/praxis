'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Upload } from 'lucide-react';
import { useSupabase } from '../../(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';

interface ThumbnailItem {
  type: 'color' | 'illustration';
  url: string;
}

interface ThumbnailPopoverProps {
  trigger: React.ReactNode;
  thumbnailUrl: string | null;
  selectedThumbnail: string | null;
  setSelectedThumbnail: (url: string | null) => void;
  setThumbnailUrl: (url: string | null) => void;
  moduleId: string | null;
  predefinedThumbnails: ThumbnailItem[];
  isLoadingPredefinedThumbnails: boolean;
  selectPredefinedThumbnail: (item: ThumbnailItem) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export default function ThumbnailPopover({
  trigger,
  thumbnailUrl,
  selectedThumbnail,
  setSelectedThumbnail,
  setThumbnailUrl,
  moduleId,
  predefinedThumbnails,
  isLoadingPredefinedThumbnails,
  selectPredefinedThumbnail,
  fileInputRef,
  align = 'center',
  sideOffset = 10
}: ThumbnailPopoverProps) {
  const supabase = useSupabase();
  const PopoverClose = PopoverPrimitive.Close;

  return (
    <Popover onOpenChange={(open) => {
      if (open) setSelectedThumbnail(thumbnailUrl);
    }}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0 overflow-hidden" align={align} sideOffset={sideOffset}>
        <div className="flex flex-col">
          <Tabs defaultValue="gallery" className="w-full">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <TabsList className="h-9 bg-transparent p-0 border-none">
                <TabsTrigger 
                  value="gallery" 
                  className="rounded-md px-3 py-1.5 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none data-[state=active]:font-medium"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="rounded-md px-3 py-1.5 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none data-[state=active]:font-medium"
                >
                  Upload
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
              <TabsContent value="gallery" className="py-4 px-4 m-0">
                {isLoadingPredefinedThumbnails ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">Loading gallery...</div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Solid Color</h3>
                      <div className="grid grid-cols-4 gap-3">
                        {predefinedThumbnails
                          .filter(item => item.type === 'color')
                          .slice(0, 8) // Show only first 8 colors (2 rows of 4)
                          .map((color, index) => (
                            <div 
                              key={`color-${index}`}
                              className={`aspect-video relative rounded-md cursor-pointer hover:ring-2 hover:ring-primaryStyling transition-all overflow-hidden shadow-sm border border-gray-100 ${selectedThumbnail === color.url ? 'ring-2 ring-primaryStyling' : ''}`}
                              onClick={() => selectPredefinedThumbnail(color)}
                            >
                              <div className="absolute inset-0" style={{ backgroundColor: color.url }}></div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Images</h3>
                      {predefinedThumbnails.filter(item => item.type === 'illustration').length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
                          <p className="text-sm text-gray-500">No images available</p>
                          <p className="text-xs text-gray-400 mt-2">Upload to 'module-thumbnails/thumbnails'</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {predefinedThumbnails
                            .filter(item => item.type === 'illustration')
                            .map((illustration, index) => (
                              <div 
                                key={`illustration-${index}`}
                                className={`aspect-video relative rounded-md cursor-pointer hover:ring-2 hover:ring-primaryStyling transition-all overflow-hidden shadow-sm border border-gray-100 ${selectedThumbnail === illustration.url ? 'ring-2 ring-primaryStyling' : ''}`}
                                onClick={() => selectPredefinedThumbnail(illustration)}
                              >
                                <Image 
                                  src={illustration.url} 
                                  alt={`Illustration ${index + 1}`} 
                                  fill 
                                  className="object-cover"
                                />
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="upload" className="px-4 py-4 m-0">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium mb-2">Upload image</p>
                  <p className="text-xs text-gray-500 mb-4">PNG, JPG, WEBP (5MB max)</p>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}>
                    Select File
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="flex justify-between items-center p-3 border-t border-gray-100 bg-white">
            <PopoverClose asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setThumbnailUrl(null);
                  setSelectedThumbnail(null);
                  if (moduleId && supabase) {
                    supabase
                      .from('modules')
                      .update({ thumbnail_url: null })
                      .eq('id', moduleId)
                      .then(({ error }) => {
                        if (error) {
                          console.error('Error removing thumbnail:', error);
                          toast.error('Failed to remove thumbnail');
                        } else {
                          toast.success('Thumbnail removed');
                        }
                      });
                  }
                }}
              >
                Remove Thumbnail
              </Button>
            </PopoverClose>
            <div className="space-x-2">
              <PopoverClose asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Reset selection to current thumbnailUrl on cancel
                    setSelectedThumbnail(thumbnailUrl);
                  }}
                >
                  Cancel
                </Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-primaryStyling hover:bg-primaryStyling/90"
                  onClick={() => {
                    if (selectedThumbnail) {
                      setThumbnailUrl(selectedThumbnail);
                      if (moduleId && supabase) {
                        supabase
                          .from('modules')
                          .update({ thumbnail_url: selectedThumbnail })
                          .eq('id', moduleId)
                          .then(({ error }) => {
                            if (error) {
                              console.error('Error updating thumbnail:', error);
                              toast.error('Failed to update thumbnail');
                            } else {
                              toast.success('Thumbnail updated');
                            }
                          });
                      }
                    }
                  }}
                >
                  Save
                </Button>
              </PopoverClose>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 