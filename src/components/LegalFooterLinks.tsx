import { Link, type Href } from 'expo-router';

const PRIVACY_HREF = '/privacy' as Href;
const TERMS_HREF = '/terms' as Href;
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  compact?: boolean;
};

export function LegalFooterLinks({ compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.disclaimer}>
        Not affiliated with the NBA or any team. For entertainment only — no cash wagering.
      </Text>
      <View style={styles.links}>
        <Link href={PRIVACY_HREF}>
          <Text style={styles.link}>Privacy</Text>
        </Link>
        <Text style={styles.sep}>·</Text>
        <Link href={TERMS_HREF}>
          <Text style={styles.link}>Terms</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  wrapCompact: {
    marginTop: 12,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  sep: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
