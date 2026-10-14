import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const HOME_HREF = '/select-sport' as Href;
const PICKS_HREF = '/' as Href;
const PROFILE_HREF = '/profile' as Href;
const LEAGUES_HREF = '/league-setup' as Href;

export type AppTopMenuActive = 'home' | 'picks' | 'profile' | 'leagues';

type Item = {
  key: AppTopMenuActive;
  label: string;
  href: Href;
};

const ITEMS: Item[] = [
  { key: 'home', label: 'Home', href: HOME_HREF },
  { key: 'picks', label: 'My picks', href: PICKS_HREF },
  { key: 'profile', label: 'Profile', href: PROFILE_HREF },
  { key: 'leagues', label: 'Private leagues', href: LEAGUES_HREF },
];

type Props = {
  active?: AppTopMenuActive;
};

export function AppTopMenu({ active }: Props) {
  return (
    <View style={styles.row}>
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (!isActive) {
                router.push(item.href);
              }
            }}
            style={({ pressed }) => [styles.linkWrap, pressed && !isActive && styles.linkPressed]}
          >
            <Text style={[styles.link, isActive && styles.linkActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  linkWrap: {
    paddingVertical: 2,
  },
  linkPressed: {
    opacity: 0.85,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  linkActive: {
    color: colors.textPrimary,
  },
});
