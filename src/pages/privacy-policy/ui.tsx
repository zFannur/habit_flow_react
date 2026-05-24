import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { HeaderBar } from '@/shared/ui';

interface SectionCardProps {
  label: string;
  body: string;
}

function SectionCard({ label, body }: SectionCardProps) {
  return (
    <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mb-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mb-2">
        {label}
      </p>
      <p className="text-[14px] text-hf-text-primary leading-relaxed">{body}</p>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary">
      <HeaderBar title={t('privacyTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="p-4 max-w-md mx-auto w-full">
          <SectionCard label={t('privacyAuthLabel')} body={t('privacyAuthText')} />
          <SectionCard label={t('privacyStorageLabel')} body={t('privacyStorageText')} />
          <SectionCard label={t('privacyKeyLabel')} body={t('privacyKeyText')} />
          <SectionCard label={t('privacyNotCollectLabel')} body={t('privacyNotCollectText')} />
          <SectionCard label={t('privacyDeletionLabel')} body={t('privacyDeletionText')} />
          <SectionCard label={t('privacyContactLabel')} body={t('privacyContactText')} />
        </div>
      </div>
    </div>
  );
}
