import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeaderboardPlayerRow } from '../components/LeaderboardPlayerRow';
import { OverallFormatsGuide } from '../components/OverallFormatsGuide';
import { formatColors } from '../content/overallFormats';
import { useAuth } from '../contexts/AuthContext';
import { useSport } from '../contexts/SportContext';
import {
  useOverallLeaderboard,
  type OverallLeaderboardMode,
} from '../hooks/useOverallLeaderboard';
import { useTeams } from '../hooks/useTeams';
import {
  buildPlayerBonusPicks,
  buildPlayerOuPicks,
} from '../lib/playerPickDetails';
import { colors } from '../theme/colors';

function parseMode(raw: string | string[] | undefined): OverallLeaderboardMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'stakes' || value === 'confidence') {
    return 'stakes';
  }
  return 'classic';
}

export default function OverallLeaderboardScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading } = useSport();
  const { teams, loading: teamsLoading, refresh: refreshTeams } = useTeams();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode = useMemo(() => parseMode(params.mode), [params.mode]);
  const [mode, setMode] = useState<OverallLeaderboardMode>(initialMode);
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);
  const {
    classicLeaderboard,
    stakesLeaderboard,
    predictions,
    bonusQuestions,
    bonusAnswers,
    showBonus,
    loading,
    error,
    refresh,
  } = useOverallLeaderboard(teams);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const leaderboard = mode === 'stakes' ? stakesLeaderboard : classicLeaderboard;
  const isStakes = mode === 'stakes';

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  const busy = teamsLoading || loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        </Link>
        <Text style={styles.title}>Overall {sport ?? ''}</Text>
        <Text style={[styles.subtitle, isStakes && styles.subtitleStakes]}>
          {isStakes
            ? 'Stakes · win the full stake or lose the full stake (1–3 per team)'
            : 'Classic · +1 for each correct O/U, bonus picks break ties'}
        </Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeChip, !isStakes && styles.modeChipClassicActive]}
            onPress={() => setMode('classic')}
          >
            <Text style={[styles.modeChipText, !isStakes && styles.modeChipClassicText]}>
              Classic
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, isStakes && styles.modeChipStakesActive]}
            onPress={() => setMode('stakes')}
          >
            <Text style={[styles.modeChipText, isStakes && styles.modeChipStakesText]}>
              Stakes
            </Text>
          </Pressable>
        </View>
        <View style={styles.guideInHeader}>
          <OverallFormatsGuide compact defaultExpanded={false} />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {busy && leaderboard.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={isStakes ? formatColors.stakes : colors.accent} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={busy}
              onRefresh={() => void Promise.all([refreshTeams(), refresh()])}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listHint}>
              Tap a player to expand their picks
              {isStakes ? ' and stake sizes (×1–×3).' : ' and bonus tiebreakers where shown.'}
            </Text>
          }
          renderItem={({ item }) => (
            <LeaderboardPlayerRow
              entry={item}
              expanded={expandedUserId === item.userId}
              onToggle={() =>
                setExpandedUserId((id) => (id === item.userId ? null : item.userId))
              }
              ouPicks={buildPlayerOuPicks(item.userId, teams, predictions, isStakes)}
              bonusPicks={buildPlayerBonusPicks(item.userId, bonusQuestions, bonusAnswers)}
              showBonus={showBonus && !isStakes}
              canExpand={item.picksSubmitted}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.accent, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: 4, fontSize: 14, lineHeight: 20 },
  subtitleStakes: { color: formatColors.stakes, fontWeight: '600' },
  guideInHeader: { marginTop: 4 },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  modeChipClassicActive: {
    borderColor: formatColors.classic,
    borderWidth: 2,
    backgroundColor: formatColors.classicBg,
  },
  modeChipStakesActive: {
    borderColor: formatColors.stakes,
    borderWidth: 2,
    backgroundColor: formatColors.stakesBg,
  },
  modeChipText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  modeChipClassicText: {
    color: formatColors.classic,
  },
  modeChipStakesText: {
    color: formatColors.stakes,
  },
  error: { color: colors.statusNeedsWork, padding: 16, fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  listHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
});
