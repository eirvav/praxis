'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Users, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type ModuleCardProps = {
  id: string;
  title: string;
  content?: string;
  description?: string;
  thumbnail_url?: string;
  updated_at?: string;
  createdAt?: string;
  courseId?: string;
  isTeacher?: boolean;
  href?: string;
  enrolled?: number;
  completion_rate?: number;
  viewMode?: 'grid' | 'list';
};

const ModuleCard = ({ 
  id, 
  title, 
  content, 
  description,
  thumbnail_url,
  updated_at,
  createdAt,
  courseId, 
  isTeacher = false,
  href,
  enrolled = 0,
  viewMode = 'grid'
}: ModuleCardProps) => {
  const lastUpdated = updated_at || createdAt || '';
  const displayText = description || content || '';
  const route = href || (
    courseId 
      ? `/${isTeacher ? 'teacher' : 'student'}/courses/${courseId}/modules/${id}`
      : `/${isTeacher ? 'teacher' : 'student'}/modules/${id}`
  );
  
  if (viewMode === 'list') {
    return (
      <div className="relative group">
        <Link href={route} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary/50 hover:shadow-xl shadow-sm transition-all h-24">
            <div className="flex items-center gap-4 h-full">
              <div className="relative flex-shrink-0">
                <div className="relative w-24 h-16 rounded-md overflow-hidden">
                  {thumbnail_url ? (
                    thumbnail_url.startsWith('#') ? (
                      <div 
                        className="absolute inset-0" 
                        style={{ backgroundColor: thumbnail_url }}
                      />
                    ) : (
                      <Image 
                        src={thumbnail_url} 
                        alt={`${title} thumbnail`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200" />
                  )}
                </div>
                <div className="absolute top-1 left-1 bg-black/70 rounded-md px-2 py-0.5 text-white text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {enrolled}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">{title}</h2>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{displayText}</p>
              </div>
            </div>
          </div>
        </Link>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50">
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>Edit Module</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete Module</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group h-full">
      <Link href={route} className="block h-full">
        <div className="bg-transparent rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all h-full flex flex-col group-hover:scale-[1.02] duration-300">
          <div className="relative w-full pt-[50%] flex-shrink-0 rounded-xl overflow-hidden">
            {thumbnail_url ? (
              thumbnail_url.startsWith('#') ? (
                <div 
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: thumbnail_url }}
                />
              ) : (
                <Image 
                  src={thumbnail_url} 
                  alt={`${title} thumbnail`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="group-hover:scale-105 transition-transform duration-500 rounded-xl"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl" />
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-md px-2 py-0.5 text-white text-xs flex items-center gap-1 font-medium">
              <Users className="h-3 w-3" />
              {enrolled}
            </div>
          </div>
          
          <div className="p-3 flex flex-col flex-1">
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">{title}</h2>
            </div>
            
            <div className="mt-auto pt-2">
              <span className="text-xs font-medium text-muted-foreground">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-black/80 hover:bg-black/90 text-white backdrop-blur-sm rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>Edit Module</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Module</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ModuleCard;