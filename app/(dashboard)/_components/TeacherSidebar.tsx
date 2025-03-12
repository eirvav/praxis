"use client";

import { 
  BookOpen, 
  CalendarDays, 
  ClipboardList,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Home,
  GraduationCap,
  BarChart,
  Star
} from "lucide-react";
import Sidebar from "./Sidebar";

const TeacherSidebar = () => {
  const teacherNavItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/teacher",
    },
    {
      icon: BookOpen,
      label: "Courses",
      href: "/teacher/courses",
    },
    {
      icon: Users,
      label: "Students",
      href: "/teacher/students",
    },
    {
      icon: ClipboardList,
      label: "Assignments",
      href: "/teacher/assignments",
    },
    {
      icon: GraduationCap,
      label: "Classes",
      href: "/teacher/classes",
    },
    {
      icon: FileText,
      label: "Grades",
      href: "/teacher/grades",
    },
    {
      icon: CalendarDays,
      label: "Schedule",
      href: "/teacher/schedule",
    },
    {
      icon: BarChart,
      label: "Analytics",
      href: "/teacher/analytics",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/teacher/messages",
    },
    {
      icon: Star,
      label: "Resources",
      href: "/teacher/resources",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/teacher/settings",
    }
  ];

  return (
    <Sidebar
      title="Teacher"
      items={teacherNavItems}
    />
  );
};

export default TeacherSidebar; 