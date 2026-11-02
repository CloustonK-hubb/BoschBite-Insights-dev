import { useEffect, useState } from "react";
// If this line shows an error, point it at the file where your Supabase client is created.
import { supabaseClient } from "../providers/supabaseClient";

/** Calls a Supabase SQL function (supabase.rpc) and re-runs when the args change. */
export function useRpc<T>(fn: string, args: Record<string, unknown>) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(args);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabaseClient.rpc(fn, args).then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        setError(error.message);
        setData(null);
      } else {
        setError(null);
        setData((data ?? []) as T[]);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, key]);

  return { data, error, loading };
}
