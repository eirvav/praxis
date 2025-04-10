'use client';

import { useSidebar } from '@/hooks/use-sidebar';
import { useStore } from '@/hooks/use-store';

export function SidebarProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebar, (state) => state);
  if (!sidebar) return null;

  return <>{children}</>;
} 