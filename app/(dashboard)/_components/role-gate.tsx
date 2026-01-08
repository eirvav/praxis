import { Suspense } from "react";

import { DashboardShell } from "@/app/(dashboard)/_components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

interface RoleGateProps {
  roles: UserRole[];
  activePath: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function RoleGate(props: RoleGateProps) {
  const { title, description } = props;

  return (
    <Suspense fallback={<DashboardFallback title={title} description={description} />}>
      <RoleGateContent {...props} />
    </Suspense>
  );
}

async function RoleGateContent({
  roles,
  activePath,
  title,
  description,
  children,
}: RoleGateProps) {
  const user = await requireRole(roles);

  return (
    <DashboardShell
      user={user}
      activePath={activePath}
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

function DashboardFallback({ title, description }: { title: string; description?: string }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6">
          <p className="text-sm text-muted-foreground">Praxis</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      </main>
    </div>
  );
}

