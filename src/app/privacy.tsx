import { LegalDocumentScreen } from '../components/LegalDocumentScreen';
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from '../content/legal';
import { getLegalContactEmail } from '../lib/legalContact';

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={PRIVACY_SECTIONS}
      contactEmail={getLegalContactEmail()}
    />
  );
}
