import { RoleGate } from "@/app/(admin)/_components/role-gate";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate
      roles={["teacher"]}
      activePath="/teacher"
      title="Teacher dashboard"
      description="Plan lessons and review student progress."
    >
      {children}
    </RoleGate>
  );
}

