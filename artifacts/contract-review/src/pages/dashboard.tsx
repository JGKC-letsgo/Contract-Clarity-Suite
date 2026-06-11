import { useState } from "react";
import { Link } from "wouter";
import { useListContracts, useGetContractStats, useListExpiringContracts } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, AlertTriangle, Clock, Search, CalendarX, X, LayoutTemplate, Mail, Loader2 } from "lucide-react";
import { ContractStatusBadge } from "@/components/contract/status-badge";
import { RiskBadge } from "@/components/contract/risk-badge";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

export default function Dashboard() {
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertDays, setAlertDays] = useState("30");
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const contractParams = {
    ...(searchQ ? { q: searchQ } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
    ...(riskFilter !== "all" ? { riskLevel: riskFilter as any } : {}),
  };

  const hasFilters = searchQ || statusFilter !== "all" || riskFilter !== "all";

  const { data: contracts, isLoading: loadingContracts } = useListContracts(
    Object.keys(contractParams).length > 0 ? contractParams : undefined
  );
  const { data: stats, isLoading: loadingStats } = useGetContractStats();
  const { data: expiring } = useListExpiringContracts({ days: 30 });

  const clearFilters = () => {
    setSearchQ("");
    setStatusFilter("all");
    setRiskFilter("all");
  };

  const handleSendAlerts = async () => {
    if (!alertEmail) return;
    setSendingAlerts(true);
    try {
      const res = await fetch("/api/contracts/send-expiry-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: alertEmail, days: parseInt(alertDays) || 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({
        title: data.sent > 0 ? `Sent ${data.sent} alert${data.sent === 1 ? "" : "s"}` : "No alerts needed",
        description: data.sent > 0
          ? `Expiry alert emailed to ${alertEmail}.`
          : data.message || "No contracts expiring in that window.",
      });
      setAlertDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSendingAlerts(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">System Overview & Active Contracts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setAlertEmail(user?.emailAddresses?.[0]?.emailAddress ?? ""); setAlertDialogOpen(true); }} data-testid="btn-email-alerts">
            <Mail className="h-4 w-4 mr-2" />
            Email Alerts
          </Button>
          <Link href="/templates">
            <Button variant="outline" data-testid="btn-templates">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </Link>
          <Link href="/contracts/new">
            <Button data-testid="btn-new-contract">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Expiry Alert Email</DialogTitle>
            <DialogDescription>Get an email summary of contracts expiring soon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="alert-email">Recipient Email</Label>
              <Input
                id="alert-email"
                type="email"
                placeholder="you@example.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-days">Expiring within (days)</Label>
              <Select value={alertDays} onValueChange={setAlertDays}>
                <SelectTrigger id="alert-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendAlerts} disabled={sendingAlerts || !alertEmail}>
              {sendingAlerts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
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
              <p className="text-xs text-muted-foreground mt-1">{stats.recentlyAnalyzed} recently analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.under_review || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.byRiskLevel.critical || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Immediate action required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <CalendarX className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats.expiringCount || 0) > 0 ? "text-amber-600" : ""}`}>
                {stats.expiringCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Expiring within 30 days</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Expiry Alerts */}
      {expiring && expiring.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-base text-amber-800 dark:text-amber-400">
                Contracts Expiring Soon
              </CardTitle>
            </div>
            <CardDescription>These contracts expire within 30 days and may need renewal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiring.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-amber-100 dark:border-amber-900 last:border-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <Link href={`/contracts/${c.id}`}>
                        <span className="font-medium text-sm hover:underline cursor-pointer">{c.title}</span>
                      </Link>
                      {c.parties && <p className="text-xs text-muted-foreground">{c.parties}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${c.daysUntilExpiry <= 7 ? "border-red-400 text-red-700 dark:text-red-400" : "border-amber-400 text-amber-700 dark:text-amber-400"}`}
                      >
                        {c.daysUntilExpiry <= 0 ? "Expired" : `${c.daysUntilExpiry}d left`}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(c.expiryDate)}</p>
                    </div>
                    <Link href={`/contracts/${c.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>
                {hasFilters
                  ? `Showing ${contracts?.length ?? 0} filtered result${contracts?.length === 1 ? "" : "s"}`
                  : "All contracts currently in the system."}
              </CardDescription>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-2 flex-wrap mt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or parties..."
                className="pl-8"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-risk">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters" data-testid="btn-clear-filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingContracts ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
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
                    <TableHead>Expiry</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const isExpiringSoon = contract.expiryDate
                      ? (() => {
                          const d = new Date(contract.expiryDate);
                          const now = new Date();
                          const days = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                          return days >= 0 && days <= 30;
                        })()
                      : false;

                    return (
                      <TableRow key={contract.id} className={isExpiringSoon ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}>
                        <TableCell className="font-medium">
                          <Link href={`/contracts/${contract.id}`} className="hover:underline hover:text-primary">
                            {contract.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{contract.parties || "-"}</TableCell>
                        <TableCell>
                          <ContractStatusBadge status={contract.status} />
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={contract.riskLevel} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {contract.expiryDate ? (
                            <span className={isExpiringSoon ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                              {formatDate(contract.expiryDate)}
                              {isExpiringSoon && <span className="ml-1 text-xs">(soon)</span>}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(contract.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`btn-view-${contract.id}`}>View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              {hasFilters ? (
                <>
                  <p>No contracts match your filters.</p>
                  <Button variant="link" className="mt-2" onClick={clearFilters}>Clear filters</Button>
                </>
              ) : (
                <>
                  <p>No contracts found.</p>
                  <Link href="/contracts/new">
                    <Button variant="link" className="mt-2">Upload your first contract</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
