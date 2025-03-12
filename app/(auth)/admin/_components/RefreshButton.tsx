'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshUserList } from "../actions";
import { useTransition } from "react";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  
  const handleRefresh = () => {
    startTransition(async () => {
      await refreshUserList();
    });
  };
  
  return (
    <Button 
      onClick={handleRefresh}
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
      disabled={isPending}
      title="Refresh user list"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      <span>Refresh</span>
    </Button>
  );
} 