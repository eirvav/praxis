# Dashboard route group changes

## 2026-01-15
- Added hover "Start" button overlay on student module cards in `/student` page
- Button links to `/student/player/[moduleId]` for launching module player

## 2026-01-09
- Simplified `/teacher` and `/student` pages to display only a greeting message: "Hello firstName, you are <ROLE>".
- Moved `_components` folder from `(dashboard)` to `(admin)` route group. All shared dashboard components (dashboard-shell, role-badge, role-gate) are now located in `app/(admin)/_components/`.
- Updated all import paths to reference the new `_components` location.
- Converted the `/teacher` and `/student` layouts into passthrough wrappers (no `RoleGate`) so the dashboards can manage their own structure without inherited UI.
- Wrapped the teacher and student dashboards in `<Suspense>` with a dedicated fallback so client-side widgets (charts, tables) satisfy Next.js 16's timing safeguards and render without blocking SSR.
- Restored role guards in the `/teacher` and `/student` layouts by calling `requireRole` while keeping the simplified markup, so users can no longer swap dashboards via URL alone.
- Added layout-level `<Suspense>` boundaries with the shared dashboard fallback so role lookups (cookies/headers) happen inside a boundary, silencing the blocking-route warning under Next 16.

## 2026-01-XX
- Moved dashboard component from `app/dashboard` to both `app/(dashboard)/teacher` and `app/(dashboard)/student` folders.
- Each role dashboard now has its own copy of the dashboard page (`page.tsx`) and data file (`data.json`).
- Removed the old `app/dashboard` folder as it's no longer needed.

