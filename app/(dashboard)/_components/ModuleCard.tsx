'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book } from 'lucide-react';

export type ModuleCardProps = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  isTeacher?: boolean;
};

const ModuleCard = ({ id, title, content, updated_at, isTeacher = false }: ModuleCardProps) => {
  const route = isTeacher ? `/teacher/modules/${id}` : `/student/modules/${id}`;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 truncate">{title}</h2>
        <p className="text-gray-600 mb-4 line-clamp-3">{content}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Last updated: {new Date(updated_at).toLocaleDateString()}
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