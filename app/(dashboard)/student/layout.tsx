import { Suspense } from "react"
import type { ReactNode } from "react"

import { DashboardFallback } from "@/components/dashboard-fallback"
import { requireRole } from "@/lib/auth"

async function StudentRoleGate({ children }: { children: ReactNode }) {
  await requireRole(["student"])
  return <>{children}</>
}

export default function StudentLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <StudentRoleGate>{children}</StudentRoleGate>
    </Suspense>
  )
}
