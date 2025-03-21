.
├── README.md
├── app
│   ├── (auth)
│   │   ├── admin
│   │   │   ├── _components
│   │   │   │   ├── DeleteUserButton.tsx
│   │   │   │   ├── RefreshButton.tsx
│   │   │   │   ├── SearchUsers.tsx
│   │   │   │   └── UserRoleCell.tsx
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── sign-in
│   │   │   ├── [[...sign-in]]
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   └── sign-up
│   │       ├── [[...sign-up]]
│   │       │   └── page.tsx
│   │       └── layout.tsx
│   ├── (dashboard)
│   │   ├── _components
│   │   │   ├── LayoutWrapper.tsx
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── RecentModules.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarItem.tsx
│   │   │   ├── StudentSidebar.tsx
│   │   │   ├── SupabaseProvider.tsx
│   │   │   └── TeacherSidebar.tsx
│   │   ├── layout.tsx
│   │   ├── student
│   │   │   ├── layout.tsx
│   │   │   ├── modules
│   │   │   │   ├── [moduleId]
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── _components
│   │   │   │   │   └── DashboardContent.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── teacher
│   │       ├── DashboardContent.tsx
│   │       ├── layout.tsx
│   │       ├── modules
│   │       │   ├── [moduleId]
│   │       │   │   ├── edit
│   │       │   │   │   └── page.tsx
│   │       │   │   └── page.tsx
│   │       │   ├── create
│   │       │   │   └── page.tsx
│   │       │   └── page.tsx
│   │       └── page.tsx
│   ├── api
│   │   └── webhook
│   │       └── clerk
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
│       ├── alert-dialog.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       └── textarea.tsx
├── components.json
├── eslint.config.mjs
├── instructions
│   ├── layout-structure.md
│   ├── module-creation-implementation-plan.md
│   ├── module-tree.md
│   ├── routing-implementation.md
│   └── tree.md
├── lib
│   └── utils.ts
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── tsconfig.json
├── types
│   └── globals.d.ts
└── utils
    └── roles.ts