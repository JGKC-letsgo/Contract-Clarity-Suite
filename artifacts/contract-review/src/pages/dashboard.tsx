import { Link } from "wouter";
import { useListContracts, useGetContractStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, FileText, AlertTriangle, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import { ContractStatusBadge } from "@/components/contract/status-badge";
import { RiskBadge } from "@/components/contract/risk-badge";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: contracts, isLoading: loadingContracts } = useListContracts();
  const { data: stats, isLoading: loadingStats } = useGetContractStats();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">System Overview & Active Contracts</p>
        </div>
        <Link href="/contracts/new">
          <Button data-testid="btn-new-contract">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.recentlyAnalyzed} recently analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.under_review || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.byRiskLevel.critical || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Immediate action required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total comments across {stats.totalVersions} versions
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent Contracts</CardTitle>
          <CardDescription>
            A list of all contracts currently in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingContracts ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : contracts && contracts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <Link href={`/contracts/${contract.id}`} className="hover:underline hover:text-primary">
                          {contract.title}
                        </Link>
                      </TableCell>
                      <TableCell>{contract.parties || "-"}</TableCell>
                      <TableCell>
                        <ContractStatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={contract.riskLevel} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(contract.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`btn-view-${contract.id}`}>View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No contracts found.</p>
              <Link href="/contracts/new">
                <Button variant="link" className="mt-2">Upload your first contract</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
