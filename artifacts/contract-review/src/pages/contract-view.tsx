import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  useGetContract, getGetContractQueryKey,
  useUpdateContract, 
  useDeleteContract,
  useAnalyzeContract,
  useListRisks, getListRisksQueryKey,
  useGetContractSummary, getGetContractSummaryQueryKey,
  useListComments, getListCommentsQueryKey,
  useCreateComment,
  useShareContract,
  useUpdateRisk,
  useSuggestClause,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ContractNav } from "@/components/contract/contract-nav";
import { ContractStatusBadge } from "@/components/contract/status-badge";
import { RiskBadge } from "@/components/contract/risk-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, Trash2, Loader2, Sparkles, MessageSquare, Send,
  Download, Share2, Copy, Check, Lightbulb, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function HighlighterText({ text, highlights, onHighlightClick }: { text: string, highlights: any[], onHighlightClick: (id: number) => void }) {
  if (!highlights || highlights.length === 0) return <div className="whitespace-pre-wrap">{text}</div>;

  let result: React.ReactNode[] = [text];

  highlights.forEach(h => {
    const clause = h.clause;
    if (!clause) return;
    const newResult: React.ReactNode[] = [];
    result.forEach((segment, i) => {
      if (typeof segment === 'string') {
        const parts = segment.split(clause);
        parts.forEach((p, j) => {
          newResult.push(p);
          if (j < parts.length - 1) {
            const colorClass = h.riskLevel === 'critical' ? 'bg-red-200 dark:bg-red-900/50 cursor-pointer' :
                               h.riskLevel === 'high' ? 'bg-orange-200 dark:bg-orange-900/50 cursor-pointer' :
                               h.riskLevel === 'medium' ? 'bg-amber-200 dark:bg-amber-900/50 cursor-pointer' :
                               'bg-blue-200 dark:bg-blue-900/50 cursor-pointer';
            newResult.push(
              <mark 
                key={`h-${h.id}-${i}-${j}`} 
                className={cn("px-1 rounded-sm transition-colors hover:brightness-95", colorClass)}
                onClick={() => onHighlightClick(h.id)}
                title={h.explanation}
              >
                {clause}
              </mark>
            );
          }
        });
      } else {
        newResult.push(segment);
      }
    });
    result = newResult;
  });

  return <div className="whitespace-pre-wrap leading-relaxed">{result.map((r, i) => <span key={i}>{r}</span>)}</div>;
}

