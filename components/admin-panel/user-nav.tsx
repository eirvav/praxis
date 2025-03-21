"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function UserNav() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  
  // Determine user role from pathname
  let userRole: string | undefined;
  if (pathname.startsWith("/teacher")) {
    userRole = "teacher";
  } else if (pathname.startsWith("/student")) {
    userRole = "student";
  }

  // Determine dashboard link based on user role
  const dashboardLink = userRole === "teacher" ? "/teacher" : userRole === "student" ? "/student" : "/";

  // Determine the display name
  const displayName = (() => {
    if (!isLoaded) return '';
    
    // First check for username (e.g. "user-with-long-name")
    if (user?.username) return user.username;
    
    // Then check for full name or first/last name combinations
    if (user?.fullName) return user.fullName;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    if (user?.lastName) return user.lastName;
    
    // Try to use email as fallback
    const primaryEmail = user?.primaryEmailAddress?.emailAddress;
    if (primaryEmail) return primaryEmail.split('@')[0];
    
    // Check if there are any email addresses available
    if (user?.emailAddresses && user.emailAddresses.length > 0) {
      const firstEmail = user.emailAddresses[0].emailAddress;
      if (firstEmail) return firstEmail.split('@')[0];
    }
    
    // Last resort fallback
    return 'User';
  })();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="flex items-center gap-4">
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage 
                src={user?.imageUrl || ""} 
                alt={displayName || "user"} 
              />
              <AvatarFallback>
                {displayName?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={dashboardLink}>Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${dashboardLink}/settings`}>Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
