"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/ui/notification-bell";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Package,
  LogOut,
  Truck,
  Menu,
} from "lucide-react";

const navItems = [
  { href: "/supplier", label: "Overview", icon: LayoutDashboard },
  { href: "/supplier/profile", label: "Company Profile", icon: Building2 },
  { href: "/supplier/quotes", label: "Quote Requests", icon: FileText },
  { href: "/supplier/orders", label: "Orders", icon: Package },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/supplier" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SupplierBadge() {
  return (
    <div className="flex items-center gap-1 mt-1">
      <Truck className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Supplier Portal</span>
    </div>
  );
}

export function SupplierNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <Link href="/supplier" className="text-lg font-bold tracking-tight">
            SupplyMatch
          </Link>
          <SupplierBadge />
        </div>
        <NotificationBell />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-4 flex flex-col">
          <div className="mb-6">
            <SheetTitle className="text-xl font-bold tracking-tight">
              SupplyMatch
            </SheetTitle>
            <SupplierBadge />
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
          <Button
            variant="ghost"
            className="justify-start gap-3 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex w-64 border-r bg-card min-h-screen p-4 flex-col">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <Link href="/supplier" className="text-xl font-bold tracking-tight">
              SupplyMatch
            </Link>
            <NotificationBell />
          </div>
          <SupplierBadge />
        </div>
        <NavLinks />
        <Button
          variant="ghost"
          className="justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </aside>
    </>
  );
}
