import React from "react";
import { Toaster } from "sonner";
import { SupabaseProvider } from '../(dashboard)/_components/SupabaseProvider';

const FullscreenLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <SupabaseProvider>
      <div className="min-h-screen bg-slate-50">
        <Toaster position="top-center" />
        {children}
      </div>
    </SupabaseProvider>
  );
};

export default FullscreenLayout; 