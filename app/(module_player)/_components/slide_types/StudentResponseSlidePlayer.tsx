'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';
import { StudentResponseSlide } from './types';

interface StudentResponseSlidePlayerProps {
  slide: StudentResponseSlide;
}

export default function StudentResponseSlidePlayer({ slide }: StudentResponseSlidePlayerProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Video Response Required</CardTitle>
          <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200">
            <Camera className="h-3 w-3 mr-1" /> Video Response
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Camera className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-medium text-rose-900">Record Your Response</h3>
              <p className="text-sm text-rose-700">
                {slide.config.severalResponses 
                  ? "You can submit multiple video responses to this prompt."
                  : "Please record a single video response to this prompt."}
              </p>
              {slide.config.instantResponse && (
                <p className="text-sm text-rose-600 mt-1 font-medium">
                  You must respond immediately after the previous video ends.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Video recording interface will be implemented here */}
        <div className="aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
          <div className="text-center p-6">
            <Camera className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-slate-900 font-medium mb-1">Video Response</h3>
            <p className="text-sm text-slate-500">
              The recording interface will appear here when viewing as a student
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
