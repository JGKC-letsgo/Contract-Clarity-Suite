import { useState } from "react";
import { useLocation } from "wouter";
import { useListTemplates } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutTemplate, FileText, ArrowRight, Eye } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Confidentiality: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Services: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Operations: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Employment: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

export default function Templates() {
  const [, setLocation] = useLocation();
  const [previewTemplate, setPreviewTemplate] = useState<{ id: string; name: string; description: string; category: string; content: string } | null>(null);
  const { data: templates, isLoading } = useListTemplates();

  const useTemplate = (template: { name: string; content: string }) => {
    // Store the template in sessionStorage so new-contract page can pick it up
    sessionStorage.setItem("templateContent", template.content);
    sessionStorage.setItem("templateTitle", template.name);
    setLocation("/contracts/new");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Contract Templates</h1>
        </div>
        <p className="text-muted-foreground text-sm font-mono">
          Start from a professionally drafted template and customize as needed.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <CardTitle className="text-lg leading-snug">{template.name}</CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs shrink-0 ${CATEGORY_COLORS[template.category] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {template.category}
                  </Badge>
                </div>
                <CardDescription className="mt-2">{template.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="bg-muted/50 rounded-md p-3 border">
                  <pre className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-5 whitespace-pre-wrap">
                    {template.content.slice(0, 300)}...
                  </pre>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setPreviewTemplate(template)}
                  data-testid={`btn-preview-${template.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => useTemplate(template)}
                  data-testid={`btn-use-${template.id}`}
                >
                  Use Template
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No templates available.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/30">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
              {previewTemplate?.content}
            </pre>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
            {previewTemplate && (
              <Button onClick={() => { useTemplate(previewTemplate); setPreviewTemplate(null); }}>
                Use This Template
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
