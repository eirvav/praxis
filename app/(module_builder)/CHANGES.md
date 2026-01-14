## Module builder

- Added teacher-only module builder flow under `teacher/create/[moduleId]`
- Implemented three-step UI (overview, slides, review/publish) with shared layout
- Added Supabase `modules` and `slides` tables with RLS for teachers/admins
- Local draft storage plus explicit save/publish actions to persist data
- Updated builder header to stretch full width with exit/title, centered step text, step-aware actions, and animated progress bar
- Extracted builder header into its own component for reuse and clarity
- Updated slide manager (Step 2) to use a Popover for "Add Slide" with categories for Context and Interactive slides
- Added Lucide icons for new slide types (Context, Video, Written Response, Knowledge Test, Video Response, Likert Scale)
- Rebuilt Step 2 slide manager list with numbered rails, icon-only cards, drag-and-drop reordering, and context menus for duplicate/delete actions powered by the builder context helpers
- Implemented Likert Scale slide UI with multi-slider editing, preview, and per-slider range settings
- Added settings UI for video upload and written response slides
- Added video response slide with builder settings UI and center instructions
- Added knowledge test slide UI with options list and settings panel
