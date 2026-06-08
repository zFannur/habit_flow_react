import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useCreateHabitMutation } from '@/entities/habit';
import { showToast } from '@/shared/ui';

interface OnboardingTemplate {
  emoji: string;
  nameRu: string;
  nameEn: string;
  subRu: string;
  subEn: string;
}

const TEMPLATES: OnboardingTemplate[] = [
  { emoji: '💧', nameRu: 'Пить воду', nameEn: 'Drink water', subRu: '8 раз в день', subEn: '8 times a day' },
  { emoji: '🧘', nameRu: 'Медитация', nameEn: 'Meditation', subRu: '10 мин утром', subEn: '10 min morning' },
  { emoji: '🚶', nameRu: 'Прогулка', nameEn: 'Walk', subRu: '30 мин', subEn: '30 min' },
  { emoji: '🚭', nameRu: 'Без курения', nameEn: 'No smoking', subRu: 'Анти-привычка', subEn: 'Anti-habit' },
  { emoji: '📚', nameRu: 'Чтение', nameEn: 'Reading', subRu: '20 мин перед сном', subEn: '20 min before bed' },
  { emoji: '✍️', nameRu: 'Дневник', nameEn: 'Journal', subRu: 'Каждый вечер', subEn: 'Every evening' },
  { emoji: '💪', nameRu: 'Спорт', nameEn: 'Exercise', subRu: '3 раза в неделю', subEn: '3x per week' },
  { emoji: '🌅', nameRu: 'Ранний подъём', nameEn: 'Early rise', subRu: 'до 7:00', subEn: 'Before 7:00' },
];

