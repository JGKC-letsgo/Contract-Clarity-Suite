import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateContract, getListContractsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LayoutTemplate, Upload, FileText, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  parties: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(["draft", "under_review", "approved", "rejected"]).default("draft"),
  content: z.string().min(10, "Content must be at least 10 characters")
});

export default function NewContract() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createContract = useCreateContract();
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      parties: "",
      effectiveDate: "",
      expiryDate: "",
      status: "draft",
      content: ""
    }
  });

  const templateTitle = sessionStorage.getItem("templateTitle");
  const templateContent = sessionStorage.getItem("templateContent");

  useEffect(() => {
    if (templateContent) {
      form.setValue("content", templateContent);
      sessionStorage.removeItem("templateContent");
    }
    if (templateTitle) {
      form.setValue("title", templateTitle);
      sessionStorage.removeItem("templateTitle");
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx?|txt)$/i)) {
      toast({ title: "Unsupported file", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    setUploadState("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/contracts/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error);
      }
      const result = await res.json();
      form.setValue("content", result.extractedText);
      if (!form.getValues("title")) {
        form.setValue("title", result.suggestedTitle);
      }
      setUploadedFilename(result.filename);
      setUploadState("done");
      toast({ title: "File extracted", description: `Text extracted from "${result.filename}".` });
    } catch (err: any) {
      setUploadState("idle");
      toast({ title: "Upload failed", description: err.message || "Could not extract text from file.", variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createContract.mutate({ data }, {
      onSuccess: (contract) => {
        queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
        toast({ title: "Contract created", description: "Your contract has been added." });
        setLocation(`/contracts/${contract.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create contract. Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Contract</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">Upload a file or paste contract text for analysis.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/templates")} data-testid="btn-browse-templates">
          <LayoutTemplate className="h-4 w-4 mr-2" />
          Browse Templates
        </Button>
      </div>

      {(templateTitle || form.watch("content")) && form.watch("content").length > 50 && !uploadedFilename && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-md px-4 py-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <span>Template loaded — customize the content below before submitting.</span>
          <Badge variant="secondary" className="ml-auto text-xs">Template</Badge>
        </div>
      )}

      {uploadedFilename && (
        <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 text-green-800 rounded-md px-4 py-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span>Extracted from <strong>{uploadedFilename}</strong> — review and edit below before submitting.</span>
          <Button
            variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0"
            onClick={() => { setUploadedFilename(null); setUploadState("idle"); form.setValue("content", ""); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" /> Upload File
          </TabsTrigger>
          <TabsTrigger value="paste" className="gap-2">
            <FileText className="h-4 w-4" /> Paste Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-zone"
              >
                {uploadState === "uploading" ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-medium">Extracting text…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium">Drop a file here, or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-1">Supports PDF, DOCX, and TXT — up to 15 MB</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  data-testid="file-input"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste">
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Content *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full text of the contract here..."
                        className="min-h-[320px] font-mono text-sm"
                        {...field}
                        data-testid="textarea-content"
                      />
                    </FormControl>
                    <FormDescription>The plain text of the contract to be analyzed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Provide metadata for the contract.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Master Services Agreement" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parties</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corp, Globex Inc" {...field} data-testid="input-parties" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-effective-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4 border-t px-6 py-4">
              <Button variant="outline" type="button" onClick={() => setLocation("/")} data-testid="btn-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createContract.isPending} data-testid="btn-submit">
                {createContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Contract
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
