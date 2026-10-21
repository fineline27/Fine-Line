import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { BonusQuestion } from '../types/bonus';
import { NBA_PLAYER_OPTIONS } from '../lib/nbaPlayerOptions';
import type { Team } from '../types/team';
import { colors } from '../theme/colors';
import { InlineOptionList } from './InlineOptionList';
import { TeamColorBadge } from './TeamColorBadge';

type Props = {
  question: BonusQuestion;
  answer: string;
  teams: Team[];
  locked: boolean;
  saving: boolean;
  onChangeAnswer: (value: string) => void;
};

export function BonusPickCard({
  question,
  answer,
  teams,
  locked,
  saving,
  onChangeAnswer,
}: Props) {
  const isChampion = question.question_key === 'nba_champion';
  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  if (locked) {
    return (
      <View style={styles.card}>
        <Text style={styles.question}>{question.question_text}</Text>
        <Text style={styles.subtitle}>Tiebreaker · locked for the season</Text>
        {answer ? (
          <View style={styles.lockedAnswerRow}>
            <Text style={styles.lockedAnswerLabel}>Your pick</Text>
            <Text style={styles.lockedAnswerValue}>{answer}</Text>
          </View>
        ) : (
          <Text style={styles.lockedAnswerEmpty}>No answer saved</Text>
        )}
        {question.winning_answer ? (
          <Text style={styles.metaResult}>Result · {question.winning_answer}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question.question_text}</Text>
      <Text style={styles.subtitle}>Tiebreaker · 1 pt when result is set</Text>

      {isChampion ? (
        <ScrollView
          style={styles.teamList}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {sortedTeams.map((team) => {
            const selected = answer === team.name;
            return (
              <Pressable
                key={team.id}
                disabled={locked}
                style={({ pressed }) => [
                  styles.teamRow,
                  selected && styles.teamRowSelected,
                  pressed && !locked && styles.teamRowPressed,
                  locked && styles.teamRowDisabled,
                ]}
                onPress={() => onChangeAnswer(team.name)}
              >
                <TeamColorBadge
                  abbreviation={team.abbreviation}
                  primaryColor={team.primary_color}
                />
                <Text style={[styles.teamName, selected && styles.teamNameSelected]}>{team.name}</Text>
                {selected ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <InlineOptionList
          options={NBA_PLAYER_OPTIONS}
          value={answer}
          onChange={onChangeAnswer}
          placeholder="Filter players…"
          disabled={locked}
          emptyQueryLimit={20}
          filteredLimit={50}
          listMaxHeight={200}
        />
      )}

      {saving ? (
        <Text style={styles.meta}>Saving…</Text>
      ) : question.winning_answer ? (
        <Text style={styles.metaResult}>Result locked · {question.winning_answer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  question: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  teamList: {
    maxHeight: 320,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamRowSelected: {
    backgroundColor: colors.pickInactive,
  },
  teamRowPressed: {
    opacity: 0.9,
  },
  teamRowDisabled: {
    opacity: 0.55,
  },
  teamName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  teamNameSelected: {
    color: colors.accent,
    fontWeight: '800',
  },
  check: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  metaResult: {
    color: colors.statusOnTrack,
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  lockedAnswerRow: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedAnswerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lockedAnswerValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  lockedAnswerEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
