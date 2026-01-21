# Module Player Guide

## Scope
- Full-screen student-only flow at `app/(module_player)/student/player/[moduleId]`
- Students access published modules from their dashboard
- Requires camera and microphone permissions before starting
- Displays module slides sequentially with navigation controls

## Key Components
- `layout.tsx`: role gate (student), loads published module/slides from Supabase,
  wraps children in PlayerProvider + PlayerShell
- `_components/player-context.tsx`: React context for player state including
  module data, slides, current slide index, media permissions, and navigation
- `_components/player-shell.tsx`: wrapper component with toaster for notifications
- `_components/media-permission-gate.tsx`: full-screen camera/mic permission
  request with live video preview; blocks access until both are granted
- `page.tsx`: main player page showing permission gate or slide content

## Data Flow
- Module and slides loaded server-side in layout.tsx from Supabase
- Only published modules (publish_at not null) are accessible
- Player state managed via PlayerProvider context
- Media stream stored in context for use in video response slides

## User Journey
1. Student sees published module on dashboard (`/student`)
2. Hovers over module card, "Start" button appears
3. Clicks "Start" → navigates to `/student/player/[moduleId]`
4. MediaPermissionGate prompts for camera + microphone
5. Student enables both permissions, sees live preview
6. Clicks "Continue to Module"
7. Slide player renders with navigation (Back/Next)
8. Progress bar shows current position

## Supabase Queries
- Modules: selects where `publish_at` is not null
- Slides: ordered by `position` ascending

## RLS
- Students can select published modules and their slides
- See `app/(module_builder)/AGENTS.md` for full RLS policy details

## Components Used from Module Builder
- `SlidePreview`: renders slide content (temporary placeholder)
- `SlideDraft` type: shared slide type definition

## Header Behavior
- Left: exit button (X) returns to `/student`
- Center: module title + current slide indicator
- Right: Back/Next navigation buttons

## Future Enhancements
- Student response recording for video response slides
- Text response submission
- Likert scale interaction
- Knowledge test answering
- Progress persistence to Supabase
- Module completion tracking

