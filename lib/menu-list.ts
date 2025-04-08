import {
  Settings,
  LayoutGrid,
  LucideIcon,
  File,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  PlusCircle,
} from "lucide-react";

// Types
type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  injectComponent?: boolean;
  isCoursesSection?: boolean;
  submenus?: { href: string; label: string; active?: boolean; }[];
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

type RoleConfig = {
  baseUrl: string;
  groups: MenuGroup[];
};

// Base menu items that can be shared between roles
const sharedMenuItems = {
  dashboard: {
    label: "Dashboard",
    icon: LayoutGrid,
  },
  courses: {
    label: "Courses",
    icon: BookOpen,
    injectComponent: true,
  },
  resources: {
    label: "Resources",
    icon: File,
  },
  settings: {
    label: "Settings",
    icon: Settings,
  },
} as const;

// Role-specific menu configurations
const menuConfigs: Record<string, RoleConfig> = {
  teacher: {
    baseUrl: "/teacher",
    groups: [
      {
        label: "",
        items: [
          {
            label: "Quick Create",
            href: "/teacher/modules/create",
            icon: PlusCircle,
          },
        ],
      },
      {
        label: "Content",
        items: [
          {
            ...sharedMenuItems.dashboard,
            href: "/teacher",
          },
          {
            ...sharedMenuItems.resources,
            href: "/teacher/resources",
          },
          {
            label: "Grading",
            href: "/teacher/grading",
            icon: ClipboardCheck,
          },
        ],
      },
      {
        label: "Courses",
        items: [
          {
            label: "Course List",
            href: "/teacher/courses",
            icon: BookOpen,
            injectComponent: true,
            isCoursesSection: true,
          },
        ],
      },
      {
        label: "Account",
        items: [
          {
            ...sharedMenuItems.settings,
            href: "/teacher/settings",
          },
        ],
      },
    ],
  },
  student: {
    baseUrl: "/student",
    groups: [
      {
        label: "",
        items: [
          {
            ...sharedMenuItems.dashboard,
            href: "/student",
          },
        ],
      },
      {
        label: "Learning",
        items: [
          {
            ...sharedMenuItems.courses,
            href: "/student/courses",
          },
          {
            ...sharedMenuItems.resources,
            href: "/student/resources",
          },
          {
            label: "My Progress",
            href: "/student/progress",
            icon: GraduationCap,
          },
        ],
      },
      {
        label: "Account",
        items: [
          {
            ...sharedMenuItems.settings,
            href: "/student/settings",
          },
        ],
      },
    ],
  },
  default: {
    baseUrl: "",
    groups: [
      {
        label: "",
        items: [
          {
            ...sharedMenuItems.dashboard,
            href: "/dashboard",
          },
        ],
      },
      {
        label: "Contents",
        items: [
          {
            ...sharedMenuItems.courses,
            href: "/courses",
          },
          {
            ...sharedMenuItems.resources,
            href: "/resources",
          },
          {
            ...sharedMenuItems.settings,
            href: "/settings",
          },
        ],
      },
    ],
  },
};

// Helper function to check if a path is active
function isPathActive(pathname: string, href: string, exact: boolean = false): boolean {
  return exact ? pathname === href : pathname.startsWith(href);
}

// Helper function to add active state to menu items
function addActiveState(items: MenuItem[], pathname: string): (MenuItem & { active: boolean })[] {
  return items.map(item => ({
    ...item,
    active: isPathActive(pathname, item.href, item.href.split("/").length <= 2),
  }));
}

// Main export function
export function getMenuList(pathname: string, role?: string): { groupLabel: string; menus: (MenuItem & { active: boolean })[] }[] {
  const config = menuConfigs[role || "default"] || menuConfigs.default;
  
  return config.groups.map(group => ({
    groupLabel: group.label,
    menus: addActiveState(group.items, pathname),
  }));
}
