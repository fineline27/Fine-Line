import { LegalDocumentScreen } from '../components/LegalDocumentScreen';
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '../content/legal';
import { getLegalContactEmail } from '../lib/legalContact';

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={TERMS_SECTIONS}
      contactEmail={getLegalContactEmail()}
    />
  );
}
