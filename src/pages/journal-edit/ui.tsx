import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useJournalEntryByDateQuery,
  useUpsertJournalEntryMutation,
  useDeleteJournalEntryMutation,
  useReflectionTemplate
} from '@/entities/journal';
import { Button } from '@/shared/ui';
import { ArrowLeft, Trash2, Smile, Zap, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { dateOnly } from '@/entities/habit';

export default function JournalEditPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Can be YYYY-MM-DD or entry id
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Determine target date
  const paramDate = id && /^\d{4}-\d{2}-\d{2}$/.test(id) ? id : undefined;
  const queryDate = searchParams.get('date');
  const todayStr = dateOnly(new Date());
  const entryDate = paramDate || queryDate || todayStr;

  // Queries & Mutations
  const { data: existingEntry, isLoading: isLoadingEntry } = useJournalEntryByDateQuery(userId, entryDate);
  const upsertMutation = useUpsertJournalEntryMutation(userId || '');
  const deleteMutation = useDeleteJournalEntryMutation(userId || '');

  // Reflection template questions
  const templateQuestions = useReflectionTemplate();

  // Local Form State
  const [mood, setMood] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [freeText, setFreeText] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showQuestions, setShowQuestions] = useState(true);

  // Load existing entry data
  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood ?? 5);
      setEnergy(existingEntry.energy ?? 5);
      setFreeText(existingEntry.free_text || '');
      setAnswers(existingEntry.answers || {});
    } else {
      // Clear form for new entry
      setMood(5);
      setEnergy(5);
      setFreeText('');
      setAnswers({});
    }
  }, [existingEntry]);

  const handleAnswerChange = (question: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: text,
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    // Construct final free text from questions if they are filled and shown,
    // or just use free text directly.
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
        finalFreeText = qText + (freeText.trim() ? `\n\n### Notes\n${freeText}` : '');
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

  if (isLoadingEntry) {
    return (
      <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-tg-secondary-bg animate-pulse rounded mb-4" />
        <div className="h-[200px] w-full bg-tg-secondary-bg animate-pulse rounded-2xl mb-4" />
        <div className="h-10 w-full bg-tg-secondary-bg animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-y-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center p-4 border-b border-tg-hint/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-tg-secondary-bg hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-tg-text" />
        </button>
        <h2 className="text-lg font-bold">
          {entryDate === todayStr ? t('journalEditHeaderToday') : entryDate}
        </h2>
        {existingEntry ? (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-xl bg-tg-secondary-bg hover:bg-red-500/10 text-red-500 active:scale-[0.95] transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Sliders Container */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex flex-col gap-5">
          {/* Mood Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[14px]">
              <span className="font-semibold flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-tg-accent" />
                {t('journalEditMoodLabel')}
              </span>
              <span className="font-bold text-tg-accent text-lg">
                {mood} {mood <= 3 ? '😢' : mood <= 5 ? '😐' : mood <= 7 ? '🙂' : mood <= 9 ? '😊' : '🤩'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full accent-tg-accent cursor-pointer"
            />
          </div>

          {/* Energy Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[14px]">
              <span className="font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-500" />
                {t('journalEditEnergyLabel')}
              </span>
              <span className="font-bold text-orange-500 text-lg">
                {energy} {energy <= 3 ? '🥱' : energy <= 5 ? '💤' : energy <= 7 ? '⚡' : '🔥'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Template Questions Toggle */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowQuestions(!showQuestions)}
            className="flex justify-between items-center bg-tg-secondary-bg p-3.5 rounded-xl hover:opacity-95 text-left"
          >
            <span className="text-[14px] font-semibold text-tg-text">
              {showQuestions ? t('journalEditQuestionsHide') : t('journalEditQuestionsShow')}
            </span>
            {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Template Questions Fields */}
          {showQuestions && (
            <div className="flex flex-col gap-4">
              {templateQuestions.map((q, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-tg-hint">{q}</label>
                  <textarea
                    placeholder={t('journalEditQuestionPlaceholder')}
                    value={answers[q] || ''}
                    onChange={(e) => handleAnswerChange(q, e.target.value)}
                    rows={2}
                    className="w-full bg-tg-secondary-bg border border-tg-hint/15 rounded-xl p-3 text-[14px] text-tg-text placeholder-tg-hint outline-none focus:border-tg-accent focus:ring-1 focus:ring-tg-accent resize-none transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Free Text / General Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-tg-hint flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {showQuestions ? 'Notes / Free form' : t('journalEditEntryLabel')}
          </label>
          <textarea
            placeholder={t('journalEditPlaceholder')}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={5}
            className="w-full bg-tg-secondary-bg border border-tg-hint/15 rounded-xl p-3 text-[14px] text-tg-text placeholder-tg-hint outline-none focus:border-tg-accent focus:ring-1 focus:ring-tg-accent transition-all"
          />
          <div className="text-right text-[11px] text-tg-hint">
            {t('journalEditCharCount', { count: freeText.length })}
          </div>
        </div>

        {/* Change template links */}
        <button
          type="button"
          onClick={() => navigate('/profile/reflection-template')}
          className="text-tg-accent text-center text-[13px] font-medium hover:underline self-center"
        >
          {t('journalEditChangeTemplate')}
        </button>

        {/* Save Button */}
        <div className="mt-4 shrink-0 pb-6">
          <Button
            label={upsertMutation.isPending ? t('journalEditSaving') : t('journalEditSave')}
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
