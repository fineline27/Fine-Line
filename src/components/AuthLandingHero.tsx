import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const FEATURES = [
  { kicker: 'Pick', title: 'Every NBA win total', detail: 'OVER or UNDER all 30 teams' },
  { kicker: 'Play', title: 'Leagues with mates', detail: 'Submit picks, then see the board' },
  { kicker: 'Win', title: 'Live standings', detail: 'Rank shifts as the season rolls' },
] as const;

export function AuthLandingHero() {
  return (
    <View style={styles.wrap}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <Text style={styles.eyebrow}>Season-long sports picks</Text>
      <Text style={styles.brandFine}>Fine</Text>
      <Text style={styles.brandLine}>Line</Text>

      <Text style={styles.headline}>
        Predict results and play against your mates.{' '}
        <Text style={styles.headlineAccent}>Who knows more sport??</Text>
      </Text>

      <View style={styles.demoCard}>
        <View style={styles.demoTop}>
          <Text style={styles.demoTeam}>OKC Thunder</Text>
          <View style={styles.demoOu}>
            <Text style={styles.demoOuLabel}>O/U</Text>
            <Text style={styles.demoOuValue}>62.5</Text>
          </View>
        </View>
        <View style={styles.demoPills}>
          <View style={[styles.demoPill, styles.demoPillOver]}>
            <Text style={styles.demoPillText}>OVER</Text>
          </View>
          <View style={styles.demoPill}>
            <Text style={styles.demoPillTextMuted}>UNDER</Text>
          </View>
        </View>
        <Text style={styles.demoCaption}>One line. One call. Bragging rights all season.</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((item) => (
          <View key={item.kicker} style={styles.feature}>
            <Text style={styles.featureKicker}>{item.kicker}</Text>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDetail}>{item.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const brandSize = Platform.select({ web: 96, default: 72 }) ?? 72;

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    paddingBottom: 8,
  },
  glowA: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
  },
  glowB: {
    position: 'absolute',
    top: 80,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  brandFine: {
    color: colors.textPrimary,
    fontSize: brandSize,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: brandSize * 0.92,
  },
  brandLine: {
    color: colors.textPrimary,
    fontSize: brandSize,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: brandSize * 0.92,
    marginBottom: 16,
  },
  headline: {
    color: colors.textSecondary,
    fontSize: Platform.select({ web: 22, default: 19 }) ?? 19,
    lineHeight: Platform.select({ web: 30, default: 27 }) ?? 27,
    fontWeight: '600',
    maxWidth: 520,
  },
  headlineAccent: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  demoCard: {
    marginTop: 22,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  demoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoTeam: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  demoOu: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  demoOuLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  demoOuValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  demoPills: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  demoPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.pickInactive,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoPillOver: {
    backgroundColor: colors.pickActive,
    borderColor: '#60a5fa',
  },
  demoPillText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  demoPillTextMuted: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  demoCaption: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  features: {
    marginTop: 20,
    gap: 10,
  },
  feature: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  featureKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  featureDetail: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
