"use client";

import { useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/app/(dashboard)/_components/role-badge";
import type { UserRole } from "@/lib/roles";
import { updateUserRoleAction } from "./actions";

export interface AdminUserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  created_at: string | null;
}

const ROLE_ORDER: UserRole[] = ["student", "teacher", "admin"];

function RoleActions({ user }: { user: AdminUserRow }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (role: UserRole) => {
    startTransition(async () => {
      await updateUserRoleAction(user.id, role);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {ROLE_ORDER.map((role) => (
          <DropdownMenuItem
            key={role}
            disabled={role === user.role}
            onClick={() => handleChange(role)}
          >
            Set role: {role}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<AdminUserRow>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const { first_name, last_name, email } = row.original;
      const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();
      return fullName || <span className="text-muted-foreground">{email}</span>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue<string>("email")}</div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <RoleBadge role={row.getValue<UserRole>("role")} />,
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => {
      const value = row.getValue<string>("created_at");
      if (!value) return <span className="text-muted-foreground">Unknown</span>;
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value));
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => <RoleActions user={row.original} />,
  },
];

