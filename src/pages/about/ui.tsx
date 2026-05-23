import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
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
          {t('profileMenuAbout')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4 max-w-md mx-auto w-full text-[14px] leading-relaxed text-hf-text-secondary">
        <h3 className="text-lg font-bold text-hf-text-primary">HabitFlow v1.0.0</h3>
        <p>
          HabitFlow is a modern Telegram Mini App designed to help you build stable habits, write daily reflections, and gain AI-powered insights about your routines.
        </p>
        <p>
          By combining behavioral science rules (like James Clear's Atomic Habits: Habit Stacking, Implementation Intentions, and the 2-Minute Rule) with modern LLM analysis, HabitFlow guides you step-by-step to permanent personal growth.
        </p>
        <h4 className="font-bold text-hf-text-primary mt-3">Features:</h4>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1.5">
          <li>Atomic habits configuration (Anchors, 2-Min fallbacks).</li>
          <li>Detailed daily reflection journal (Mood & Energy).</li>
          <li>Bring Your Own Key (BYO-Key) OpenRouter AI assistant chat.</li>
          <li>Aggregated completion analytics and weekly reviews.</li>
          <li>Fully integrated with Telegram Webview safe areas and haptics.</li>
        </ul>
      </div>
    </div>
  );
}
