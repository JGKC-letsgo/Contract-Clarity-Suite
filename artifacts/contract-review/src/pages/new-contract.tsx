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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createContract.mutate({ data }, {
      onSuccess: (contract) => {
        queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
        toast({
          title: "Contract created",
          description: "Your contract has been successfully added to the system."
        });
        setLocation(`/contracts/${contract.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create contract. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Contract</h1>
        <p className="text-muted-foreground mt-1 text-sm font-mono">Upload or paste a new contract for analysis.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Enter the metadata and content of the contract.</CardDescription>
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

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Content *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste the full text of the contract here..." 
                        className="min-h-[400px] font-mono text-sm" 
                        {...field} 
                        data-testid="textarea-content"
                      />
                    </FormControl>
                    <FormDescription>
                      The plain text of the contract to be analyzed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
