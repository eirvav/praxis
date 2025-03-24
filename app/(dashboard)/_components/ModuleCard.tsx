'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book } from 'lucide-react';

export type ModuleCardProps = {
  id: string;
  title: string;
  content: string;
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
  updated_at,
  createdAt,
  courseId, 
  isTeacher = false,
  href
}: ModuleCardProps) => {
  // Use updated_at if available, otherwise use createdAt
  const lastUpdated = updated_at || createdAt || '';
  
  // If custom href is provided, use it
  // Otherwise, use course context if available, fallback to standalone route
  const route = href || (
    courseId 
      ? `/${isTeacher ? 'teacher' : 'student'}/courses/${courseId}/modules/${id}`
      : `/${isTeacher ? 'teacher' : 'student'}/modules/${id}`
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 truncate">{title}</h2>
        <p className="text-gray-600 mb-4 line-clamp-3">{content}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
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