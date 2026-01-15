## Module Builder Publish + Video Uploads

This flow ensures all six slide types are validated before publish and that
teacher-uploaded videos are stored privately in Supabase Storage.

## Slide Types Covered
- `context`
- `video`
- `writtenResponse`
- `likertScale`
- `videoResponse`
- `knowledgeTest`

## Publish Flow
1. Step 3 and header publish actions validate slide content and settings.
2. Video files are uploaded directly to Supabase Storage when selected in Step 2.
3. Slides are persisted with normalized content/settings, including `videoPath`.
4. Module is published by setting `publish_at` and saving slides.

## Video Uploads
- Bucket: `teacher-video-uploads`
- Prefix: `module-builder-uploads/{moduleId}/{slideId}/...`
- Size limit: 50MB
- MIME types: mp4, webm, quicktime
- Private by default; store `content.videoPath` only (no public URL)
- Signed upload init endpoint: `app/api/module-builder/signed-upload/route.ts`
- Direct-to-storage upload happens on Step 2 selection via signed URL

## Validation Rules (Summary)
- Context: content body required.
- Video: title required; uploaded video required (`videoPath`).
- Written response: prompt required; `maxWords` required when enabled.
- Likert: at least one slider; valid labels and range; valid active slider.
- Video response: valid max duration; max responses required when enabled.
- Knowledge test: question required; >=2 options; at least one correct.

## Key Files
- `actions.ts`: server-side validation + persistence.
- `direct-upload.ts`: client helper for signed uploads on Step 2.
- `publish-validation.ts`: client validation for publish.
- `publish-upload.ts`: publish-time video upload helper.
- `app/api/module-builder/upload-video/route.ts`: authenticated upload route (fallback).
- `app/api/module-builder/signed-upload/route.ts`: signed upload init route.
- `step-2/_components/main-content-middle.tsx`: pending video tracking.

## Supabase RLS
- Storage insert policy uses a `security definer` function to avoid RLS
  recursion and allow teacher/admin uploads under the prefix.

## Tests
- `__tests__/publish-validation.test.ts` covers validation for all slide types.

## Local Commands
- `npm test`
- `npm run lint`

