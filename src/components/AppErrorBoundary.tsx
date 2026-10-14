import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AppErrorBoundary', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.body}>
              The app hit an error while loading. Try a hard refresh. If this started after a
              deploy, check Vercel env vars (Supabase URL + publishable key) and redeploy.
            </Text>
            <Text style={styles.error} selectable>
              {this.state.error.message}
            </Text>
            <Pressable style={styles.button} onPress={() => this.setState({ error: null })}>
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 48 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  error: {
    color: colors.statusNeedsWork,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontWeight: '800' },
});
