import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          {t('profileMenuPrivacy')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4 max-w-md mx-auto w-full text-[13.5px] leading-relaxed text-hf-text-secondary">
        <h3 className="text-[16px] font-bold text-hf-text-primary mb-1">Your Key, Your Data</h3>
        <p>
          At HabitFlow, we strongly respect your privacy.
        </p>
        <h4 className="font-bold text-hf-text-primary mt-3">1. Data Storage</h4>
        <p>
          All your local habit check marks, journal entries, and AI assistant chats are synchronized and stored securely using **Supabase** database tables. They are only visible to your authenticated user account.
        </p>
        <h4 className="font-bold text-hf-text-primary mt-3">2. API Keys and LLM Chats</h4>
        <p>
          Your OpenRouter API key is stored locally in your browser's private localStorage. We do not store or transmit your API keys to our servers. All AI completions are made directly from your client application to OpenRouter.
        </p>
        <h4 className="font-bold text-hf-text-primary mt-3">3. External Processing</h4>
        <p>
          AI features send selected journal and habit logs to OpenRouter and the chosen LLM model provider. Never write anything in your daily reflection journal that you are not comfortable sharing with these services.
        </p>
      </div>
    </div>
  );
}
