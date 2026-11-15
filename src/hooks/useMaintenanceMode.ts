import { useCallback, useEffect, useState } from 'react';

import {
  getEnvMaintenanceState,
  resolveMaintenanceState,
  type MaintenanceState,
} from '../lib/maintenance';
import { isSupabaseConfigured } from '../lib/supabase';

const POLL_MS = 30_000;

export function useMaintenanceMode() {
  const envLocked = getEnvMaintenanceState();
  const [remoteState, setRemoteState] = useState<MaintenanceState | null>(envLocked);
  const [checking, setChecking] = useState(!envLocked && isSupabaseConfigured());

  const refresh = useCallback(async () => {
    if (envLocked) {
      setRemoteState(envLocked);
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const next = await resolveMaintenanceState();
      setRemoteState(next);
    } finally {
      setChecking(false);
    }
  }, [envLocked]);

  useEffect(() => {
    void refresh();
    if (envLocked) {
      return;
    }
    const id = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [envLocked, refresh]);

  const active = remoteState?.enabled === true;

  return {
    active,
    message: remoteState?.message ?? '',
    checking: checking && !active,
    refresh,
  };
}
