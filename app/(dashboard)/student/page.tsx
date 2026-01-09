import { Suspense } from "react"
import Link from "next/link"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardFallback } from "@/components/dashboard-fallback"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { getUserWithRole } from "@/lib/auth"

type PublishedModule = {
  id: string
  title: string | null
  description: string | null
  publish_at: string | null
  deadline_at: string | null
  slides?: { id: string }[]
}

async function fetchPublishedModules(): Promise<PublishedModule[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("modules")
    .select("id,title,description,publish_at,deadline_at,slides (id)")
    .not("publish_at", "is", null)
    .order("publish_at", { ascending: false })

  return data ?? []
}

export default async function StudentPage() {
  const modules = await fetchPublishedModules()
  const user = await getUserWithRole()
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email

  return (
    <Suspense fallback={<DashboardFallback />}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          user={{
            name: displayName,
            email: user.email,
          }}
        />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Available modules</h1>
                <Link
                  href="/student"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Refresh
                </Link>
              </div>
              {modules.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No modules yet</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Published modules will appear here once available.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {modules.map((module) => (
                    <Card key={module.id}>
                      <CardHeader>
                        <CardTitle>{module.title || "Untitled module"}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {module.description || "No description"}
                        </p>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Slides: {module.slides?.length ?? 0}
                        </span>
                        <span>
                          {module.publish_at
                            ? new Date(module.publish_at).toLocaleDateString()
                            : "Draft"}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div> 
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  )
}
