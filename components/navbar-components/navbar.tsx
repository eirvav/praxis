import { SheetMenu } from "@/components/navbar-components/sheet-menu";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <SheetMenu />
        <h1 className="ml-4 font-semibold text-lg">{title}</h1>
      </div>
    </header>
  );
}
