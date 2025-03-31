'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';

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
  accuracy?: number;
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
  accuracy = 0,
  completion_rate = 0,
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
      <Link href={route} className="block">
        <div className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary/50 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-16 rounded-md overflow-hidden">
              {thumbnail_url ? (
                <Image 
                  src={thumbnail_url} 
                  alt={`${title} thumbnail`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-1">{displayText}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{enrolled} Enrolled</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{accuracy}%</span> Accuracy
              </div>
              <div className="text-sm">
                <span className="font-medium">{completion_rate}%</span> Completed
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={route} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all">
        <div className="relative w-full h-40">
          {thumbnail_url ? (
            <Image 
              src={thumbnail_url} 
              alt={`${title} thumbnail`}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h2>
          {displayText && (
            <p className="text-sm text-muted-foreground mb-4">{displayText}</p>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{enrolled} Enrolled</span>
              </div>
              <span className="text-muted-foreground">
                {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>Accuracy</span>
                  <span className="font-medium">{accuracy}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>Completion Rate</span>
                  <span className="font-medium">{completion_rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full" 
                    style={{ width: `${completion_rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end mt-4 text-primary">
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ModuleCard;