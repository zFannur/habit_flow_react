import { Env } from '@/shared/config';

interface EmojiIconProps {
  emoji: string;
  iconTelegramFileId?: string;
  tint?: string;
  size?: number;
  fontSize?: number;
  className?: string;
}

export const EmojiIcon = ({
  emoji,
  iconTelegramFileId,
  tint,
  size = 44,
  fontSize = 22,
  className = '',
}: EmojiIconProps) => {
  const imageUrl = iconTelegramFileId
    ? `${Env.supabaseUrl}/functions/v1/get_telegram_photo?file_id=${iconTelegramFileId}`
    : null;

  return (
    <div
      className={`rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: tint || 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={emoji}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji on image load failure
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.textContent = emoji;
              span.style.fontSize = `${fontSize}px`;
              span.className = 'leading-none select-none';
              parent.appendChild(span);
            }
          }}
        />
      ) : (
        <span style={{ fontSize: `${fontSize}px` }} className="leading-none select-none">
          {emoji}
        </span>
      )}
    </div>
  );
};
