"use client";

import Link from "next/link";
import { Ellipsis, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { TRANSLATION_KEYS } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/navbar-components/collapse-menu-button";
import { CourseNavigation } from "@/app/(dashboard)/_components/CourseNavigation";
import { CreateCourseModal } from "@/app/(dashboard)/_components/CreateCourseModal";
import { QuickCreateModal } from "@/app/(dashboard)/_components/quick-create-modal";
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
  const { user } = useUser();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const t = useTranslations();
  
  // Determine user role from pathname
  let userRole: string | undefined;
  if (pathname.startsWith("/teacher")) {
    userRole = "teacher";
  } else if (pathname.startsWith("/student")) {
    userRole = "student";
  }
  
  // Get the menu list based on user role
  const menuList = getMenuList(pathname, userRole);

  // Function to get translated text based on translationKey
  const getTranslatedLabel = (label: string, translationKey?: string) => {
    if (translationKey) {
      try {
        return t(translationKey);
      } catch {
        console.error(`Translation key not found: ${translationKey}`);
        return label;
      }
    }
    return label;
  };

  return (
    <>
      <ScrollArea className="[&>div>div[style]]:!block">
        <nav className="mt-8 h-full w-full">
          <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
            {menuList.map(({ groupLabel, translationKey: groupTranslationKey, menus }, index) => {
              // Get translated group label if available
              const translatedGroupLabel = getTranslatedLabel(groupLabel, groupTranslationKey);
              const isCoursesGroup = groupTranslationKey === TRANSLATION_KEYS.COURSES;
              
              return (
                <li className={cn("w-full", translatedGroupLabel ? "pt-5" : "")} key={index}>
                  {(isOpen && translatedGroupLabel) || isOpen === undefined ? (
                    <div className="flex justify-between items-center px-4 pb-2">
                      <p className="text-sm font-medium text-muted-foreground max-w-[200px] truncate">
                        {translatedGroupLabel}
                      </p>
                      {isCoursesGroup && userRole === 'teacher' && (
                        <div
                          className="h-5 w-5 p-0 flex items-center justify-center group cursor-pointer"
                          onClick={() => setIsCourseModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 transition-transform group-hover:scale-125 group-hover:text-primary" />
                        </div>
                      )}
                    </div>
                  ) : !isOpen && isOpen !== undefined && translatedGroupLabel ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div 
                            className="w-full flex justify-center items-center"
                            onClick={isCoursesGroup && userRole === 'teacher' ? () => setIsCourseModalOpen(true) : undefined}
                          >
                            {isCoursesGroup && userRole === 'teacher' ? (
                              <div className="h-5 w-5 p-0 flex items-center justify-center group cursor-pointer">
                                <Plus className="h-4 w-4 transition-transform group-hover:scale-125 group-hover:text-primary" />
                              </div>
                            ) : (
                              <Ellipsis className="h-5 w-5" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{translatedGroupLabel}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="pb-2"></p>
                  )}
                  {menus.map(
                    ({ href, label, translationKey, icon: Icon, active, submenus, injectComponent, isCoursesSection }, menuIndex) => {
                      // Create a unique ID for this menu item
                      const menuId = `${index}-${menuIndex}`;
                      
                      // Get translated label
                      const translatedLabel = getTranslatedLabel(label, translationKey);

                      // Regular menu item without submenus or injection
                      if (!submenus && !injectComponent) {
                        return (
                          <div className="w-full" key={menuIndex}>
                            <TooltipProvider disableHoverableContent>
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start h-10 mb-1",
                                      translationKey === "common.navigation.quickCreate" && "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white",
                                      ((active === undefined && pathname.startsWith(href)) || active) && 
                                      "bg-indigo-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-foreground"
                                    )}
                                    onClick={(e) => {
                                      if (translationKey === "common.navigation.quickCreate") {
                                        e.preventDefault();
                                        setIsQuickCreateModalOpen(true);
                                      }
                                    }}
                                    asChild={translationKey !== "common.navigation.quickCreate"}
                                  >
                                    {translationKey === "common.navigation.quickCreate" ? (
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
                                          {translatedLabel}
                                        </p>
                                      </div>
                                    ) : (
                                      <Link href={href}>
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
                                          {translatedLabel}
                                        </p>
                                      </Link>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                {isOpen === false && (
                                  <TooltipContent side="right">
                                    {translatedLabel}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      } 
                      
                      // Item with injection (CourseNavigation)
                      if (injectComponent && isCoursesSection) {
                        return (
                          <div 
                            key={menuId}
                            className={cn(
                              "transition-all",
                              isOpen === false ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                            )}
                          >
                            <CourseNavigation isTeacher={userRole === "teacher"} />
                          </div>
                        );
                      }
                      
                      // Item with submenus
                      return (
                        <div className="w-full" key={menuIndex}>
                          <CollapseMenuButton
                            icon={Icon}
                            label={translatedLabel}
                            active={
                              active === undefined
                                ? pathname.startsWith(href)
                                : active
                            }
                            submenus={submenus || []}
                            isOpen={isOpen}
                          />
                        </div>
                      );
                    }
                  )}
                </li>
              );
            })}
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
      
      <CreateCourseModal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)} 
      />

      <QuickCreateModal
        isOpen={isQuickCreateModalOpen}
        onClose={() => setIsQuickCreateModalOpen(false)}
      />
    </>
  );
}
