import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { User } from "@/types/users";

/**
 * @param skipFetch — when true (e.g. viewer is the same user), skip GET /users/:id and use `currentUser` from callers instead.
 */
export function useUser(id: string | undefined, skipFetch?: boolean) {
  return useQuery<User | undefined>({
    queryKey: ["user", id],
    queryFn: async () => {
      if (!id) return undefined;
      return api.getUser(id);
    },
    enabled: !!id && !skipFetch,
  });
}
