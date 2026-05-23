import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  type HabitType,
  type ScheduleType,
  type ScheduleConfig
} from '@/entities/habit';
import { Input } from '@/shared/ui';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export default function HabitFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Queries & Mutations
  const { data: habits } = useHabitsQuery(userId);
  const createMutation = useCreateHabitMutation(userId || '');
  const updateMutation = useUpdateHabitMutation(userId || '');

  // Edit Mode detection
  const isEditMode = !!id;
  const editHabit = habits?.find((h) => h.id === id);

  // Wizard Step State (1 to 4)
  const [step, setStep] = useState(1);

  // Form Fields State
  const [habitType, setHabitType] = useState<HabitType>('binary');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [iconEmoji, setIconEmoji] = useState('🧘');
  const [color, setColor] = useState('#2481cc');

  // Countable/Timed settings
  const [targetValue, setTargetValue] = useState<number>(1);
  const [targetUnit, setTargetUnit] = useState('');

  // Schedule settings
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [everyN, setEveryN] = useState<number>(2);
  const [monthlyDates, setMonthlyDates] = useState<number[]>([1]);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);
  const [newReminderTime, setNewReminderTime] = useState('08:00');

  // Reinforcement settings
  const [stackAfterHabitId, setStackAfterHabitId] = useState('');
  const [implementationWhen, setImplementationWhen] = useState('');
  const [implementationWhere, setImplementationWhere] = useState('');
  const [identityStatement, setIdentityStatement] = useState('');
  const [twoMinuteVersion, setTwoMinuteVersion] = useState('');
  const [reward, setReward] = useState('');

  // Initialize form if editing
  useEffect(() => {
    if (isEditMode && editHabit) {
      setHabitType(editHabit.habit_type);
      setName(editHabit.name);
      setCategory(editHabit.category || '');
      setIconEmoji(editHabit.icon_emoji || '🧘');
      setColor(editHabit.color || '#2481cc');
      setTargetValue(editHabit.target_value || 1);
      setTargetUnit(editHabit.target_unit || '');
      setScheduleType(editHabit.schedule_type);
      
      const config = editHabit.schedule_config;
      if (config.weekdays) setWeekdays(config.weekdays);
      if (config.every_n) setEveryN(config.every_n);
      if (config.dates) setMonthlyDates(config.dates);
      
      setReminderTimes(editHabit.reminder_times || []);
      setStackAfterHabitId(editHabit.stack_after_habit_id || '');
      setImplementationWhen(editHabit.implementation_when || '');
      setImplementationWhere(editHabit.implementation_where || '');
      setIdentityStatement(editHabit.identity_statement || '');
      setTwoMinuteVersion(editHabit.two_minute_version || '');
      setReward(editHabit.reward || '');
    }
  }, [isEditMode, editHabit]);

  const addReminderTime = () => {
    if (newReminderTime && !reminderTimes.includes(newReminderTime)) {
      setReminderTimes([...reminderTimes, newReminderTime].sort());
    }
  };

  const removeReminderTime = (time: string) => {
    setReminderTimes(reminderTimes.filter((t) => t !== time));
  };

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

  const handleNext = () => {
    if (step === 2 && !name.trim()) {
      alert('Please enter a name for the habit');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!userId) return;

    const scheduleConfig: ScheduleConfig = {};
    if (scheduleType === 'weekdays') {
      scheduleConfig.weekdays = weekdays;
    } else if (scheduleType === 'every_n_days') {
      scheduleConfig.every_n = everyN;
    } else if (scheduleType === 'monthly_dates') {
      scheduleConfig.dates = monthlyDates;
    }

    const fallbackDate = new Date().toISOString().split('T')[0] || '';

    const payload = {
      name,
      category: category.trim() || undefined,
      habit_type: habitType,
      icon_emoji: iconEmoji,
      color,
      target_value: habitType === 'countable' || habitType === 'timed' ? targetValue : undefined,
      target_unit: habitType === 'countable' ? targetUnit : undefined,
      schedule_type: scheduleType,
      schedule_config: scheduleConfig,
      reminder_times: reminderTimes,
      start_date: editHabit?.start_date || fallbackDate,
      is_archived: editHabit?.is_archived || false,
      position: editHabit?.position || (habits ? habits.length : 0),
      stack_after_habit_id: stackAfterHabitId || undefined,
      implementation_when: implementationWhen.trim() || undefined,
      implementation_where: implementationWhere.trim() || undefined,
      identity_statement: identityStatement.trim() || undefined,
      two_minute_version: twoMinuteVersion.trim() || undefined,
      reward: reward.trim() || undefined,
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
      alert('Failed to save habit');
    }
  };

  const otherHabits = habits?.filter((h) => h.id !== id && !h.is_archived) || [];

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center p-4 border-b border-hf-border/10 shrink-0">
        <button
          type="button"
          onClick={step > 1 ? handleBack : () => navigate(-1)}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-hf-text-primary" />
        </button>
        <h2 className="text-[15px] font-extrabold uppercase tracking-wider text-hf-text-secondary">
          {t('habitCreateStepCounter', { step, total: 4 })}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Step 1: Type selection */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-bold">{t('habitCreateStep1Title')}</h3>
              <p className="text-hf-text-secondary text-[13px] mt-1">{t('habitCreateStep1Subtitle')}</p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { type: 'binary' as HabitType, label: t('habitTypeBinary'), desc: t('habitTypeBinaryDesc'), emoji: '✅' },
                { type: 'countable' as HabitType, label: t('habitTypeCountable'), desc: t('habitTypeCountableDesc'), emoji: '🔢' },
                { type: 'timed' as HabitType, label: t('habitTypeTimed'), desc: t('habitTypeTimedDesc'), emoji: '⏱' },
                { type: 'anti' as HabitType, label: t('habitTypeAnti'), desc: t('habitTypeAntiDesc'), emoji: '🛡' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setHabitType(item.type)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3.5 items-start ${
                    habitType === item.type
                      ? 'border-hf-accent bg-hf-accent/8 ring-1 ring-hf-accent'
                      : 'border-hf-border/15 bg-hf-bg-secondary/50 hover:bg-hf-bg-secondary'
                  }`}
                >
                  <span className="text-2xl mt-0.5">{item.emoji}</span>
                  <div>
                    <h4 className="font-bold text-[15px]">{item.label}</h4>
                    <p className="text-[12px] text-hf-text-secondary mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Name and Icon */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-xl font-bold">{t('habitCreateStep2Title')}</h3>
              <p className="text-hf-text-secondary text-[13px] mt-1">{t('habitCreateStep2Subtitle')}</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-hf-text-secondary">{t('commonNameLabel')}</label>
                <Input
                  placeholder={t('habitCreateStep2NameHint')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-hf-text-secondary">{t('commonCategoryLabel')}</label>
                <Input
                  placeholder="E.g. Health, Work, Mind"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              {/* Emoji Icon picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-hf-text-secondary">{t('habitCreateStep2IconLabel')}</label>
                <div className="flex gap-2.5 flex-wrap bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-3.5">
                  {['🧘', '💧', '🏃', '📚', '🍎', '🚭', '💻', '⏰', '💪', '🧠', '✍️', '🥦'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIconEmoji(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        iconEmoji === emoji
                          ? 'bg-hf-accent text-white scale-110 shadow'
                          : 'bg-hf-bg-secondary hover:opacity-90'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Schedule and Goal */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-xl font-bold">{t('habitCreateStep3Title')}</h3>
              <p className="text-hf-text-secondary text-[13px] mt-1">{t('habitCreateStep3Subtitle')}</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Type-Specific goals */}
              {habitType === 'countable' && (
                <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 flex flex-col gap-4">
                  <h4 className="text-[13px] font-bold text-hf-text-secondary uppercase tracking-wider">{t('habitCreateStep3GoalLabel')}</h4>
                  <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-hf-text-secondary">Value</label>
                      <Input
                        type="number"
                        min="1"
                        value={targetValue}
                        onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-hf-text-secondary">Unit</label>
                      <Input
                        placeholder="e.g. glass, page"
                        value={targetUnit}
                        onChange={(e) => setTargetUnit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {habitType === 'timed' && (
                <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 flex flex-col gap-2.5">
                  <h4 className="text-[13px] font-bold text-hf-text-secondary uppercase tracking-wider">{t('habitCreateStep3GoalLabel')}</h4>
                  <label className="text-[12px] font-medium text-hf-text-secondary">Duration (Minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                  />
                </div>
              )}

              {/* Schedule Repeat Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-hf-text-secondary">{t('habitCreateStep3RepeatTypeLabel')}</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                  className="w-full bg-hf-bg-secondary border border-hf-border/15 rounded-xl p-3.5 text-[14px] text-hf-text-primary outline-none focus:border-hf-accent transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Selected Weekdays</option>
                  <option value="every_n_days">Every N Days</option>
                  <option value="monthly_dates">Monthly Dates</option>
                </select>
              </div>

              {/* Conditional schedule options */}
              {scheduleType === 'weekdays' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-hf-text-secondary">Select days</label>
                  <div className="flex justify-between bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-2.5">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                      const dayVal = idx + 1;
                      const active = weekdays.includes(dayVal);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleWeekday(dayVal)}
                          className={`w-9 h-9 rounded-full font-bold text-[13px] flex items-center justify-center transition-all ${
                            active
                              ? 'bg-hf-accent text-white scale-105'
                              : 'bg-hf-bg-secondary text-hf-text-primary hover:opacity-90'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {scheduleType === 'every_n_days' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-hf-text-secondary">Every N days</label>
                  <Input
                    type="number"
                    min="1"
                    value={everyN}
                    onChange={(e) => setEveryN(parseInt(e.target.value) || 2)}
                  />
                </div>
              )}

              {scheduleType === 'monthly_dates' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-hf-text-secondary">Select dates of month</label>
                  <div className="grid grid-cols-7 gap-1.5 bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-3 max-h-[160px] overflow-y-auto">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
                      const active = monthlyDates.includes(date);
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => toggleMonthlyDate(date)}
                          className={`h-8 rounded-lg font-bold text-[12px] flex items-center justify-center transition-all ${
                            active
                              ? 'bg-hf-accent text-white'
                              : 'bg-hf-bg-secondary text-hf-text-primary'
                          }`}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reminders list */}
              <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 flex flex-col gap-3">
                <label className="text-[13px] font-bold text-hf-text-secondary uppercase tracking-wider">{t('habitCreateStep3RemindersLabel')}</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="flex-1 bg-hf-bg-secondary border border-hf-border/15 rounded-xl p-2.5 text-[14px] text-hf-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={addReminderTime}
                    className="px-4 bg-hf-accent text-white font-bold rounded-xl text-[14px] flex items-center justify-center"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {reminderTimes.map((time) => (
                    <span
                      key={time}
                      className="bg-hf-bg-secondary border border-hf-border/15 text-hf-text-primary text-[13px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    >
                      {time}
                      <button
                        type="button"
                        onClick={() => removeReminderTime(time)}
                        className="text-red-500 font-extrabold hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Behavioral Reinforcement */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-xl font-bold">{t('habitCreateStep4Title')}</h3>
              <p className="text-hf-text-secondary text-[13px] mt-1">{t('habitCreateStep4Subtitle')}</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Habit Stacking */}
              {otherHabits.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-hf-text-secondary">Habit Stacking (After which habit?)</label>
                  <select
                    value={stackAfterHabitId}
                    onChange={(e) => setStackAfterHabitId(e.target.value)}
                    className="w-full bg-hf-bg-secondary border border-hf-border/15 rounded-xl p-3.5 text-[14px] text-hf-text-primary outline-none"
                  >
                    <option value="">None</option>
                    {otherHabits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.icon_emoji} {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Intentions: When / Where */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-hf-text-secondary">Implementation Intention</label>
                <div className="flex gap-3">
                  <Input
                    placeholder="When (e.g. after morning shower)"
                    value={implementationWhen}
                    onChange={(e) => setImplementationWhen(e.target.value)}
                  />
                  <Input
                    placeholder="Where (e.g. bedroom mat)"
                    value={implementationWhere}
                    onChange={(e) => setImplementationWhere(e.target.value)}
                  />
                </div>
              </div>

              {/* Identity statement */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-hf-text-secondary">Identity ("I am a person who...")</label>
                <Input
                  placeholder="e.g. cares for my physical health"
                  value={identityStatement}
                  onChange={(e) => setIdentityStatement(e.target.value)}
                />
              </div>

              {/* 2 Minute Version */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-hf-text-secondary">2-Minute Version (Fallback for hard days)</label>
                <Input
                  placeholder="e.g. drink one sip of water instead of whole glass"
                  value={twoMinuteVersion}
                  onChange={(e) => setTwoMinuteVersion(e.target.value)}
                />
              </div>

              {/* Reward */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-hf-text-secondary">Reward</label>
                <Input
                  placeholder="e.g. a cup of good espresso after"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 shrink-0 pb-6 flex gap-3.5 justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3.5 rounded-xl border border-hf-border/20 font-semibold text-[14px] text-hf-text-primary hover:bg-hf-bg-secondary active:scale-[0.98] transition-all"
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl bg-hf-accent text-white font-semibold text-[14px] flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-3.5 rounded-xl bg-hf-accent text-white font-semibold text-[14px] flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isEditMode ? t('habitEditSubmit') : t('habitCreateSubmit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