const NEGOTIATION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-muted text-muted-foreground" },
  negotiating: { label: "Negotiating", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

export default function ContractView({ id }: { id: number }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [expandedRiskId, setExpandedRiskId] = useState<number | null>(null);
  const [counterProposalText, setCounterProposalText] = useState<Record<number, string>>({});
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("Reviewer");

  const { data: contract, isLoading: loadingContract } = useGetContract(id, { query: { enabled: !!id, queryKey: getGetContractQueryKey(id) } });
  const { data: risks, isLoading: loadingRisks } = useListRisks(id, { query: { enabled: !!id, queryKey: getListRisksQueryKey(id) } });
  const { data: summary } = useGetContractSummary(id, { query: { enabled: !!id, queryKey: getGetContractSummaryQueryKey(id) } });
  const { data: comments, isLoading: loadingComments } = useListComments(id, { query: { enabled: !!id, queryKey: getListCommentsQueryKey(id) } });

  const analyzeContract = useAnalyzeContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const createComment = useCreateComment();
  const shareContract = useShareContract();
  const updateRisk = useUpdateRisk();
  const suggestClause = useSuggestClause();

  const analyzeHasRun = useRef(false);

  useEffect(() => {
    if (contract && !contract.analyzed && !analyzeContract.isPending && !analyzeHasRun.current) {
      analyzeHasRun.current = true;
      handleAnalyze();
    }
  }, [contract]);

  const handleAnalyze = () => {
    analyzeContract.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListRisksQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetContractSummaryQueryKey(id) });
        setShowSummaryModal(true);
        toast({ title: "Analysis Complete", description: "The contract has been analyzed for risks." });
      },
      onError: () => {
        toast({ title: "Analysis Failed", description: "There was an error analyzing the contract.", variant: "destructive" });
      }
    });
  };

  const handleStatusChange = (newStatus: "draft" | "under_review" | "approved" | "rejected") => {
    updateContract.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(id) });
        toast({ title: "Status updated" });
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this contract?")) {
      deleteContract.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Contract deleted" });
          setLocation("/");
        }
      });
    }
  };

  const handleExport = () => {
    window.open(`/api/contracts/${id}/export`, "_blank");
  };

  const handleShare = () => {
    shareContract.mutate({ id }, {
      onSuccess: (result) => {
        setShareUrl(result.url);
      },
      onError: () => {
        toast({ title: "Share Failed", description: "Could not generate share link.", variant: "destructive" });
      }
    });
  };

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !authorName.trim()) return;
    createComment.mutate({ id, data: { text: newCommentText, authorName, selectedText: "" } }, {
      onSuccess: () => {
        setNewCommentText("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(id) });
        toast({ title: "Comment added" });
      }
    });
  };

  const handleUpdateNegotiationStatus = (riskId: number, status: string) => {
    updateRisk.mutate({ id, riskId, data: { negotiationStatus: status as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRisksQueryKey(id) });
        toast({ title: "Negotiation status updated" });
      }
    });
  };

  const handleSaveCounterProposal = (riskId: number) => {
    const text = counterProposalText[riskId] ?? "";
    updateRisk.mutate({ id, riskId, data: { counterProposal: text } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRisksQueryKey(id) });
        toast({ title: "Counter-proposal saved" });
      }
    });
  };

  const handleSuggestClause = (riskId: number) => {
    suggestClause.mutate({ id, riskId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRisksQueryKey(id) });
        toast({ title: "Suggestion generated", description: "AI has suggested a safer replacement clause." });
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not generate suggestion.", variant: "destructive" });
      }
    });
  };

  const riskRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scrollToRisk = (riskId: number) => {
    setSelectedRiskId(riskId);
    const element = riskRefs.current[riskId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loadingContract) {
    return <div className="p-8"><Skeleton className="h-10 w-1/3 mb-4" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!contract) {
    return <div className="p-8">Contract not found</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted/10">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">{contract.title}</h1>
          <ContractStatusBadge status={contract.status} />
          <RiskBadge level={contract.riskLevel} />
        </div>
        <div className="flex items-center gap-2">
          <Select value={contract.status} onValueChange={(val: any) => handleStatusChange(val)}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-action">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => handleAnalyze()} disabled={analyzeContract.isPending} data-testid="btn-analyze">
            {analyzeContract.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze
          </Button>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="btn-actions">
                Actions <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport} data-testid="btn-export">
                <Download className="h-4 w-4 mr-2" />
                Export Risk Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare} data-testid="btn-share" disabled={shareContract.isPending}>
                <Share2 className="h-4 w-4 mr-2" />
                {shareContract.isPending ? "Generating link..." : "Share Read-only Link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive" data-testid="btn-delete">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Contract
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContractNav contractId={id} />

      {/* AI Summary Banner */}
      {summary && contract.analyzed && !showSummaryModal && (
        <div className="bg-primary/5 border-b p-3 flex justify-between items-center px-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Analysis Available</span>
            <span className="text-sm text-muted-foreground line-clamp-1 max-w-lg">{summary.summaryText}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowSummaryModal(true)} data-testid="btn-view-summary">
            View Summary
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Document Panel */}
        <div className="flex-1 border-r overflow-y-auto bg-background p-8 md:p-12 shadow-inner">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 border-b pb-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div><strong>Parties:</strong> {contract.parties || "-"}</div>
                <div><strong>Effective:</strong> {formatDate(contract.effectiveDate)}</div>
                <div><strong>Expiry:</strong> {formatDate(contract.expiryDate)}</div>
              </div>
            </div>
            <div className="font-serif text-lg leading-relaxed text-foreground/90 pb-32">
              <HighlighterText text={contract.content} highlights={risks || []} onHighlightClick={scrollToRisk} />
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-80 lg:w-[420px] bg-background flex flex-col border-l">
          <Tabs defaultValue="risks" className="flex flex-col h-full w-full">
            <div className="px-4 pt-3 border-b">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="risks" data-testid="tab-risks">
                  Risks <Badge variant="secondary" className="ml-2 px-1 py-0">{risks?.length || 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="comments" data-testid="tab-comments">
                  Comments <Badge variant="secondary" className="ml-2 px-1 py-0">{comments?.length || 0}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="risks" className="flex-1 overflow-hidden flex flex-col m-0 border-0 data-[state=active]:flex">
              <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-4">
                  {loadingRisks ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                  ) : risks && risks.length > 0 ? (
                    risks.map((risk) => {
                      const statusInfo = NEGOTIATION_STATUS_LABELS[risk.negotiationStatus ?? "open"] ?? NEGOTIATION_STATUS_LABELS.open;
                      const isExpanded = expandedRiskId === risk.id;
                      const isSuggesting = suggestClause.isPending && suggestClause.variables?.riskId === risk.id;

                      return (
                        <Card
                          key={risk.id}
                          ref={(el) => { riskRefs.current[risk.id] = el; }}
                          className={cn(
                            "transition-all border-l-4",
                            selectedRiskId === risk.id ? "ring-2 ring-primary border-transparent" : "",
                            risk.riskLevel === 'critical' ? 'border-l-red-500' :
                            risk.riskLevel === 'high' ? 'border-l-orange-500' :
                            risk.riskLevel === 'medium' ? 'border-l-amber-500' :
                            'border-l-blue-500'
                          )}
                          data-testid={`risk-card-${risk.id}`}
                        >
                          <CardHeader
                            className="p-3 pb-0 flex flex-row items-start justify-between space-y-0 cursor-pointer"
                            onClick={() => { setSelectedRiskId(risk.id); setExpandedRiskId(isExpanded ? null : risk.id); }}
                          >
                            <div className="font-semibold text-sm capitalize">{risk.category}</div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={cn(
                                "text-[10px] uppercase px-1 py-0 border-transparent",
                                risk.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                risk.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                                risk.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                              )}>
                                {risk.riskLevel}
                              </Badge>
                              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusInfo.className)}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-2">
                            <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded-md mb-2 italic line-clamp-2">
                              "{risk.clause}"
                            </p>
                            <p className="text-sm">{risk.explanation}</p>

                            {/* Suggestion if available */}
                            {risk.suggestion && (
                              <div className="mt-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200 dark:border-green-900">
                                <strong className="block mb-1">Suggested Fix:</strong>
                                {risk.suggestion}
                              </div>
                            )}

                            {/* Expanded: negotiation + counter-proposal */}
                            {isExpanded && (
                              <div className="mt-3 space-y-3 pt-3 border-t">
                                {/* Negotiation Status */}
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground block mb-1">Negotiation Status</label>
                                  <Select
                                    value={risk.negotiationStatus ?? "open"}
                                    onValueChange={(val) => handleUpdateNegotiationStatus(risk.id, val)}
                                  >
                                    <SelectTrigger className="h-8 text-xs" data-testid={`select-negotiation-${risk.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="negotiating">Negotiating</SelectItem>
                                      <SelectItem value="accepted">Accepted</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Counter-proposal */}
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground block mb-1">Counter-Proposal</label>
                                  <Textarea
                                    className="text-xs min-h-[60px] resize-none"
                                    placeholder="Enter your counter-proposal..."
                                    value={counterProposalText[risk.id] ?? risk.counterProposal ?? ""}
                                    onChange={e => setCounterProposalText(prev => ({ ...prev, [risk.id]: e.target.value }))}
                                    data-testid={`textarea-counter-${risk.id}`}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1.5 h-7 text-xs w-full"
                                    onClick={() => handleSaveCounterProposal(risk.id)}
                                    data-testid={`btn-save-counter-${risk.id}`}
                                  >
                                    Save Counter-Proposal
                                  </Button>
                                </div>

                                {/* Suggest Fix Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-8 text-xs gap-1.5"
                                  onClick={() => handleSuggestClause(risk.id)}
                                  disabled={isSuggesting}
                                  data-testid={`btn-suggest-${risk.id}`}
                                >
                                  {isSuggesting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Lightbulb className="h-3.5 w-3.5" />
                                  )}
                                  {risk.suggestion ? "Regenerate Suggestion" : "AI: Suggest Safer Clause"}
                                </Button>
                              </div>
                            )}

                            {/* Expand toggle */}
                            <button
                              className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-full justify-center"
                              onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                            >
                              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                              {isExpanded ? "Collapse" : "Negotiate / Suggest Fix"}
                            </button>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {contract.analyzed ? "No risks identified." : "Analyze the contract to see risks."}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col m-0 border-0 data-[state=active]:flex">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {loadingComments ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                  ) : comments && comments.length > 0 ? (
                    comments.filter(c => !c.resolved).map(comment => (
                      <div key={comment.id} className="bg-card border rounded-md p-3 shadow-sm text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        {comment.selectedText && (
                          <div className="border-l-2 border-primary/40 pl-2 py-1 my-2 text-xs italic text-muted-foreground bg-muted/30">
                            "{comment.selectedText}"
                          </div>
                        )}
                        <div>{comment.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No active comments.
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-muted/10 space-y-3">
                <Input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Your Name"
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    className="min-h-[60px] resize-none text-sm"
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                  />
                  <Button
                    className="h-auto self-stretch w-10 px-0"
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim() || !authorName.trim() || createComment.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Contract Analysis Summary
            </DialogTitle>
            <DialogDescription>AI-generated summary and risk assessment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between border rounded-md p-4 bg-muted/30">
              <span className="font-medium">Overall Risk Assessment</span>
              <RiskBadge level={summary?.riskLevel || contract.riskLevel} className="text-base px-3 py-1" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Executive Summary</h4>
              <div className="bg-muted/50 p-4 rounded-md border text-sm leading-relaxed whitespace-pre-wrap">
                {summary?.summaryText || "No summary available."}
              </div>
            </div>
            {risks && risks.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center justify-between">
                  <span>Key Findings</span>
                  <Badge variant="secondary">{risks.length} Risks</Badge>
                </h4>
                <div className="space-y-2">
                  {risks.slice(0, 3).map(r => (
                    <div key={r.id} className="text-sm border-l-2 pl-3 py-1 border-primary/50">
                      <span className="font-medium capitalize">{r.category}: </span>
                      <span className="text-muted-foreground">{r.explanation}</span>
                    </div>
                  ))}
                  {risks.length > 3 && (
                    <div className="text-xs text-muted-foreground italic pl-3">+ {risks.length - 3} more. See sidebar.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSummaryModal(false)} data-testid="btn-close-summary">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share URL Dialog */}
      <Dialog open={!!shareUrl} onOpenChange={() => setShareUrl(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Read-only Share Link
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view the contract and its risk analysis — no login required.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2">
              <Input value={shareUrl ?? ""} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyShareUrl} data-testid="btn-copy-share">
                {copiedShare ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareUrl(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
