import { useEffect, useState } from 'react';

import { fetchUserRank, isSupabaseConfigured } from '../lib/supabase';

export function useUserRank(): { rank: number | null; loading: boolean } {
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setRank(null);
          setLoading(false);
        }
        return;
      }

      try {
        const value = await fetchUserRank();
        if (!cancelled) {
          setRank(value);
        }
      } catch {
        if (!cancelled) {
          setRank(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rank, loading };
}
