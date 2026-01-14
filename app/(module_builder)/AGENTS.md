# Module Builder Guide

## Scope
- Full-screen teacher-only flow at `app/(module_builder)/teacher/create/[moduleId]`
- Three steps: Overview (step-1), Slides (step-2), Review & Publish (step-3)
- Drafts persist locally; explicit save/publish writes to Supabase

## Key Components
- `layout.tsx`: role gate (teacher), loads existing module/slides, wraps Builder
  Provider + Header shell
- `_components/builder-context.tsx`: localStorage-backed state, slide CRUD,
  ordering, selection, lastSyncedAt timestamp
- `_components/builder-shell.tsx`: wiring for header, navigation, publish
  action, toasts (sonner Toaster bottom-right)
- `_components/builder-header.tsx`: exit/title, centered step label, progress
  bar, step-aware actions
- `step-1/page.tsx`: overview form (title, course, deadline, description),
  validates with zod, auto-saves before advancing to step 2, shows toast on
  success/error
- `step-2/page.tsx`: slide list + editor + settings for context slides
- `step-3/page.tsx`: review summary, preview, publish CTA (sets publish_at and
  redirects to `/teacher`)
- `types.ts`: ModuleDraft, SlideDraft definitions
- `actions.ts`: server actions for saving module, saving slides, publishing

## Data Flow & Persistence
- Local draft: stored in `localStorage` keyed by `moduleId` inside
  `builder-context`; resequenced positions on every change
- Save overview (step 1): validates with zod, calls `saveModuleAction`, toast
  success/error, then navigates to step 2
- Save slides (step 2): `saveSlidesAction` replaces slides for module; debounced
  manually via button
- Publish (step 3 + header): `publishModuleAction` upserts module with
  `publish_at` and replaces slides; on success toast + redirect to `/teacher`
- Toaster: `components/ui/sonner.tsx`, mounted in `builder-shell`, position
  bottom-right

## Supabase Schema (public)
- `modules`: id uuid pk, course_id uuid?, teacher_id uuid (fk users), title
  text, description text?, deadline_at timestamptz?, publish_at timestamptz?,
  created_at, updated_at
- `slides`: id uuid pk, module_id uuid fk modules on delete cascade, position
  int>0, type text, title text?, content jsonb, settings jsonb, created_at,
  updated_at, unique(module_id, position)

## RLS
- `modules`: admin all via `is_admin()`, teacher manage own (teacher_id=auth.uid),
  select published (publish_at is not null)
- `slides`: admin all; teacher manage when parent module.teacher_id=auth.uid;
  select when parent publish_at not null

## Header Behavior
- Left: exit to `/teacher`, title shows module title once set (else "Create
  Module")
- Center: fixed step label; only "Step N:" is bold
- Right: step-aware buttons (Next/Back/Publish); progress bar animates width per
  step

## Slides
- Supported types: `context`, `video`, `writtenResponse`, `likertScale`,
  `videoResponse`, and `knowledgeTest`.
- Likert Scale lives under `step-2/_components/slide-types/likert-scale-slide/`
  and includes multi-slider editing plus per-slider range settings.
- Video Upload and Text Response slides live in their own folders with
  settings UIs under `step-2/_components/slide-types/`.
- Video Response slide lives in its own folder with settings and summary UI.
- Knowledge Test slide lives in its own folder with options editor and
  settings UI.

## Step 3 Review & Publish
- Slide review shows one selected slide at a time using Step 3 components.
- Stub files exist for additional types under `_components/slide-types/`
  (quiz, video response, etc.)—extend SlideDraft/type checks + renderers
  when implementing new types.

## Entry / Quick Create
- Sidebar "Quick Create" generates UUID and routes to step-1 for a new module.

## Gotchas / Notes
- Ensure `moduleId` is a valid UUID; 22P02 indicates bad id
- Save/publish actions return structured `{ok, message?}`; UI toasts errors
- When adding slide types, update validation in `actions.ts` and state shape in
  `types.ts` + builder UI
- To surface status, prefer toasts (no inline header status)

## Testing
- Run `npm run lint`
- Manual: create module via sidebar, fill step 1, advance to step 2 (save
  succeeds), add slide(s), save slides, publish, expect redirect to `/teacher`
  and module visible on teacher/student dashboards when published

