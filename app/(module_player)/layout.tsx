import { ClerkProvider } from '@clerk/nextjs';
import { SupabaseProvider } from '@/app/(dashboard)/_components/SupabaseProvider';
import { Suspense } from 'react';

// Simple loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen bg-sidebar">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export default function ModulePlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <SupabaseProvider>
        <div className="min-h-screen bg-sidebar">
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </div>
      </SupabaseProvider>
    </ClerkProvider>
  );
} 