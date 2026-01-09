# Admin route group changes

## 2026-01-09
- Moved `_components` folder from `(dashboard)` route group to `(admin)` route group. This folder now contains shared dashboard components:
  - `dashboard-shell.tsx` - Shared dashboard layout with header and navigation
  - `role-badge.tsx` - Component for displaying user role badges
  - `role-gate.tsx` - Component for role-based access control with Suspense support
- Updated all import paths across the application to reference the new `_components` location.

## 2026-01-08
- Added `layout.tsx` to guard `/admin` with role-aware checks and wrap content in the shared dashboard shell.
- Created `page.tsx`, `columns.tsx`, and supporting server actions to surface a Shadcn data table that lists Supabase users and lets admins upgrade roles in-app.
- Extended the admin table to show first/last names pulled from Supabase so staff can identify people without relying on email only.

