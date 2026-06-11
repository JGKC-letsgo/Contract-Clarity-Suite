import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "low" | "medium" | "high" | "critical" | null | undefined;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  if (!level) return null;

  const config = {
    low: { label: "Low Risk", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900 hover:bg-blue-200" },
    medium: { label: "Medium Risk", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900 hover:bg-amber-200" },
    high: { label: "High Risk", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900 hover:bg-orange-200" },
    critical: { label: "Critical Risk", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900 hover:bg-red-200" }
  };

  const current = config[level];

  return (
    <Badge variant="outline" className={cn("font-medium", current.className, className)} data-testid={`risk-${level}`}>
      {current.label}
    </Badge>
  );
}
