import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Search, PlusCircle, User, LogOut } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/explore", icon: Search, label: "Explore" },
    { path: "/create", icon: PlusCircle, label: "Create" },
    { path: currentUser ? `/profile/${currentUser.id}` : "/login", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-foreground">The</span>{" "}
            <span className="text-primary">Telescope</span>
          </Link>
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-sm">
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 bg-secondary border-0 text-sm"
            />
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {currentUser ? (
              <>
                <Link to={`/profile/${currentUser.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/login")}>Sign in</Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 sm:pb-8 pt-4">
        {children}
      </main>

      <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()}{" "}
            <Link to="/" className="font-medium text-foreground hover:text-primary transition-colors">
              The Telescope
            </Link>
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <Link to="/create" className="hover:text-foreground transition-colors">Create</Link>
            {currentUser ? (
              <Link to={`/profile/${currentUser.id}`} className="hover:text-foreground transition-colors">Profile</Link>
            ) : (
              <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            )}
          </nav>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl sm:hidden">
        <div className="flex items-center justify-around h-14">
          {navItems.map(item => {
            const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
