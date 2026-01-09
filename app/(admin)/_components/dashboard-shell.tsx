import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import type { RoleAwareUser } from "@/lib/auth";
import { ROLE_TO_PATH } from "@/lib/roles";

interface DashboardShellProps {
  user: RoleAwareUser;
  title?: string;
  description?: string;
  activePath?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  title,
  description,
  activePath,
  children,
}: DashboardShellProps) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const headerLabel = displayName || user.email;
  const currentPath = activePath ?? ROLE_TO_PATH[user.role];

  return (
    <div className="min-h-svh bg-background" data-active-path={currentPath}>
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{headerLabel}</span>
              <Badge variant="secondary" className="uppercase">
                {user.role}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8 space-y-2">
          {title ? <h1 className="text-3xl font-bold">{title}</h1> : null}
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}

