import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupAvatarFile, setSignupAvatarFile] = useState<File | null>(null);
  const [signupAvatarPreview, setSignupAvatarPreview] = useState<string | null>(null);
  const signupFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (signupAvatarPreview) URL.revokeObjectURL(signupAvatarPreview);
    };
  }, [signupAvatarPreview]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err = await login(loginEmail, loginPassword);
      if (err) setError(err);
      else navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signupUsername || !signupName || !signupEmail || !signupPassword) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const err = await signup(signupUsername, signupName, signupEmail, signupPassword, signupAvatarFile);
      if (err) setError(err);
      else {
        setSignupAvatarFile(null);
        setSignupAvatarPreview(null);
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSignupPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }
    setSignupAvatarPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setSignupAvatarFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <span className="text-primary">Dark</span>Feed
          </CardTitle>
          <CardDescription>Share your thoughts with the world</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} type="password" autoComplete="current-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20 border border-border">
                    <AvatarImage src={signupAvatarPreview ?? undefined} />
                    <AvatarFallback className="text-lg">
                      {signupName.trim() ? signupName.trim()[0].toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <input ref={signupFileRef} type="file" accept="image/*" className="hidden" onChange={onSignupPhoto} />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => signupFileRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                    {signupAvatarFile ? "Change photo" : "Add profile photo"}
                  </Button>
                  {signupAvatarFile && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSignupAvatarFile(null);
                        setSignupAvatarPreview(prev => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground text-center">Optional — uses initials if skipped</p>
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={signupUsername} onChange={e => setSignupUsername(e.target.value)} placeholder="cooluser" />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Cool User" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={signupEmail} onChange={e => setSignupEmail(e.target.value)} type="email" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input value={signupPassword} onChange={e => setSignupPassword(e.target.value)} type="password" autoComplete="new-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
