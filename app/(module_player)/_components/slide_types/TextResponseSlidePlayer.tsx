'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlignLeft } from 'lucide-react';
import { TextSlide } from './types';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import 'react-quill-new/dist/quill.snow.css';
import type ReactQuill from 'react-quill-new';

// Define type for ReactQuill props
interface BaseReactQuillProps {
  theme?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: Record<string, unknown>;
}

// Dynamically import ReactQuill with loading state and SSR disabled
const ReactQuillComponent = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    return function QuillEditor({ forwardedRef, ...props }: BaseReactQuillProps & { forwardedRef?: React.RefObject<ReactQuill> }) {
      return <RQ ref={forwardedRef} {...props} />;
    };
  },
  { 
    ssr: false, 
    loading: () => {
      // We're using a function component here to access the translations
      const TextEditorLoading = () => {
        const t = useTranslations();
        return (
          <p className="py-4 h-[200px] border rounded-md flex items-center justify-center bg-white text-gray-500">
            {t('common.loading.textEditor')}
          </p>
        );
      };
      return <TextEditorLoading />;
    }
  }
);

interface TextSlidePlayerProps {
  slide: TextSlide;
}

export default function TextSlidePlayer({ slide }: TextSlidePlayerProps) {
  const [response, setResponse] = useState('');
  const t = useTranslations('slides.common');
  const f = useTranslations('slides.text');

  // Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ]
    }
  };

  return (
    <Card className="border-blue-200 w-full flex-1">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <AlignLeft className="h-6 w-6 text-blue-600" />
            {t('textSlide')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8 px-8">
        {/* Teacher's content */}
        <div className="w-full mb-8">
          <div 
            className="space-y-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: slide.config.content }}
          />
        </div>

        {/* Divider */}
        <div className="w-full border-t border-blue-200 my-6"></div>

        {/* Student's response area */}
        <div className="w-full">
          <div className="rounded-md p-1">
            <div className="quill-container w-full">
              <style jsx global>{`
                .quill {
                  height: 250px;
                  display: flex;
                  flex-direction: column;
                }
                .ql-container {
                  flex: 1;
                  overflow: auto;
                }
                .ql-editor {
                  min-height: 200px;
                }
                @media (min-width: 640px) {
                  .quill {
                    height: 300px;
                  }
                }
              `}</style>
              <ReactQuillComponent
                theme="snow"
                value={response}
                onChange={setResponse}
                placeholder={f('placeholder')}
                modules={modules}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
