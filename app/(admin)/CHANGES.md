# Admin route group changes

## 2026-01-08
- Added `layout.tsx` to guard `/admin` with role-aware checks and wrap content in the shared dashboard shell.
- Created `page.tsx`, `columns.tsx`, and supporting server actions to surface a Shadcn data table that lists Supabase users and lets admins upgrade roles in-app.
- Extended the admin table to show first/last names pulled from Supabase so staff can identify people without relying on email only.

