"use client";

import { 
  BookOpen, 
  CalendarDays, 
  GraduationCap, 
  MessageSquare,
  Users,
  Home,
  Clock,
  Folder,
  Settings
} from "lucide-react";
import Sidebar from "./Sidebar";

const StudentSidebar = () => {
  const studentNavItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/student",
    },
    {
      icon: BookOpen,
      label: "Courses",
      href: "/student/courses",
    },
    {
      icon: GraduationCap,
      label: "Assignments",
      href: "/student/assignments",
    },
    {
      icon: CalendarDays,
      label: "Schedule",
      href: "/student/schedule",
    },
    {
      icon: Clock,
      label: "Progress",
      href: "/student/progress",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/student/messages",
    },
    {
      icon: Users,
      label: "Study Groups",
      href: "/student/study-groups",
    },
    {
      icon: Folder,
      label: "Resources",
      href: "/student/resources",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/student/settings",
    }
  ];

  return (
    <Sidebar
      title="Student"
      items={studentNavItems}
    />
  );
};

export default StudentSidebar; 