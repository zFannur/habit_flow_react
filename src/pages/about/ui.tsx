import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { HeaderBar } from '@/shared/ui';

function SectionCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 w-full">
      <p className="text-[11px] uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mb-2">{label}</p>
      <p className="text-[14px] text-hf-text-primary leading-relaxed">{body}</p>
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary">
      <HeaderBar title={t('aboutTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="p-4 flex flex-col gap-4 max-w-md mx-auto w-full items-center pt-6">

          {/* App icon */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--hf-accent, #3B82F6), #7C3AED)',
              boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
            }}
          >
            <span className="text-[44px] leading-none">🌱</span>
          </div>

          <h2 className="text-[26px] font-bold text-hf-text-primary tracking-tight -mt-1">HabitFlow</h2>
          <p className="text-[12px] text-hf-text-tertiary -mt-3">{t('aboutVersion', { version: '1.0.0' })}</p>

          <SectionCard label={t('aboutWhatLabel')} body={t('aboutWhatText')} />
          <SectionCard label={t('aboutPrinciplesLabel')} body={t('aboutPrinciplesText')} />

        </div>
      </div>
    </div>
  );
}
