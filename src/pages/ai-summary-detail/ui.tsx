import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useAiSummariesQuery, useDeleteSummaryMutation, useRegenerateSummaryMutation } from '@/entities/ai';
import { Markdown } from '@/shared/ui';
import { ArrowLeft, Trash2, RefreshCw, Calendar, Cpu } from 'lucide-react';

export default function AiSummaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Queries & Mutations
  const { data: summaries, isLoading } = useAiSummariesQuery(userId);
  const summary = summaries?.find((s) => s.id === id);

  const deleteMutation = useDeleteSummaryMutation(userId || '');
  const regenerateMutation = useRegenerateSummaryMutation(userId || '');

  const handleDelete = async () => {
    if (!id || !userId) return;
    if (confirm(t('aiPromptDeleteConfirmText'))) {
      try {
        await deleteMutation.mutateAsync(id);
        navigate(-1);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRegenerate = async () => {
    if (!summary || !userId) return;
    if (confirm(t('aiSummaryRegenerateConfirmText'))) {
      try {
        const key = localStorage.getItem('openrouter_key') || undefined;
        await regenerateMutation.mutateAsync({
          rangeEndN: summary.range_end_n,
          openRouterKey: key,
          model: summary.model_used || undefined,
        });
        alert('Regenerating summary triggered successfully!');
        navigate(-1);
      } catch (e) {
        console.error(e);
        alert('Failed to regenerate summary');
      }
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-[250px] w-full bg-hf-bg-secondary animate-pulse rounded-2xl" />
      </div>
    );
  }

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
        <h2 className="text-[16px] font-bold truncate max-w-[60%]">
          {t('aiSummaryTitle', {
            from: summary.range_start_date,
            to: summary.range_end_date,
          })}
        </h2>
        <button
          type="button"
          onClick={handleDelete}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:bg-red-500/10 text-red-500 active:scale-[0.95] transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* Metadata Card */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 flex flex-col gap-3 text-[13px] shadow-sm">
          <div className="flex items-center gap-2 text-hf-text-secondary">
            <Calendar className="w-4 h-4 text-hf-accent" />
            <span>
              Entries range: <strong>{summary.range_start_n} - {summary.range_end_n}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-hf-text-secondary">
            <Cpu className="w-4 h-4 text-orange-500" />
            <span>
              Model used: <strong>{summary.model_used || 'google/gemini-2.5-flash'}</strong>
            </span>
          </div>
          {summary.tokens_used && (
            <div className="text-[11px] text-hf-text-secondary mt-0.5">
              Tokens used: {summary.tokens_used}
            </div>
          )}
        </div>

        {/* Summary Content */}
        <div className="bg-hf-card border border-hf-border/10 rounded-2xl p-5 shadow-sm min-h-[200px]">
          <Markdown content={summary.content} />
        </div>

        {/* Regenerate Button */}
        <div className="mt-2 shrink-0 pb-6">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
            className="w-full py-3.5 rounded-xl border border-hf-accent/20 bg-hf-accent/5 text-hf-accent font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-hf-accent/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
            {t('aiSummaryRegenerate')}
          </button>
        </div>
      </div>
    </div>
  );
}
