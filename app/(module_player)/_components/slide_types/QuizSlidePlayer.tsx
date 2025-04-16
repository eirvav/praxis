'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { QuizSlide } from './types';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';

interface QuizSlidePlayerProps {
  slide: QuizSlide;
}

export default function QuizSlidePlayer({ slide }: QuizSlidePlayerProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const supabase = useSupabase();
  
  // Handle quiz answer selection
  const selectQuizAnswer = (optionIndex: number) => {
    if (!isAnswerChecked) {
      setSelectedAnswer(optionIndex);
    }
  };

  // Check quiz answer and save progress
  const checkQuizAnswer = async () => {
    if (selectedAnswer === null) return;
    
    const isAnswerCorrect = selectedAnswer === slide.config.correctOptionIndex;
    setIsCorrect(isAnswerCorrect);
    setIsAnswerChecked(true);
    
    // Save progress to database
    if (supabase) {
      try {
        const { error } = await supabase
          .from('slide_progress')
          .upsert({
            slide_id: slide.id,
            completed: true,
            is_correct: isAnswerCorrect,
            selected_answer: selectedAnswer,
            last_attempt_at: new Date().toISOString()
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error saving quiz progress:', err);
      }
    }
    
    if (isAnswerCorrect) {
      toast.success('Correct answer!');
    } else {
      toast.error('Incorrect answer. Try again!');
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Quiz Question</CardTitle>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
            <ListTodo className="h-3 w-3 mr-1" /> Quiz Slide
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <h3 className="text-xl font-medium">{slide.config.question}</h3>
        
        <div className="space-y-3">
          {slide.config.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex">
              <Button
                type="button"
                variant={selectedAnswer === optionIndex ? "default" : "outline"}
                className={`w-full justify-start text-left ${
                  isAnswerChecked && 
                  slide.config.correctOptionIndex === optionIndex
                    ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100 hover:text-green-800'
                    : ''
                }`}
                onClick={() => selectQuizAnswer(optionIndex)}
                disabled={isAnswerChecked}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {String.fromCharCode(65 + optionIndex)}
                  </div>
                  <span>{option}</span>
                </div>
              </Button>
            </div>
          ))}
        </div>
        
        {selectedAnswer !== null && !isAnswerChecked && (
          <div className="flex justify-center pt-2">
            <Button onClick={checkQuizAnswer}>
              Check Answer
            </Button>
          </div>
        )}
        
        {isAnswerChecked && (
          <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {isCorrect
              ? 'Correct! Great job!'
              : `Incorrect. The correct answer is: ${slide.config.options[slide.config.correctOptionIndex]}`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
