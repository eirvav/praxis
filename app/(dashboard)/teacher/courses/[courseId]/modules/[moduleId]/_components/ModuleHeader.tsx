'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Edit, MoreVertical, Share2, Trash2, Radio, Layers } from "lucide-react";
import Image from "next/image";
import { ModuleStats } from "./ModuleStats";
import { format } from "date-fns";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  deadline?: string;
  totalSlides: number;
  completionRate: number;
  submissions: number;
  avgCompletionTime: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const ModuleHeader = ({
  title,
  description,
  thumbnailUrl,
  deadline,
  totalSlides,
  completionRate,
  submissions,
  avgCompletionTime,
  onEdit,
  onDelete,
  isDeleting,
}: ModuleHeaderProps) => {
  const formattedDeadline = deadline ? format(new Date(deadline), 'MMM d, yyyy') : 'No deadline';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-red-500">
            <Radio className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="h-11 bg-white">
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="h-11 w-11 bg-white">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Slides
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                disabled={isDeleting}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Module"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-start gap-8">
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
           {/*<h1 className="text-3xl font-bold">{title}</h1>*/} 
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Due {formattedDeadline}</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>{totalSlides} Slides</span>
              </div>
            </div>
          </div>

          <div>
            <ModuleStats
              completionRate={completionRate}
              submissions={submissions}
              avgCompletionTime={avgCompletionTime}
            />
          </div>
        </div>

        {thumbnailUrl && (
          <div className="relative aspect-video w-1/3 rounded-lg border overflow-hidden flex-shrink-0">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
}; 