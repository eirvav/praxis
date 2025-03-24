.
├── README.md
├── app
│   ├── (auth)
│   │   ├── admin
│   │   │   ├── _components
│   │   │   │   ├── DeleteUserButton.tsx
│   │   │   │   ├── RefreshButton.tsx
│   │   │   │   ├── SearchUsers.tsx
│   │   │   │   └── UserRoleCell.tsx
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── sign-in
│   │   │   ├── [[...sign-in]]
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   └── sign-up
│   │       ├── [[...sign-up]]
│   │       │   └── page.tsx
│   │       └── layout.tsx
│   ├── (dashboard)
│   │   ├── _components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseNavigation.tsx
│   │   │   ├── CreateCourseModal.tsx
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── RecentCourses.tsx
│   │   │   ├── RecentModules.tsx
│   │   │   └── SupabaseProvider.tsx
│   │   ├── layout.tsx
│   │   ├── student
│   │   │   ├── courses
│   │   │   │   ├── [courseId]
│   │   │   │   │   ├── modules
│   │   │   │   │   │   └── [moduleId]
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── teacher
│   │       ├── courses
│   │       │   ├── [courseId]
│   │       │   │   ├── modules
│   │       │   │   │   ├── [moduleId]
│   │       │   │   │   │   └── page.tsx
│   │       │   │   │   └── create
│   │       │   │   │       └── page.tsx
│   │       │   │   └── page.tsx
│   │       │   └── page.tsx
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── api
│   │   └── webhook
│   │       └── clerk
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── admin-panel
│   │   ├── admin-panel-layout.tsx
│   │   ├── collapse-menu-button.tsx
│   │   ├── content-layout.tsx
│   │   ├── footer.tsx
│   │   ├── menu.tsx
│   │   ├── navbar.tsx
│   │   ├── sheet-menu.tsx
│   │   ├── sidebar-toggle.tsx
│   │   ├── sidebar.tsx
│   │   └── user-nav.tsx
│   ├── mode-toggle.tsx
│   ├── providers
│   │   └── theme-provider.tsx
│   └── ui
│       ├── alert-dialog.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── collapsible.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── sheet.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── components.json
├── eslint.config.mjs
├── hooks
│   ├── use-sidebar.ts
│   └── use-store.ts
├── instructions
│   ├── advanced-module-creation-implementation.md
│   ├── current_Supabase_SQL.md
│   ├── dashboard_structure.md
│   └── tree.md
├── lib
│   ├── menu-list.ts
│   └── utils.ts
├── middleware.ts
├── module-slides-schema.sql
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── tsconfig.json
├── types
│   └── globals.d.ts
└── utils
    └── roles.ts