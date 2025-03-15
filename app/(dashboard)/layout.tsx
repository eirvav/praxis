import React from "react";
import { Toaster } from "sonner";
import { SupabaseProvider } from './_components/SupabaseProvider';

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <SupabaseProvider>
      <div className="min-h-screen">
        <Toaster position="top-center" />
        {children}
      </div>
    </SupabaseProvider>
  );
};

export default DashboardLayout; 