## Module builder create

- Added publish validation utilities and video upload helpers for private storage.
- Added videoPath support in slide content for persisted uploads.
- Added publish-time upload workflow for teacher video slides.
- Added README documenting publish validation and video upload flow.
- Added client-side timing logs around publish-time video uploads.
- Fixed TypeScript build error in `normalizeSlides` function where nullable properties from zod schema were incompatible with `SlideDraft['content']` type. Updated `normalizeContent` to convert `null` values to `undefined` and ensured proper type conversion in `normalizeSlides`.

