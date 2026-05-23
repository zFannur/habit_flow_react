import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { ArrowLeft, Mail, Globe, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-hf-border/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-hf-text-primary" />
        </button>
        <h2 className="text-[17px] font-bold">
          {t('profileMenuContact')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-5 flex flex-col gap-5 max-w-md mx-auto w-full text-[14px]">
        <div>
          <h3 className="text-lg font-bold text-hf-text-primary mb-1">Get in touch</h3>
          <p className="text-hf-text-secondary leading-relaxed">
            Have questions, feedback, or need help? Reach out to the author or follow developer channels.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="https://t.me/habit_flow_channel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl hover:bg-hf-bg-secondary transition-all"
          >
            <MessageSquare className="w-5 h-5 text-hf-accent shrink-0" />
            <div>
              <h4 className="font-bold text-hf-text-primary">Telegram Channel</h4>
              <p className="text-[11px] text-hf-text-secondary mt-0.5">@habit_flow_channel</p>
            </div>
          </a>

          <a
            href="mailto:support@habitflow.app"
            className="flex items-center gap-4 p-4 bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl hover:bg-hf-bg-secondary transition-all"
          >
            <Mail className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <h4 className="font-bold text-hf-text-primary">Support Email</h4>
              <p className="text-[11px] text-hf-text-secondary mt-0.5">support@habitflow.app</p>
            </div>
          </a>

          <a
            href="https://habitflow.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl hover:bg-hf-bg-secondary transition-all"
          >
            <Globe className="w-5 h-5 text-hf-success shrink-0" />
            <div>
              <h4 className="font-bold text-hf-text-primary">Official Website</h4>
              <p className="text-[11px] text-hf-text-secondary mt-0.5">https://habitflow.app</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
