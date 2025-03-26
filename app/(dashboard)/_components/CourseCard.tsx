'use client';

import { Card } from "@/components/ui/card";
import { BookOpen, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  moduleCount?: number;
  createdAt: string;
  href: string;
}

export function CourseCard({
  id,
  title,
  description,
  moduleCount = 0,
  createdAt,
  href,
}: CourseCardProps) {
  return (
    <Link href={href}>
      <Card className="group transition-all hover:border-primary">
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
} 