import { useState } from "react";
import { 
  useGetContract, getGetContractQueryKey,
  useListVersions, getListVersionsQueryKey,
  useCreateVersion,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ContractNav } from "@/components/contract/contract-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, History, LayoutPanelLeft, Rows2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wordDiff, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const versionSchema = z.object({
  authorName: z.string().min(1, "Author name required"),
  changeNote: z.string().min(1, "Change note required"),
  content: z.string().min(10, "Content required")
});

type DiffMode = "merged" | "split";

function MergedDiff({ baseContent, compareContent }: { baseContent: string; compareContent: string }) {
  const diff = wordDiff(baseContent, compareContent);
  return (
    <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
      {diff.map((part, idx) => {
        if (part.type === "added") {
          return (
            <span key={idx} className="bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300 underline decoration-green-500 mx-0.5">
              {part.value}
            </span>
          );
        }
        if (part.type === "removed") {
          return (
            <span key={idx} className="bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300 line-through opacity-70 mx-0.5">
              {part.value}
            </span>
          );
        }
        return <span key={idx}>{part.value}</span>;
      })}
    </div>
  );
}

function SplitDiff({ baseContent, compareContent }: { baseContent: string; compareContent: string }) {
  const diff = wordDiff(baseContent, compareContent);

  // Build left (removed + unchanged) and right (added + unchanged) separately
  const left: React.ReactNode[] = [];
  const right: React.ReactNode[] = [];

  diff.forEach((part, idx) => {
    if (part.type === "unchanged") {
      left.push(<span key={`l-${idx}`}>{part.value}</span>);
      right.push(<span key={`r-${idx}`}>{part.value}</span>);
    } else if (part.type === "removed") {
      left.push(
        <span key={`l-${idx}`} className="bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300 line-through opacity-80">
          {part.value}
        </span>
      );
    } else if (part.type === "added") {
      right.push(
        <span key={`r-${idx}`} className="bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300 underline decoration-green-500">
          {part.value}
        </span>
      );
    }
  });

  return (
    <div className="grid grid-cols-2 gap-0 h-full">
      <div className="border-r overflow-y-auto p-6 md:p-8">
        <div className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          Old version
        </div>
        <div className="font-serif text-base leading-relaxed whitespace-pre-wrap">
          {left}
        </div>
      </div>
      <div className="overflow-y-auto p-6 md:p-8">
        <div className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          New version
        </div>
        <div className="font-serif text-base leading-relaxed whitespace-pre-wrap">
          {right}
        </div>
      </div>
    </div>
  );
}

