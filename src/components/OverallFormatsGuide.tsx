import { StyleSheet, Text, View } from 'react-native';

import { classicFormat, formatColors, stakesFormat } from '../content/overallFormats';
import { colors } from '../theme/colors';

type Props = {
  /** Shorter copy for the home header */
  compact?: boolean;
};

function FormatBlock({
  title,
  tagline,
  bullets,
  accent,
  accentBg,
  compact,
}: {
  title: string;
  tagline: string;
  bullets: readonly string[];
  accent: string;
  accentBg: string;
  compact?: boolean;
}) {
  const isStakes = title === 'Stakes';
  const shown = compact ? bullets.slice(0, 2) : bullets;
  return (
    <View
      style={[
        styles.block,
        { borderColor: accent, backgroundColor: accentBg },
        isStakes && styles.blockStakes,
      ]}
    >
      {isStakes ? <View style={styles.stakesStripe} /> : null}
      <Text style={[styles.blockTitle, { color: accent }, isStakes && styles.blockTitleStakes]}>
        {title}
      </Text>
      <Text style={styles.blockTagline}>{tagline}</Text>
      {shown.map((line) => (
        <Text key={line} style={[styles.bullet, compact && styles.bulletCompact]}>
          · {line}
        </Text>
      ))}
    </View>
  );
}

export function OverallFormatsGuide({ compact }: Props) {
  return (
    <View style={styles.wrap}>
      {!compact ? (
        <Text style={styles.heading}>Two overall formats</Text>
      ) : (
        <Text style={styles.headingCompact}>Classic vs Stakes</Text>
      )}
      <FormatBlock
        title={classicFormat.title}
        tagline={classicFormat.tagline}
        bullets={classicFormat.bullets}
        accent={formatColors.classic}
        accentBg={formatColors.classicBg}
        compact={compact}
      />
      <FormatBlock
        title={stakesFormat.title}
        tagline={stakesFormat.tagline}
        bullets={stakesFormat.bullets}
        accent={formatColors.stakes}
        accentBg={formatColors.stakesBg}
        compact={compact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  headingCompact: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  block: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  blockStakes: {
    borderWidth: 2,
    paddingVertical: 14,
  },
  stakesStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: formatColors.stakesStrong,
  },
  blockTitleStakes: {
    fontSize: 17,
    marginLeft: 4,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  blockTagline: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  bullet: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  bulletCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
