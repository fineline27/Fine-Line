import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { BonusQuestion } from '../types/bonus';
import { NBA_PLAYER_OPTIONS } from '../lib/nbaPlayerOptions';
import { colors } from '../theme/colors';
import { SearchableSelect } from './SearchableSelect';

type Props = {
  questions: BonusQuestion[];
  answers: Record<string, string>;
  teamNames: string[];
  loading: boolean;
  locked: boolean;
  savingQuestionId: string | null;
  onChangeAnswer: (questionId: string, value: string) => void;
};

function optionsForQuestion(q: BonusQuestion, teamNames: string[]): string[] {
  if (q.question_key === 'nba_champion') {
    return teamNames;
  }
  return NBA_PLAYER_OPTIONS;
}

function placeholderForQuestion(q: BonusQuestion): string {
  if (q.question_key === 'nba_champion') {
    return 'Search NBA team…';
  }
  return 'Search player name…';
}

export function BonusPicksSection({
  questions,
  answers,
  teamNames,
  loading,
  locked,
  savingQuestionId,
  onChangeAnswer,
}: Props) {
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const sortedTeams = [...teamNames].sort((a, b) => a.localeCompare(b));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bonus tiebreakers</Text>
      <Text style={styles.hint}>
        Choose from the list — type to search, then tap a name. MVP & ROY use current NBA players;
        champion uses all 30 teams. Worth 1 pt each when results are set (tiebreak only).
      </Text>
      {questions.map((q, index) => (
        <View
          key={q.id}
          style={[styles.card, { zIndex: questions.length - index }]}
        >
          <Text style={styles.label}>{q.question_text}</Text>
          <SearchableSelect
            options={optionsForQuestion(q, sortedTeams)}
            value={answers[q.id] ?? ''}
            onChange={(value) => onChangeAnswer(q.id, value)}
            placeholder={placeholderForQuestion(q)}
            disabled={locked}
          />
          {savingQuestionId === q.id ? (
            <Text style={styles.saving}>Saving…</Text>
          ) : q.winning_answer ? (
            <Text style={styles.resultSet}>Result locked · {q.winning_answer}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  loadingWrap: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 10,
  },
  saving: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  resultSet: {
    color: colors.statusOnTrack,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});
