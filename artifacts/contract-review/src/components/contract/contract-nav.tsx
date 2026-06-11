import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ContractNav({ contractId }: { contractId: number }) {
  const [location] = useLocation();

  const links = [
    { href: `/contracts/${contractId}`, label: "Document" },
    { href: `/contracts/${contractId}/versions`, label: "Versions" },
    { href: `/contracts/${contractId}/comments`, label: "Comments" }
  ];

  return (
    <div className="flex border-b bg-muted/20 px-4">
      {links.map(link => {
        const isActive = location === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <button
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
              data-testid={`tab-${link.label.toLowerCase()}`}
            >
              {link.label}
            </button>
          </Link>
        );
      })}
    </div>
  );
}
