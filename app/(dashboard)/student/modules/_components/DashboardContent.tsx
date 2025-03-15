'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import RecentModules from '../../../_components/RecentModules';

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
  const firstName = user?.firstName || user?.username?.split('-')[0] || 'Student';

  return (
    <div className="container p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{greeting}, {firstName}!</h1>
        <p className="text-gray-600 mt-2">Welcome to your student dashboard</p>
      </div>

      {/* Recent Modules */}
      <RecentModules />
    </div>
  );
};

export default DashboardContent; 