import { StyleSheet, Text, View } from 'react-native';

import type { LeagueBonusQuestionBlock } from '../lib/playerPickDetails';
import { colors } from '../theme/colors';

type Props = {
  blocks: LeagueBonusQuestionBlock[];
};

export function LeagueBonusBoard({ blocks }: Props) {
  if (blocks.length === 0) {
    return (
      <Text style={styles.empty}>No bonus questions for this league yet.</Text>
    );
  }

  return (
    <View style={styles.wrap}>
      {blocks.map((block) => (
        <View key={block.questionId} style={styles.questionBlock}>
          <Text style={styles.questionText}>{block.label}</Text>
          <Text style={styles.questionMeta}>
            {block.pointsWorth} pt tiebreak
            {block.winningAnswer ? ` · Result: ${block.winningAnswer}` : ''}
          </Text>
          {block.answers.map((row) => (
            <View key={row.userId} style={[styles.answerRow, row.isMe && styles.answerRowMe]}>
              <Text style={[styles.memberName, row.isMe && styles.memberNameMe]}>
                {row.displayName}
                {row.isMe ? ' (you)' : ''}
              </Text>
              <Text style={styles.answerValue} numberOfLines={2}>
                {row.answer}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  questionBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  questionText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 20,
  },
  questionMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 10,
    fontWeight: '600',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  answerRowMe: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  memberName: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  memberNameMe: {
    color: colors.accent,
  },
  answerValue: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
});
