'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SliderSlide } from './types';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ReflectionSlidePlayerProps {
  slide: SliderSlide;
}

export default function ReflectionSlidePlayer({ slide }: ReflectionSlidePlayerProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, number>>({});
  const supabase = useSupabase();
  const t = useTranslations('slides.common');

  // Load saved responses
  useEffect(() => {
    async function loadResponses() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('slide_responses')
          .select('responses')
          .eq('slide_id', slide.id)
          .single();

        if (error) throw error;
        if (data?.responses) {
          setSelectedValues(data.responses);
        }
      } catch (err) {
        console.error('Error loading responses:', err);
      }
    }

    loadResponses();
  }, [supabase, slide.id]);

  // Save response to database
  const saveResponse = async (sliderId: string, value: number) => {
    if (!supabase) return;

    const newValues = { ...selectedValues, [sliderId]: value };
    setSelectedValues(newValues);

    try {
      const { error } = await supabase
        .from('slide_responses')
        .upsert({
          slide_id: slide.id,
          responses: newValues,
          last_updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving response:', err);
    }
  };

  return (
    <Card className="border-indigo-200 w-full flex-1">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <MoveHorizontal className="h-6 w-6 text-indigo-600" />
            {t('scaleRating')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        <div className="space-y-8">
          {slide.config.sliders.map((slider) => {
            const boxCount = slider.max - slider.min + 1;
            return (
              <div key={slider.id} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{slider.question}</h3>
                  {slide.config.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {slide.config.description}
                    </p>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <div className="flex justify-between absolute -top-6 w-full text-sm text-muted-foreground">
                      <span>{slider.minLabel}</span>
                      <span>{slider.midLabel}</span>
                      <span>{slider.maxLabel}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      {Array.from({ length: boxCount }, (_, i) => {
                        const value = slider.min + i;
                        const isSelected = selectedValues[slider.id] === value;
                        return (
                          <button
                            key={i}
                            onClick={() => saveResponse(slider.id, value)}
                            className={cn(
                              "flex-1 flex items-center justify-center h-12 rounded-md border text-sm font-medium transition-all",
                              isSelected
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                : "bg-white hover:bg-indigo-50 hover:border-indigo-200 text-gray-700 hover:text-indigo-700"
                            )}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
