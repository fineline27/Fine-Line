import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { MaintenanceScreen } from '../components/MaintenanceScreen';
import { SupabaseSetupScreen } from '../components/SupabaseSetupScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { LeagueProvider } from '../contexts/LeagueContext';
import { SportProvider } from '../contexts/SportContext';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';
import { isSupabaseConfigured } from '../lib/supabase';
import { colors } from '../theme/colors';

const APP_TITLE = Constants.expoConfig?.name?.trim() || 'Fine Line';

function AppShell() {
  const { active, message, checking, refresh } = useMaintenanceMode();

  if (active) {
    return <MaintenanceScreen message={message} onRetry={refresh} retrying={checking} />;
  }

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <SportProvider>
          <LeagueProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
          </LeagueProvider>
        </SportProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = APP_TITLE;
    }
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <StatusBar style="light" />
        <SupabaseSetupScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppShell />
    </>
  );
}
