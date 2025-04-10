import { ClerkProvider } from '@clerk/nextjs'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '../_components/Breadcrumbs'
import { LanguageSwitcher } from '@/components/language-switcher'
import { SidebarProvider } from '@/components/providers/sidebar-provider'
import { SidebarToggle } from '@/components/sidebar-toggle'

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-sidebar dark:bg-slate-900">
          <div className="flex flex-col min-h-screen p-2 lg:p-4">
            <div className="rounded-xl overflow-hidden border shadow-[0_3px_10px_rgb(0,0,0,0.2)]">
              <header className="bg-background border-b">
                <div className={cn(
                  "flex h-16 items-center justify-between px-4",
                  "transition-all duration-300"
                )}>
                  <div className="flex items-center">
                    <SidebarToggle />
                    <Breadcrumbs />
                  </div>
                  <div className="flex items-center space-x-2">
                    <LanguageSwitcher />
                    <Button variant="ghost" size="icon">
                      <Bell className="h-5 w-5" />
                    </Button>
                    {/* <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button> */}
                  </div>
                </div>
              </header>
              <main className="bg-background">
                {children}
              </main>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ClerkProvider>
  )
}