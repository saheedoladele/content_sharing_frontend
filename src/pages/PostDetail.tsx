import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";
import { formatTimeAgo } from "@/lib/time";
import { useAuth } from "@/lib/AuthContext";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, ArrowLeft, Reply } from "lucide-react";

function CommentItem({
  comment,
  allComments,
  onReply,
}: {
  comment: Comment;
  allComments: Comment[];
  onReply: (id: string) => void;
}) {
  const { currentUser } = useAuth();
  const isSelf = Boolean(currentUser && comment.authorId === currentUser.id);
  const { data: authorRemote } = useUser(comment.authorId, isSelf);
  const author = isSelf && currentUser ? currentUser : authorRemote;
  const replies = allComments.filter(c => c.parentCommentId === comment.id);
  if (!author) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link to={`/profile/${author.id}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage key={author.avatar} src={author.avatar || undefined} alt="" className="object-cover" />
            <AvatarFallback>{author.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${author.id}`} className="font-semibold text-sm hover:underline">{author.displayName}</Link>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm mt-0.5">{comment.text}</p>
          {!comment.parentCommentId && (
            <button type="button" onClick={() => onReply(comment.id)} className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1">
              <Reply className="h-3 w-3" /> Reply
            </button>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-border pl-4">
          {replies.map(r => <CommentItem key={r.id} comment={r} allComments={allComments} onReply={onReply} />)}
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data: post, isLoading: postLoading, error } = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.getPost(id!),
    enabled: !!id,
  });

  const isOwnPost = Boolean(currentUser && post?.authorId === currentUser.id);
  const { data: authorRemote } = useUser(post?.authorId, isOwnPost);
  const author = isOwnPost && currentUser ? currentUser : authorRemote;

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.listComments(id!),
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.toggleLike(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      api.addComment(id!, {
        text: commentText.trim(),
        parentCommentId: replyTo,
      }),
    onSuccess: () => {
      setCommentText("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const replyAuthorId = replyTo ? comments.find(c => c.id === replyTo)?.authorId : undefined;
  const isReplySelf = Boolean(currentUser && replyAuthorId === currentUser.id);
  const { data: replyAuthorRemote } = useUser(replyAuthorId, isReplySelf);
  const replyAuthor = isReplySelf && currentUser ? currentUser : replyAuthorRemote;

  if (postLoading) {
    return <p className="text-center text-muted-foreground py-12">Loading…</p>;
  }
  if (error || !post) {
    return <p className="text-center text-muted-foreground py-12">Post not found</p>;
  }

  const topComments = comments.filter(c => !c.parentCommentId);
  const liked = currentUser ? post.likes.includes(currentUser.id) : false;

  const toggleLike = () => {
    if (!currentUser || likeMutation.isPending) return;
    likeMutation.mutate();
  };

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim() || commentMutation.isPending) return;
    commentMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {author && (
        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <Link to={`/profile/${author.id}`}>
              <Avatar className="h-11 w-11">
                <AvatarImage key={author.avatar} src={author.avatar || undefined} alt="" className="object-cover" />
                <AvatarFallback>{author.displayName[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${author.id}`} className="font-semibold hover:underline">{author.displayName}</Link>
              <p className="text-xs text-muted-foreground">@{author.username} · {formatTimeAgo(post.createdAt)}</p>
            </div>
          </div>
          <p className="mt-4 text-foreground whitespace-pre-wrap">{post.text}</p>
          {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-4 rounded-lg w-full max-h-[500px] object-cover" />}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
            <button type="button" onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              <span>{post.likes.length} likes</span>
            </button>
            <span className="text-sm text-muted-foreground">{comments.length} comments</span>
          </div>
        </article>
      )}

      {currentUser ? (
        <form onSubmit={addComment} className="space-y-2">
          {replyTo && replyAuthor && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Replying to {replyAuthor.displayName}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-primary hover:underline">Cancel</button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="bg-secondary border-0 min-h-[60px] resize-none flex-1"
            />
            <Button type="submit" disabled={!commentText.trim() || commentMutation.isPending} size="sm" className="self-end">Post</Button>
          </div>
        </form>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Sign in</Link> to comment
        </p>
      )}

      <div className="space-y-4">
        {topComments.map(c => (
          <CommentItem key={c.id} comment={c} allComments={comments} onReply={rid => setReplyTo(rid)} />
        ))}
      </div>
    </div>
  );
}
