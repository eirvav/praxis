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
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseNavigation.tsx
│   │   │   ├── CreateCourseModal.tsx
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── RecentCourses.tsx
│   │   │   ├── RecentModules.tsx
│   │   │   ├── SupabaseProvider.tsx
│   │   │   ├── createFirstModule.tsx
│   │   │   └── quick-create-modal.tsx
│   │   ├── layout.tsx
│   │   ├── student
│   │   │   ├── _components
│   │   │   │   └── StudentModuleCard.tsx
│   │   │   ├── courses
│   │   │   │   ├── [courseId]
│   │   │   │   │   ├── modules
│   │   │   │   │   │   └── [moduleId]
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── metadata.ts
│   │   │   └── page.tsx
│   │   └── teacher
│   │       ├── courses
│   │       │   ├── [courseId]
│   │       │   │   ├── modules
│   │       │   │   │   └── [moduleId]
│   │       │   │   │       ├── _components
│   │       │   │   │       │   ├── CircularProgress.tsx
│   │       │   │   │       │   ├── ModuleGrading.tsx
│   │       │   │   │       │   ├── ModuleHeader.tsx
│   │       │   │   │       │   ├── ModuleNavigation.tsx
│   │       │   │   │       │   ├── ModuleStatistics.tsx
│   │       │   │   │       │   └── ModuleStats.tsx
│   │       │   │   │       ├── grading
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── layout.tsx
│   │       │   │   │       ├── page.tsx
│   │       │   │   │       └── statistics
│   │       │   │   │           └── page.tsx
│   │       │   │   └── page.tsx
│   │       │   └── page.tsx
│   │       ├── layout.tsx
│   │       ├── metadata.ts
│   │       └── page.tsx
│   ├── (module_creator)
│   │   ├── _components
│   │   │   ├── SlideEditor.tsx
│   │   │   ├── SlideViewer.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── ThumbnailPopover.tsx
│   │   │   └── slide_types
│   │   │       ├── ContextSlide.tsx
│   │   │       ├── QuizSlide.tsx
│   │   │       ├── ReflectionSlide.tsx
│   │   │       ├── SliderSlide.tsx
│   │   │       ├── StudentResponseSlide.tsx
│   │   │       └── VideoSlide.tsx
│   │   ├── layout.tsx
│   │   └── teacher
│   │       ├── courses
│   │       │   └── [courseId]
│   │       │       └── modules
│   │       │           └── create
│   │       │               └── page.tsx
│   │       └── modules
│   │           └── create
│   │               └── page.tsx
│   ├── (module_player)
│   │   ├── [moduleID]
│   │   │   └── page.tsx
│   │   ├── _components
│   │   │   ├── ModuleHeader.tsx
│   │   │   ├── ModulePlayer.tsx
│   │   │   ├── ModuleProgress.tsx
│   │   │   ├── SlideContent.tsx
│   │   │   ├── index.ts
│   │   │   └── slide_types
│   │   │       ├── ContextSlide.tsx
│   │   │       ├── QuizSlide.tsx
│   │   │       ├── SliderSlide.tsx
│   │   │       ├── StudentResponseSlide.tsx
│   │   │       ├── TextSlide.tsx
│   │   │       ├── VideoSlide.tsx
│   │   │       └── index.ts
│   │   ├── layout.tsx
│   │   └── sql_script.sql
│   ├── api
│   │   └── webhook
│   │       └── clerk
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── language-switcher.tsx
│   ├── menu.tsx
│   ├── mode-toggle.tsx
│   ├── navbar-components
│   │   ├── admin-panel-layout.tsx
│   │   ├── collapse-menu-button.tsx
│   │   ├── content-layout.tsx
│   │   ├── menu.tsx
│   │   ├── navbar.tsx
│   │   ├── sheet-menu.tsx
│   │   ├── sidebar-toggle.tsx
│   │   ├── sidebar.tsx
│   │   └── user-nav.tsx
│   ├── providers
│   │   ├── sidebar-provider.tsx
│   │   └── theme-provider.tsx
│   ├── sidebar-toggle.tsx
│   └── ui
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── chart.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── components.json
├── eslint.config.mjs
├── hooks
│   ├── use-sidebar.ts
│   └── use-store.ts
├── i18n
│   └── request.ts
├── instructions
│   ├── advanced-module-creation-implementation.md
│   ├── app.md
│   ├── current_Supabase_SQL.md
│   ├── originalMiddleware.md
│   └── slides_table.md
├── lib
│   ├── menu-list.ts
│   └── utils.ts
├── messages
│   ├── en.json
│   └── no.json
├── middleware.ts
├── next-env.d.ts
├── next.config.js
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
├── tailwind.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── types
│   └── globals.d.ts
└── utils
    ├── roles.ts
    └── toast.ts

