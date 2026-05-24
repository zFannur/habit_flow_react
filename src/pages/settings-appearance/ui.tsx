import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useTheme, type ThemeMode, type AccentColor } from '@/shared/lib/theme';
import { HeaderBar } from '@/shared/ui';

const ACCENT_OPTIONS: { id: AccentColor; color: string; nameKey: string }[] = [
  { id: 'blue',   color: '#3B82F6', nameKey: 'accentBlue'   },
  { id: 'green',  color: '#22C55E', nameKey: 'accentGreen'  },
  { id: 'amber',  color: '#F59E0B', nameKey: 'accentAmber'  },
  { id: 'red',    color: '#EF4444', nameKey: 'accentRed'    },
  { id: 'violet', color: '#A855F7', nameKey: 'accentViolet' },
  { id: 'pink',   color: '#EC4899', nameKey: 'accentPink'   },
  { id: 'teal',   color: '#06B6D4', nameKey: 'accentTeal'   },
  { id: 'gray',   color: '#6B7785', nameKey: 'accentGray'   },
];

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold px-1 pb-2.5">
      {text}
    </p>
  );
}

export default function AppearanceSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode, setMode, accent, setAccent } = useTheme();

  const themeOptions: { type: ThemeMode; labelKey: string }[] = [
    { type: 'light', labelKey: 'appearanceThemeLight' },
    { type: 'dark',  labelKey: 'appearanceThemeDark'  },
    { type: 'auto',  labelKey: 'appearanceThemeAuto'  },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary">
      <HeaderBar title={t('appearanceTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="p-4 flex flex-col max-w-md mx-auto w-full">

          {/* Theme section */}
          <SectionLabel text={t('appearanceThemeSection')} />
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mb-4">
            <div className="p-[3px] bg-hf-bg-tertiary rounded-hf-md flex gap-0">
              {themeOptions.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setMode(item.type)}
                  className={`flex-1 py-2 rounded-[9px] text-[13px] font-medium transition-all ${
                    mode === item.type
                      ? 'bg-hf-card text-hf-text-primary shadow-sm'
                      : 'text-hf-text-tertiary'
                  }`}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Accent section */}
          <SectionLabel text={t('appearanceAccentSection')} />
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((item) => {
                const selected = accent === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAccent(item.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: item.color,
                        border: selected ? `3px solid ${item.color}` : '3px solid transparent',
                        boxShadow: `0 2px 6px ${item.color}4D`,
                      }}
                    >
                      {selected && <span className="text-white text-sm font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] text-hf-text-tertiary font-medium">{t(item.nameKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
