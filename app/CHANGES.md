# App folder changes

## 2026-01-08
- **Root page redirect**: Updated `app/page.tsx` to redirect to `/auth/login` as the default landing page. The root route now automatically redirects users to the login page when they first visit the site.
- **Role-based dashboards**: Added guarded route groups for `/admin`, `/teacher`, and `/student` along with a shared dashboard shell, teacher & student overview pages, and an admin data table fed by Supabase. `/protected` now simply redirects users to their role-specific dashboard.
- **User names**: Added first/last name capture during sign-up plus Suspense-based role gating so layouts stay compliant with Cache Components. Names are loaded from `public.users` for dashboard greetings and admin lists.
