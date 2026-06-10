import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  dateOnly,
  parseLocalDate,
  type HabitType,
  type ScheduleType,
  type ScheduleConfig,
} from '@/entities/habit';
import { Input } from '@/shared/ui/input';
import { Chip } from '@/shared/ui/chip';
import { Slider } from '@/shared/ui/slider';
import {
  CheckSquare,
  Hash,
  Clock,
  Shield,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Calendar,
  Bell,
  RefreshCw,
} from 'lucide-react';

const ACCENT_COLORS = [
  { name: 'accentBlue', color: '#3B82F6' },
  { name: 'accentGreen', color: '#22C55E' },
  { name: 'accentAmber', color: '#F59E0B' },
  { name: 'accentRed', color: '#EF4444' },
  { name: 'accentViolet', color: '#A855F7' },
  { name: 'accentPink', color: '#EC4899' },
  { name: 'accentTeal', color: '#06B6D4' },
  { name: 'accentGray', color: '#6B7785' },
];

const WEEKDAY_KEYS = [
  'habitWeekMon', 'habitWeekTue', 'habitWeekWed', 'habitWeekThu',
  'habitWeekFri', 'habitWeekSat', 'habitWeekSun',
];

const CATEGORIES = [
  'habitCatHealth', 'habitCatSport', 'habitCatStudy', 'habitCatWork',
  'habitCatRelationships', 'habitCatFinance', 'habitCatHobby', 'habitCatMental',
];

const DEFAULT_EMOJIS = ['💪', '🌟', '⚡', '🎯', '🌱', '✨', '🔥', '💡', '🎨', '📚', '🧘', '🌊', '❤️', '🏃', '💎', '🌿'];

const CATEGORY_EMOJI_SETS: Record<string, string[]> = {
  habitCatHealth: ['🥗', '🥦', '💊', '🩺', '🫀', '🩹', '🧬', '💉', '🫁', '🧠', '🦷', '🏥', '🧪', '🍎', '🥑', '🫖'],
  habitCatSport: ['🏃', '💪', '🧘', '🚴', '🏊', '⚽', '🎾', '🏋️', '🤸', '🥊', '🏅', '🎯', '🧗', '🛹', '⛷️', '🏄'],
  habitCatStudy: ['📚', '✏️', '🎓', '📖', '🔬', '🔭', '💻', '📝', '🗂️', '📐', '📓', '🧮', '📊', '🖊️', '🗃️', '📜'],
  habitCatWork: ['💼', '📧', '🖥️', '📱', '📅', '⏰', '💡', '📈', '🗓️', '🖨️', '☕', '🧑‍💼', '📞', '🔧', '📌', '🗝️'],
  habitCatRelationships: ['❤️', '👨‍👩‍👧', '🤝', '💌', '🎁', '🥂', '💑', '👨‍👩‍👦', '🫂', '💬', '📸', '🌹', '💍', '🏡', '🫶', '✨'],
  habitCatFinance: ['💰', '📉', '💳', '🏦', '💵', '📊', '🪙', '💹', '🏧', '💎', '🤑', '📑', '💸', '🔐', '📒', '🎰'],
  habitCatHobby: ['🎨', '🎸', '📷', '✂️', '🧩', '🎮', '📻', '🎭', '🖌️', '🎼', '🧵', '🪴', '♟️', '🎲', '🪁', '🎻'],
  habitCatMental: ['🧘', '😌', '🌿', '🕯️', '📔', '🫧', '🌊', '☁️', '🌙', '⭐', '🦋', '🌸', '🔮', '🫁', '🌱', '💆'],
};

const GOAL_UNITS: Record<HabitType, string[]> = {
  binary: ['times'],
  countable: ['times', 'glass', 'pages', 'set', 'km'],
  timed: ['min', 'hours'],
  anti: ['times'],
};

const GOAL_UNIT_I18N_KEY: Record<string, string> = {
  times: 'habitGoalUnitTimes',
  glass: 'habitGoalUnitGlass',
  pages: 'habitGoalUnitPages',
  set: 'habitGoalUnitSet',
  km: 'habitGoalUnitKm',
  min: 'habitGoalUnitMin',
  hours: 'habitGoalUnitHours',
};

