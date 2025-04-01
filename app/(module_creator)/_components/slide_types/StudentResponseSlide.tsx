import { Badge } from '@/components/ui/badge';
import { MessageSquare, Video, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StudentResponseSlideProps {
  config: {
    severalResponses: boolean;
    instantResponse: boolean;
  };
  onConfigChange: (configUpdate: any) => void;
}

export const StudentResponseSlideContent = ({ config }: StudentResponseSlideProps) => {
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
                ? "Students can retry recording their response" 
                : "Students can record only once!"}
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

export const createDefaultStudentResponseConfig = () => {
  return {
    severalResponses: false,
    instantResponse: false
  };
};

export default StudentResponseSlideContent; 