import { Suspense } from "react"
import type { ReactNode } from "react"

import { DashboardFallback } from "@/components/dashboard-fallback"
import { requireRole } from "@/lib/auth"

async function TeacherRoleGate({ children }: { children: ReactNode }) {
  await requireRole(["teacher"])
  return <>{children}</>
}

export default function TeacherLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <TeacherRoleGate>{children}</TeacherRoleGate>
    </Suspense>
  )
}
