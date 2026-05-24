import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useJournalEntryByDateQuery,
  useUpsertJournalEntryMutation,
  useDeleteJournalEntryMutation,
  getSavedReflectionTemplate,
} from '@/entities/journal';
import { HeaderBar, Slider, Input, Button } from '@/shared/ui';
import { ChevronDown } from 'lucide-react';
import { dateOnly } from '@/entities/habit';

const MOOD_FACES = ['😢', '😕', '😐', '🙂', '😊'];

function moodColor(val: number): string {
  if (val <= 3) return '#EF4444';
  if (val <= 6) return '#9AA0AB';
  return '#22C55E';
}

export default function JournalEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const paramDate = id && /^\d{4}-\d{2}-\d{2}$/.test(id) ? id : undefined;
  const queryDate = searchParams.get('date');
  const todayStr = dateOnly(new Date());
  const entryDate = paramDate || queryDate || todayStr;
  const { data: existingEntry, isLoading: isLoadingEntry } = useJournalEntryByDateQuery(
    userId,
    entryDate,
  );
  const upsertMutation = useUpsertJournalEntryMutation(userId || '');
  const deleteMutation = useDeleteJournalEntryMutation(userId || '');

  const templateQuestions = getSavedReflectionTemplate() ?? [
    t('reflectionTemplateQ1'),
    t('reflectionTemplateQ2'),
    t('reflectionTemplateQ3'),
    t('reflectionTemplateQ4'),
  ];

  const [mood, setMood] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [freeText, setFreeText] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showQuestions, setShowQuestions] = useState(true);

  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood ?? 5);
      setEnergy(existingEntry.energy ?? 5);
      setFreeText(existingEntry.free_text || '');
      setAnswers(existingEntry.answers || {});
    } else {
      setMood(5);
      setEnergy(5);
      setFreeText('');
      setAnswers({});
    }
  }, [existingEntry]);

  const handleAnswerChange = (question: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [question]: text }));
  };

  const handleSave = async () => {
    if (!userId) return;

    let finalFreeText = freeText;
    if (showQuestions) {
      const qText = templateQuestions
        .map((q) => {
          const ans = answers[q] || '';
          return ans.trim() ? `### ${q}\n${ans}` : '';
        })
        .filter(Boolean)
        .join('\n\n');

      if (qText) {
        finalFreeText = qText + (freeText.trim() ? `\n\n### ${t('journalEditNotesHeading')}\n${freeText}` : '');
      }
    }

    try {
      await upsertMutation.mutateAsync({
        id: existingEntry?.id,
        entry_date: entryDate,
        mood,
        energy,
        free_text: finalFreeText,
        answers,
      });
      navigate('/journal');
    } catch (e) {
      console.error(e);
      alert(t('journalEditLoadError'));
    }
  };

  const handleDelete = async () => {
    if (!existingEntry || !userId) return;
    if (confirm(t('habitDetailDeleteConfirmBody'))) {
      try {
        await deleteMutation.mutateAsync({ id: existingEntry.id, dateStr: entryDate });
        navigate('/journal');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const trailing = existingEntry ? (
    <button
      type="button"
      onClick={handleDelete}
      className="p-1.5 rounded-hf-md bg-hf-bg-secondary hover:bg-red-500/10 text-red-500 active:scale-[0.95] transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    </button>
  ) : undefined;

  if (isLoadingEntry) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-[200px] w-full bg-hf-bg-secondary animate-pulse rounded-hf-lg mb-4" />
        <div className="h-10 w-full bg-hf-bg-secondary animate-pulse rounded-hf-md" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <HeaderBar
        title={existingEntry ? t('journalEditHeaderEdit') : t('journalEditHeaderNew')}
        onBack={() => navigate('/journal')}
        trailing={trailing}
      />

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-hf-body-md font-semibold text-hf-text-primary">
              {t('journalEditMoodLabel')}
            </span>
            <span className="text-hf-headline-md font-bold" style={{ color: moodColor(mood) }}>
              {mood}
            </span>
          </div>

          <div className="flex justify-between items-center px-2">
            {MOOD_FACES.map((face, i) => (
              <span key={i} className="text-[24px] leading-none select-none opacity-70">
                {face}
              </span>
            ))}
          </div>

          <Slider value={mood} onChanged={(v) => setMood(v)} min={1} max={10} />
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-hf-body-md font-semibold text-hf-text-primary flex items-center gap-1.5">
              <span className="text-amber-500 text-lg">⚡</span>
              {t('journalEditEnergyLabel')}
            </span>
            <span className="text-hf-headline-md font-bold text-amber-500">
              {energy}
            </span>
          </div>

          <Slider value={energy} onChanged={(v) => setEnergy(v)} min={1} max={10} className="[&_input]:accent-amber-500 [&_input::-webkit-slider-thumb]:bg-amber-500 [&_input::-moz-range-thumb]:bg-amber-500" />
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4">
          <Input
            label={t('journalEditEntryLabel')}
            hint={t('journalEditPlaceholder')}
            value={freeText}
            onValueChange={setFreeText}
            minLines={5}
            maxLines={20}
          />
          <div className="text-right text-hf-label-sm text-hf-text-tertiary mt-1.5">
            {t('journalEditCharCount', { count: freeText.length })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQuestions(!showQuestions)}
          className="flex justify-between items-center bg-hf-bg-secondary p-3.5 rounded-hf-md hover:opacity-95 active:scale-[0.99] transition-all"
        >
          <span className="text-hf-body-md font-semibold text-hf-text-primary">
            {showQuestions
              ? t('journalEditQuestionsHide')
              : t('journalEditQuestionsShow')}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-hf-text-secondary transition-transform duration-200 ${
              showQuestions ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showQuestions && (
          <div className="flex flex-col gap-3.5">
            {templateQuestions.map((q, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <span className="text-hf-label-sm font-medium text-hf-text-secondary">
                  {idx + 1}. {q}
                </span>
                <Input
                  hint={t('journalEditQuestionPlaceholder')}
                  value={answers[q] || ''}
                  onValueChange={(v) => handleAnswerChange(q, v)}
                  minLines={2}
                  maxLines={6}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/profile/reflection-template')}
          className="text-hf-accent text-center text-hf-body-sm font-medium hover:underline self-center"
        >
          {t('journalEditChangeTemplate')}
        </button>

        <div className="mt-2 shrink-0 pb-8">
          <Button
            label={
              upsertMutation.isPending
                ? t('journalEditSaving')
                : t('journalEditSave')
            }
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
