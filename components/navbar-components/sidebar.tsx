"use client";
import { Menu } from "@/components/navbar-components/menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  const pathname = usePathname();
  
  // Determine dashboard link based on path
  let dashboardLink = "/dashboard";
  if (pathname.startsWith("/teacher")) {
    dashboardLink = "/teacher";
  } else if (pathname.startsWith("/student")) {
    dashboardLink = "/student";
  }
  
  if (!sidebar) return null;
  const { getOpenState, setIsHover, settings } = sidebar;
  
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        "bg-sidebar text-sidebar-foreground",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden"
      )}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 overflow-y-auto"
      >
        <Button
          className={cn(
            "transition-transform ease-in-out duration-300 mb-1",
            !getOpenState() ? "translate-x-1" : "translate-x-0"
          )}
          variant="link"
          asChild
        >
          <Link href={dashboardLink} className="flex items-center gap-2">
            <Image 
              src="/logo.svg" 
              alt="praXis Logo" 
              width={24} 
              height={24} 
              className="mr-1"
            />
            <h1
              className={cn(
                "font-bold text-lg whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300",
                !getOpenState()
                  ? "-translate-x-96 opacity-0 hidden"
                  : "translate-x-0 opacity-100"
              )}
            >
              praXis
            </h1>
          </Link>
        </Button>
        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
