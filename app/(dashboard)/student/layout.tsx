import { RoleGate } from "@/app/(admin)/_components/role-gate";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate
      roles={["student"]}
      activePath="/student"
      title="Student dashboard"
      description="Track assignments and stay up to date."
    >
      {children}
    </RoleGate>
  );
}

