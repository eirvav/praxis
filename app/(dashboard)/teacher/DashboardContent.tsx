'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Clock, BookOpen, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RecentModules from '../_components/RecentModules';

const DashboardContent = () => {
  const { user, isLoaded } = useUser();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  if (!isLoaded) {
    return <div className="container p-6">Loading...</div>;
  }

  // Get first name from user
  const firstName = user?.firstName || user?.username?.split('-')[0] || 'Teacher';

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{greeting}, {firstName}!</h1>
          <p className="text-gray-600 mt-2">Welcome to your teacher dashboard</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/teacher/modules/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Module
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium">My Modules</h2>
          </div>
          <Link href="/teacher/modules">
            <p className="text-3xl font-bold text-gray-900 hover:text-blue-600">Manage Modules</p>
          </Link>
          <p className="text-gray-600 mt-1">Create and edit your learning content</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-medium">Students</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">View Students</p>
          <p className="text-gray-600 mt-1">Monitor student progress</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-medium">Calendar</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">Schedule</p>
          <p className="text-gray-600 mt-1">Manage your teaching calendar</p>
        </div>
      </div>

      {/* Recent Modules */}
      <RecentModules isTeacher={true} />

      {/* Additional dashboard content can be added here */}
    </div>
  );
};

export default DashboardContent; 