app/
│── layout.tsx              # Main layout for LMS
│── page.tsx                # Landing page
│
├── dashboard/              # Common dashboard for all users
│   ├── layout.tsx          # Dashboard layout
│   ├── page.tsx            # Dashboard homepage
│   ├── teacher/            # Teacher-specific pages
│   │   ├── page.tsx        # Teacher dashboard
│   │   ├── modules/        # Teacher’s module management
│   │   │   ├── page.tsx    # List all modules created by the teacher
│   │   │   ├── create/page.tsx  # Page for creating a new module
│   │   │   ├── [moduleId]/ # Dynamic route for each unique module
│   │   │   │   ├── page.tsx # Edit/View module
│   │   │   │   ├── edit/page.tsx # Edit module page
│
│   ├── student/            # Student-specific pages
│   │   ├── page.tsx        # Student dashboard
│   │   ├── modules/        # Student's module list
│   │   │   ├── page.tsx    # Shows modules available to students
│   │   │   ├── [moduleId]/ # Dynamic route for each unique module
│   │   │   │   ├── page.tsx # View the module content
