import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useImperativeHandle, forwardRef, Ref } from 'react';
import { useSupabase } from '../../../(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import 'react-quill-new/dist/quill.snow.css';
import { useTranslations } from 'next-intl';
import type ReactQuill from 'react-quill-new';

// Define type for ReactQuill props
interface BaseReactQuillProps {
  theme?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: Record<string, unknown>;
}

// Define the Quill editor interface
interface ReactQuillInstance {
  getEditor: () => {
    blur: () => void;
    getSelection: (focus: boolean) => { index: number; length: number };
    insertEmbed: (index: number, type: string, value: string) => void;
    setSelection: (index: number, length?: number) => void;
  };
}

// Dynamically import ReactQuill with loading state and SSR disabled
const ReactQuillComponent = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    return function QuillEditor({ forwardedRef, ...props }: BaseReactQuillProps & { forwardedRef?: Ref<ReactQuill> }) {
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
          <p className="py-4 h-[300px] border rounded-md flex items-center justify-center bg-white text-gray-500">
            {t('common.loading.textEditor')}
          </p>
        );
      };
      return <TextEditorLoading />;
    }
  }
);

export interface ContextSlideRef {
  blur: () => void;
}

export interface ContextSlideConfig {
  type: 'context';
  content: string;
}

interface ContextSlideProps {
  config: ContextSlideConfig;
  onConfigChange: (configUpdate: Partial<ContextSlideConfig>) => void;
}

export const ContextSlideContent = forwardRef<ContextSlideRef, ContextSlideProps>(({ config, onConfigChange }, ref) => {
  const supabase = useSupabase();
  const t = useTranslations();
  const [editorValue, setEditorValue] = useState(config.content || '');
  const [quillInstance, setQuillInstance] = useState<ReactQuill | null>(null);

  // Expose blur method
  useImperativeHandle(ref, () => ({
    blur: () => {
      if (quillInstance) {
        const editor = (quillInstance as unknown as ReactQuillInstance).getEditor();
        if (editor && typeof editor.blur === 'function') {
          editor.blur();
        }
      }
    }
  }));

  // Upload image handler
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      
      try {
        toast.loading(t('common.editor.imageUpload'));
        
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `slide_images/${fileName}`;
        
        const { error } = await supabase.storage
          .from('module_content')
          .upload(filePath, file);
          
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('module_content')
          .getPublicUrl(filePath);
          
        if (!urlData?.publicUrl) throw new Error('Failed to get public URL');
        
        if (quillInstance) {
          const editor = (quillInstance as unknown as ReactQuillInstance).getEditor();
          if (editor) {
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', urlData.publicUrl);
            editor.setSelection(range.index + 1);
          }
        }
        
        toast.dismiss();
        toast.success(t('common.editor.imageUploadSuccess'));
      } catch (error: unknown) {
        console.error('Error uploading image:', error);
        toast.dismiss();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(t('common.editor.imageUploadError', { message: errorMessage }));
      }
    };
    
    input.click();
  };

  // Basic toolbar configuration with dropdown headers
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    }
  };

  // Handle editor changes with a controlled component approach
  const handleChange = (value: string) => {
    setEditorValue(value);
    onConfigChange({ content: value });
  };

  return (
    <div className="bg-white rounded-md flex flex-col w-full space-y-6">
      
      <div className="quill-container w-full">
        <style jsx global>{`
          .quill {
            height: 300px;
            display: flex;
            flex-direction: column;
          }
          .ql-container {
            flex: 1;
            overflow: auto;
          }
          .ql-editor {
            min-height: 250px;
          }
          @media (min-width: 640px) {
            .quill {
              height: 350px;
            }
          }
          @media (min-width: 768px) {
            .quill {
              height: 400px;
            }
          }
        `}</style>
        <ReactQuillComponent
          forwardedRef={(el: ReactQuill | null) => {
            if (el) {
              setQuillInstance(el);
            }
          }}
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          placeholder="Enter context"
          modules={modules}
        />
      </div>
    </div>
  );
});

ContextSlideContent.displayName = 'ContextSlideContent';

export const ContextSlideTypeBadge = () => {
  const t = useTranslations();
  return (
    <Badge variant="outline" className="bg-teal-50 text-teal-700 hover:bg-teal-50 border-teal-200">
      <MessageSquare className="h-3 w-3 mr-1" /> {t('slides.common.contextSlide')}
    </Badge>
  );
};

// Get default context slide config
export const getDefaultContextSlideConfig = (): ContextSlideConfig => {
  return { 
    type: 'context', 
    content: ''
  };
};

// Create default context slide config
export const createDefaultContextSlideConfig = (): ContextSlideConfig => {
  return getDefaultContextSlideConfig();
};

export default ContextSlideContent; 