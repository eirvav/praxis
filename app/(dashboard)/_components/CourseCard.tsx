'use client';

import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
      <Card className="h-full overflow-hidden transition-all hover:border-primary hover:shadow-md">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-xl truncate">{title}</h3>
            {description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {description}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 