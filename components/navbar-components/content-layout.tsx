import { Navbar } from "@/components/navbar-components/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export function ContentLayout({ title, children, hideNavbar = false }: ContentLayoutProps) {
  return (
    <div className="w-full h-full">
      {!hideNavbar && <Navbar title={title} />}
      <div className="w-full">{children}</div>
    </div>
  );
}
