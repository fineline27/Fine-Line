import Constants from 'expo-constants';

export function getLegalContactEmail(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.legalContactEmail;
  if (typeof fromExtra === 'string' && fromExtra.includes('@')) {
    return fromExtra.trim();
  }
  return null;
}
