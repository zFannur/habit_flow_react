import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useTheme, type ThemeMode, type AccentColor } from '@/shared/lib/theme';
import { HeaderBar } from '@/shared/ui';
import { Moon, Sun, Monitor, Languages, Palette } from 'lucide-react';

export default function AppearanceSettingsPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { mode, setMode, accent, setAccent } = useTheme();

  const themeOptions: { type: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { type: 'light', label: t('themeLight'), Icon: Sun },
    { type: 'dark', label: t('themeDark'), Icon: Moon },
    { type: 'auto', label: t('themeSystem'), Icon: Monitor },
  ];

  const accentOptions: { id: AccentColor; color: string; name: string }[] = [
    { id: 'blue', color: '#3B82F6', name: 'Blue' },
    { id: 'green', color: '#22C55E', name: 'Green' },
    { id: 'amber', color: '#F59E0B', name: 'Amber' },
    { id: 'red', color: '#EF4444', name: 'Red' },
    { id: 'violet', color: '#A855F7', name: 'Violet' },
    { id: 'pink', color: '#EC4899', name: 'Pink' },
    { id: 'teal', color: '#06B6D4', name: 'Teal' },
    { id: 'gray', color: '#6B7785', name: 'Gray' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <HeaderBar
        title={t('profileMenuAppearance')}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        <div className="bg-hf-card border border-hf-border rounded-hf-lg p-4 shadow-hf-card flex flex-col gap-3">
          <h3 className="text-hf-title-sm flex items-center gap-1.5 text-hf-text-primary">
            <Languages className="w-4 h-4 text-hf-accent" />
            {t('profileSectionLanguage')}
          </h3>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setLocale('en')}
              className={`flex-1 py-3 rounded-hf-md text-hf-label-sm border transition-all ${
                locale === 'en'
                  ? 'border-hf-accent bg-hf-accent/8 text-hf-accent'
                  : 'border-hf-border bg-hf-bg-secondary text-hf-text-secondary'
              }`}
            >
              {t('langEn')}
            </button>
            <button
              onClick={() => setLocale('ru')}
              className={`flex-1 py-3 rounded-hf-md text-hf-label-sm border transition-all ${
                locale === 'ru'
                  ? 'border-hf-accent bg-hf-accent/8 text-hf-accent'
                  : 'border-hf-border bg-hf-bg-secondary text-hf-text-secondary'
              }`}
            >
              {t('langRu')}
            </button>
          </div>
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg p-4 shadow-hf-card flex flex-col gap-3">
          <h3 className="text-hf-title-sm flex items-center gap-1.5 text-hf-text-primary">
            <Moon className="w-4 h-4 text-hf-accent" />
            {t('themeLabel')}
          </h3>
          <div className="grid grid-cols-3 gap-2.5 mt-1">
            {themeOptions.map((item) => {
              const { Icon } = item;
              return (
                <button
                  key={item.type}
                  onClick={() => setMode(item.type)}
                  className={`py-3 px-2.5 rounded-hf-md text-hf-label-sm border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    mode === item.type
                      ? 'border-hf-accent bg-hf-accent/8 text-hf-accent'
                      : 'border-hf-border bg-hf-bg-secondary text-hf-text-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg p-4 shadow-hf-card flex flex-col gap-3">
          <h3 className="text-hf-title-sm flex items-center gap-1.5 text-hf-text-primary">
            <Palette className="w-4 h-4 text-hf-accent" />
            {t('habitCreateStep2AccentColorLabel')}
          </h3>
          <div className="flex gap-3 justify-between mt-1 flex-wrap">
            {accentOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => setAccent(item.id)}
                className={`w-11 h-11 rounded-full relative transition-all border flex items-center justify-center ${
                  accent === item.id ? 'scale-110 shadow border-hf-text-primary border-2' : 'border-transparent opacity-85'
                }`}
                style={{ backgroundColor: item.color }}
                title={item.name}
              >
                {accent === item.id && <span className="text-white text-xs font-bold">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
