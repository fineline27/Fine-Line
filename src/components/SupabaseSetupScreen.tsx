import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export function SupabaseSetupScreen() {
  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Fine Line</Text>
        <Text style={styles.subtitle}>Site configuration needed</Text>
        <Text style={styles.body}>
          This build is missing Supabase settings, so login and picks cannot run. On Vercel, open
          your project → Settings → Environment Variables and set:
        </Text>
        <Text style={styles.code} selectable>
          EXPO_PUBLIC_SUPABASE_URL{'\n'}
          EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        </Text>
        <Text style={styles.body}>
          Redeploy after saving. Use the deployment URL from the Fine Line (NBA) Vercel project —
          not unrelated sites on similar domains.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 48, maxWidth: 520, alignSelf: 'center', width: '100%' },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.statusNeedsWork, fontSize: 16, fontWeight: '700', marginTop: 8 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 16 },
  code: {
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
