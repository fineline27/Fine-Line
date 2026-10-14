import { Redirect } from 'expo-router';

/** Legacy route — sport picker lives on /home. */
export default function SelectSportScreen() {
  return <Redirect href="/home" />;
}
