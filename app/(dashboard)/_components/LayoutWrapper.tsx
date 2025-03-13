"use client";

import React, { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { FiSearch, FiBell, FiMail } from "react-icons/fi";
import { Input } from "@/components/ui/input";

interface LayoutWrapperProps {
  sidebar: React.ReactNode;
  children?: React.ReactNode;
  firstName?: string;
  userRole?: string;
}

const LayoutWrapper = ({ sidebar, children, firstName, userRole }: LayoutWrapperProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, isLoaded } = useUser();

  // Determine the display name
  const displayName = (() => {
    // First check for username (e.g. "user-with-long-name")
    if (user?.username) return user.username;
    
    // Then check for full name or first/last name combinations
    if (user?.fullName) return user.fullName;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    if (user?.lastName) return user.lastName;
    
    // Try to use email as fallback (like in the admin dashboard)
    const primaryEmail = user?.primaryEmailAddress?.emailAddress;
    if (primaryEmail) return primaryEmail.split('@')[0];
    
    // Check if there are any email addresses available
    if (user?.emailAddresses && user.emailAddresses.length > 0) {
      const firstEmail = user.emailAddresses[0].emailAddress;
      if (firstEmail) return firstEmail.split('@')[0];
    }
    
    // Fall back to firstName prop if provided
    if (firstName) return firstName;
    
    // Last resort fallback - only show when user data is loaded
    return isLoaded ? 'User' : ''; // Show empty while loading
  })();

  return (
    <div className="h-full bg-slate-100">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col bg-white shadow-sm transition-transform md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex`}
      >
        {sidebar}
      </div>
      <div className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setIsMobileSidebarOpen(false)} />
      <main className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 pt-3">
          <div className="flex items-center gap-6 flex-1 pr-4">
            <button 
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 md:hidden" 
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
              <span className="sr-only">Open menu</span>
            </button>
            
            <div className="w-full relative mt-1">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full h-12 rounded-full bg-white pl-12 pr-4 border border-gray-300 shadow-sm text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-5 mt-1">
            <div className="flex items-center gap-4">
              <button className="relative rounded-full bg-white p-2.5 text-gray-500 hover:bg-gray-100">
                <FiBell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-medium text-white">3</span>
              </button>
              <button className="rounded-full bg-white p-2.5 text-gray-500 hover:bg-gray-100">
                <FiMail className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </button>
            </div>
            <div className="h-10 w-px bg-gray-300 mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: {
                        width: '2.5rem',
                        height: '2.5rem'
                      }
                    }
                  }}
                />
              </div>
              <div className="hidden md:flex md:flex-col md:justify-center">
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-gray-500 capitalize">{userRole || 'Guest'}</div>
              </div>
            </div>
          </div>
        </header>
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
};

export default LayoutWrapper;