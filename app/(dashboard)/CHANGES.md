# Dashboard route group changes

## 2026-01-09
- Simplified `/teacher` and `/student` pages to display only a greeting message: "Hello firstName, you are <ROLE>".
- Moved `_components` folder from `(dashboard)` to `(admin)` route group. All shared dashboard components (dashboard-shell, role-badge, role-gate) are now located in `app/(admin)/_components/`.
- Updated all import paths to reference the new `_components` location.

