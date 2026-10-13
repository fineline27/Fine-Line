import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AuthProvider } from '../contexts/AuthContext';
import { LeagueProvider } from '../contexts/LeagueContext';
import { SportProvider } from '../contexts/SportContext';
import { colors } from '../theme/colors';

export default function RootLayout() {
  return (
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
  );
}
