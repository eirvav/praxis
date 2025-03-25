import React from "react";
import { SupabaseProvider } from './_components/SupabaseProvider';
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <SupabaseProvider>
      <div className="min-h-screen">
        <AdminPanelLayout>
          {children}
        </AdminPanelLayout>
      </div>
    </SupabaseProvider>
  );
};

export default DashboardLayout; 