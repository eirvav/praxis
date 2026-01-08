import { RoleGate } from "@/app/(dashboard)/_components/role-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate
      roles={["admin"]}
      activePath="/admin"
      title="Admin dashboard"
      description="Manage user roles and promote teachers."
    >
      {children}
    </RoleGate>
  );
}

