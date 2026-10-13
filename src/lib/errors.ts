export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      const details = typeof record.details === 'string' ? record.details : '';
      const hint = typeof record.hint === 'string' ? record.hint : '';
      const code = typeof record.code === 'string' ? record.code : '';
      const parts = [message.trim()];
      if (details) {
        parts.push(details);
      }
      if (hint) {
        parts.push(hint);
      }
      if (code) {
        parts.push(`(${code})`);
      }
      return parts.join(' — ');
    }
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }
  return fallback;
}
