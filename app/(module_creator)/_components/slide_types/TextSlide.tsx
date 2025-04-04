import { Badge } from '@/components/ui/badge';
import { AlignLeft, Info } from 'lucide-react';
import { TextSlideConfig } from '../SlideEditor';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSupabase } from '../../../(dashboard)/_components/SupabaseProvider';
import { toast } from 'sonner';
import 'react-quill-new/dist/quill.snow.css';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define type for ReactQuill props
interface ReactQuillProps {
  theme?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: Record<string, unknown>;
}

// Dynamically import ReactQuill with loading state and SSR disabled
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    return function comp(props: ReactQuillProps) {
      return <RQ {...props} />;
    };
  },
  { ssr: false, loading: () => <p className="py-4 h-[300px] border rounded-md flex items-center justify-center bg-white text-gray-500">Loading text editor...</p> }
);

interface TextSlideProps {
  config: TextSlideConfig;
  onConfigChange: (configUpdate: Partial<TextSlideConfig>) => void;
}

// Define Quill editor interface
interface QuillEditor {
  getSelection: (focus: boolean) => { index: number; length: number };
  insertEmbed: (index: number, type: string, value: string) => void;
  setSelection: (index: number, length?: number) => void;
}

// Define QL-Editor element interface
interface QuillEditorElement extends HTMLElement {
  __quill?: QuillEditor;
}

export const TextSlideContent = ({ config, onConfigChange }: TextSlideProps) => {
  const supabase = useSupabase();
  const [editorValue, setEditorValue] = useState(config.content || '');
  
  // Make sure to sync our local state with props when they change
  useEffect(() => {
    setEditorValue(config.content || '');
  }, [config.content]);

  // Upload image handler
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      
      try {
        // Show loading toast
        toast.loading('Uploading image...');
        
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `slide_images/${fileName}`;
        
        // Upload to Supabase storage
        const { error } = await supabase.storage
          .from('module_content')
          .upload(filePath, file);
          
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('module_content')
          .getPublicUrl(filePath);
          
        if (!urlData?.publicUrl) throw new Error('Failed to get public URL');
        
        // Get the Quill editor instance
        const quillEditorElement = document.querySelector('.ql-editor') as QuillEditorElement;
        const quill = quillEditorElement?.__quill;
        if (!quill) throw new Error('Quill editor not found');
        
        // Insert image into editor
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', urlData.publicUrl);
        
        // Move cursor after image
        quill.setSelection(range.index + 1);
        
        toast.dismiss();
        toast.success('Image uploaded successfully');
      } catch (error: unknown) {
        console.error('Error uploading image:', error);
        toast.dismiss();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Upload failed: ${errorMessage}`);
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
    <div className="bg-white rounded-md flex flex-col w-full space-y-4">
      {/* Quill Editor */}
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
        <ReactQuill
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          placeholder="Enter rich text content for this slide..."
          modules={modules}
        />
      </div>
      
      {/* Informational alert for teachers */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          This text will be presented to students. They will be able to view and interact with this content during the module.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export const TextSlideTypeBadge = () => {
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
      <AlignLeft className="h-3 w-3 mr-1" /> Rich Text
    </Badge>
  );
};

export const createDefaultTextSlideConfig = (): TextSlideConfig => {
  return { type: 'text', content: '' };
};

export default TextSlideContent;
