import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import PostCard from "@/components/PostCard";

export default function Feed() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState("global");

  const { data: globalPosts = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ["posts", "global"],
    queryFn: () => api.listPosts("global"),
  });

  const { data: followingPosts = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["posts", "following"],
    queryFn: () => api.listPosts("following"),
    enabled: !!currentUser && tab === "following",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Feed</h1>
        {currentUser && (
          <Link to="/create">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" /> Post
            </Button>
          </Link>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="space-y-3">
          {loadingGlobal ? (
            <p className="text-center text-muted-foreground py-12">Loading…</p>
          ) : (
            globalPosts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>
        <TabsContent value="following" className="space-y-3">
          {!currentUser ? (
            <p className="text-center text-muted-foreground py-12">
              <Link to="/login" className="text-primary hover:underline">Sign in</Link> to see posts from people you follow.
            </p>
          ) : loadingFollowing ? (
            <p className="text-center text-muted-foreground py-12">Loading…</p>
          ) : followingPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No posts yet. <Link to="/explore" className="text-primary hover:underline">Find people to follow!</Link>
            </p>
          ) : (
            followingPosts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
