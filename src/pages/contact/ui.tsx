import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { ArrowLeft, Mail, Globe, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-tg-hint/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-tg-secondary-bg hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-tg-text" />
        </button>
        <h2 className="text-[17px] font-bold">
          {t('profileMenuContact')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-5 flex flex-col gap-5 max-w-md mx-auto w-full text-[14px]">
        <div>
          <h3 className="text-lg font-bold text-tg-text mb-1">Get in touch</h3>
          <p className="text-tg-hint leading-relaxed">
            Have questions, feedback, or need help? Reach out to the author or follow developer channels.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="https://t.me/habit_flow_channel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl hover:bg-tg-secondary-bg transition-all"
          >
            <MessageSquare className="w-5 h-5 text-tg-accent shrink-0" />
            <div>
              <h4 className="font-bold text-tg-text">Telegram Channel</h4>
              <p className="text-[11px] text-tg-hint mt-0.5">@habit_flow_channel</p>
            </div>
          </a>

          <a
            href="mailto:support@habitflow.app"
            className="flex items-center gap-4 p-4 bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl hover:bg-tg-secondary-bg transition-all"
          >
            <Mail className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <h4 className="font-bold text-tg-text">Support Email</h4>
              <p className="text-[11px] text-tg-hint mt-0.5">support@habitflow.app</p>
            </div>
          </a>

          <a
            href="https://habitflow.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl hover:bg-tg-secondary-bg transition-all"
          >
            <Globe className="w-5 h-5 text-tg-success shrink-0" />
            <div>
              <h4 className="font-bold text-tg-text">Official Website</h4>
              <p className="text-[11px] text-tg-hint mt-0.5">https://habitflow.app</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
