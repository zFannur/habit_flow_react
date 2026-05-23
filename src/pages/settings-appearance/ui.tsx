import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';
import { ArrowLeft, Moon, Sun, Monitor, Languages, Palette } from 'lucide-react';

export default function AppearanceSettingsPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();

  // Local Appearance states
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [accent, setAccent] = useState<string>('default');

  // Load Saved States
  useEffect(() => {
    const savedTheme = (localStorage.getItem('appearance.theme') as 'light' | 'dark' | 'system') || 'system';
    setTheme(savedTheme);
    
    const savedAccent = localStorage.getItem('appearance.accent') || 'default';
    setAccent(savedAccent);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('appearance.theme', newTheme);
    
    // Apply styling class to root document
    const root = document.documentElement;
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleAccentChange = (newAccent: string) => {
    setAccent(newAccent);
    localStorage.setItem('appearance.accent', newAccent);
    
    // Apply theme variables globally
    const root = document.documentElement;
    if (newAccent === 'orange') {
      root.style.setProperty('--tg-theme-accent-color', '#f97316');
    } else if (newAccent === 'purple') {
      root.style.setProperty('--tg-theme-accent-color', '#a855f7');
    } else if (newAccent === 'green') {
      root.style.setProperty('--tg-theme-accent-color', '#10b981');
    } else {
      // Default Telegram blue
      root.style.setProperty('--tg-theme-accent-color', '#2481cc');
    }
  };

  const handleLanguageChange = (lang: 'en' | 'ru') => {
    setLocale(lang);
  };

  const handleSave = () => {
    alert('Appearance settings saved!');
    navigate(-1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-tg-hint/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-tg-secondary-bg hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-tg-text" />
        </button>
        <h2 className="text-[17px] font-bold">
          {t('profileMenuAppearance')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Language Selection */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-tg-text">
            <Languages className="w-4 h-4 text-tg-accent" />
            Language
          </h3>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex-1 py-3 rounded-xl font-bold text-[13px] border transition-all ${
                locale === 'en'
                  ? 'border-tg-accent bg-tg-accent/8 text-tg-accent font-extrabold'
                  : 'border-tg-hint/10 bg-tg-secondary-bg text-tg-text'
              }`}
            >
              {t('langEn')}
            </button>
            <button
              onClick={() => handleLanguageChange('ru')}
              className={`flex-1 py-3 rounded-xl font-bold text-[13px] border transition-all ${
                locale === 'ru'
                  ? 'border-tg-accent bg-tg-accent/8 text-tg-accent font-extrabold'
                  : 'border-tg-hint/10 bg-tg-secondary-bg text-tg-text'
              }`}
            >
              {t('langRu')}
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-tg-text">
            <Moon className="w-4 h-4 text-tg-accent" />
            Theme Mode
          </h3>
          <div className="grid grid-cols-3 gap-2.5 mt-1">
            {[
              { type: 'light' as const, label: 'Light', icon: Sun },
              { type: 'dark' as const, label: 'Dark', icon: Moon },
              { type: 'system' as const, label: 'System', icon: Monitor },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => handleThemeChange(item.type)}
                  className={`py-3 px-2.5 rounded-xl font-semibold text-[12px] border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    theme === item.type
                      ? 'border-tg-accent bg-tg-accent/8 text-tg-accent font-extrabold'
                      : 'border-tg-hint/10 bg-tg-secondary-bg text-tg-text'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Selection */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-tg-text">
            <Palette className="w-4 h-4 text-tg-accent" />
            {t('habitCreateStep2AccentColorLabel')}
          </h3>
          <div className="flex gap-3 justify-between mt-1">
            {[
              { id: 'default', color: '#2481cc', name: 'Blue' },
              { id: 'orange', color: '#f97316', name: 'Orange' },
              { id: 'purple', color: '#a855f7', name: 'Purple' },
              { id: 'green', color: '#10b981', name: 'Green' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleAccentChange(item.id)}
                className={`w-11 h-11 rounded-full relative transition-all border flex items-center justify-center ${
                  accent === item.id ? 'scale-110 shadow border-tg-text' : 'border-transparent opacity-85'
                }`}
                style={{ backgroundColor: item.color }}
                title={item.name}
              >
                {accent === item.id && <span className="text-white text-xs font-bold">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-auto shrink-0 pb-6">
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
