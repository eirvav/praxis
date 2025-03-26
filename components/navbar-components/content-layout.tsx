import { Navbar } from "@/components/navbar-components/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="w-full h-full">
      <Navbar title={title} />
      <div className="w-full pt-8 pb-8 px-4 sm:px-8">{children}</div>
    </div>
  );
}
