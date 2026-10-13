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
};

export function DeleteLeagueSection({ league, userId, busy, onBusyChange, onDeleted }: Props) {
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

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Delete this league</Text>
      <Text style={styles.hint}>
        Only the owner can delete a private league. All members, picks, and bonus answers are removed
        permanently.
      </Text>
      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {confirming ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Delete &quot;{league.name}&quot; ({league.invite_code})? This cannot be undone.
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.cancel}
              onPress={() => setConfirming(false)}
              disabled={busy}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => void onConfirmDelete()} disabled={busy}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete permanently</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.deleteLink} onPress={() => setConfirming(true)} disabled={busy}>
          <Text style={styles.deleteLinkText}>Delete league…</Text>
        </Pressable>
      )}
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
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.statusNeedsWork,
    backgroundColor: colors.statusNeedsWorkBg,
  },
  title: { color: colors.statusNeedsWork, fontWeight: '800', fontSize: 16 },
  hint: { color: colors.textSecondary, marginTop: 8, fontSize: 13, lineHeight: 19 },
  deleteLink: { marginTop: 12, alignSelf: 'flex-start' },
  deleteLinkText: { color: colors.statusNeedsWork, fontWeight: '800', fontSize: 15 },
  confirmBox: { marginTop: 12 },
  confirmText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textPrimary, fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.statusNeedsWork,
  },
  deleteBtnText: { color: '#fff', fontWeight: '800' },
  error: { color: colors.statusNeedsWork, marginTop: 10, fontSize: 13, lineHeight: 18 },
  success: { color: colors.statusOnTrack, marginTop: 10, fontWeight: '700' },
});
