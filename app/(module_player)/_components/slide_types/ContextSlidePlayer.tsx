'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { ContextSlide } from './types';
import { useSupabase } from '@/app/(dashboard)/_components/SupabaseProvider';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ContextSlidePlayerProps {
  slide: ContextSlide;
}

export default function ContextSlidePlayer({ slide }: ContextSlidePlayerProps) {
  const [isRead, setIsRead] = useState(false);
  const supabase = useSupabase();
  const t = useTranslations('slides.common');

  // Load read status
  useEffect(() => {
    async function loadReadStatus() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('slide_responses')
          .select('is_read')
          .eq('slide_id', slide.id)
          .single();

        if (error) throw error;
        if (data?.is_read) {
          setIsRead(data.is_read);
        }
      } catch (err) {
        console.error('Error loading read status:', err);
      }
    }

    loadReadStatus();
  }, [supabase, slide.id]);

  // Mark as read when component unmounts or when user leaves
  useEffect(() => {
    const markAsRead = async () => {
      if (!supabase || isRead) return;

      try {
        const { error } = await supabase
          .from('slide_responses')
          .upsert({
            slide_id: slide.id,
            is_read: true,
            last_updated_at: new Date().toISOString()
          });

        if (error) throw error;
        setIsRead(true);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    };

    // Mark as read when component unmounts
    return () => {
      markAsRead();
    };
  }, [supabase, slide.id, isRead]);

  return (
    <Card className="border-teal-200 w-full flex-1">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <MessageSquare className="h-6 w-6 text-teal-600" />
            {t('contextSlide')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        <div className="w-full">
          <h1 className="text-3xl font-semibold mb-6">{slide.config.title}</h1>
          <div 
            className="space-y-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: slide.config.content }} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
