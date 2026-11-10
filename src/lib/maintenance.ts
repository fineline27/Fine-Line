import Constants from 'expo-constants';

import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export type MaintenanceState = {
  enabled: boolean;
  message: string;
};

const DEFAULT_MESSAGE = "We're making a few updates and will be back shortly.";

function readEnvMaintenanceEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as { maintenanceMode?: string } | undefined;
  const raw = extra?.maintenanceMode?.trim().toLowerCase();
  if (raw === '1' || raw === 'true' || raw === 'yes') {
    return true;
  }
  const fromEnv =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MAINTENANCE_MODE?.trim().toLowerCase();
  return fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes';
}

function readEnvMaintenanceMessage(): string | null {
  const extra = Constants.expoConfig?.extra as { maintenanceMessage?: string } | undefined;
  const fromExtra = extra?.maintenanceMessage?.trim();
  if (fromExtra) {
    return fromExtra;
  }
  const fromEnv =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MAINTENANCE_MESSAGE?.trim();
  return fromEnv || null;
}

/** Build-time / env override — works even if Supabase is unreachable. */
export function getEnvMaintenanceState(): MaintenanceState | null {
  if (!readEnvMaintenanceEnabled()) {
    return null;
  }
  return {
    enabled: true,
    message: readEnvMaintenanceMessage() ?? DEFAULT_MESSAGE,
  };
}

export async function fetchRemoteMaintenanceState(): Promise<MaintenanceState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('app_maintenance')
    .select('enabled, message')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    // Table may not exist until migration is run — treat as "not in maintenance".
    return null;
  }
  if (!data?.enabled) {
    return null;
  }
  const message = typeof data.message === 'string' && data.message.trim() ? data.message.trim() : DEFAULT_MESSAGE;
  return { enabled: true, message };
}

export async function resolveMaintenanceState(): Promise<MaintenanceState | null> {
  const envState = getEnvMaintenanceState();
  if (envState) {
    return envState;
  }
  return fetchRemoteMaintenanceState();
}

export { DEFAULT_MESSAGE as DEFAULT_MAINTENANCE_MESSAGE };
