import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Bell, Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/navbar-components/sidebar'

export const metadata: Metadata = {
  title: 'praXis Student Dashboard',
  description: 'Created By Eirik Pagani Vavik',
}

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <div className="h-full">
        <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
          <div className="border-b h-full flex items-center gap-x-4 px-6">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <h1 className="font-bold text-2xl">
                  praXis
                </h1>
              </div>
              <div className="flex items-center gap-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
          <Sidebar />
        </div>
        <main className="md:pl-56 pt-[80px] h-full">
          {children}
        </main>
      </div>
    </ClerkProvider>
  )
}