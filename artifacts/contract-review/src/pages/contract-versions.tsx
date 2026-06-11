import { useState } from "react";
import { 
  useGetContract, getGetContractQueryKey,
  useListVersions, getListVersionsQueryKey,
  useCreateVersion,
  useGetVersion, getGetVersionQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ContractNav } from "@/components/contract/contract-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, History, Clock, FilePlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wordDiff, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const versionSchema = z.object({
  authorName: z.string().min(1, "Author name required"),
  changeNote: z.string().min(1, "Change note required"),
  content: z.string().min(10, "Content required")
});

export default function ContractVersions({ id }: { id: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [baseVersionId, setBaseVersionId] = useState<string>("");
  const [compareVersionId, setCompareVersionId] = useState<string>("");
  const [showAddVersion, setShowAddVersion] = useState(false);

  const { data: contract, isLoading: loadingContract } = useGetContract(id, { query: { enabled: !!id, queryKey: getGetContractQueryKey(id) } });
  const { data: versions, isLoading: loadingVersions } = useListVersions(id, { query: { enabled: !!id, queryKey: getListVersionsQueryKey(id) } });
  
  const createVersion = useCreateVersion();

  const form = useForm<z.infer<typeof versionSchema>>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      authorName: "",
      changeNote: "",
      content: contract?.content || ""
    }
  });

  // Default selections when versions load
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

  const diffResult = (baseVersion && compareVersion && baseVersion.id !== compareVersion.id) 
    ? wordDiff(baseVersion.content, compareVersion.content)
    : null;

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

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-xl font-bold tracking-tight truncate mr-4">{contract.title} <span className="text-muted-foreground font-normal text-base">/ Versions</span></h1>
        <Button onClick={() => {
          form.setValue('content', versions[0]?.content || contract.content);
          setShowAddVersion(true);
        }} data-testid="btn-add-version">
          <FilePlus className="mr-2 h-4 w-4" />
          Add Version
        </Button>
      </div>

      <ContractNav contractId={id} />

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Sidebar */}
        <div className="w-80 border-r bg-background flex flex-col h-full">
          <div className="p-4 border-b font-medium flex items-center gap-2 bg-muted/20">
            <History className="h-4 w-4 text-muted-foreground" />
            Version History
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {versions.map((v, idx) => (
              <div key={v.id} className="relative pl-6 pb-4 border-l border-muted-foreground/30 last:border-0 last:pb-0">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
                <div className="bg-card border rounded-md p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">v{v.versionNumber}.0</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(v.createdAt)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    By {v.authorName}
                  </div>
                  <div className="text-sm bg-muted/50 p-2 rounded">{v.changeNote}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diff Viewer */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="p-4 border-b bg-muted/10 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Compare</span>
              <Select value={baseVersionId} onValueChange={setBaseVersionId}>
                <SelectTrigger className="w-[180px]" data-testid="select-base-version">
                  <SelectValue placeholder="Base Version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>Version {v.versionNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">with</span>
            <div className="flex items-center gap-2">
              <Select value={compareVersionId} onValueChange={setCompareVersionId}>
                <SelectTrigger className="w-[180px]" data-testid="select-compare-version">
                  <SelectValue placeholder="Compare Version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>Version {v.versionNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12">
            <div className="max-w-3xl mx-auto font-serif text-lg leading-relaxed bg-white dark:bg-black p-8 rounded-lg border shadow-sm min-h-[500px]">
              {baseVersionId === compareVersionId ? (
                <div className="whitespace-pre-wrap">{baseVersion?.content}</div>
              ) : diffResult ? (
                <div className="whitespace-pre-wrap">
                  {diffResult.map((part, idx) => {
                    if (part.type === 'added') {
                      return <span key={idx} className="bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300 underline decoration-green-500 mx-0.5">{part.value}</span>;
                    }
                    if (part.type === 'removed') {
                      return <span key={idx} className="bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300 line-through decoration-red-500 mx-0.5 opacity-70">{part.value}</span>;
                    }
                    return <span key={idx}>{part.value}</span>;
                  })}
                </div>
              ) : (
                <div className="text-muted-foreground text-center mt-20">Select versions to compare</div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-author" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="changeNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Change Note</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Revised indemnity clause" {...field} data-testid="input-note" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1 flex flex-col">
                      <FormLabel>Contract Text</FormLabel>
                      <FormControl>
                        <Textarea className="flex-1 min-h-[300px] font-mono text-sm" {...field} data-testid="input-content" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
