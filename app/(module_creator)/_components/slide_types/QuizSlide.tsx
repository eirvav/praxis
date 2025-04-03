import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListTodo, Plus, Trash } from 'lucide-react';
import { QuizSlideConfig } from '../SlideEditor';

interface QuizSlideProps {
  config: QuizSlideConfig;
  onConfigChange: (configUpdate: Partial<QuizSlideConfig>) => void;
}

export const QuizSlideContent = ({ config, onConfigChange }: QuizSlideProps) => {
  // Add a quiz option
  const addQuizOption = () => {
    const updatedOptions = [...config.options, ''];
    
    onConfigChange({
      options: updatedOptions
    });
  };

  // Remove a quiz option
  const removeQuizOption = (optionIndex: number) => {
    const updatedOptions = [...config.options];
    updatedOptions.splice(optionIndex, 1);
    
    // Update correct option index if needed
    let correctOptionIndex = config.correctOptionIndex;
    if (optionIndex === correctOptionIndex) {
      correctOptionIndex = 0;
    } else if (optionIndex < correctOptionIndex) {
      correctOptionIndex--;
    }
    
    onConfigChange({
      options: updatedOptions,
      correctOptionIndex
    });
  };

  // Update a quiz option
  const updateQuizOption = (optionIndex: number, value: string) => {
    const updatedOptions = [...config.options];
    updatedOptions[optionIndex] = value;
    
    onConfigChange({
      options: updatedOptions
    });
  };

  // Set correct quiz option
  const setCorrectQuizOption = (optionIndex: number) => {
    onConfigChange({
      correctOptionIndex: optionIndex
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Question</label>
        <Input
          placeholder="Enter your question"
          value={config.question || ''}
          onChange={(e) => onConfigChange({ question: e.target.value })}
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Options</label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addQuizOption}
            className="h-7 px-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
          </Button>
        </div>
        
        {config.options.map((option: string, optionIndex: number) => (
          <div key={optionIndex} className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-md text-xs font-medium">
              {optionIndex + 1}
            </div>
            <Input
              placeholder={`Option ${optionIndex + 1}`}
              value={option}
              onChange={(e) => updateQuizOption(optionIndex, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant={config.correctOptionIndex === optionIndex ? "default" : "outline"}
              size="sm"
              onClick={() => setCorrectQuizOption(optionIndex)}
              className="h-8 px-2"
            >
              Correct
            </Button>
            {config.options.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeQuizOption(optionIndex)}
                className="h-8 px-2 text-red-500 hover:text-red-600"
              >
                <Trash className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        
        <p className="text-xs text-muted-foreground">
          Mark one option as correct for the quiz
        </p>
      </div>
    </div>
  );
};

export const QuizSlideTypeBadge = () => {
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
      <ListTodo className="h-3 w-3 mr-1" /> Quiz
    </Badge>
  );
};

export const createDefaultQuizSlideConfig = (): QuizSlideConfig => {
  return { type: 'quiz', question: '', options: [''], correctOptionIndex: 0 };
};

export default QuizSlideContent;
