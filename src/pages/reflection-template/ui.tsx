import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { getSavedReflectionTemplate, saveReflectionTemplate, resetReflectionTemplate } from '@/entities/journal';
import { HeaderBar } from '@/shared/ui';
import { Plus, X } from 'lucide-react';

export default function ReflectionTemplatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getInitialQuestions = (): string[] => {
    const saved = getSavedReflectionTemplate();
    if (saved) return saved;
    return [
      t('reflectionTemplateQ1'),
      t('reflectionTemplateQ2'),
      t('reflectionTemplateQ3'),
      t('reflectionTemplateQ4'),
    ];
  };

  const [questions, setQuestions] = useState<string[]>(getInitialQuestions());

  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, val: string) => {
    const updated = [...questions];
    updated[idx] = val;
    setQuestions(updated);
  };

  const handleSave = () => {
    const clean = questions.map((q) => q.trim()).filter(Boolean);
    if (clean.length === 0) {
      alert('Please keep at least one question');
      return;
    }
    saveReflectionTemplate(clean);
    navigate(-1);
  };

  const handleReset = () => {
    if (confirm(t('reflectionTemplateResetButton') + '?')) {
      resetReflectionTemplate();
      setQuestions([
        t('reflectionTemplateQ1'),
        t('reflectionTemplateQ2'),
        t('reflectionTemplateQ3'),
        t('reflectionTemplateQ4'),
      ]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary overflow-y-auto pb-tg-safe-bottom">
      <HeaderBar
        title={t('reflectionTemplateTitle')}
        onBack={handleSave}
        trailing={
          <button
            onClick={handleReset}
            className="text-hf-text-secondary hover:text-hf-warning transition-colors p-1"
            title={t('reflectionTemplateResetButton')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 p-4 flex flex-col gap-3.5 max-w-md mx-auto w-full">
        <p className="text-[13px] text-hf-text-secondary leading-relaxed px-1">
          {t('reflectionTemplateDesc')}
        </p>

        {questions.map((q, idx) => (
          <div key={idx} className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card px-3.5 py-3 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-hf-accent/12 flex items-center justify-center shrink-0">
              <span className="text-[12px] font-semibold text-hf-accent leading-none">{idx + 1}</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={q}
                onChange={(e) => handleQuestionChange(idx, e.target.value)}
                placeholder={t('reflectionTemplateInputHint')}
                className="w-full bg-transparent text-[14px] text-hf-text-primary outline-none placeholder:text-hf-text-tertiary"
              />
            </div>
            {questions.length > 1 && (
              <button
                onClick={() => handleRemoveQuestion(idx)}
                className="p-2 rounded-hf-md hover:bg-hf-danger/10 hover:text-hf-danger text-hf-text-tertiary transition-colors"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={handleAddQuestion}
          className="w-full py-3 border border-dashed border-hf-border/50 rounded-hf-md flex items-center justify-center gap-2 text-hf-accent text-[14px] font-semibold hover:bg-hf-accent/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('reflectionTemplateAddButton')}</span>
        </button>

        <button
          onClick={handleReset}
          className="w-full py-3 rounded-hf-md text-hf-text-secondary text-[14px] font-semibold hover:bg-hf-bg-secondary/50 transition-colors mt-3"
        >
          {t('reflectionTemplateResetButton')}
        </button>
      </div>
    </div>
  );
}
