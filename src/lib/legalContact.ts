import Constants from 'expo-constants';

/** Shown on Privacy / Terms and for account-deletion requests. */
export const LEGAL_CONTACT_EMAIL = 'finelinesport@gmail.com';

const LEGACY_LEGAL_CONTACT_EMAIL = 'schultzw182@gmail.com';

export function getLegalContactEmail(): string {
  const fromExtra = Constants.expoConfig?.extra?.legalContactEmail;
  if (typeof fromExtra === 'string' && fromExtra.includes('@')) {
    const trimmed = fromExtra.trim();
    if (trimmed.toLowerCase() === LEGACY_LEGAL_CONTACT_EMAIL.toLowerCase()) {
      return LEGAL_CONTACT_EMAIL;
    }
    return trimmed;
  }
  return LEGAL_CONTACT_EMAIL;
}
