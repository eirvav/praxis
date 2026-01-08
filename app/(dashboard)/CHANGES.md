# Dashboard route group changes

## 2026-01-08
- Added `dashboard-shell.tsx` and `role-badge.tsx` for consistent dashboard chrome, nav, and role labeling.
- Implemented guarded layouts plus first-pass content for the `/teacher` and `/student` dashboards driven by Supabase-authenticated role data.
- Introduced `role-gate.tsx` to wrap each dashboard layout in Suspense, keeping Cache Components happy while names and roles load from Supabase.
- Removed Admin navigation link from `dashboard-shell.tsx` NAV_ITEMS array.

