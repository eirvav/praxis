'use client';

import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';
import { useStore } from '@/hooks/use-store';

export function SidebarToggle() {
  const sidebar = useStore(useSidebar, (state) => state);
  if (!sidebar) return null;

  const { toggleOpen } = sidebar;

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleOpen}
      className="bg-primaryStyling hover:bg-indigo-700 text-white hover:text-white cursor-pointer"
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
} 