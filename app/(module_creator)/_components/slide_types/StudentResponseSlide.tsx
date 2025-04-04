import { Badge } from '@/components/ui/badge';
import { MessageSquare, Video, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StudentResponseSlideConfig } from '../SlideEditor';

interface StudentResponseSlideProps {
  config: StudentResponseSlideConfig;
  onConfigChange: (configUpdate: Partial<StudentResponseSlideConfig>) => void;
}

export const StudentResponseSlideContent = ({ config }: StudentResponseSlideProps) => {
  // Function to format duration in seconds to a readable format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    } else if (minutes === 1 && remainingSeconds === 0) {
      return `1 minute`;
    } else if (remainingSeconds === 0) {
      return `${minutes} minutes`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This slide will allow students to record and submit video responses. Configure the response settings in the right panel.
        </AlertDescription>
      </Alert>
      
      <div className="rounded-lg border bg-slate-50 p-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
            <Video className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Student Video Response</h3>
            <p className="text-sm text-slate-500">
              {config.severalResponses 
                ? `Students can record up to ${config.maxResponses} response${config.maxResponses > 1 ? 's' : ''}` 
                : "Students can record only once!"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Maximum response length: {formatDuration(config.responseMaxDuration)}
            </p>
            
            {config.instantResponse && (
              <p className="text-sm text-rose-600 mt-1">
                Response required immediately after video
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentResponseSlideTypeBadge = () => {
  return (
    <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200">
      <MessageSquare className="h-3 w-3 mr-1" /> Response
    </Badge>
  );
};

export const createDefaultStudentResponseConfig = (): StudentResponseSlideConfig => {
  return {
    type: 'student_response',
    severalResponses: false,
    instantResponse: false,
    maxResponses: 1,
    responseMaxDuration: 120 // default to 2 minutes (120 seconds)
  };
};

export default StudentResponseSlideContent; 