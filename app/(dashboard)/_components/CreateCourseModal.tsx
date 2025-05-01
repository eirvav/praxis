'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabase } from './SupabaseProvider';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const t = useTranslations();

  // Handle modal close without refresh
  const handleClose = () => {
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a course title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (!supabase || !user) {
        throw new Error('Authentication required');
      }

      const { data, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: title.trim(),
          description: description.trim(),
          teacher_id: user.id
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      toast.success('Course created successfully');

      // Redirect to the course page instead of module creation
      if (data && data.length > 0) {
        const courseId = data[0].id;

        // Navigate to the new course page
        router.push(`/teacher/courses/${courseId}`);

        // Refresh the page after a short delay to update the sidebar
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        router.refresh();
        onClose();
      }

      setTitle('');
      setDescription('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create course. Please try again.';
      console.error('Error creating course:', err);
      setError(message);
      toast.error('Failed to create course');
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] p-6">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-semibold text-center">
            {t('common.buttons.createCourse')}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg my-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div>
              <Label htmlFor="title" className="text-base">Course Title</Label>
            </div>
            <div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter course title"
                disabled={isSubmitting}
                className="h-11"
              />
            </div>
          </div>


          <DialogFooter className="gap-4 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px] bg-transparent text-red-500 hover:bg-white hover:text-red-600 cursor-pointer shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px] bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 