export default function ContractVersions({ id }: { id: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [baseVersionId, setBaseVersionId] = useState<string>("");
  const [compareVersionId, setCompareVersionId] = useState<string>("");
  const [diffMode, setDiffMode] = useState<DiffMode>("split");
  const [showAddVersion, setShowAddVersion] = useState(false);

  const { data: contract, isLoading: loadingContract } = useGetContract(id, { query: { enabled: !!id, queryKey: getGetContractQueryKey(id) } });
  const { data: versions, isLoading: loadingVersions } = useListVersions(id, { query: { enabled: !!id, queryKey: getListVersionsQueryKey(id) } });
  
  const createVersion = useCreateVersion();

  const form = useForm<z.infer<typeof versionSchema>>({
    resolver: zodResolver(versionSchema),
    defaultValues: { authorName: "", changeNote: "", content: contract?.content || "" }
  });

  if (versions && versions.length > 0 && !baseVersionId && !compareVersionId) {
    if (versions.length >= 2) {
      setBaseVersionId(versions[1].id.toString());
      setCompareVersionId(versions[0].id.toString());
    } else {
      setBaseVersionId(versions[0].id.toString());
      setCompareVersionId(versions[0].id.toString());
    }
  }

  const baseVersion = versions?.find(v => v.id.toString() === baseVersionId);
  const compareVersion = versions?.find(v => v.id.toString() === compareVersionId);
  const isDifferent = baseVersion && compareVersion && baseVersion.id !== compareVersion.id;

  const onAddVersion = (data: z.infer<typeof versionSchema>) => {
    createVersion.mutate({ id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVersionsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(id) });
        setShowAddVersion(false);
        form.reset();
        toast({ title: "Version created" });
      }
    });
  };

  if (loadingContract || loadingVersions) {
    return <div className="p-8"><Skeleton className="h-10 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!contract || !versions) return null;

  // Stats
  const addedCount = isDifferent ? wordDiff(baseVersion!.content, compareVersion!.content).filter(p => p.type === "added").length : 0;
  const removedCount = isDifferent ? wordDiff(baseVersion!.content, compareVersion!.content).filter(p => p.type === "removed").length : 0;

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-xl font-bold tracking-tight truncate mr-4">
          {contract.title}
          <span className="text-muted-foreground font-normal text-base"> / Versions</span>
        </h1>
        <Button
          onClick={() => {
            form.setValue("content", versions[0]?.content || contract.content);
            setShowAddVersion(true);
          }}
          data-testid="btn-add-version"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          Add Version
        </Button>
      </div>

      <ContractNav contractId={id} />

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Sidebar */}
        <div className="w-72 border-r bg-background flex flex-col h-full shrink-0">
          <div className="p-3 border-b font-medium flex items-center gap-2 bg-muted/20 text-sm">
            <History className="h-4 w-4 text-muted-foreground" />
            Version History
            <Badge variant="secondary" className="ml-auto">{versions.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="relative pl-5 pb-3 border-l border-muted-foreground/20 last:border-0 last:pb-0">
                <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[5.5px] top-2 ring-4 ring-background" />
                <Card className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-muted/50",
                  (v.id.toString() === baseVersionId || v.id.toString() === compareVersionId) && "border-primary/50 bg-primary/5"
                )}>
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-semibold text-sm">v{v.versionNumber}.0</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(v.createdAt)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1.5">by {v.authorName}</div>
                  <div className="text-xs bg-muted/60 p-1.5 rounded">{v.changeNote}</div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Diff Area */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {/* Controls bar */}
          <div className="p-3 border-b bg-muted/5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Compare</span>
              <Select value={baseVersionId} onValueChange={setBaseVersionId}>
                <SelectTrigger className="h-8 text-xs w-[140px]" data-testid="select-base-version">
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>Version {v.versionNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">→</span>
              <Select value={compareVersionId} onValueChange={setCompareVersionId}>
                <SelectTrigger className="h-8 text-xs w-[140px]" data-testid="select-compare-version">
                  <SelectValue placeholder="Compare" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>Version {v.versionNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Change stats */}
            {isDifferent && (
              <div className="flex items-center gap-2 text-xs ml-2">
                <span className="text-green-700 dark:text-green-400 font-mono">+{addedCount}</span>
                <span className="text-red-700 dark:text-red-400 font-mono">-{removedCount}</span>
              </div>
            )}

            {/* View toggle */}
            <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5 bg-background">
              <Button
                variant={diffMode === "split" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5 text-xs"
                onClick={() => setDiffMode("split")}
                data-testid="btn-split-view"
              >
                <LayoutPanelLeft className="h-3.5 w-3.5" />
                Split
              </Button>
              <Button
                variant={diffMode === "merged" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5 text-xs"
                onClick={() => setDiffMode("merged")}
                data-testid="btn-merged-view"
              >
                <Rows2 className="h-3.5 w-3.5" />
                Merged
              </Button>
            </div>
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-hidden">
            {baseVersionId === compareVersionId || !isDifferent ? (
              <div className="h-full overflow-y-auto p-8 md:p-12">
                <div className="max-w-3xl mx-auto bg-white dark:bg-black border rounded-lg p-8 shadow-sm">
                  <div className="font-serif text-base leading-relaxed whitespace-pre-wrap">
                    {baseVersion?.content || <span className="text-muted-foreground">Select two different versions to compare.</span>}
                  </div>
                </div>
              </div>
            ) : diffMode === "merged" ? (
              <div className="h-full overflow-y-auto p-8 md:p-12">
                <div className="max-w-3xl mx-auto bg-white dark:bg-black border rounded-lg p-8 shadow-sm">
                  <MergedDiff baseContent={baseVersion!.content} compareContent={compareVersion!.content} />
                </div>
              </div>
            ) : (
              <div className="h-full bg-white dark:bg-black border-t">
                <SplitDiff baseContent={baseVersion!.content} compareContent={compareVersion!.content} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Version Dialog */}
      <Dialog open={showAddVersion} onOpenChange={setShowAddVersion}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Version</DialogTitle>
            <DialogDescription>Create a new tracked version of this contract.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddVersion)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="authorName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl><Input {...field} data-testid="input-author" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="changeNote" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Note</FormLabel>
                      <FormControl><Input placeholder="e.g. Revised indemnity clause" {...field} data-testid="input-note" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Contract Text</FormLabel>
                    <FormControl>
                      <Textarea className="flex-1 min-h-[300px] font-mono text-sm" {...field} data-testid="input-content" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="pt-4 mt-auto">
                <Button variant="outline" type="button" onClick={() => setShowAddVersion(false)}>Cancel</Button>
                <Button type="submit" disabled={createVersion.isPending} data-testid="btn-save-version">Save Version</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
