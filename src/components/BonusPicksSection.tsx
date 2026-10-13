import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import type { BonusQuestion } from '../types/bonus';
import { colors } from '../theme/colors';

type Props = {
  questions: BonusQuestion[];
  answers: Record<string, string>;
  loading: boolean;
  locked: boolean;
  savingQuestionId: string | null;
  onChangeAnswer: (questionId: string, value: string) => void;
};

export function BonusPicksSection({
  questions,
  answers,
  loading,
  locked,
  savingQuestionId,
  onChangeAnswer,
}: Props) {
  const [draft, setDraft] = useState(answers);

  useEffect(() => {
    setDraft(answers);
  }, [answers]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bonus tiebreakers</Text>
      <Text style={styles.hint}>
        MVP, champion, and ROY — worth 1 pt each when results are set. Breaks ties on the
        leaderboard.
      </Text>
      {questions.map((q) => (
        <View key={q.id} style={styles.row}>
          <Text style={styles.label}>{q.question_text}</Text>
          <TextInput
            style={styles.input}
            placeholder="Your pick (player or team)"
            placeholderTextColor={colors.textMuted}
            value={draft[q.id] ?? ''}
            editable={!locked}
            onChangeText={(text) => setDraft((prev) => ({ ...prev, [q.id]: text }))}
            onEndEditing={() => onChangeAnswer(q.id, draft[q.id] ?? '')}
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
  wrap: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 17,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
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
