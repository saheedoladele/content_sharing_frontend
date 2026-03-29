import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import PostCard from "@/components/PostCard";

export default function Explore() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const { currentUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", !!currentUser],
    queryFn: () => api.listUsers(!!currentUser),
  });

  const users = allUsers.filter(u => u.id !== currentUser?.id);

  const { data: allPosts = [] } = useQuery({
    queryKey: ["posts", "global"],
    queryFn: () => api.listPosts("global"),
  });

  const { data: searchResults = [], isFetching: searchLoading } = useQuery({
    queryKey: ["posts", "search", query],
    queryFn: () => api.searchPosts(query.trim()),
    enabled: query.trim().length > 0,
  });

  const suggestedUsers = currentUser
    ? users.filter(u => !currentUser.following.includes(u.id))
    : users;

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!currentUser) return;
      const following = currentUser.following.includes(userId);
      if (following) await api.unfollow(userId);
      else await api.follow(userId);
    },
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const filteredPosts = query.trim() ? searchResults : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 bg-secondary border-0"
        />
      </div>

      {query.trim() ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {searchLoading ? "Searching…" : `${filteredPosts.length} results`}
          </h2>
          {filteredPosts.map(p => <PostCard key={p.id} post={p} />)}
          {!searchLoading && filteredPosts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No posts found</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-3">Suggested People</h2>
            <div className="space-y-2">
              {suggestedUsers.map(user => {
                const isFollowing = currentUser ? currentUser.following.includes(user.id) : false;
                return (
                  <div key={user.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <Link to={`/profile/${user.id}`}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user.id}`} className="font-semibold text-sm hover:underline">{user.displayName}</Link>
                      <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.bio}</p>
                    </div>
                    {currentUser && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(user.id)}
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Trending Posts</h2>
            <div className="space-y-3">
              {allPosts.slice(0, 5).map(p => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
