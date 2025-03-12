import React from "react";
import { Toaster } from "sonner";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      {children}
    </div>
  );
};

export default DashboardLayout; 