import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { classicFormat, formatColors, stakesFormat } from '../content/overallFormats';
import { colors } from '../theme/colors';

type Props = {
  /** Shorter bullets when expanded (home header) */
  compact?: boolean;
  /** Start collapsed so picks list gets more room */
  defaultExpanded?: boolean;
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

export function OverallFormatsGuide({ compact = false, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
      >
        <View style={styles.toggleTextCol}>
          <Text style={styles.toggleTitle}>Classic vs Stakes</Text>
          <Text style={styles.toggleHint}>
            {expanded ? 'Tap to hide scoring rules' : 'Tap to see how each overall format works'}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  togglePressed: {
    opacity: 0.9,
  },
  toggleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  toggleTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  chevron: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  expanded: {
    gap: 10,
    marginTop: 10,
  },
  block: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  blockStakes: {
    borderWidth: 1,
  },
  stakesStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: formatColors.stakes,
  },
  blockTitleStakes: {
    marginLeft: 2,
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
