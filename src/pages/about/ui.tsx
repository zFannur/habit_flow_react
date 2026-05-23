import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { HeaderBar } from '@/shared/ui';

export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary overflow-y-auto">
      <HeaderBar title={t('aboutTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full items-center">
        {/* App Icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-hf-accent to-[#7C3AED] shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex items-center justify-center mt-6">
          <span className="text-[44px] leading-none">🌱</span>
        </div>

        {/* Title & Version */}
        <h2 className="text-[26px] font-bold text-hf-text-primary tracking-tight">HabitFlow</h2>
        <p className="text-[12px] text-hf-text-tertiary -mt-3">{t('aboutVersion', { version: '1.0.0' })}</p>

        {/* What is HabitFlow */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 w-full mt-2">
          <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold mb-2">{t('aboutWhatLabel')}</p>
          <p className="text-[14px] text-hf-text-primary leading-relaxed">{t('aboutWhatText')}</p>
        </div>

        {/* Principles */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 w-full">
          <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold mb-2">{t('aboutPrinciplesLabel')}</p>
          <p className="text-[14px] text-hf-text-primary leading-relaxed">{t('aboutPrinciplesText')}</p>
        </div>

        {/* Tech Stack */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 w-full">
          <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold mb-2">{t('privacyStorageLabel')}</p>
          <p className="text-[14px] text-hf-text-primary leading-relaxed">
            Flutter 3.27+ · Riverpod · go_router · Supabase · Edge Functions (Deno) · OpenRouter API · pg_cron · aiogram 3 · freezed
          </p>
        </div>

        {/* Open Source */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 w-full">
          <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold mb-2">{t('aboutSourceLink')}</p>
          <p className="text-[14px] text-hf-text-primary leading-relaxed">
            {t('aboutSpecHint')} ·{' '}
            <a href="https://t.me/habitflow_dev" target="_blank" rel="noopener noreferrer" className="text-hf-accent underline">{t('aboutChannelLink')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
