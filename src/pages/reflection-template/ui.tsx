import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { getSavedReflectionTemplate, saveReflectionTemplate, resetReflectionTemplate } from '@/entities/journal';
import { Button, Input } from '@/shared/ui';
import { ArrowLeft, Plus, Trash2, RotateCcw } from 'lucide-react';

export default function ReflectionTemplatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load existing or default questions
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
    alert('Reflection template saved!');
    navigate(-1);
  };

  const handleReset = () => {
    if (confirm(t('reflectionTemplateResetButton'))) {
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
          {t('reflectionTemplateTitle')}
        </h2>
        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:bg-orange-500/10 text-orange-500 active:scale-[0.95] transition-all"
          title={t('reflectionTemplateResetButton')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        <div>
          <p className="text-hf-text-secondary text-[13px] leading-relaxed">
            {t('reflectionTemplateDesc')}
          </p>
        </div>

        {/* Questions list */}
        <div className="flex flex-col gap-3.5">
          {questions.map((q, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-[14px] font-bold text-hf-text-secondary w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <Input
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  placeholder={t('reflectionTemplateInputHint')}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                className="p-3 bg-hf-bg-secondary/50 border border-hf-border/10 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Question Button */}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-3.5 border border-dashed border-hf-border/25 rounded-xl flex items-center justify-center gap-2 hover:bg-hf-bg-secondary transition-all text-hf-accent text-[14px] font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>{t('reflectionTemplateAddButton')}</span>
        </button>

        {/* Save Button */}
        <div className="mt-4 shrink-0 pb-6">
          <Button
            label={t('commonSave')}
            onClick={handleSave}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
