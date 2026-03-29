import type { User } from "@/types/users";
import type { Post } from "@/types/posts";
import type { Comment } from "@/types/comments";
import { getToken, setToken } from "@/storage/authStorage";

const API_ROOT =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

function url(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_ROOT}${p}`;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url(path), { ...options, headers });
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  async register(body: {
    username: string;
    displayName: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<User> {
    return request("/auth/me");
  },

  async listUsers(excludeSelf: boolean): Promise<User[]> {
    const q = excludeSelf ? "?excludeSelf=true" : "";
    return request(`/users${q}`);
  },

  async getUser(id: string): Promise<User> {
    return request(`/users/${encodeURIComponent(id)}`);
  },

  async updateProfile(
    updates: Partial<Pick<User, "displayName" | "bio" | "avatar">>,
  ): Promise<User> {
    return request("/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async follow(userId: string): Promise<User> {
    return request(`/users/${encodeURIComponent(userId)}/follow`, {
      method: "POST",
    });
  },

  async unfollow(userId: string): Promise<User> {
    return request(`/users/${encodeURIComponent(userId)}/follow`, {
      method: "DELETE",
    });
  },

  async listPosts(scope: "global" | "following"): Promise<Post[]> {
    return request(`/posts?scope=${scope}`);
  },

  async searchPosts(q: string): Promise<Post[]> {
    return request(`/posts/search?q=${encodeURIComponent(q)}`);
  },

  async getPost(id: string): Promise<Post> {
    return request(`/posts/${encodeURIComponent(id)}`);
  },

  async createPost(body: { text: string; imageUrl?: string }): Promise<Post> {
    return request("/posts", { method: "POST", body: JSON.stringify(body) });
  },

  async toggleLike(postId: string): Promise<Post> {
    return request(`/posts/${encodeURIComponent(postId)}/like`, {
      method: "POST",
    });
  },

  async listPostsByUser(userId: string): Promise<Post[]> {
    return request(`/posts/user/${encodeURIComponent(userId)}`);
  },

  async listLikedByUser(userId: string): Promise<Post[]> {
    return request(`/posts/user/${encodeURIComponent(userId)}/liked`);
  },

  async listComments(postId: string): Promise<Comment[]> {
    return request(`/posts/${encodeURIComponent(postId)}/comments`);
  },

  async addComment(
    postId: string,
    body: { text: string; parentCommentId?: string | null },
  ): Promise<Comment> {
    return request(`/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async uploadImage(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("image", file);
    const headers = new Headers();
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url("/upload/image"), {
      method: "POST",
      body: fd,
      headers,
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },
};
