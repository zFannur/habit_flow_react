import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { HeaderBar } from '@/shared/ui';

const FIRST_DAY_KEY = 'account.firstDayOfWeek';

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold px-1 pb-2.5">
      {text}
    </p>
  );
}

function RadioRow({ label, selected, onTap }: { label: string; selected: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} className="w-full flex items-center gap-3 py-3 text-left">
      <div
        className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-all ${
          selected ? 'border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
        }`}
      >
        {selected && <div className="w-[10px] h-[10px] rounded-full bg-hf-accent" />}
      </div>
      <span className="text-[15px] font-medium text-hf-text-primary">{label}</span>
    </button>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { state: session } = useSessionStore();
  const user = session.status === 'authenticated' ? session.user : null;

  const savedFirstDay = localStorage.getItem(FIRST_DAY_KEY);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<1 | 7>(
    savedFirstDay === '7' ? 7 : 1,
  );

  const avatarLetter = user ? (user.first_name || 'U').charAt(0).toUpperCase() : 'U';
  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || '—'
    : '—';
  const username = user?.telegram_username ? `@${user.telegram_username}` : '';

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary">
      <HeaderBar title={t('accountTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="p-4 flex flex-col max-w-md mx-auto w-full">

          {/* Telegram */}
          <SectionLabel text={t('accountTelegramSection')} />
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-extrabold select-none shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--hf-accent, #3B82F6), #6366F1)' }}
              >
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-hf-text-primary truncate leading-tight">{displayName}</p>
                {username && (
                  <p className="text-[12px] text-hf-text-tertiary mt-0.5">{username}</p>
                )}
              </div>
            </div>
          </div>

          {/* Language */}
          <SectionLabel text={t('accountLanguageSection')} />
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mb-4">
            <RadioRow label={t('languageRussian')} selected={locale === 'ru'} onTap={() => setLocale('ru')} />
            <div className="h-px bg-hf-border" />
            <RadioRow label={t('languageEnglish')} selected={locale === 'en'} onTap={() => setLocale('en')} />
          </div>

          {/* First Day of Week */}
          <SectionLabel text={t('accountFirstDaySection')} />
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mb-4">
            <RadioRow label={t('accountFirstDayMonday')} selected={firstDayOfWeek === 1} onTap={() => { setFirstDayOfWeek(1); localStorage.setItem(FIRST_DAY_KEY, '1'); }} />
            <div className="h-px bg-hf-border" />
            <RadioRow label={t('accountFirstDaySunday')} selected={firstDayOfWeek === 7} onTap={() => { setFirstDayOfWeek(7); localStorage.setItem(FIRST_DAY_KEY, '7'); }} />
          </div>

        </div>
      </div>
    </div>
  );
}
