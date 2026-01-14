## Project Guide

## Project Structure
- `app/` - Next.js App Router routes and layouts
- `app/(module_builder)/` - Teacher module builder flow and documentation
- `app/(module_builder)/teacher/create/[moduleId]/` - Step-based module builder
- `app/(module_builder)/teacher/create/[moduleId]/step-2/_components/` - Step 2 editor UI and settings
- `app/(module_builder)/teacher/create/[moduleId]/step-2/_components/slide-types/likert-scale-slide/` - Likert Scale slide implementation
- `app/(module_builder)/teacher/create/[moduleId]/step-2/_components/slide-types/video-upload-slide/` - Video upload slide implementation
- `app/(module_builder)/teacher/create/[moduleId]/step-2/_components/slide-types/text-response-slide/` - Text response slide implementation
- `app/(module_builder)/teacher/create/[moduleId]/step-2/_components/slide-types/video-response-slide/` - Video response slide implementation
- `app/(module_builder)/teacher/create/[moduleId]/step-2/_components/slide-types/quiz-slide/` - Knowledge test slide implementation
- `components/` - Shared UI components (Shadcn)
- `lib/` - Server helpers, auth, and Supabase utilities

