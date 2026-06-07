import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { Button } from "./button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
              Discovery Agent
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Overview
            </Link>
            <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Inventory
            </Link>
            <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Flows
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="outline" className="hidden md:flex border-white/10">
              Documentation
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
