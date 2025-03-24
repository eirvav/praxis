.
├── _components
│   ├── CourseCard.tsx
│   ├── CourseNavigation.tsx
│   ├── CreateCourseModal.tsx
│   ├── ModuleCard.tsx
│   ├── RecentCourses.tsx
│   ├── RecentModules.tsx
│   ├── SlideViewer.tsx
│   └── SupabaseProvider.tsx
├── layout.tsx
├── student
│   ├── courses
│   │   ├── [courseId]
│   │   │   ├── modules
│   │   │   │   └── [moduleId]
│   │   │   │       └── page.tsx
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
└── teacher
    ├── courses
    │   ├── [courseId]
    │   │   ├── modules
    │   │   │   └── [moduleId]
    │   │   │       └── page.tsx
    │   │   └── page.tsx
    │   └── page.tsx
    ├── layout.tsx
    └── page.tsx