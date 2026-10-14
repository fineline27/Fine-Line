import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeaderboardPlayerRow } from './LeaderboardPlayerRow';
import { OverallFormatsGuide } from './OverallFormatsGuide';
import { formatColors } from '../content/overallFormats';
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

type Props = {
  mode: OverallLeaderboardMode;
};

export function OverallLeaderboardPanel({ mode }: Props) {
  const { sport } = useSport();
  const { teams, loading: teamsLoading, refresh: refreshTeams } = useTeams();
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

  const isStakes = mode === 'stakes';
  const leaderboard = isStakes ? stakesLeaderboard : classicLeaderboard;
  const busy = teamsLoading || loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Overall {sport ?? ''}</Text>
        <Text style={[styles.subtitle, isStakes && styles.subtitleStakes]}>
          {isStakes
            ? 'Stakes · win the full stake or lose the full stake (1–3 per team)'
            : 'Classic · +1 for each correct O/U, bonus picks break ties'}
        </Text>
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
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: 4, fontSize: 14, lineHeight: 20 },
  subtitleStakes: { color: formatColors.stakes, fontWeight: '600' },
  guideInHeader: { marginTop: 8 },
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
