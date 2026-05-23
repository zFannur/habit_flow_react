import { WifiOff, Lock, Hourglass, AlertTriangle, Pencil } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useTranslation } from '@/shared/lib/i18n';

type ErrorKind = 'network' | 'unauthorized' | 'aiLimit' | 'server' | 'validation' | 'generic';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  onRelogin?: () => void;
  onChangeModel?: () => void;
  isAiContext?: boolean;
  className?: string;
}

export const ErrorState = ({
  error,
  onRetry,
  onRelogin,
  onChangeModel,
  isAiContext = false,
  className = '',
}: ErrorStateProps) => {
  const { t } = useTranslation();

  const classifyError = (): ErrorKind => {
    if (!error) return 'generic';

    const errObj = error as Record<string, unknown>;
    const msg = typeof errObj.message === 'string' ? errObj.message.toLowerCase() : String(errObj).toLowerCase();
    const status = typeof errObj.status === 'number' ? errObj.status : 0;

    if (
      msg.includes('network') ||
      msg.includes('fetch') ||
      status === 0
    ) {
      return 'network';
    }

    if (status === 401 || msg.includes('unauthorized')) {
      return 'unauthorized';
    }

    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
      return 'aiLimit';
    }

    if (status >= 500 && status <= 504) {
      return 'server';
    }

    if (msg.includes('validation') || msg.includes('invalid')) {
      return 'validation';
    }

    return 'generic';
  };

  const kind = classifyError();

  const getDetails = () => {
    switch (kind) {
      case 'network':
        return {
          Icon: WifiOff,
          colorClass: 'text-hf-text-secondary bg-hf-text-secondary/10',
          title: t('errorNetworkTitle'),
          desc: t('errorNetworkDesc'),
          primaryLabel: t('errorRetry'),
          primaryAction: onRetry,
          secondaryLabel: null,
          secondaryAction: null,
        };
      case 'unauthorized':
        return {
          Icon: Lock,
          colorClass: 'text-amber-500 bg-amber-500/10',
          title: t('errorUnauthorizedTitle'),
          desc: t('errorUnauthorizedDesc'),
          primaryLabel: t('errorRelogin'),
          primaryAction: onRelogin,
          secondaryLabel: null,
          secondaryAction: null,
        };
      case 'aiLimit':
        return {
          Icon: Hourglass,
          colorClass: 'text-amber-500 bg-amber-500/10',
          title: t('errorAiLimitTitle'),
          desc: t('errorAiLimitDesc'),
          primaryLabel: isAiContext ? t('errorChangeModel') : t('errorWait'),
          primaryAction: isAiContext ? onChangeModel : undefined,
          secondaryLabel: isAiContext ? t('errorWait') : null,
          secondaryAction: null,
        };
      case 'server':
        return {
          Icon: AlertTriangle,
          colorClass: 'text-hf-danger bg-hf-danger/10',
          title: t('errorServerTitle'),
          desc: t('errorServerDesc'),
          primaryLabel: t('errorRetry'),
          primaryAction: onRetry,
          secondaryLabel: null,
          secondaryAction: null,
        };
      case 'validation':
        return {
          Icon: Pencil,
          colorClass: 'text-hf-accent bg-hf-accent/10',
          title: t('errorValidationTitle'),
          desc: t('errorValidationDesc'),
          primaryLabel: null,
          primaryAction: null,
          secondaryLabel: null,
          secondaryAction: null,
        };
      default:
        return {
          Icon: AlertTriangle,
          colorClass: 'text-hf-text-secondary bg-hf-text-secondary/10',
          title: t('errorGenericTitle'),
          desc: t('errorGenericDesc'),
          primaryLabel: t('errorRetry'),
          primaryAction: onRetry,
          secondaryLabel: null,
          secondaryAction: null,
        };
    }
  };

  const details = getDetails();
  const { Icon } = details;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-9 py-6 ${className}`}
    >
      {/* Icon Wrapper */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${details.colorClass}`}
      >
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-[18px] font-bold text-hf-text-primary leading-tight mt-5 tracking-[-0.01em]">
        {details.title}
      </h3>
      <p className="text-[14px] text-hf-text-secondary leading-relaxed mt-2.5 max-w-xs">
        {details.desc}
      </p>

      {details.primaryLabel && details.primaryAction && (
        <div className="mt-7 w-full flex justify-center">
          <Button
            label={details.primaryLabel}
            onClick={details.primaryAction}
            variant="primary"
          />
        </div>
      )}

      {details.secondaryLabel && details.secondaryAction && (
        <div className="mt-3 w-full flex justify-center">
          <Button
            label={details.secondaryLabel}
            onClick={details.secondaryAction}
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
};
