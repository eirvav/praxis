'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ShieldCheck, 
  ShieldAlert, 
  GraduationCap,
  ChevronDown
} from "lucide-react";
import { setRole } from "../actions";

interface UserRoleCellProps {
  userId: string;
  userRole?: string;
}

export function UserRoleCell({ userId, userRole }: UserRoleCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="default"
        className={`capitalize ${
          userRole === "admin" 
            ? "bg-purple-500 hover:bg-purple-500" 
            : userRole === "teacher" 
              ? "bg-blue-500 hover:bg-blue-500" 
              : userRole === "student" 
                ? "bg-green-500 hover:bg-green-500"
                : "bg-gray-500 hover:bg-gray-500"
        }`}
      >
        {userRole || "No role"}
      </Badge>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <form action={setRole}>
            <input type="hidden" value={userId} name="id" />
            <input type="hidden" value="admin" name="role" />
            <DropdownMenuItem asChild>
              <button className="w-full flex items-center cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4 text-purple-500" />
                <span>Admin</span>
              </button>
            </DropdownMenuItem>
          </form>

          <form action={setRole}>
            <input type="hidden" value={userId} name="id" />
            <input type="hidden" value="teacher" name="role" />
            <DropdownMenuItem asChild>
              <button className="w-full flex items-center cursor-pointer">
                <ShieldAlert className="mr-2 h-4 w-4 text-blue-500" />
                <span>Teacher</span>
              </button>
            </DropdownMenuItem>
          </form>

          <form action={setRole}>
            <input type="hidden" value={userId} name="id" />
            <input type="hidden" value="student" name="role" />
            <DropdownMenuItem asChild>
              <button className="w-full flex items-center cursor-pointer">
                <GraduationCap className="mr-2 h-4 w-4 text-green-500" />
                <span>Student</span>
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 