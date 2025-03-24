.
├── (auth)
│   ├── admin
│   │   ├── _components
│   │   │   ├── DeleteUserButton.tsx
│   │   │   ├── RefreshButton.tsx
│   │   │   ├── SearchUsers.tsx
│   │   │   └── UserRoleCell.tsx
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── sign-in
│   │   ├── [[...sign-in]]
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── sign-up
│       ├── [[...sign-up]]
│       │   └── page.tsx
│       └── layout.tsx
├── (dashboard)
│   ├── _components
│   │   ├── CourseCard.tsx
│   │   ├── CourseNavigation.tsx
│   │   ├── CreateCourseModal.tsx
│   │   ├── ModuleCard.tsx
│   │   ├── RecentCourses.tsx
│   │   ├── RecentModules.tsx
│   │   └── SupabaseProvider.tsx
│   ├── layout.tsx
│   ├── student
│   │   ├── courses
│   │   │   ├── [courseId]
│   │   │   │   ├── modules
│   │   │   │   │   └── [moduleId]
│   │   │   │   │       └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── teacher
│       ├── courses
│       │   ├── [courseId]
│       │   │   ├── modules
│       │   │   │   └── [moduleId]
│       │   │   │       └── page.tsx
│       │   │   └── page.tsx
│       │   └── page.tsx
│       ├── layout.tsx
│       └── page.tsx
├── (fullscreen)
│   ├── _components
│   │   ├── SlideEditor.tsx
│   │   ├── SlideViewer.tsx
│   │   └── StepIndicator.tsx
│   ├── layout.tsx
│   └── teacher
│       ├── courses
│       │   └── [courseId]
│       │       └── modules
│       │           └── create
│       │               └── page.tsx
│       └── modules
│           └── create
│               └── page.tsx
├── api
│   └── webhook
│       └── clerk
│           └── route.ts
├── favicon.ico
├── globals.css
├── layout.tsx
└── page.tsx