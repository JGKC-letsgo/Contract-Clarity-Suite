import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, Plus, Settings, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/contracts/new", label: "New Contract", icon: Plus },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
  ];

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-lg">
          <FileText className="h-5 w-5 text-primary" />
          <span>Legalese</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Contract Intelligence</p>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={location === item.href ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-2", location === item.href && "font-semibold")}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
