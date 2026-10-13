import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../lib/errors';
import { LEAGUE_POOL_FIX_HINT } from '../lib/leagueFixHint';
import { canDeleteLeague, deleteLeague } from '../lib/leagues';
import type { League } from '../types/league';
import { colors } from '../theme/colors';

type Props = {
  league: League;
  userId: string | undefined;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onDeleted: () => void | Promise<void>;
  compact?: boolean;
};

export function DeleteLeagueSection({
  league,
  userId,
  busy,
  onBusyChange,
  onDeleted,
  compact = false,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!canDeleteLeague(league, userId)) {
    return null;
  }

  async function onConfirmDelete() {
    onBusyChange(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteLeague(league.id);
      setSuccess(`Deleted "${league.name}".`);
      setConfirming(false);
      await onDeleted();
    } catch (err) {
      const message = getErrorMessage(err, 'Could not delete league');
      const lower = message.toLowerCase();
      if (lower.includes('permission denied') || lower.includes('row-level security')) {
        setError(`${message} ${LEAGUE_POOL_FIX_HINT}`);
      } else if (isMissingDeleteSetup(message)) {
        setError(`${message} Run supabase/08-delete-private-league.sql in Supabase SQL Editor, then try again.`);
      } else {
        setError(message);
      }
    } finally {
      onBusyChange(false);
    }
  }

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        {success ? <Text style={styles.successSmall}>{success}</Text> : null}
        {error ? <Text style={styles.errorSmall}>{error}</Text> : null}
        {confirming ? (
          <View style={styles.compactConfirm}>
            <Text style={styles.compactConfirmText}>Delete this league permanently?</Text>
            <View style={styles.compactActions}>
              <Pressable onPress={() => setConfirming(false)} disabled={busy}>
                <Text style={styles.compactCancel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void onConfirmDelete()} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={colors.textMuted} size="small" />
                ) : (
                  <Text style={styles.compactDelete}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirming(true)} disabled={busy}>
            <Text style={styles.compactLink}>Delete league</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {confirming ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Delete &quot;{league.name}&quot;? All picks and members are removed. This cannot be undone.
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={() => setConfirming(false)} disabled={busy}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => void onConfirmDelete()} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.textSecondary} size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setConfirming(true)} disabled={busy}>
          <Text style={styles.deleteLink}>Delete league…</Text>
        </Pressable>
      )}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function isMissingDeleteSetup(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('delete_private_league') ||
    lower.includes('could not find the function') ||
    lower.includes('schema cache') ||
    lower.includes('not set up')
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteLink: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  confirmBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10, alignItems: 'center' },
  cancel: { paddingVertical: 4 },
  cancelText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  deleteBtn: { paddingVertical: 4 },
  deleteBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  error: { color: colors.statusNeedsWork, marginTop: 8, fontSize: 12, lineHeight: 17 },
  success: { color: colors.statusOnTrack, marginTop: 8, fontSize: 12 },
  compactWrap: { marginTop: 4 },
  compactLink: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  compactConfirm: { marginTop: 4 },
  compactConfirmText: { color: colors.textMuted, fontSize: 12 },
  compactActions: { flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' },
  compactCancel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  compactDelete: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  errorSmall: { color: colors.statusNeedsWork, fontSize: 11, marginTop: 4 },
  successSmall: { color: colors.statusOnTrack, fontSize: 11, marginTop: 4 },
});
