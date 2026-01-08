import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/roles";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  teacher: "secondary",
  student: "outline",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={ROLE_VARIANTS[role]} className="uppercase">
      {ROLE_LABELS[role]}
    </Badge>
  );
}

