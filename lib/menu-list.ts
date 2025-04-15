import {
  LayoutGrid,
  LucideIcon,
  File,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  PlusCircle,
} from "lucide-react";

// Function to generate a consistent color from a string
export const generateColorFromString = (str: string): string => {
  if (!str) return '#6366f1'; // Default to primary color

  // Extract the course code prefix (letters before numbers)
  const prefix = str.match(/^[A-Za-z]+/);
  const mainPrefix = prefix ? prefix[0].toUpperCase() : str;
  
  // Use the prefix for base color generation to ensure courses with same prefix get similar colors
  let hash = 0;
  for (let i = 0; i < mainPrefix.length; i++) {
    hash = mainPrefix.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate the primary hue from the course prefix (department code)
  const primaryHue = Math.abs(hash) % 360;
  
  // For courses with the same prefix, use the full name to create slight variations
  let secondaryHash = 0;
  for (let i = 0; i < str.length; i++) {
    secondaryHash = str.charCodeAt(i) + ((secondaryHash << 5) - secondaryHash);
  }
  
  // Create a variation of ±20 degrees based on the full course name
  const hueVariation = (secondaryHash % 41) - 20; // Range from -20 to +20
  
  // Calculate final hue with variation
  const finalHue = (primaryHue + hueVariation + 360) % 360;
  
  // Fixed saturation and lightness for vibrant but consistent colors
  const s = 85;
  const l = 65;

  return `hsl(${finalHue}, ${s}%, ${l}%)`;
};

// Translation keys
export const TRANSLATION_KEYS = {
  QUICK_CREATE: "common.navigation.quickCreate",
  DASHBOARD: "common.navigation.dashboard",
  COURSES: "common.navigation.courses",
  RESOURCES: "common.navigation.resources",
  COURSE_LIST: "common.navigation.courseList",
  COURSE_LIST_TEMP: "common.navigation.courseListTemp",
  CONTENT: "common.navigation.content",
  LEARNING: "common.navigation.learning",
  MY_PROGRESS: "common.navigation.myProgress",
  CONTENTS: "common.navigation.contents"
} as const;

// Types
export type MenuItem = {
  href: string;
  label: string;
  translationKey?: string;
  icon: LucideIcon;
  injectComponent?: boolean;
  isCoursesSection?: boolean;
  submenus?: { href: string; label: string; translationKey?: string; active?: boolean; }[];
};

export type MenuGroup = {
  label: string;
  translationKey?: string;
  items: MenuItem[];
};

export type RoleConfig = {
  baseUrl: string;
  groups: MenuGroup[];
};

// Base menu items that can be shared between roles
const sharedMenuItems = {
  dashboard: {
    label: "Dashboard",
    translationKey: TRANSLATION_KEYS.DASHBOARD,
    icon: LayoutGrid,
  },
  courses: {
    label: "Courses",
    translationKey: TRANSLATION_KEYS.COURSES,
    icon: BookOpen,
    injectComponent: true,
  },
  resources: {
    label: "Resources",
    translationKey: TRANSLATION_KEYS.RESOURCES,
    icon: File,
  },
} as const;

// Role-specific menu configurations
export const menuConfigs: Record<string, RoleConfig> = {
  teacher: {
    baseUrl: "/teacher",
    groups: [
      {
        label: "",
        items: [
          {
            label: "Quick Create",
            translationKey: TRANSLATION_KEYS.QUICK_CREATE,
            href: "/teacher/modules/create",
            icon: PlusCircle,
          },
        ],
      },
      {
        label: "Content",
        translationKey: TRANSLATION_KEYS.CONTENT,
        items: [
          {
            ...sharedMenuItems.dashboard,
            href: "/teacher",
          },
          {
            ...sharedMenuItems.resources,
            href: "#",
          },
          {
            label: "Course List (temp)",
            translationKey: TRANSLATION_KEYS.COURSE_LIST_TEMP,
            href: "#",
            icon: ClipboardCheck,
          },
        ],
      },
      {
        label: "Courses",
        translationKey: TRANSLATION_KEYS.COURSES,
        items: [
          {
            label: "Course List",
            translationKey: TRANSLATION_KEYS.COURSE_LIST,
            href: "/teacher/courses",
            icon: BookOpen,
            injectComponent: true,
            isCoursesSection: true,
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
        translationKey: TRANSLATION_KEYS.LEARNING,
        items: [
          {
            ...sharedMenuItems.resources,
            href: "#",
          },
          {
            label: "My Progress",
            translationKey: TRANSLATION_KEYS.MY_PROGRESS,
            href: "#",
            icon: GraduationCap,
          },
        ],
      },
      {
        label: "Courses",
        translationKey: TRANSLATION_KEYS.COURSES,
        items: [
          {
            label: "Course List",
            translationKey: TRANSLATION_KEYS.COURSE_LIST,
            href: "/student/courses",
            icon: BookOpen,
            injectComponent: true,
            isCoursesSection: true,
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
        translationKey: TRANSLATION_KEYS.CONTENTS,
        items: [
          {
            ...sharedMenuItems.courses,
            href: "/courses",
          },
          {
            ...sharedMenuItems.resources,
            href: "#",
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
export function getMenuList(pathname: string, role?: string): { groupLabel: string; translationKey?: string; menus: (MenuItem & { active: boolean })[] }[] {
  const config = menuConfigs[role || "default"] || menuConfigs.default;
  
  return config.groups.map(group => ({
    groupLabel: group.label,
    translationKey: group.translationKey,
    menus: addActiveState(group.items, pathname),
  }));
}
