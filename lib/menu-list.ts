import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Book,
  GraduationCap,
  NotebookPen,
  Box,
  File,
  ClipboardCheck,
  BookOpen,
  BookMarked
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  injectComponent?: boolean;
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

// Define teacher menu configuration for easy addition/removal of items
const teacherMenuConfig = {
  dashboard: {
    href: "/teacher",
    label: "Dashboard",
    icon: LayoutGrid
  },
  modules: {
    href: "/teacher/modules",
    label: "All Modules",
    icon: Book
  },
  resources: {
    href: "/teacher/resources",
    label: "Resources",
    icon: File
  },
  grading: {
    href: "/teacher/grading",
    label: "Grading",
    icon: ClipboardCheck
  },
  settings: {
    href: "/teacher/settings",
    label: "Settings",
    icon: Settings
  }
};

// Define student menu configuration for easy addition/removal of items
const studentMenuConfig = {
  dashboard: {
    href: "/student",
    label: "Dashboard",
    icon: LayoutGrid
  },
  courses: {
    href: "/student/courses",
    label: "Courses",
    icon: BookOpen,
    injectComponent: true
  },
  modules: {
    href: "/student/modules",
    label: "All Modules",
    icon: Book
  },
  resources: {
    href: "/student/resources",
    label: "Resources",
    icon: File
  },
  progress: {
    href: "/student/progress",
    label: "My Progress",
    icon: GraduationCap
  },
  settings: {
    href: "/student/settings",
    label: "Settings",
    icon: Settings
  }
};

export function getMenuList(pathname: string, role?: string): Group[] {
  // Return role-specific menu based on the user role
  if (role === "teacher") {
    return getTeacherMenu(pathname);
  } else if (role === "student") {
    return getStudentMenu(pathname);
  }
  
  // Default menu if no role is specified or role doesn't match
  return getDefaultMenu(pathname);
}

function getTeacherMenu(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          ...teacherMenuConfig.dashboard,
          active: pathname === teacherMenuConfig.dashboard.href
        }
      ]
    },
    {
      groupLabel: "Teaching",
      menus: [
        {
          href: "/teacher/courses",
          label: "Courses",
          icon: BookOpen,
          active: pathname.startsWith("/teacher/courses"),
          injectComponent: true
        },
        {
          ...teacherMenuConfig.modules,
          active: pathname.startsWith("/teacher/modules")
        },
        {
          ...teacherMenuConfig.resources,
          active: pathname === teacherMenuConfig.resources.href
        },
        {
          ...teacherMenuConfig.grading,
          active: pathname === teacherMenuConfig.grading.href
        }
      ]
    },
    {
      groupLabel: "Account",
      menus: [
        {
          ...teacherMenuConfig.settings,
          active: pathname.startsWith(teacherMenuConfig.settings.href)
        }
      ]
    }
  ];
}

function getStudentMenu(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          ...studentMenuConfig.dashboard,
          active: pathname === studentMenuConfig.dashboard.href
        }
      ]
    },
    {
      groupLabel: "Learning",
      menus: [
        {
          href: "/student/courses",
          label: "Courses",
          icon: BookOpen,
          active: pathname.startsWith("/student/courses"),
          injectComponent: true
        },
        {
          ...studentMenuConfig.modules,
          active: pathname.startsWith("/student/modules")
        },
        {
          ...studentMenuConfig.resources,
          active: pathname === studentMenuConfig.resources.href
        },
        {
          ...studentMenuConfig.progress,
          active: pathname === studentMenuConfig.progress.href
        }
      ]
    },
    {
      groupLabel: "Account",
      menus: [
        {
          ...studentMenuConfig.settings,
          active: pathname.startsWith(studentMenuConfig.settings.href)
        }
      ]
    }
  ];
}

function getDefaultMenu(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          active: pathname === "/dashboard"
        }
      ]
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "/courses",
          label: "Courses",
          icon: BookOpen,
          active: pathname.startsWith("/courses")
        },
        {
          href: "/modules",
          label: "All Modules",
          icon: Book,
          active: pathname.startsWith("/modules")
        },
        {
          href: "/resources",
          label: "Resources",
          icon: File,
          active: pathname === "/resources"
        },
        {
          href: "/settings",
          label: "Settings",
          icon: Settings,
          active: pathname === "/settings"
        }
      ]
    }
  ];
}
