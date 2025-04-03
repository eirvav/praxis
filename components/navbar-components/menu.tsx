"use client";

import Link from "next/link";
import { Ellipsis, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/navbar-components/collapse-menu-button";
import { CourseNavigation } from "@/app/(dashboard)/_components/CourseNavigation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { UserButton } from "@clerk/nextjs";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  // Determine user role from pathname
  let userRole: string | undefined;
  if (pathname.startsWith("/teacher")) {
    userRole = "teacher";
  } else if (pathname.startsWith("/student")) {
    userRole = "student";
  }
  
  // Get the menu list based on user role
  const menuList = getMenuList(pathname, userRole);

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus, injectComponent }, index) => {
                  // Regular menu item without submenus or injection
                  if (!submenus && !injectComponent) {
                    return (
                      <div className="w-full" key={index}>
                        <TooltipProvider disableHoverableContent>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  (active === undefined &&
                                    pathname.startsWith(href)) ||
                                  active
                                    ? "secondary"
                                    : "ghost"
                                }
                                className="w-full justify-start h-10 mb-1"
                                asChild
                              >
                                <Link href={href}>
                                  <span
                                    className={cn(isOpen === false ? "" : "mr-4")}
                                  >
                                    <Icon size={18} />
                                  </span>
                                  <p
                                    className={cn(
                                      "max-w-[200px] truncate",
                                      isOpen === false
                                        ? "-translate-x-96 opacity-0"
                                        : "translate-x-0 opacity-100"
                                    )}
                                  >
                                    {label}
                                  </p>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            {isOpen === false && (
                              <TooltipContent side="right">
                                {label}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        
                      </div>
                    );
                  } 
                  
                  // Item with injection (CourseNavigation)
                  if (injectComponent) {
                    const [isExpanded, setIsExpanded] = useState(true);
                    
                    return (
                      <div className="w-full" key={index}>
                        <TooltipProvider disableHoverableContent>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  (active === undefined &&
                                    pathname.startsWith(href)) ||
                                  active
                                    ? "secondary"
                                    : "ghost"
                                }
                                className="w-full justify-start h-10 mb-1"
                                onClick={() => setIsExpanded(!isExpanded)}
                              >
                                <div className="w-full flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                                      <Icon size={18} />
                                    </span>
                                    <p
                                      className={cn(
                                        "max-w-[200px] truncate",
                                        isOpen === false
                                          ? "-translate-x-96 opacity-0"
                                          : "translate-x-0 opacity-100"
                                      )}
                                    >
                                      {label}
                                    </p>
                                  </div>
                                  <ChevronDown
                                    size={18}
                                    className={cn(
                                      "transition-transform duration-200",
                                      isExpanded ? "rotate-180" : ""
                                    )}
                                  />
                                </div>
                              </Button>
                            </TooltipTrigger>
                            {isOpen === false && (
                              <TooltipContent side="right">
                                {label}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* Injected component */}
                        <div className={cn(
                          "transition-all",
                          !isExpanded || isOpen === false ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                        )}>
                          <CourseNavigation isTeacher={userRole === "teacher"} />
                        </div>
                      </div>
                    );
                  }
                  
                  // Item with submenus
                  return (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={
                          active === undefined
                            ? pathname.startsWith(href)
                            : active
                        }
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  );
                }
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end">
            <div className="w-full border-t pt-4">
              <div className="flex items-center gap-3 px-2">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-10 w-10"
                    }
                  }}
                />
                {isOpen && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">
                      {user?.fullName || user?.username}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
