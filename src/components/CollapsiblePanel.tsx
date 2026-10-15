import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  title: string;
  hintCollapsed: string;
  hintExpanded?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  wrapStyle?: StyleProp<ViewStyle>;
  toggleStyle?: StyleProp<ViewStyle>;
};

export function CollapsiblePanel({
  title,
  hintCollapsed,
  hintExpanded = 'Tap to hide',
  defaultExpanded = false,
  children,
  wrapStyle,
  toggleStyle,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.wrap, wrapStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.toggle, toggleStyle, pressed && styles.togglePressed]}
      >
        <View style={styles.toggleTextCol}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleHint}>{expanded ? hintExpanded : hintCollapsed}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    fontWeight: '800',
    fontSize: 16,
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  chevron: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    marginTop: 12,
  },
});
