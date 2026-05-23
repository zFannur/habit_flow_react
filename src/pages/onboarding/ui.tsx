import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useCreateHabitMutation, dateOnly } from '@/entities/habit';
import { ArrowLeft } from 'lucide-react';

interface OnboardingTemplate {
  emoji: string;
  nameRu: string;
  nameEn: string;
  subRu: string;
  subEn: string;
  isAnti?: boolean;
}

const TEMPLATES: OnboardingTemplate[] = [
  { emoji: '💧', nameRu: 'Пить воду', nameEn: 'Drink water', subRu: '8 раз в день', subEn: '8 times a day' },
  { emoji: '🧘', nameRu: 'Медитация', nameEn: 'Meditation', subRu: '10 мин утром', subEn: '10 min morning' },
  { emoji: '🚶', nameRu: 'Прогулка', nameEn: 'Walk', subRu: '30 мин', subEn: '30 min' },
  { emoji: '🚭', nameRu: 'Без курения', nameEn: 'No smoking', subRu: 'Анти-привычка', subEn: 'Anti-habit', isAnti: true },
  { emoji: '📚', nameRu: 'Чтение', nameEn: 'Reading', subRu: '20 мин перед сном', subEn: '20 min before bed' },
  { emoji: '✍️', nameRu: 'Дневник', nameEn: 'Journal', subRu: 'Каждый вечер', subEn: 'Every evening' },
  { emoji: '💪', nameRu: 'Спорт', nameEn: 'Exercise', subRu: '3 раза в неделю', subEn: '3x per week' },
  { emoji: '🌅', nameRu: 'Ранний подъём', nameEn: 'Early rise', subRu: 'до 7:00', subEn: 'Before 7:00' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [step, setStep] = useState(0);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const createHabitMutation = useCreateHabitMutation(userId || '');

  const totalSteps = 5;

  const handleNext = async () => {
    // Creating habits on step 3 (templates page)
    if (step === 3 && selectedTemplates.size > 0 && !submitting) {
      setSubmitting(true);
      try {
        const templatesToCreate = Array.from(selectedTemplates).map((idx) => TEMPLATES[idx]!);
        for (const tpl of templatesToCreate) {
          try {
            await createHabitMutation.mutateAsync({
              name: locale === 'en' ? tpl.nameEn : tpl.nameRu,
              habit_type: tpl.isAnti ? 'anti' : 'binary',
              icon_emoji: tpl.emoji,
              color: '#3B82F6',
              schedule_type: 'daily',
              schedule_config: {},
              reminder_times: [],
              start_date: dateOnly(new Date()),
              is_archived: false,
              position: 0,
            });
          } catch (err) {
            console.error(`Failed to create template habit "${tpl.nameEn}":`, err);
          }
        }
      } catch (err) {
        console.error('Failed to create onboarding habits:', err);
      } finally {
        setSubmitting(false);
      }
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Last step: mark seen and go to Today
      localStorage.setItem('onboarding.seen', 'true');
      navigate('/today', { replace: true });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    setStep(totalSteps - 1);
  };

  const toggleTemplate = (idx: number) => {
    const next = new Set(selectedTemplates);
    if (next.has(idx)) {
      next.delete(idx);
    } else if (next.size < 3) {
      next.add(idx);
    }
    setSelectedTemplates(next);
  };

  const renderSlide = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="flex justify-end mt-2">
              <div className="bg-hf-bg-secondary border border-hf-border/10 rounded-xl p-0.5 flex gap-0.5">
                <button
                  onClick={() => setLocale('ru')}
                  className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                    locale === 'ru' ? 'bg-hf-card text-hf-accent shadow-sm' : 'text-hf-text-secondary'
                  }`}
                >
                  🇷🇺 RU
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                    locale === 'en' ? 'bg-hf-card text-hf-accent shadow-sm' : 'text-hf-text-secondary'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-[80px] leading-none">🌱</span>
              <h1 className="text-[34px] font-bold tracking-tight mt-6 text-hf-text-primary">
                HabitFlow
              </h1>
              <p className="text-[16px] text-hf-text-secondary mt-2 max-w-xs leading-normal">
                {t('onboardingS1Sub')}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-hf-accent hover:opacity-90 active:scale-[0.99] text-white font-bold text-[16px] py-4 rounded-2xl transition-all"
            >
              {t('onboardingBegin')}
            </button>
          </div>
        );

      case 1:
        return (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="flex-1 flex flex-col justify-center gap-6">
              {/* Concentric Circles Visual */}
              <div className="flex justify-center relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 rounded-full border border-hf-accent/15" />
                <div className="absolute inset-4 rounded-full border border-hf-accent/15" />
                <div className="absolute inset-8 rounded-full border border-hf-accent/15" />
                <div className="absolute inset-12 rounded-full border border-hf-accent/50" />
                <div className="absolute inset-[68px] rounded-full bg-hf-accent shadow-md flex items-center justify-center text-[22px] text-white font-bold">
                  🧑
                </div>
                <span className="absolute top-[20%] right-[-5%] text-[10px] font-bold text-hf-text-secondary uppercase tracking-wider">
                  {t('onboardingS2LabelHabits')}
                </span>
                <span className="absolute bottom-[25%] right-[-10%] text-[10px] font-bold text-hf-text-secondary uppercase tracking-wider">
                  {t('onboardingS2LabelActions')}
                </span>
                <span className="absolute bottom-[10%] left-[-5%] text-[10px] font-bold text-hf-text-secondary uppercase tracking-wider">
                  {t('onboardingS2LabelIdentity')}
                </span>
              </div>

              <div>
                <h2 className="text-[24px] font-bold tracking-tight text-hf-text-primary">
                  {t('onboardingS2Title')}
                </h2>
                <p className="text-[14px] text-hf-text-secondary mt-3 leading-relaxed">
                  {t('onboardingS2P1')}
                </p>
                <p className="text-[14px] text-hf-text-secondary mt-2.5 leading-relaxed">
                  {t('onboardingS2P2')}
                </p>
              </div>

              <blockquote className="border-l-3 border-hf-accent pl-4 italic text-[13px] text-hf-text-secondary">
                <p>{t('onboardingS2Quote')}</p>
                <cite className="block mt-1 font-semibold not-italic text-[11px] text-hf-text-secondary/70 uppercase">
                  {t('onboardingS2Author')}
                </cite>
              </blockquote>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-hf-accent hover:opacity-90 active:scale-[0.99] text-white font-bold text-[16px] py-4 rounded-2xl transition-all"
            >
              {t('commonNext')}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="flex-1 flex flex-col justify-center gap-6">
              <div>
                <h2 className="text-[26px] font-bold tracking-tight text-hf-text-primary leading-tight">
                  {t('onboardingS3Title')}
                </h2>
                <p className="text-[14px] text-hf-text-secondary mt-2 leading-relaxed">
                  {t('onboardingS3Sub')}
                </p>
              </div>

              {/* Path Option 1 */}
              <button
                onClick={handleNext}
                className="w-full text-left bg-hf-accent/4 border border-hf-accent hover:bg-hf-accent/8 p-4 rounded-2xl flex items-center gap-4 transition-all"
              >
                <div className="w-11 h-11 bg-hf-accent/12 rounded-xl flex items-center justify-center text-[22px]">
                  ✨
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-hf-text-primary">
                    {t('onboardingS3Templates')}
                  </h4>
                  <p className="text-[12px] text-hf-text-secondary mt-0.5">
                    {t('onboardingS3TemplatesSub')}
                  </p>
                </div>
                <span className="bg-hf-accent/12 text-hf-accent font-semibold text-[11px] px-2.5 py-1 rounded-full uppercase">
                  {t('onboardingS3BadgeRecommended')}
                </span>
              </button>

              {/* Path Option 2 */}
              <button
                onClick={handleNext}
                className="w-full text-left bg-hf-card border border-hf-border/15 hover:bg-hf-bg-secondary p-4 rounded-2xl flex items-center gap-4 transition-all"
              >
                <div className="w-11 h-11 bg-hf-bg-secondary rounded-xl flex items-center justify-center text-[22px]">
                  ✏️
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-hf-text-primary">
                    {t('onboardingS3Custom')}
                  </h4>
                  <p className="text-[12px] text-hf-text-secondary mt-0.5">
                    {t('onboardingS3CustomSub')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-[24px] font-bold tracking-tight text-hf-text-primary">
                  {t('onboardingS4Title')}
                </h2>
                <p className="text-[12px] text-hf-text-secondary mt-1">
                  {t('onboardingS4Max')} · {t('onboardingS4Selected', { count: selectedTemplates.size })}/3
                </p>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                {TEMPLATES.map((tpl, idx) => {
                  const isSelected = selectedTemplates.has(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleTemplate(idx)}
                      className={`relative text-center border p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'border-hf-accent bg-hf-accent/6'
                          : 'border-hf-border/15 bg-hf-card hover:bg-hf-bg-secondary'
                      }`}
                    >
                      <span className="text-[28px] leading-none">{tpl.emoji}</span>
                      <span className="text-[13px] font-semibold text-hf-text-primary mt-1">
                        {locale === 'en' ? tpl.nameEn : tpl.nameRu}
                      </span>
                      <span className="text-[10px] text-hf-text-secondary">
                        {locale === 'en' ? tpl.subEn : tpl.subRu}
                      </span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-[18px] h-[18px] bg-hf-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={selectedTemplates.size === 0}
              className={`w-full font-bold text-[16px] py-4 rounded-2xl mt-6 transition-all ${
                selectedTemplates.size === 0
                  ? 'bg-hf-accent/30 text-white/50 cursor-not-allowed'
                  : 'bg-hf-accent hover:opacity-90 active:scale-[0.99] text-white'
              }`}
            >
              {t('onboardingS4Btn')}
            </button>
          </div>
        );

      case 4:
        return (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="flex-1 flex flex-col justify-center gap-6 overflow-y-auto">
              <div className="flex justify-center shrink-0">
                <div className="w-24 h-24 bg-hf-accent/10 rounded-full flex items-center justify-center text-[42px] leading-none shadow-inner">
                  🔔
                </div>
              </div>

              <div>
                <h2 className="text-[24px] font-bold tracking-tight text-hf-text-primary">
                  {t('onboardingS5Title')}
                </h2>
                <p className="text-[14px] text-hf-text-secondary mt-2.5 leading-relaxed">
                  {t('onboardingS5Text')}
                </p>
              </div>

              {/* Bot Mock Preview */}
              <div className="bg-hf-bg-secondary rounded-2xl p-4 flex flex-col gap-2.5">
                <span className="text-[9px] font-bold text-hf-text-secondary tracking-wider uppercase">
                  Telegram
                </span>
                
                <div className="bg-blue-50/70 p-3.5 rounded-2xl flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[16px] text-white shrink-0">
                    🤖
                  </div>
                  <div className="flex-1">
                    <h5 className="text-[12px] font-bold text-hf-accent leading-none">
                      {t('onboardingS5BotName')}
                    </h5>
                    
                    {/* Chat bubble */}
                    <div className="bg-white p-3.5 rounded-xl rounded-tl-sm shadow-sm mt-2 flex flex-col gap-2 text-black max-w-[240px]">
                      <p className="text-[12px] leading-relaxed font-medium">
                        {t('onboardingS5TgMsg')}
                      </p>
                      <span className="text-[8px] text-hf-text-secondary self-end mt-0.5">
                        09:00 ✓✓
                      </span>
                      <div className="flex gap-2 mt-2">
                        <span className="flex-1 bg-hf-accent/12 text-hf-accent text-[11px] font-bold py-1.5 rounded-lg text-center leading-none">
                          {t('onboardingS5DoneBtn')}
                        </span>
                        <span className="flex-1 bg-hf-accent/12 text-hf-accent text-[11px] font-bold py-1.5 rounded-lg text-center leading-none">
                          {t('onboardingS5SkipBtn')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-hf-accent hover:opacity-90 active:scale-[0.99] text-white font-bold text-[16px] py-4 rounded-2xl transition-all"
            >
              {t('onboardingFinish')}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center px-5 py-4 shrink-0">
        <div className="w-9 h-9 shrink-0">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] flex items-center justify-center border border-hf-border/10 transition-all text-hf-text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isActive = i === step;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-5 bg-hf-accent' : 'w-1.5 bg-hf-text-secondary/20'
                }`}
              />
            );
          })}
        </div>

        {/* Skip button */}
        <div className="w-[60px] text-right shrink-0">
          {step >= 1 && step <= 3 && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-[13px] font-semibold text-hf-text-secondary hover:text-hf-accent transition-all"
            >
              {t('onboardingSkip')}
            </button>
          )}
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderSlide()}
      </div>
    </div>
  );
}
