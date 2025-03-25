'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Book, FileImage } from 'lucide-react';

export type ModuleCardProps = {
  id: string;
  title: string;
  content?: string;
  description?: string;
  thumbnail_url?: string;
  updated_at?: string;
  createdAt?: string; // For backward compatibility
  courseId?: string;
  isTeacher?: boolean;
  href?: string; // Allow custom href to be passed
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
  href
}: ModuleCardProps) => {
  // Use updated_at if available, otherwise use createdAt
  const lastUpdated = updated_at || createdAt || '';
  
  // Use description if available, otherwise use content for backward compatibility
  const displayText = description || content || '';
  
  // If custom href is provided, use it
  // Otherwise, use course context if available, fallback to standalone route
  const route = href || (
    courseId 
      ? `/${isTeacher ? 'teacher' : 'student'}/courses/${courseId}/modules/${id}`
      : `/${isTeacher ? 'teacher' : 'student'}/modules/${id}`
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col h-full">
      {/* Thumbnail section */}
      <div className="relative w-full h-40 bg-amber-50">
        {thumbnail_url ? (
          <Image 
            src={thumbnail_url} 
            alt={`${title} thumbnail`}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileImage className="h-12 w-12 text-amber-300" />
          </div>
        )}
      </div>
      
      {/* Content section */}
      <div className="p-6 flex-1 flex flex-col">
        <h2 className="text-xl font-semibold mb-2 truncate">{title}</h2>
        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{displayText}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-sm text-gray-500">
            {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
          </span>
          <Link href={route}>
            <Button variant="default" size="sm">
              <Book className="mr-2 h-4 w-4" />
              {isTeacher ? 'View' : 'Read'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard; 