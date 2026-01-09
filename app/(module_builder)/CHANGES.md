## Module builder

- Added teacher-only module builder flow under `teacher/create/[moduleId]`
- Implemented three-step UI (overview, slides, review/publish) with shared layout
- Added Supabase `modules` and `slides` tables with RLS for teachers/admins
- Local draft storage plus explicit save/publish actions to persist data

