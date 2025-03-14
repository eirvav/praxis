"use client";

import React from "react";
import { Home, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import SidebarItem from "./SidebarItem";
import { cn } from "@/lib/utils";

interface SidebarProps {
  items: {
    icon: any;
    label: string;
    href: string;
  }[];
  title: string;
  className?: string;
}

const Sidebar = ({ items, title, className }: SidebarProps) => {
  const { signOut } = useClerk();
  
  // Group navigation items by category
  const dashboardItems = items.slice(0, 1); // Dashboard only
  const mainItems = items.slice(1, 5); // First 4 items after dashboard
  
  // Find settings item and remove it from otherItems
  const settingsItem = items.find(item => item.label === "Settings");
  const otherItemsWithoutSettings = items.slice(5).filter(item => item.label !== "Settings");

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Sidebar header with title and logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-x-2">
          <Image 
            src="/logo.svg" 
            alt="Praxis Logo" 
            width={32} 
            height={32} 
            className="h-8 w-8"
          />
          <h1 className="font-semibold text-xl">Praxis</h1>
          <span className="text-sm text-slate-500">{title}</span>
        </Link>
      </div>

      {/* Navigation Links - Dashboard */}
      <div className="flex flex-col w-full px-3 pt-4">
        <p className="text-xs font-medium text-gray-400 px-3 mb-2 uppercase">Overview</p>
        {dashboardItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
          />
        ))}
      </div>

      {/* Navigation Links - Main */}
      <div className="flex flex-col w-full px-3 pt-4">
        <p className="text-xs font-medium text-gray-400 px-3 mb-2 uppercase">Main</p>
        {mainItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
          />
        ))}
      </div>

      {/* Navigation Links - Other */}
      {otherItemsWithoutSettings.length > 0 && (
        <div className="flex flex-col w-full px-3 pt-4">
          <p className="text-xs font-medium text-gray-400 px-3 mb-2 uppercase">Others</p>
          {otherItemsWithoutSettings.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
            />
          ))}
        </div>
      )}

      {/* Settings and Logout at bottom */}
      <div className="mt-auto px-3 mb-4">
        <p className="text-xs font-medium text-gray-400 px-3 mb-2 uppercase">Settings & Account</p>
        
        {/* Settings item */}
        {settingsItem && (
          <SidebarItem
            key={settingsItem.href}
            icon={settingsItem.icon}
            label={settingsItem.label}
            href={settingsItem.href}
          />
        )}
        
        {/* Logout button using Clerk */}
        <button 
          onClick={() => signOut({ redirectUrl: '/' })}
          className="flex items-center gap-x-3 text-red-600 text-sm font-medium pl-3 
                   transition-all hover:text-red-700 hover:bg-red-50 py-3 rounded-lg w-full mt-2"
        >
          <LogOut size={20} className="text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;