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
  ShoppingCart,
  Sparkles,
  ClipboardList,
  FileText,
  Repeat,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Business Profile", icon: Building2 },
  { href: "/dashboard/items", label: "Purchased Items", icon: ShoppingCart },
  { href: "/dashboard/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
  { href: "/dashboard/quotes", label: "Quotes", icon: FileText },
  { href: "/dashboard/recurring", label: "Recurring Orders", icon: Repeat },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
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

export function DashboardNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="text-lg font-bold tracking-tight flex-1">
          SupplyMatch
        </Link>
        <NotificationBell />
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-4 flex flex-col">
          <SheetTitle className="text-xl font-bold tracking-tight mb-6">
            SupplyMatch
          </SheetTitle>
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

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card min-h-screen p-4 flex-col">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            SupplyMatch
          </Link>
          <NotificationBell />
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
