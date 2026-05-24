import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { HeaderBar } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast/toast-store';
import { Copy } from 'lucide-react';

interface ContactRowProps {
  emoji: string;
  label: string;
  value: string;
  iconBg: string;
}

function ContactRow({ emoji, label, value, iconBg }: ContactRowProps) {
  const { t } = useTranslation();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    showToast({ title: t('contactCopiedToast', { value }), message: '', variant: 'success' });
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card px-3.5 py-3 flex items-center gap-3 text-left active:bg-hf-bg-tertiary transition-colors mb-2.5"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl"
        style={{ background: iconBg }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-hf-text-tertiary tracking-[0.04em] font-medium leading-tight">{label}</p>
        <p className="text-[14px] font-medium text-hf-text-primary mt-1 leading-tight truncate">{value}</p>
      </div>
      <Copy className="w-[18px] h-[18px] text-hf-text-tertiary shrink-0" />
    </button>
  );
}

export default function ContactPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary">
      <HeaderBar title={t('contactTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="p-4 max-w-md mx-auto w-full">
          <p className="text-[14px] text-hf-text-secondary leading-relaxed px-1 mb-3.5">
            {t('contactDesc')}
          </p>

          <ContactRow
            emoji="💬"
            label={t('contactChannelTelegram')}
            value="https://t.me/nova_th"
            iconBg="rgba(42,171,238,0.12)"
          />
          <ContactRow
            emoji="📧"
            label={t('contactChannelEmail')}
            value="coresolderwire@gmail.com"
            iconBg="rgba(34,197,94,0.12)"
          />
          <ContactRow
            emoji="🐙"
            label={t('contactChannelGithub')}
            value="https://github.com/zFannur/habit_flow"
            iconBg="rgba(107,114,128,0.12)"
          />
        </div>
      </div>
    </div>
  );
}
