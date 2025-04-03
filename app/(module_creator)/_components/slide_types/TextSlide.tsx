import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlignLeft } from 'lucide-react';
import { TextSlideConfig } from '../SlideEditor';

interface TextSlideProps {
  config: TextSlideConfig;
  onConfigChange: (configUpdate: Partial<TextSlideConfig>) => void;
}

export const TextSlideContent = ({ config, onConfigChange }: TextSlideProps) => {
  return (
    <Textarea
      placeholder="Enter slide content"
      className="min-h-[200px] resize-none bg-white"
      value={config.content || ''}
      onChange={(e) => onConfigChange({ content: e.target.value })}
    />
  );
};

export const TextSlideTypeBadge = () => {
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
      <AlignLeft className="h-3 w-3 mr-1" /> Text
    </Badge>
  );
};

export const createDefaultTextSlideConfig = (): TextSlideConfig => {
  return { type: 'text', content: '' };
};

export default TextSlideContent;
