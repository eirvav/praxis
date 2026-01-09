# Components changes

## 2026-01-09
- Updated `sign-up-form.tsx` and `update-password-form.tsx` to route users back to `/`, letting the root route handle post-auth redirects now that `/protected` was removed.

## 2026-01-08
- Added Shadcn table primitives (`ui/table.tsx`, `ui/data-table.tsx`) plus TanStack Table to power the admin dashboard.
- Updated `login-form.tsx` to route users directly to their role-specific dashboards after Supabase authentication.
- Enhanced `sign-up-form.tsx` with first/last name inputs and metadata handling so Supabase profile rows are populated automatically.