const TOTAL = 5;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<'ru' | 'en'>(locale as 'ru' | 'en');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const createHabitMutation = useCreateHabitMutation(userId || '');

  const dateOnly = (d: Date) => d.toISOString().split('T')[0]!;

  const handleNext = async () => {
    if (step === 0) {
      setLocale(lang);
    }

    if (step === 3 && selectedTemplates.size > 0 && !submitting) {
      if (!userId) {
        showToast({
          title: t('onboardingHabitsError'),
          message: 'No active session (userId missing).',
          variant: 'warning',
        });
      } else {
        setSubmitting(true);
        const failures: string[] = [];
        try {
          const toCreate = Array.from(selectedTemplates).map((i) => TEMPLATES[i]!);
          for (const tpl of toCreate) {
            try {
              await createHabitMutation.mutateAsync({
                name: lang === 'en' ? tpl.nameEn : tpl.nameRu,
                habit_type: tpl.emoji === '🚭' ? 'anti' : 'binary',
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
              failures.push(err instanceof Error ? err.message : String(err));
              console.error('Failed to create template habit:', err);
            }
          }
        } finally {
          setSubmitting(false);
        }
        if (failures.length > 0) {
          // Показываем реальную ошибку Supabase вместо молчаливого провала —
          // обычно это RLS/JWT (см. setSession в session store).
          showToast({
            title: t('onboardingHabitsError'),
            message: failures[0]!,
            variant: 'warning',
          });
        }
      }
    }

    if (step < TOTAL - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('onboarding.seen', 'true');
      navigate('/today', { replace: true });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    setStep(TOTAL - 1);
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

  const showSkip = step >= 1 && step <= 3;

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top">
      {/* Top Navigation Bar */}
      <div className="flex items-center px-5 pt-4 pb-3 shrink-0">
        <div className="w-9 h-9 shrink-0">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center active:scale-95 transition-all"
            >
              <span className="text-hf-body-lg font-bold text-hf-text-secondary leading-none">←</span>
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center gap-[6px] mx-2.5">
          {Array.from({ length: TOTAL }).map((_, i) => {
            const active = i === step;
            return (
              <div
                key={i}
                className="h-[6px] rounded-[3px] transition-all duration-300"
                style={{
                  width: active ? '22px' : '6px',
                  backgroundColor: active
                    ? 'var(--color-hf-accent)'
                    : 'var(--color-hf-bg-tertiary)',
                }}
              />
            );
          })}
        </div>

        <div className="w-[60px] text-right shrink-0">
          {showSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-hf-body-sm font-semibold text-hf-text-tertiary active:text-hf-accent transition-all py-1"
            >
              {t('onboardingSkip')}
            </button>
          )}
        </div>
      </div>

      {/* Slides */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Slide 0: Welcome ── */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-5 pb-8">
            <div className="flex justify-end">
              {/* Language chip */}
              <div className="bg-hf-bg-tertiary border border-hf-border rounded-[10px] p-0.5 flex">
                <button
                  onClick={() => setLang('ru')}
                  className={`px-2.5 py-1 rounded-lg text-hf-label-md font-semibold transition-all ${
                    lang === 'ru'
                      ? 'bg-hf-card text-hf-accent shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-hf-text-secondary'
                  }`}
                >
                  {t('langRu')}
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-lg text-hf-label-md font-semibold transition-all ${
                    lang === 'en'
                      ? 'bg-hf-card text-hf-accent shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-hf-text-secondary'
                  }`}
                >
                  {t('langEn')}
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center pb-4">
              <span className="text-[80px] leading-none">🌱</span>
              <h1 className="text-[34px] font-bold tracking-[-0.03em] mt-4 text-hf-text-primary leading-[1.1]">
                HabitFlow
              </h1>
              <p className="text-hf-body-lg font-normal text-hf-text-secondary leading-[1.5] mt-2.5 max-w-[280px]">
                {t('onboardingS1Sub')}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-hf-accent active:scale-[0.99] text-white font-bold text-[16px] py-[15px] px-6 rounded-[14px] transition-all tracking-[-0.01em]"
            >
              {t('onboardingBegin')}
            </button>
          </div>
        )}

        {/* ── Slide 1: Identity ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-7 overflow-y-auto pb-tg-safe-bottom">
            <div className="flex flex-col gap-5 flex-1 justify-center">
              {/* Concentric Circles */}
              <div className="flex justify-center pt-2">
                <div className="relative w-[180px] h-[180px] shrink-0">
                  {/* Rings */}
                  {[178, 140, 100, 60].map((size, i) => (
                    <div
                      key={size}
                      className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px]"
                      style={{
                        width: size,
                        height: size,
                        borderColor: `var(--color-hf-accent)`,
                        opacity: i === 3 ? 0.5 : 0.18,
                      }}
                    />
                  ))}
                  {/* Center */}
                  <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-hf-accent flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
                    <span className="text-[22px] leading-none">🧑</span>
                  </div>
                  {/* Labels */}
                  <span
                    className="absolute text-[10px] font-semibold text-hf-text-tertiary tracking-[0.03em] whitespace-nowrap"
                    style={{ top: '20%', right: '4%' }}
                  >
                    {t('onboardingS2LabelHabits')}
                  </span>
                  <span
                    className="absolute text-[10px] font-semibold text-hf-text-tertiary tracking-[0.03em] whitespace-nowrap"
                    style={{ bottom: '25%', right: '0%' }}
                  >
                    {t('onboardingS2LabelActions')}
                  </span>
                  <span
                    className="absolute text-[10px] font-semibold text-hf-text-tertiary tracking-[0.03em] whitespace-nowrap"
                    style={{ bottom: '10%', left: '4%' }}
                  >
                    {t('onboardingS2LabelIdentity')}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-hf-text-primary">
                  {t('onboardingS2Title')}
                </h2>
                <p className="text-hf-body-md text-hf-text-secondary leading-[1.65] mt-3.5">
                  {t('onboardingS2P1')}
                </p>
                <p className="text-hf-body-md text-hf-text-secondary leading-[1.65] mt-2.5">
                  {t('onboardingS2P2')}
                </p>
              </div>

              <blockquote className="border-l-[3px] border-hf-accent pl-3.5 opacity-75">
                <p className="text-hf-body-sm text-hf-text-secondary italic leading-[1.5]">
                  {t('onboardingS2Quote')}
                </p>
                <cite className="block mt-1 text-hf-label-sm text-hf-text-tertiary not-italic">
                  {t('onboardingS2Author')}
                </cite>
              </blockquote>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-hf-accent active:scale-[0.99] text-white font-bold text-[16px] py-[15px] px-6 rounded-[14px] transition-all tracking-[-0.01em] mt-6"
            >
              {t('commonNext')}
            </button>
          </div>
        )}

        {/* ── Slide 2: Choose path ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center px-6 pb-7">
            <div>
              <h2 className="text-[26px] font-bold leading-[1.2] tracking-[-0.02em] text-hf-text-primary">
                {t('onboardingS3Title')}
              </h2>
              <p className="text-hf-body-md text-hf-text-secondary leading-[1.6] mt-2">
                {t('onboardingS3Sub')}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-5">
              {/* Templates - highlighted */}
              <button
                onClick={handleNext}
                className="w-full text-left flex items-center gap-3 px-4 py-[18px] rounded-[14px] border-[1.5px] border-hf-accent bg-hf-accent/5 active:opacity-80 transition-all"
              >
                <div className="w-[46px] h-[46px] rounded-[14px] bg-hf-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-xl leading-none">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-hf-body-lg font-bold text-hf-text-primary leading-[1.2]">
                    {t('onboardingS3Templates')}
                  </h4>
                  <p className="text-hf-body-sm text-hf-text-secondary leading-[1.2] mt-0.5">
                    {t('onboardingS3TemplatesSub')}
                  </p>
                </div>
                <span className="px-2 py-[3px] rounded-full bg-hf-accent/10 text-hf-label-sm text-hf-accent shrink-0">
                  {t('onboardingS3BadgeRecommended')}
                </span>
              </button>

              {/* Custom - not highlighted */}
              <button
                onClick={handleNext}
                className="w-full text-left flex items-center gap-3 px-4 py-[18px] rounded-[14px] border-[1.5px] border-hf-border bg-hf-card active:opacity-80 transition-all"
              >
                <div className="w-[46px] h-[46px] rounded-[14px] bg-hf-bg-tertiary flex items-center justify-center shrink-0">
                  <span className="text-xl leading-none">✏️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-hf-body-lg font-bold text-hf-text-primary leading-[1.2]">
                    {t('onboardingS3Custom')}
                  </h4>
                  <p className="text-hf-body-sm text-hf-text-secondary leading-[1.2] mt-0.5">
                    {t('onboardingS3CustomSub')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Slide 3: Templates grid ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col px-5 pt-3 pb-6 overflow-hidden">
            <div className="shrink-0 mb-3.5">
              <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-hf-text-primary">
                {t('onboardingS4Title')}
              </h2>
              <p className="text-hf-body-sm text-hf-text-tertiary text-[12px] mt-1">
                {t('onboardingS4Max')} · {t('onboardingS4Selected', { count: selectedTemplates.size })}/3
              </p>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2.5 overflow-y-auto pb-1">
              {TEMPLATES.map((tpl, idx) => {
                const isSelected = selectedTemplates.has(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleTemplate(idx)}
                    className={`relative flex flex-col items-center justify-center text-center rounded-xl border-[1.5px] px-2.5 py-3 gap-1.5 transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-hf-accent bg-hf-accent/6'
                        : 'border-hf-border bg-hf-card hover:bg-hf-bg-secondary'
                    }`}
                  >
                    <span className="text-[28px] leading-none">{tpl.emoji}</span>
                    <span className="text-hf-body-sm font-semibold text-hf-text-primary">
                      {lang === 'en' ? tpl.nameEn : tpl.nameRu}
                    </span>
                    <span className="text-hf-label-sm text-hf-text-tertiary text-[10px]">
                      {lang === 'en' ? tpl.subEn : tpl.subRu}
                    </span>
                    {isSelected && (
                      <span className="absolute top-[6px] right-[6px] w-[18px] h-[18px] bg-hf-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedTemplates.size === 0}
              className={`w-full font-bold text-[16px] py-[15px] px-6 rounded-[14px] transition-all tracking-[-0.01em] mt-3 shrink-0 ${
                selectedTemplates.size === 0
                  ? 'bg-hf-accent/30 text-white/50 cursor-not-allowed'
                  : 'bg-hf-accent active:scale-[0.99] text-white'
              }`}
            >
              {t('onboardingS4Btn')}
            </button>
          </div>
        )}

        {/* ── Slide 4: Notifications ── */}
        {step === 4 && (
          <div className="flex-1 flex flex-col justify-between px-6 pb-7 overflow-y-auto pb-tg-safe-bottom">
            <div className="flex-1 flex flex-col justify-center gap-5">
              <div className="flex justify-center pt-2">
                <div className="w-24 h-24 rounded-full bg-hf-accent/10 flex items-center justify-center shadow-inner">
                  <span className="text-[42px] leading-none">🔔</span>
                </div>
              </div>

              <div>
                <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-hf-text-primary">
                  {t('onboardingS5Title')}
                </h2>
                <p className="text-hf-body-md text-hf-text-secondary leading-[1.65] mt-2.5">
                  {t('onboardingS5Text')}
                </p>
              </div>

              {/* Telegram Preview */}
              <div className="bg-hf-bg-secondary rounded-2xl p-4">
                <span className="text-[9px] font-bold text-hf-text-tertiary tracking-[0.04em] uppercase">
                  {t('onboardingS5TelegramLabel')}
                </span>

                <div className="mt-2.5 bg-[#EFF7FF] rounded-[14px] p-3 flex gap-2.5">
                  {/* Bot avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-base leading-none">🤖</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="text-hf-label-md text-hf-accent leading-none">
                      {t('onboardingS5BotName')}
                    </h5>

                    {/* Chat bubble */}
                    <div className="bg-white rounded-xl rounded-tl-[4px] px-3 py-2.5 mt-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      <p className="text-hf-body-sm text-[#222222] leading-[1.5]">
                        {t('onboardingS5TgMsg')}
                      </p>
                      <div className="text-right mt-2">
                        <span className="text-[8px] text-[#AAAAAA]">09:00 ✓✓</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="flex-1 bg-hf-accent/10 text-hf-accent text-hf-label-md font-semibold py-1.5 px-2.5 rounded-lg text-center leading-none">
                          {t('onboardingS5DoneBtn')}
                        </span>
                        <span className="flex-1 bg-hf-accent/10 text-hf-accent text-hf-label-md font-semibold py-1.5 px-2.5 rounded-lg text-center leading-none">
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
              className="w-full bg-hf-accent active:scale-[0.99] text-white font-bold text-[16px] py-[15px] px-6 rounded-[14px] transition-all tracking-[-0.01em] mt-3"
            >
              {t('onboardingFinish')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
