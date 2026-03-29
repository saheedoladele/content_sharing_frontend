import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostCard from "@/components/PostCard";
import { Camera } from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const { currentUser, updateProfile, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.getUser(id!),
    enabled: !!id,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["postsByUser", id],
    queryFn: () => api.listPostsByUser(id!),
    enabled: !!id,
  });

  const isOwn = currentUser?.id === user?.id;

  const { data: likedPosts = [] } = useQuery({
    queryKey: ["likedByUser", id],
    queryFn: () => api.listLikedByUser(id!),
    enabled: !!id && !!isOwn,
  });

  const isFollowing =
    currentUser && user ? currentUser.following.includes(user.id) : false;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFollowing) await api.unfollow(user.id);
      else await api.follow(user.id);
    },
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });

  if (isLoading || !user) {
    return <p className="text-center text-muted-foreground py-12">{isLoading ? "Loading…" : "User not found"}</p>;
  }

  const openEdit = () => {
    if (!currentUser) return;
    setEditName(currentUser.displayName);
    setEditBio(currentUser.bio);
    setEditAvatar(currentUser.avatar);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    await updateProfile({
      displayName: editName || undefined,
      bio: editBio,
      avatar: editAvatar || undefined,
    });
    setEditOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["user", id] });
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }
    setAvatarUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setEditAvatar(url);
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{user.displayName}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              {isOwn ? (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={openEdit}>Edit profile</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-24 w-24 border border-border">
                          <AvatarImage src={editAvatar} />
                          <AvatarFallback className="text-2xl">{editName[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                        </Avatar>
                        <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={avatarUploading}
                          onClick={() => avatarFileRef.current?.click()}
                        >
                          <Camera className="h-4 w-4" />
                          {avatarUploading ? "Uploading…" : "Upload profile photo"}
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input value={editName} onChange={e => setEditName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Bio</label>
                        <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="resize-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Avatar image URL (optional)</label>
                        <Input
                          value={editAvatar}
                          onChange={e => setEditAvatar(e.target.value)}
                          placeholder="Or paste an image URL"
                        />
                      </div>
                      <Button onClick={handleEditSave} className="w-full">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : currentUser ? (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  disabled={followMutation.isPending}
                  onClick={() => followMutation.mutate()}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              ) : null}
            </div>
            {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
            <div className="mt-3 flex gap-4 text-sm">
              <span><strong>{userPosts.length}</strong> <span className="text-muted-foreground">posts</span></span>
              <span><strong>{user.followers.length}</strong> <span className="text-muted-foreground">followers</span></span>
              <span><strong>{user.following.length}</strong> <span className="text-muted-foreground">following</span></span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          {isOwn && <TabsTrigger value="liked">Liked</TabsTrigger>}
        </TabsList>
        <TabsContent value="posts" className="space-y-3 mt-4">
          {userPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No posts yet</p>
          ) : (
            userPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>
        {isOwn && (
          <TabsContent value="liked" className="space-y-3 mt-4">
            {likedPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No liked posts</p>
            ) : (
              likedPosts.map(p => <PostCard key={p.id} post={p} />)
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
