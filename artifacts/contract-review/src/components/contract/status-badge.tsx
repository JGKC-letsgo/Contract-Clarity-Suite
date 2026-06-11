import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContractStatusBadgeProps {
  status: "draft" | "under_review" | "approved" | "rejected";
  className?: string;
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const statusConfig = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 hover:bg-gray-200" },
    under_review: { label: "Under Review", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900 hover:bg-blue-200" },
    approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900 hover:bg-green-200" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900 hover:bg-red-200" }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)} data-testid={`status-${status}`}>
      {config.label}
    </Badge>
  );
}
