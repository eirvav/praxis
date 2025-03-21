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
  ClipboardCheck
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
    href: "",
    label: "Modules",
    icon: Book,
    submenus: [
      {
        href: "/teacher/modules",
        label: "All Modules"
      },
      {
        href: "/teacher/modules/create",
        label: "Create Module"
      },
      {
        href: "/teacher/modules/MIX250",
        label: "MIX250"
      },
      {
        href: "/teacher/modules/PSYK101",
        label: "PSYK101"
      }
    ]
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
  modules: {
    href: "",
    label: "Modules",
    icon: Book,
    submenus: [
      {
        href: "/student/modules",
        label: "All Modules"
      },
      {
        href: "/student/modules/MIX250",
        label: "MIX250"
      },
      {
        href: "/student/modules/PSYK101",
        label: "PSYK101"
      }
    ]
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
          ...teacherMenuConfig.modules,
          active: pathname.startsWith("/teacher/modules"),
          submenus: teacherMenuConfig.modules.submenus?.map(submenu => ({
            ...submenu,
            active: pathname === submenu.href
          }))
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
          ...studentMenuConfig.modules,
          active: pathname.startsWith("/student/modules"),
          submenus: studentMenuConfig.modules.submenus?.map(submenu => ({
            ...submenu,
            active: pathname === submenu.href
          }))
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
          href: "",
          label: "Modules",
          icon: Box,
          submenus: [
            {
              href: "/modules/MIX250",
              label: "MIX250",
              active: pathname === "/modules/MIX250"
            },
            {
              href: "/modules/PSYK101",
              label: "PSYK101",
              active: pathname === "/modules/PSYK101"
            }
          ]
        },
        {
          href: "/resources",
          label: "Resources",
          icon: File,
          active: pathname === "/resources"
        },
        {
          href: "/categories",
          label: "Categories",
          icon: Bookmark,
          active: pathname === "/categories"
        },
        {
          href: "/tags",
          label: "Tags",
          icon: Tag,
          active: pathname === "/tags"
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users,
          active: pathname === "/users"
        },
        {
          href: "/account",
          label: "Account",
          icon: Settings,
          active: pathname === "/account"
        }
      ]
    }
  ];
}
