import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, X } from "lucide-react";

export default function CreatePost() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPost({
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
      }),
    onSuccess: post => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate(`/post/${post.id}`);
    },
  });

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!text.trim()) return;
    try {
      await createMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await api.uploadImage(file);
      setImageUrl(url);
      setShowImage(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={e => setText(e.target.value)}
              className="min-h-[120px] bg-secondary border-0 resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{text.length}/500</span>
            </div>

            {showImage ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Image</Label>
                  <button type="button" onClick={() => { setShowImage(false); setImageUrl(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  placeholder="https://… or upload below"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="bg-secondary border-0"
                />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? "Uploading…" : "Upload image file"}
                </Button>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="rounded-lg w-full max-h-48 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowImage(true)} className="gap-1.5">
                  <ImagePlus className="h-4 w-4" /> Add image
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={!text.trim() || createMutation.isPending}>
                {createMutation.isPending ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
