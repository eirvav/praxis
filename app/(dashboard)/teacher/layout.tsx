'use client';

import { ClerkProvider } from '@clerk/nextjs'
import { Bell, PanelLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/hooks/use-sidebar'
import { useStore } from '@/hooks/use-store'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '../_components/Breadcrumbs'

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sidebar = useStore(useSidebar, (state) => state);
  if (!sidebar) return null;

  const { toggleOpen } = sidebar;

  return (
    <ClerkProvider>
      <div className="min-h-screen bg-sidebar dark:bg-slate-900">
        <div className="flex flex-col min-h-screen p-2 lg:p-4">
          <div className="rounded-xl overflow-hidden border shadow-[0_3px_10px_rgb(0,0,0,0.2)]">
            <header className="bg-background border-b">
              <div className={cn(
                "flex h-16 items-center justify-between px-4",
                "transition-all duration-300"
              )}>
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleOpen}
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    <PanelLeft className="h-5 w-5" />
                  </Button>
                  <Breadcrumbs />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </header>
            <main className="bg-background">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ClerkProvider>
  )
}