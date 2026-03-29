import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { api } from "@/services/api";
import { getToken, setToken } from "@/storage/authStorage";
import type { User } from "@/types/users";

interface AuthContextType {
  currentUser: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (
    username: string,
    displayName: string,
    email: string,
    password: string,
    avatarFile?: File | null,
  ) => Promise<string | null>;
  logout: () => void;
  updateProfile: (
    updates: Partial<Pick<User, "displayName" | "bio" | "avatar">>,
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch {
      setToken(null);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const { token, user } = await api.login(email, password);
        setToken(token);
        setCurrentUser(user);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Login failed";
      }
    },
    [],
  );

  const signup = useCallback(
    async (
      username: string,
      displayName: string,
      email: string,
      password: string,
      avatarFile?: File | null,
    ): Promise<string | null> => {
      try {
        const { token, user } = await api.register({
          username,
          displayName,
          email,
          password,
        });
        setToken(token);
        setCurrentUser(user);
        if (avatarFile) {
          try {
            const { url } = await api.uploadImage(avatarFile);
            const updated = await api.updateProfile({ avatar: url });
            setCurrentUser(updated);
          } catch (e) {
            return e instanceof Error
              ? `Account created, but profile photo upload failed: ${e.message}`
              : "Account created, but profile photo upload failed.";
          }
        }
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Sign up failed";
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "displayName" | "bio" | "avatar">>) => {
      const user = await api.updateProfile(updates);
      setCurrentUser(user);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        ready,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
