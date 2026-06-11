import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, Plus, Settings, LayoutTemplate, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/react";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/contracts/new", label: "New Contract", icon: Plus },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
  ];

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-lg">
          <FileText className="h-5 w-5 text-primary" />
          <span>Contract Clarity</span>
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

      <div className="p-4 border-t space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
              {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.emailAddresses?.[0]?.emailAddress}
              </p>
              {user.firstName && (
                <p className="text-xs text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
