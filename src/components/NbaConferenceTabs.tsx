import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NBA_CONFERENCES, type NbaConferenceId } from '../lib/nbaConferences';
import { colors } from '../theme/colors';

type Props = {
  value: NbaConferenceId;
  onChange: (id: NbaConferenceId) => void;
};

export function NbaConferenceTabs({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {NBA_CONFERENCES.map((conf) => {
        const active = value === conf.id;
        return (
          <Pressable
            key={conf.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(conf.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={conf.title}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {conf.id === 'east' ? 'East' : 'West'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.pickActive,
    borderColor: '#60a5fa',
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
});