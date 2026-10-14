import { Redirect } from 'expo-router';

/** @deprecated Use the Home tab at `/home` — kept for old links and bookmarks. */
export default function SelectSportRedirectScreen() {
  return <Redirect href="/home" />;
}
