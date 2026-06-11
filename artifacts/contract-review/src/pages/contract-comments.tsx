import { useState } from "react";
import { 
  useGetContract, getGetContractQueryKey,
  useListComments, getListCommentsQueryKey,
  useCreateComment, useUpdateComment, useDeleteComment
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ContractNav } from "@/components/contract/contract-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Check, Trash2, Send } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ContractComments({ id }: { id: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("Reviewer");

  const { data: contract, isLoading: loadingContract } = useGetContract(id, { query: { enabled: !!id, queryKey: getGetContractQueryKey(id) } });
  const { data: comments, isLoading: loadingComments } = useListComments(id, { query: { enabled: !!id, queryKey: getListCommentsQueryKey(id) } });
  
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const handleAddComment = () => {
    if (!newCommentText.trim() || !authorName.trim()) return;

    createComment.mutate({
      id,
      data: {
        text: newCommentText,
        authorName,
        selectedText: "" // For simplicity in global comments view
      }
    }, {
      onSuccess: () => {
        setNewCommentText("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(id) });
        toast({ title: "Comment added" });
      }
    });
  };

  const handleResolve = (commentId: number, resolved: boolean) => {
    updateComment.mutate({
      id: commentId,
      data: { resolved }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(id) });
      }
    });
  };

  const handleDelete = (commentId: number) => {
    if (window.confirm("Delete this comment?")) {
      deleteComment.mutate({ id: commentId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetContractQueryKey(id) });
        }
      });
    }
  };

  if (loadingContract || loadingComments) {
    return <div className="p-8"><Skeleton className="h-10 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!contract || !comments) return null;

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center p-4 border-b bg-background">
        <h1 className="text-xl font-bold tracking-tight truncate">{contract.title} <span className="text-muted-foreground font-normal text-base">/ Comments</span></h1>
      </div>

      <ContractNav contractId={id} />

      <div className="flex-1 flex overflow-hidden">
        {/* Comments Thread */}
        <div className="flex-1 flex flex-col max-w-4xl border-r bg-background">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                <p>No comments on this contract yet.</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className={cn("flex gap-4", comment.resolved ? "opacity-60" : "")} data-testid={`comment-${comment.id}`}>
                  <Avatar className="w-10 h-10 border bg-muted">
                    <AvatarFallback className="text-sm font-semibold">{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                        {comment.resolved && <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">Resolved</span>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => handleResolve(comment.id, !comment.resolved)}
                          data-testid={`btn-resolve-${comment.id}`}
                          title={comment.resolved ? "Reopen" : "Resolve"}
                        >
                          <Check className={cn("h-4 w-4", comment.resolved ? "text-muted-foreground" : "text-green-600")} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive" 
                          onClick={() => handleDelete(comment.id)}
                          data-testid={`btn-delete-comment-${comment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {comment.selectedText && (
                      <div className="bg-muted/50 border-l-2 border-primary/40 pl-3 py-2 text-sm italic text-muted-foreground line-clamp-3 font-serif">
                        "{comment.selectedText}"
                      </div>
                    )}
                    
                    <div className="text-sm bg-card border rounded-md p-3 shadow-sm">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 bg-muted/20 border-t">
            <Card className="shadow-none border-muted">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Posting as:</span>
                  <Input 
                    value={authorName} 
                    onChange={e => setAuthorName(e.target.value)} 
                    className="h-8 w-40 text-sm"
                    data-testid="input-comment-author"
                  />
                </div>
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Add a comment..." 
                    className="min-h-[80px] resize-none"
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    data-testid="input-comment-text"
                  />
                  <Button 
                    className="h-auto self-stretch w-14" 
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim() || !authorName.trim() || createComment.isPending}
                    data-testid="btn-submit-comment"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Context panel (empty for now, could show document context) */}
        <div className="hidden lg:block w-80 bg-muted/5 p-6">
          <div className="sticky top-6 space-y-4 text-sm text-muted-foreground">
            <h3 className="font-medium text-foreground">Collaboration Guidelines</h3>
            <p>Use comments to flag ambiguous language, request clarification from counterparties, or discuss strategy with internal teams.</p>
            <p>Resolved comments are kept for the audit trail but visually dimmed to keep the workspace clear.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
