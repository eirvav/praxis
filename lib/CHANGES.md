# Lib changes

## 2026-01-08
- Introduced `roles.ts` as the canonical source for `UserRole` types and route mappings.
- Added `auth.ts` helpers (`getUserWithRole`, `requireRole`, `redirectToRoleDashboard`) to centralize Supabase access checks used by layouts, server actions, and routing logic.
- `getUserWithRole` now hydrates first/last names from `public.users` so dashboards and admin tools can greet users with their preferred details.