const TYPE_OPTIONS: { type: HabitType; icon: typeof CheckSquare; labelKey: string; descKey: string; exampleKey: string }[] = [
  { type: 'binary', icon: CheckSquare, labelKey: 'habitTypeBinary', descKey: 'habitTypeBinaryDesc', exampleKey: 'habitFormExampleBinary' },
  { type: 'countable', icon: Hash, labelKey: 'habitTypeCountable', descKey: 'habitTypeCountableDesc', exampleKey: 'habitFormExampleCountable' },
  { type: 'timed', icon: Clock, labelKey: 'habitTypeTimed', descKey: 'habitTypeTimedDesc', exampleKey: 'habitFormExampleTimed' },
  { type: 'anti', icon: Shield, labelKey: 'habitTypeAnti', descKey: 'habitTypeAntiDesc', exampleKey: 'habitFormExampleAnti' },
];

export default function HabitFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const { data: habits } = useHabitsQuery(userId);
  const createMutation = useCreateHabitMutation(userId || '');
  const updateMutation = useUpdateHabitMutation(userId || '');

  const isEditMode = !!id;
  const editHabit = habits?.find((h) => h.id === id);

  const [step, setStep] = useState(isEditMode ? 2 : 1);

  const [habitType, setHabitType] = useState<HabitType>('binary');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [iconEmoji, setIconEmoji] = useState('🌟');
  const [color, setColor] = useState('#3B82F6');
  const [accentOpen, setAccentOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const [targetValue, setTargetValue] = useState<number>(1);
  const [goalUnit, setGoalUnit] = useState('times');

  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [everyN, setEveryN] = useState<number>(2);
  const [timesPerWeek, setTimesPerWeek] = useState<number>(3);
  const [monthlyDates, setMonthlyDates] = useState<number[]>([1]);
  const [reminders, setReminders] = useState<string[]>(['08:00']);
  const [endless, setEndless] = useState(true);

  const [stackingText, setStackingText] = useState('');
  const [whenText, setWhenText] = useState('');
  const [whereText, setWhereText] = useState('');
  const [identityText, setIdentityText] = useState('');
  const [twoMinText, setTwoMinText] = useState('');
  const [rewardText, setRewardText] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && editHabit) {
      setHabitType(editHabit.habit_type);
      setName(editHabit.name);
      setCategory(editHabit.category || '');
      setIsCustomCategory(false);
      if (editHabit.category && !CATEGORIES.some((k) => editHabit.category === t(k))) {
        setIsCustomCategory(true);
        setCustomCategoryText(editHabit.category);
      }
      setIconEmoji(editHabit.icon_emoji || '🌟');
      setColor(editHabit.color || '#3B82F6');
      setTargetValue(editHabit.target_value || 1);
      setGoalUnit(editHabit.target_unit || 'times');
      setScheduleType(editHabit.schedule_type);

      const config = editHabit.schedule_config;
      if (config.weekdays) setWeekdays(config.weekdays);
      if (config.n_per_week) setTimesPerWeek(config.n_per_week);
      if (config.every_n) setEveryN(config.every_n);
      if (config.dates) setMonthlyDates(config.dates);

      setReminders(editHabit.reminder_times || []);
      setStackingText(editHabit.stack_after_habit_id || '');
      setWhenText(editHabit.implementation_when || '');
      setWhereText(editHabit.implementation_where || '');
      setIdentityText(editHabit.identity_statement || '');
      setTwoMinText(editHabit.two_minute_version || '');
      setRewardText(editHabit.reward || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editHabit]);

  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((d) => d !== day));
    } else {
      setWeekdays([...weekdays, day].sort());
    }
  };

  const toggleMonthlyDate = (date: number) => {
    if (monthlyDates.includes(date)) {
      setMonthlyDates(monthlyDates.filter((d) => d !== date));
    } else {
      setMonthlyDates([...monthlyDates, date].sort());
    }
  };

  const addReminder = () => {
    setReminders([...reminders, '08:00']);
  };

  const removeReminder = (idx: number) => {
    setReminders(reminders.filter((_, i) => i !== idx));
  };

  const updateReminder = (idx: number, time: string) => {
    const updated = [...reminders];
    updated[idx] = time;
    setReminders(updated);
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return name.trim().length > 0 && name.trim().length <= 60;
      default:
        return true;
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (step < 4) {
      setStep(step + 1);
    } else {
      submitHabit();
    }
  };

  const submitHabit = async () => {
    if (!userId || submitting) return;
    setSubmitting(true);

    const scheduleConfig: ScheduleConfig = {};
    if (scheduleType === 'weekdays') {
      scheduleConfig.weekdays = weekdays;
    } else if (scheduleType === 'n_per_week') {
      scheduleConfig.n_per_week = timesPerWeek;
    } else if (scheduleType === 'every_n_days') {
      scheduleConfig.every_n = everyN;
    } else if (scheduleType === 'monthly_dates') {
      scheduleConfig.dates = monthlyDates;
    }

    const fallbackDate = dateOnly(new Date());

    const payload = {
      name,
      category: category.trim() || undefined,
      habit_type: habitType,
      icon_emoji: iconEmoji,
      color,
      target_value: (habitType === 'countable' || habitType === 'timed') ? targetValue : undefined,
      target_unit: habitType === 'countable' ? goalUnit : undefined,
      schedule_type: scheduleType,
      schedule_config: scheduleConfig,
      reminder_times: reminders,
      start_date: editHabit?.start_date || fallbackDate,
      is_archived: editHabit?.is_archived || false,
      position: editHabit?.position ?? (habits ? habits.length : 0),
      stack_after_habit_id: stackingText.trim() || undefined,
      implementation_when: whenText.trim() || undefined,
      implementation_where: whereText.trim() || undefined,
      identity_statement: identityText.trim() || undefined,
      two_minute_version: twoMinText.trim() || undefined,
      reward: rewardText.trim() || undefined,
    };

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, habit: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/habits');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = isCustomCategory ? customCategoryText : (category || t(CATEGORIES[0]!));
  const categoryKey = !isCustomCategory ? CATEGORIES.find((k) => t(k) === category) || CATEGORIES[0]! : CATEGORIES[0]!;
  const emojiSet = CATEGORY_EMOJI_SETS[categoryKey] ?? DEFAULT_EMOJIS;

  const otherHabits = habits?.filter((h) => h.id !== id && !h.is_archived) || [];

  const repeatLabel = (): string => {
    if (scheduleType === 'weekdays' && weekdays.length > 0) {
      return weekdays.map((d) => t(WEEKDAY_KEYS[d - 1]!)).join(', ');
    }
    switch (scheduleType) {
      case 'daily': return t('habitRepeatDaily');
      case 'weekdays': return t('habitRepeatWeekdays');
      case 'n_per_week': return t('habitCreateStep3FrequencyValue', { value: timesPerWeek });
      case 'every_n_days': return t('habitRepeatEveryN');
      case 'monthly_dates': return t('habitRepeatMonthly');
    }
  };

  const typeLabel = (): string => {
    switch (habitType) {
      case 'binary': return t('habitTypeBinary');
      case 'countable': return t('habitTypeCountable');
      case 'timed': return t('habitTypeTimed');
      case 'anti': return t('habitTypeAnti');
    }
  };

  const todayActionLabel = (): string => {
    switch (habitType) {
      case 'binary': return t('habitCreateStep4ActionBinary');
      case 'anti': return t('habitCreateStep4ActionAnti');
      default: return t('habitCreateStep4ActionOther');
    }
  };

  const isCountable = habitType === 'countable' || habitType === 'timed';
  const units = GOAL_UNITS[habitType] || ['times'];

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary pt-tg-safe-top pb-tg-safe-bottom">
      {/* Wizard Header */}
      <div className="shrink-0 bg-hf-bg-primary border-b border-hf-border pb-[10px]">
        <div className="flex items-center px-4 pt-[14px] pb-[10px]">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center active:scale-95 transition-all"
          >
            {step === 1 && !isEditMode ? (
              <X className="w-[18px] h-[18px] text-hf-text-secondary" />
            ) : (
              <X className="w-[18px] h-[18px] text-hf-text-secondary" style={{ transform: 'scaleX(-1)' }} />
            )}
          </button>
          <div className="flex-1 text-center">
            <span className="text-hf-label-md text-hf-text-tertiary tracking-[0.02em] uppercase">
              {t('habitCreateStepCounter', { step, total: 4 })}
            </span>
          </div>
          <div className="w-9" />
        </div>
        <div className="flex px-4 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-[2px] ${i < 4 ? 'mr-1' : ''} ${
                i <= step ? 'bg-hf-accent' : 'bg-hf-bg-tertiary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="px-4 pt-6 pb-4">
          {/* ── Step 1: Habit Type ── */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-hf-text-primary leading-[1.2] tracking-[-0.03em]">
                  {t('habitCreateStep1Title')}
                </h3>
                <p className="text-hf-body-md text-hf-text-tertiary leading-[1.5] mt-1.5">
                  {t('habitCreateStep1Subtitle')}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {TYPE_OPTIONS.map((opt) => {
                  const selected = habitType === opt.type;
                  const isAnti = opt.type === 'anti';
                  const accentColor = isAnti ? '#EF4444' : '#3B82F6';
                  const IconComp = opt.icon;

                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setHabitType(opt.type)}
                      className={`relative text-left p-4 rounded-2xl transition-all active:scale-[0.99] ${
                        isAnti ? 'bg-red-500/5' : 'bg-hf-card'
                      } ${
                        selected
                          ? `border-2 ${isAnti ? 'border-red-500' : 'border-hf-accent'}` + ` shadow-[0_0_0_4px_${isAnti ? 'rgb(239,68,68,0.08)' : 'rgb(59,130,246,0.08)'}]`
                          : `border-[1.5px] ${isAnti ? 'border-red-500/25' : 'border-hf-border'}`
                      }`}
                    >
                      <div className="flex gap-3.5 items-start">
                        <div
                          className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: selected
                              ? isAnti ? 'rgb(239,68,68,0.15)' : 'rgb(59,130,246,0.1)'
                              : isAnti ? 'rgb(239,68,68,0.08)' : undefined,
                          }}
                        >
                          <IconComp
                            className="w-[22px] h-[22px]"
                            style={{ color: selected || isAnti ? accentColor : '#8E8E93' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-hf-body-lg font-semibold text-hf-text-primary leading-[1.2]">
                            {t(opt.labelKey)}
                          </h4>
                          <p
                            className="text-hf-body-sm leading-[1.3] mt-0.5"
                            style={{ color: isAnti ? (selected ? '#EF4444' : undefined) : undefined }}
                          >
                            {t(opt.descKey)}
                          </p>
                          <p className="text-hf-body-sm text-hf-text-tertiary leading-[1.3] text-[12px] mt-[3px]">
                            {t('habitFormExamplePrefix')} {t(opt.exampleKey)}
                          </p>
                        </div>
                      </div>
                      {selected && (
                        <div
                          className="absolute top-0 right-0 w-[22px] h-[22px] rounded-full flex items-center justify-center"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[0px] leading-none select-none">{t('habitFormTypeNotAvailable')}</p>
            </div>
          )}

          {/* ── Step 2: Name & Icon ── */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-hf-text-primary leading-[1.2] tracking-[-0.03em]">
                  {t('habitCreateStep2Title')}
                </h3>
                <p className="text-hf-body-md text-hf-text-tertiary leading-[1.5] mt-1.5">
                  {t('habitCreateStep2Subtitle')}
                </p>
              </div>

              {/* Name */}
              <div className="mb-5">
                <span className="text-hf-label-md text-hf-text-secondary tracking-[0.04em] uppercase">
                  {t('commonNameLabel')}
                </span>
                <div className="mt-2">
                  <Input
                    placeholder={t('habitCreateStep2NameHint')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <span className="text-hf-label-md text-hf-text-secondary tracking-[0.04em] uppercase">
                  {t('commonCategoryLabel')}
                </span>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {CATEGORIES.map((catKey) => (
                    <Chip
                      key={catKey}
                      label={t(catKey)}
                      selected={!isCustomCategory && category === t(catKey)}
                      onTap={() => {
                        setIsCustomCategory(false);
                        setCustomCategoryText('');
                        setCategory(t(catKey));
                      }}
                    />
                  ))}
                  <Chip
                    label={t('habitCategoryNew')}
                    selected={isCustomCategory}
                    onTap={() => {
                      setIsCustomCategory(true);
                      setCategory(customCategoryText);
                    }}
                  />
                </div>
                {isCustomCategory && (
                  <div className="mt-3">
                    <Input
                      placeholder={t('habitFormNewCategoryPlaceholder')}
                      value={customCategoryText}
                      onChange={(e) => {
                        setCustomCategoryText(e.target.value);
                        setCategory(e.target.value);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Icon */}
              <div className="mb-6">
                <span className="text-hf-label-md text-hf-text-secondary tracking-[0.04em] uppercase">
                  {t('habitCreateStep2IconLabel')}
                </span>

                {/* Preview circle */}
                <div className="flex justify-center my-6">
                  <div
                    className="w-24 h-24 rounded-full border-[2.5px] flex items-center justify-center"
                    style={{ backgroundColor: `${color}1F`, borderColor: color }}
                  >
                    <span className="text-[44px] leading-none">{iconEmoji}</span>
                  </div>
                </div>

                {/* Emoji grid */}
                <div className="grid grid-cols-8 gap-1.5">
                  {emojiSet.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIconEmoji(em)}
                      className={`w-full aspect-square rounded-[10px] border-[1.5px] flex items-center justify-center text-lg transition-all active:scale-95 ${
                        iconEmoji === em
                          ? 'bg-hf-accent/10 border-hf-accent'
                          : 'bg-hf-bg-secondary border-transparent'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div>
                <button
                  type="button"
                  onClick={() => setAccentOpen(!accentOpen)}
                  className="w-full flex items-center gap-2.5 py-2.5"
                >
                  <div className="w-[22px] h-[22px] rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-hf-label-lg text-hf-text-primary">
                    {t('habitCreateStep2AccentColorLabel')}
                  </span>
                  <span className="text-hf-body-sm text-hf-text-tertiary text-[12px]">
                    {t(ACCENT_COLORS.find((a) => a.color === color)?.name || 'accentBlue')}
                  </span>
                  <div className="flex-1" />
                  {accentOpen ? (
                    <ChevronUp className="w-4 h-4 text-hf-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-hf-text-tertiary" />
                  )}
                </button>
                {accentOpen && (
                  <div className="flex flex-wrap gap-2.5 pb-2">
                    {ACCENT_COLORS.map((ac) => {
                      const isSelected = color === ac.color;
                      return (
                        <button
                          key={ac.color}
                          type="button"
                          onClick={() => setColor(ac.color)}
                          className="relative w-9 h-9 rounded-full transition-all"
                          style={{
                            backgroundColor: ac.color,
                            border: isSelected
                              ? '3px solid var(--color-hf-bg-primary)'
                              : '3px solid transparent',
                            boxShadow: isSelected
                              ? `0 0 0 2.5px ${ac.color}`
                              : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Schedule ── */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-hf-text-primary leading-[1.2] tracking-[-0.03em]">
                  {t('habitCreateStep3Title')}
                </h3>
                <p className="text-hf-body-md text-hf-text-tertiary leading-[1.5] mt-1.5">
                  {t('habitCreateStep3Subtitle')}
                </p>
              </div>

              {/* Repeat type */}
              <div className="mb-5">
                <span className="text-hf-label-md text-hf-text-secondary tracking-[0.04em] uppercase">
                  {t('habitCreateStep3RepeatTypeLabel')}
                </span>
                <div className="mt-2">
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                    className="w-full bg-hf-card border-[1.5px] border-hf-border rounded-xl px-3.5 py-3 text-hf-body-md text-hf-text-primary outline-none focus:border-hf-accent transition-all"
                  >
                    <option value="daily">{t('habitRepeatDaily')}</option>
                    <option value="weekdays">{t('habitRepeatWeekdays')}</option>
                    <option value="n_per_week">{t('habitRepeatNPerWeek')}</option>
                    <option value="every_n_days">{t('habitRepeatEveryN')}</option>
                    <option value="monthly_dates">{t('habitRepeatMonthly')}</option>
                  </select>
                </div>
              </div>

              {/* Weekdays */}
              {scheduleType === 'weekdays' && (
                <div className="flex gap-1.5 mb-5">
                  {WEEKDAY_KEYS.map((key, i) => {
                    const active = weekdays.includes(i + 1);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleWeekday(i + 1)}
                        className={`flex-1 py-2 rounded-[10px] text-hf-label-md font-semibold transition-all active:scale-95 ${
                          active
                            ? 'bg-hf-accent text-white'
                            : 'bg-hf-bg-secondary border-[1.5px] border-hf-border text-hf-text-secondary'
                        }`}
                      >
                        {t(key)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* N per week */}
              {scheduleType === 'n_per_week' && (
                <div className="bg-hf-bg-secondary rounded-[14px] p-4 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-hf-body-md text-hf-text-secondary">
                      {t('habitCreateStep3FrequencyLabel')}
                    </span>
                    <span className="text-hf-headline-sm font-bold text-hf-accent">
                      {t('habitCreateStep3FrequencyValue', { value: timesPerWeek })}
                    </span>
                  </div>
                  <Slider
                    value={timesPerWeek}
                    onChanged={(v) => setTimesPerWeek(Math.round(v))}
                    min={1}
                    max={7}
                    step={1}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-hf-label-sm text-hf-text-tertiary">1</span>
                    <span className="text-hf-label-sm text-hf-text-tertiary">7</span>
                  </div>
                </div>
              )}

              {/* Every N days */}
              {scheduleType === 'every_n_days' && (
                <div className="bg-hf-bg-secondary rounded-[14px] px-4 py-3.5 flex items-center gap-2 mb-5">
                  <span className="text-hf-body-md text-hf-text-secondary flex-1">{t('habitFormEveryPrefix')}</span>
                  <button
                    type="button"
                    onClick={() => setEveryN(Math.max(1, everyN - 1))}
                    className="w-[34px] h-[34px] rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center text-hf-body-md text-hf-text-primary active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-hf-headline-sm font-bold text-hf-text-primary">
                    {everyN}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEveryN(everyN + 1)}
                    className="w-[34px] h-[34px] rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center text-hf-body-md text-hf-text-primary active:scale-95"
                  >
                    +
                  </button>
                  <span className="text-hf-body-md text-hf-text-secondary">{t('habitFormDaysSuffix')}</span>
                </div>
              )}

              {/* Monthly dates */}
              {scheduleType === 'monthly_dates' && (
                <div className="bg-hf-bg-secondary rounded-[14px] p-3.5 mb-5">
                  <span className="text-hf-label-md text-hf-text-tertiary tracking-[0.05em] uppercase">
                    {t('habitCreateStep3SelectDays')}
                  </span>
                  <div className="grid grid-cols-7 gap-[5px] mt-2.5">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const active = monthlyDates.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleMonthlyDate(d)}
                          className={`aspect-square rounded-lg text-hf-label-md font-semibold flex items-center justify-center transition-all active:scale-95 ${
                            active
                              ? 'bg-hf-accent text-white'
                              : 'bg-hf-card border border-hf-border text-hf-text-secondary'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Goal (countable/timed) */}
              {isCountable && (
                <div className="mb-5">
                  <span className="text-hf-label-md text-hf-text-secondary tracking-[0.04em] uppercase">
                    {t('habitCreateStep3GoalLabel')}
                  </span>
                  <div className="bg-hf-bg-secondary rounded-[14px] px-4 py-3.5 flex items-center gap-2.5 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setTargetValue(Math.max(1, targetValue - 1))}
                      className="w-9 h-9 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center text-hf-body-md text-hf-text-primary active:scale-95"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-[24px] font-bold text-hf-text-primary">
                      {targetValue}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTargetValue(targetValue + 1)}
                      className="w-9 h-9 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center text-hf-body-md text-hf-text-primary active:scale-95"
                    >
                      +
                    </button>
                    <div className="flex-1" />
                    <select
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value)}
                      className="bg-hf-card border-[1.5px] border-hf-border rounded-[10px] px-3 py-2 text-hf-body-md text-hf-text-primary outline-none"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>{t((GOAL_UNIT_I18N_KEY[u] ?? u) as Parameters<typeof t>[0])}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Reminders */}
              <div className="mb-5">
                <span className="text-hf-label-md text-hf-text-secondary tracking-[0.04em] uppercase">
                  {t('habitCreateStep3RemindersLabel')}
                </span>
                <div className="bg-hf-bg-secondary rounded-[14px] mt-2.5">
                  {reminders.map((time, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3.5 py-3 border-b border-hf-border"
                    >
                      <Clock className="w-4 h-4 text-hf-accent shrink-0" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateReminder(i, e.target.value)}
                        className="flex-1 bg-transparent text-hf-body-md text-hf-text-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeReminder(i)}
                        className="p-1 rounded-lg hover:bg-hf-danger/10 transition-colors"
                      >
                        <X className="w-[15px] h-[15px] text-hf-text-tertiary" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addReminder}
                    className="w-full flex items-center gap-2.5 px-3.5 py-3.5 active:opacity-70"
                  >
                    <div className="w-7 h-7 rounded-lg bg-hf-accent/10 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-hf-accent" />
                    </div>
                    <span className="text-hf-label-lg text-hf-accent">{t('habitCreateStep3AddReminder')}</span>
                  </button>
                </div>
                <p className="text-hf-body-sm text-hf-text-tertiary leading-[1.5] text-[12px] mt-2">
                  {t('habitCreateStep3RemindersHint')}
                </p>
              </div>

              {/* Period accordion */}
              <div className="bg-hf-bg-secondary rounded-[14px] mb-5">
                <button
                  type="button"
                  onClick={() => setPeriodOpen(!periodOpen)}
                  className="w-full flex items-center gap-2.5 px-4 py-3.5"
                >
                  <Calendar className="w-4 h-4 text-hf-text-tertiary" />
                  <span className="text-hf-label-lg text-hf-text-primary">
                    {t('habitCreateStep3PeriodLabel')}
                  </span>
                  <div className="flex-1" />
                  {periodOpen ? (
                    <ChevronUp className="w-4 h-4 text-hf-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-hf-text-tertiary" />
                  )}
                </button>
                {periodOpen && (
                  <div className="border-t border-hf-border px-4 py-3 pb-4">
                    <span className="text-hf-label-md text-hf-text-secondary">
                      {t('habitCreateStep3StartDateLabel')}
                    </span>
                    <div className="mt-1.5 px-3.5 py-2.5 bg-hf-card border-[1.5px] border-hf-border rounded-[10px] text-hf-body-md text-hf-text-primary">
                      {new Intl.DateTimeFormat(locale).format(
                        parseLocalDate(editHabit?.start_date ?? dateOnly(new Date()))
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEndless(!endless)}
                        className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all ${
                          endless ? 'bg-hf-accent border-hf-accent' : 'border-hf-border'
                        }`}
                      >
                        {endless && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>
                      <span className="text-hf-body-md text-hf-text-primary">{t('habitCreateStep3Endless')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Reinforcement ── */}
          {step === 4 && (
            <div>
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-hf-text-primary leading-[1.2] tracking-[-0.03em]">
                  {t('habitCreateStep4Title')}
                </h3>
                <p className="text-hf-body-sm text-hf-text-tertiary leading-[1.6] mt-1.5">
                  {t('habitCreateStep4Subtitle')}
                </p>
              </div>

              {/* Habit Stacking */}
              <AccordionSection emoji="🧱" title={t('habitCreateStep4StackingTitle')} subtitle={t('habitCreateStep4StackingSubtitle')}>
                {otherHabits.length === 0 ? (
                  <div className="px-3.5 py-3 bg-hf-bg-secondary border-[1.5px] border-hf-border rounded-xl text-hf-body-sm text-hf-text-tertiary italic">
                    {t('habitStackingNoHabits')}
                  </div>
                ) : (
                  <select
                    value={stackingText}
                    onChange={(e) => setStackingText(e.target.value)}
                    className="w-full bg-hf-bg-secondary border-[1.5px] border-hf-border rounded-xl px-3.5 py-3 text-hf-body-md text-hf-text-primary outline-none focus:border-hf-accent transition-all"
                  >
                    <option value="">{t('habitFormSelectEmpty')}</option>
                    {otherHabits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.icon_emoji} {h.name}
                      </option>
                    ))}
                  </select>
                )}
              </AccordionSection>

              {/* Implementation Intention */}
              <div className="mt-2.5">
                <AccordionSection emoji="📍" title={t('habitCreateStep4IntentionTitle')} subtitle={t('habitCreateStep4IntentionSubtitle')}>
                  <div className="flex flex-col gap-2.5">
                    <Input
                      placeholder={t('habitCreateStep4IntentionWhenHint')}
                      value={whenText}
                      onChange={(e) => setWhenText(e.target.value)}
                    />
                    <Input
                      placeholder={t('habitCreateStep4IntentionWhereHint')}
                      value={whereText}
                      onChange={(e) => setWhereText(e.target.value)}
                    />
                  </div>
                </AccordionSection>
              </div>

              {/* Identity */}
              <div className="mt-2.5">
                <AccordionSection emoji="🎭" title={t('habitCreateStep4IdentityTitle')} subtitle={t('habitCreateStep4IdentitySubtitle')}>
                  <Input
                    placeholder={t('habitCreateStep4IdentityHint')}
                    value={identityText}
                    onChange={(e) => setIdentityText(e.target.value)}
                    minLines={3}
                    maxLines={5}
                  />
                  <p className="text-hf-body-sm text-hf-text-tertiary leading-[1.5] text-[12px] mt-2">
                    {t('habitCreateStep4IdentityNote')}
                  </p>
                </AccordionSection>
              </div>

              {/* 2-minute version */}
              <div className="mt-2.5">
                <AccordionSection emoji="⚡" title={t('habitCreateStep4TwoMinTitle')} subtitle={t('habitCreateStep4TwoMinSubtitle')}>
                  <Input
                    placeholder={t('habitCreateStep4TwoMinHint')}
                    value={twoMinText}
                    onChange={(e) => setTwoMinText(e.target.value)}
                  />
                </AccordionSection>
              </div>

              {/* Reward */}
              <div className="mt-2.5">
                <AccordionSection emoji="🍰" title={t('habitCreateStep4RewardTitle')} subtitle={t('habitCreateStep4RewardSubtitle')}>
                  <Input
                    placeholder={t('habitCreateStep4RewardHint')}
                    value={rewardText}
                    onChange={(e) => setRewardText(e.target.value)}
                  />
                </AccordionSection>
              </div>

              {/* Preview card */}
              <div className="mt-7">
                <span className="text-hf-label-md text-hf-text-tertiary tracking-[0.06em] uppercase">
                  {t('habitCreateStep4PreviewLabel')}
                </span>
                <div className="mt-2.5 bg-hf-bg-secondary rounded-[18px] border-[1.5px] border-hf-border p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-[52px] h-[52px] rounded-2xl border-2 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}1F`, borderColor: color }}
                    >
                      <span className="text-2xl">{iconEmoji || '🌟'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-hf-body-lg font-extrabold text-hf-text-primary tracking-[-0.02em]">
                        {name || t('habitCreateStep4PreviewName')}
                      </h4>
                      <p className="text-hf-body-sm text-hf-text-secondary mt-0.5">
                        {currentCategory} · {typeLabel()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-hf-text-tertiary tracking-[0.04em] uppercase">
                        {t('habitCreateStep4PreviewStreak')}
                      </span>
                      <p
                        className="text-hf-headline-md font-bold leading-none mt-0.5"
                        style={{ color }}
                      >
                        0
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-hf-border mb-3" />

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-hf-card border border-hf-border rounded-lg text-[12px] text-hf-text-secondary">
                      <RefreshCw className="w-3 h-3 text-hf-text-tertiary" />
                      {repeatLabel()}
                    </span>
                    {reminders.length > 0 && (
                      <span className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-hf-card border border-hf-border rounded-lg text-[12px] text-hf-text-secondary">
                        <Bell className="w-3 h-3 text-hf-text-tertiary" />
                        {reminders.length > 1 ? `${reminders[0]} +${reminders.length - 1}` : reminders[0]}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-hf-label-md text-hf-accent"
                      style={{ backgroundColor: `${color}14`, border: `1px solid ${color}33` }}>
                      {t('commonNewBadge')}
                    </span>
                  </div>

                  {/* Today action */}
                  <div className="flex items-center bg-hf-card border-[1.5px] border-hf-border rounded-xl px-3.5 py-3">
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-hf-text-tertiary tracking-[0.04em] uppercase">
                        {t('habitCreateStep4PreviewToday')}
                      </span>
                      <p className="text-hf-body-sm text-hf-text-secondary mt-0.5">{todayActionLabel()}</p>
                    </div>
                    <div
                      className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] flex items-center justify-center"
                      style={{ backgroundColor: `${color}1F`, borderColor: color }}
                    >
                      {habitType === 'anti' ? (
                        <ShieldCheck className="w-5 h-5" style={{ color }} />
                      ) : (
                        <Check className="w-5 h-5" style={{ color }} strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={() => {
                  setStackingText('');
                  setWhenText('');
                  setWhereText('');
                  setIdentityText('');
                  setTwoMinText('');
                  setRewardText('');
                }}
                className="w-full mt-4 py-2.5 text-hf-label-lg font-semibold text-hf-text-secondary active:text-hf-text-primary rounded-xl transition-all"
              >
                {t('habitCreateStep4Reset')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-hf-bg-primary border-t border-hf-border px-4 py-3 pb-5">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext() || submitting}
          className={`w-full py-[15px] rounded-[14px] text-hf-body-lg font-bold text-center transition-all active:scale-[0.99] tracking-[-0.01em] ${
            !canNext() || submitting
              ? 'bg-hf-bg-tertiary text-hf-text-tertiary cursor-not-allowed'
              : 'bg-hf-accent text-white'
          }`}
        >
          {step < 4 ? t('commonNext') : (isEditMode ? t('habitEditSubmit') : t('habitCreateSubmit'))}
        </button>
      </div>
    </div>
  );
}

/* ── Accordion section for Step 4 ── */
function AccordionSection({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-hf-card border-[1.5px] border-hf-border rounded-[14px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-xl leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-hf-label-lg text-hf-text-primary">{title}</h4>
          {!open && (
            <p className="text-hf-body-sm text-hf-text-tertiary text-[12px] mt-0.5">{subtitle}</p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-[18px] h-[18px] text-hf-text-tertiary shrink-0" />
        ) : (
          <ChevronDown className="w-[18px] h-[18px] text-hf-text-tertiary shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-hf-border px-4 pt-3 pb-4">
          <p className="text-hf-body-sm text-hf-text-secondary leading-[1.5] mb-3">{subtitle}</p>
          {children}
        </div>
      )}
    </div>
  );
}
