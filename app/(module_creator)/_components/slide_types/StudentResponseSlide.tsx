import { Badge } from '@/components/ui/badge';
import { Info, Camera } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from 'next-intl';

export interface StudentResponseSlideConfig {
  type: 'student_response';
  severalResponses: boolean;
  instantResponse: boolean;
  maxResponses: number;
  responseMaxDuration: number; // in seconds
  isRequired: boolean;
}

interface StudentResponseSlideProps {
  config: StudentResponseSlideConfig;
  onConfigChange: (configUpdate: Partial<StudentResponseSlideConfig>) => void;
}

export const StudentResponseSlideContent = ({ config }: StudentResponseSlideProps) => {
  const t = useTranslations();
  
  // Function to format duration in seconds to a readable format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return t('slides.studentResponse.seconds', { duration: remainingSeconds });
    } else if (minutes === 1 && remainingSeconds === 0) {
      return t('slides.studentResponse.minute');
    } else if (remainingSeconds === 0) {
      return t('slides.studentResponse.minutes', { count: minutes });
    } else {
      return t('slides.studentResponse.minutesSeconds', { minutes, seconds: remainingSeconds });
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-indigo-50 border-indigo-200">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-indigo-700 border-indigo-200">
          {t('slides.studentResponse.info')}
        </AlertDescription>
      </Alert>
      
      <div className="rounded-lg border bg-slate-50 p-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
            <Camera className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{t('slides.studentResponse.title')}</h3>
            <p className="text-sm text-slate-500">
              {config.severalResponses 
                ? t('slides.studentResponse.recordMultiple', { count: config.maxResponses }) 
                : t('slides.studentResponse.recordOnce')}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {t('slides.studentResponse.maxLength', { duration: formatDuration(config.responseMaxDuration) })}
            </p>
            
            {config.instantResponse && (
              <p className="text-sm text-rose-600 mt-1">
                {t('slides.studentResponse.requiredImmediately')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentResponseSlideTypeBadge = () => {
  const t = useTranslations();
  return (
    <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200">
      <Camera className="h-3 w-3 mr-1" /> {t('slides.common.videoResponse')}
    </Badge>
  );
};

// Get default config with translations
export const getDefaultStudentResponseConfig = (): StudentResponseSlideConfig => {
  return {
    type: 'student_response',
    severalResponses: false,
    instantResponse: false,
    maxResponses: 1,
    responseMaxDuration: 120, // default to 2 minutes (120 seconds)
    isRequired: true
  };
};

// Default config creator used in the app
export const createDefaultStudentResponseConfig = (): StudentResponseSlideConfig => {
  return getDefaultStudentResponseConfig();
};

export default StudentResponseSlideContent; 