"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href,
}: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-x-3 text-sm font-medium py-2.5 px-3 rounded-lg transition-all",
        isActive 
          ? "bg-purple-100 text-purple-900"
          : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-6 h-6",
        isActive ? "text-purple-600" : "text-gray-400"
      )}>
        <Icon size={18} />
      </div>
      {label}
    </Link>
  );
};

export default SidebarItem; 