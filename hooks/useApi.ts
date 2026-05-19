import { useCallback, useEffect, useState } from "react";
import type { DependencyList } from "react";

import { ApiError } from "@/services/api";

export function useApi<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
): {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setData(await fn());
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.statusCode === 0 ? "Pas de connexion Internet" : err.message,
        );
      } else {
        setError("Une erreur inattendue est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
