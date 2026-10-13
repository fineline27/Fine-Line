import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

type Section = { title: string; body: string };

type Props = {
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactEmail: string | null;
};

export function LegalDocumentScreen({ title, lastUpdated, sections, contactEmail }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.docTitle}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: {lastUpdated}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
        {contactEmail ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.sectionBody}>
              Privacy and account requests: {contactEmail}
            </Text>
          </View>
        ) : (
          <Text style={styles.contactMissing}>
            Set EXPO_PUBLIC_LEGAL_CONTACT_EMAIL in your environment so users can reach you for
            account deletion and privacy requests.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  docTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  updated: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  contactMissing: {
    color: colors.statusNeedsWork,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
