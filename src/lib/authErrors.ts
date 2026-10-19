import { AuthError } from '@supabase/supabase-js';

import { getErrorMessage } from './errors';
import { USERNAME_TAKEN_MESSAGE } from './usernames';

/** Maps Supabase Auth sign-up failures to clearer copy (trigger errors are often generic). */
export function mapSignUpError(err: unknown): string {
  const captcha = mapCaptchaAuthError(err);
  if (captcha) {
    return captcha;
  }

  const message = getErrorMessage(err, 'Sign up failed');
  const lower = message.toLowerCase();

  if (lower.includes('username is already taken')) {
    return USERNAME_TAKEN_MESSAGE;
  }

  if (err instanceof AuthError && err.status === 422 && lower.includes('database error')) {
    return `${USERNAME_TAKEN_MESSAGE}. If you already tried another name, ask the site admin to run supabase/14-fix-signup-database-error.sql in Supabase.`;
  }

  if (lower.includes('database error saving new user') || lower.includes('database error')) {
    return `${USERNAME_TAKEN_MESSAGE}. If the problem continues, the sign-up database script may need to be updated in Supabase (see supabase/14-fix-signup-database-error.sql).`;
  }

  return message;
}

export function mapSignInError(err: unknown): string {
  return mapCaptchaAuthError(err) ?? getErrorMessage(err, 'Sign in failed');
}

function mapCaptchaAuthError(err: unknown): string | null {
  const message = getErrorMessage(err, '');
  const lower = message.toLowerCase();
  if (
    lower.includes('captcha') ||
    lower.includes('turnstile') ||
    (err instanceof AuthError && err.status === 422 && lower.includes('verification'))
  ) {
    return 'Security check failed or expired. Complete the Cloudflare verification below, then try again.';
  }
  return null;
}
