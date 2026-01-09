# Components changes

## 2026-01-09
- Added `ui/textarea` primitive used by module builder forms.
- Wired `nav-main` Quick Create button to launch the module builder at `/teacher/create/[moduleId]/step-1` with a generated UUID.
- Updated `sign-up-form.tsx` and `update-password-form.tsx` to route users back to `/`, letting the root route handle post-auth redirects now that `/protected` was removed.
- Replaced the invalid `--spacing(...)` utilities in `ui/toggle-group.tsx` and `ui/sidebar.tsx` with `calc(var(--spacing) * n)` expressions so Tailwind can emit valid CSS.
- Added `dashboard-fallback.tsx` plus Suspense fallbacks for the dashboards so client-only components (TanStack table, dnd-kit) no longer trip the `Date.now()` runtime guard.
- Converted all CSS variable-based utility classes (e.g., `w-(--sidebar-width)`) to Tailwind's supported `w-[--sidebar-width]` form across sidebar, header, select, dropdown, tooltip, and nav components to restore proper layout widths/heights.
- Added a subtle drop shadow to `SidebarInset` so the main content surface visually separates from the sidebar at larger breakpoints.

## 2026-01-08
- Added Shadcn table primitives (`ui/table.tsx`, `ui/data-table.tsx`) plus TanStack Table to power the admin dashboard.
- Updated `login-form.tsx` to route users directly to their role-specific dashboards after Supabase authentication.
- Enhanced `sign-up-form.tsx` with first/last name inputs and metadata handling so Supabase profile rows are populated automatically.

