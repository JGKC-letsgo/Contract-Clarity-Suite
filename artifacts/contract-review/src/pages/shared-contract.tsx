import { useGetSharedContract } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/contract/risk-badge";
import { ContractStatusBadge } from "@/components/contract/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import { FileText, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SharedContract({ token }: { token: string }) {
  const { data: contract, isLoading, error } = useGetSharedContract(token);

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-24">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4 opacity-60" />
        <h2 className="text-xl font-semibold mb-2">Contract Not Found</h2>
        <p className="text-muted-foreground">This share link is invalid or has expired.</p>
      </div>
    );
  }

  const riskColors: Record<string, string> = {
    critical: "border-l-red-500",
    high: "border-l-orange-500",
    medium: "border-l-amber-500",
    low: "border-l-blue-500",
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Read-only Banner */}
      <div className="bg-primary/5 border-b px-6 py-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>This is a <strong>read-only</strong> shared view. To review or edit this contract, log in to Contract Clarity.</span>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <FileText className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <ContractStatusBadge status={contract.status as "draft" | "under_review" | "approved" | "rejected"} />
              <RiskBadge level={contract.riskLevel as "low" | "medium" | "high" | "critical" | null | undefined} />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-mono uppercase mb-1">Parties</p>
                <p>{contract.parties || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-mono uppercase mb-1">Effective Date</p>
                <p>{formatDate(contract.effectiveDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-mono uppercase mb-1">Expiry Date</p>
                <p>{formatDate(contract.expiryDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-mono uppercase mb-1">Risks Found</p>
                <p>{contract.risks?.length ?? 0}</p>
              </div>
            </div>
            {contract.summaryText && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-mono text-muted-foreground uppercase mb-2">AI Summary</p>
                <p className="text-sm leading-relaxed">{contract.summaryText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-8">
          {/* Document */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-4">Contract Document</h2>
            <div className="bg-white dark:bg-black border rounded-lg p-8 shadow-sm font-serif text-base leading-relaxed whitespace-pre-wrap">
              {contract.content}
            </div>
          </div>

          {/* Risks Sidebar */}
          {contract.risks && contract.risks.length > 0 && (
            <div className="w-80 shrink-0">
              <h2 className="text-lg font-semibold mb-4">
                Risk Analysis
                <Badge variant="secondary" className="ml-2 text-xs">{contract.risks.length}</Badge>
              </h2>
              <div className="space-y-3">
                {contract.risks.map(risk => (
                  <Card
                    key={risk.id}
                    className={cn("border-l-4", riskColors[risk.riskLevel] ?? "border-l-muted")}
                  >
                    <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                      <div className="font-semibold text-sm capitalize">{risk.category}</div>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase px-1 py-0 border-transparent",
                        risk.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                        risk.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                        risk.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      )}>
                        {risk.riskLevel}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded-md mb-2 italic line-clamp-2">
                        "{risk.clause}"
                      </p>
                      <p className="text-sm">{risk.explanation}</p>
                      {risk.suggestion && (
                        <div className="mt-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200 dark:border-green-900">
                          <strong>Suggested fix:</strong> {risk.suggestion}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
