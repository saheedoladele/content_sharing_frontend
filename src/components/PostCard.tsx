import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatTimeAgo } from "@/lib/time";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { currentUser } = useAuth();
  const isOwnPost = Boolean(currentUser && post.authorId === currentUser.id);
  const { data: authorRemote, isLoading: authorLoading, isError: authorError } = useUser(
    post.authorId,
    isOwnPost
  );
  const author = isOwnPost && currentUser ? currentUser : authorRemote;
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => api.listComments(post.id),
  });

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);

  useEffect(() => {
    setLiked(currentUser ? post.likes.includes(currentUser.id) : false);
    setLikeCount(post.likes.length);
  }, [currentUser, post.id, post.likes]);

  const likeMutation = useMutation({
    mutationFn: () => api.toggleLike(post.id),
    onSuccess: updated => {
      if (currentUser) setLiked(updated.likes.includes(currentUser.id));
      setLikeCount(updated.likes.length);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    },
  });

  if (!isOwnPost && authorError) return null;
  if (!isOwnPost && (authorLoading || !author)) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 animate-pulse h-24" />
    );
  }
  if (!author) return null;

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || likeMutation.isPending) return;
    likeMutation.mutate();
  };

  return (
    <Link to={`/post/${post.id}`} className="block">
      <article className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50">
        <div className="flex items-start gap-3">
          <Link to={`/profile/${author.id}`} onClick={e => e.stopPropagation()}>
            <Avatar className="h-10 w-10">
              <AvatarImage key={author.avatar} src={author.avatar || undefined} alt="" className="object-cover" />
              <AvatarFallback>{author.displayName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${author.id}`} onClick={e => e.stopPropagation()} className="font-semibold text-sm hover:underline text-foreground">
                {author.displayName}
              </Link>
              <span className="text-muted-foreground text-xs">@{author.username}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">{formatTimeAgo(post.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{post.text}</p>
            {post.imageUrl && (
              <img src={post.imageUrl} alt="" className="mt-3 rounded-lg w-full max-h-80 object-cover" />
            )}
            <div className="mt-3 flex items-center gap-6">
              <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
