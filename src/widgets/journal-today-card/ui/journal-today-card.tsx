import { useTranslation } from '@/shared/lib/i18n';

interface JournalTodayCardProps {
  written: boolean;
  onOpen: () => void;
  timeStr?: string;
  textPreview?: string;
}

const STARS = [
  { top: '12%', left: '68%', size: '3px' },
  { top: '25%', left: '82%', size: '2px' },
  { top: '55%', left: '75%', size: '2px' },
  { top: '70%', left: '90%', size: '3px' },
  { top: '40%', left: '95%', size: '1.5px' },
  { top: '80%', left: '60%', size: '1.5px' },
  { top: '15%', left: '55%', size: '1.5px' },
];

export const JournalTodayCard = ({
  written = false,
  onOpen,
  timeStr,
  textPreview,
}: JournalTodayCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      className="relative min-h-[110px] rounded-[20px] overflow-hidden shadow-md border border-tg-hint/10 p-5 flex items-center gap-3.5 select-none"
      style={{
        background: 'linear-gradient(135deg, #1A1A4E 0%, #2D1B69 40%, #0F3460 100%)',
      }}
    >
      {/* Background Stars */}
      {STARS.map((star, idx) => (
        <div
          key={idx}
          className="absolute bg-white/40 rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
        />
      ))}

      {/* Emoji Indicator */}
      <span className="text-[32px] leading-none shrink-0">
        {written ? '✅' : '📝'}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 text-white">
        {written ? (
          <div className="flex flex-col">
            <span className="text-[12px] text-white/60 leading-tight">
              {timeStr || 'Запись сделана'}
            </span>
            <p className="text-[14px] text-white/85 leading-normal mt-1 line-clamp-2 italic">
              {textPreview || '«...»'}
            </p>
            <button
              type="button"
              onClick={onOpen}
              className="text-[14px] font-semibold text-white/75 hover:text-white mt-2 self-start transition-all"
            >
              {t('journalCardEditLink')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <h4 className="text-[16px] font-bold leading-tight">
              {t('journalCardTitle')}
            </h4>
            <p className="text-[12px] text-white/60 leading-snug mt-1">
              {t('journalCardSubtitle')}
            </p>
            <button
              type="button"
              onClick={onOpen}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 border border-white/35 hover:bg-white/25 active:scale-[0.95] text-white font-semibold text-[13px] self-start transition-all"
            >
              {t('commonOpen')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
