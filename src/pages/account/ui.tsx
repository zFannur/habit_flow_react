import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { BottomSheet, HeaderBar } from '@/shared/ui';
import { supabase } from '@/shared/api';
import { Languages, ShieldAlert, Trash2 } from 'lucide-react';

export default function AccountPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { state: session, logout } = useSessionStore();
  const user = session.status === 'authenticated' ? session.user : null;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<1 | 7>(1);

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      if (error) throw error;
      await logout();
      setIsDeleteOpen(false);
      navigate('/splash');
    } catch (e) {
      console.error(e);
      alert('Failed to delete account');
    }
  };

  const avatarLetter = user ? (user.first_name || 'U').charAt(0).toUpperCase() : 'U';
  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' : 'Guest User';

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary overflow-y-auto">
      <HeaderBar title={t('accountTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* User Info Card */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-hf-accent to-purple-600 shadow flex items-center justify-center text-white text-lg font-extrabold select-none shrink-0">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-hf-text-primary truncate leading-tight">
                {displayName}
              </h3>
              {user?.telegram_username && (
                <p className="text-[12px] text-hf-text-tertiary mt-0.5">
                  @{user.telegram_username}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Telegram Info Rows */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-3 text-[13px]">
          <div className="flex justify-between items-center pb-2 border-b border-hf-border/30">
            <span className="text-hf-text-secondary">{t('aboutWhatLabel')}</span>
            <span className="font-bold text-hf-text-primary">{user?.telegram_user_id || '—'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-hf-border/30">
            <span className="text-hf-text-secondary">{t('accountTelegramSection')}</span>
            <span className="font-bold text-hf-text-primary">{user?.first_name || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-hf-text-secondary">{t('accountLanguageSection')}</span>
            <span className="font-bold text-hf-text-primary uppercase">{locale}</span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-hf-text-primary">
            <Languages className="w-4 h-4 text-hf-accent" />
            {t('accountLanguageSection')}
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setLocale('en')}
              className={`flex-1 py-2.5 rounded-hf-md font-bold text-[13px] border transition-all ${
                locale === 'en'
                  ? 'border-hf-accent bg-hf-accent/10 text-hf-accent'
                  : 'border-hf-border/30 bg-hf-bg-secondary text-hf-text-secondary'
              }`}
            >
              {t('langEn')}
            </button>
            <button
              onClick={() => setLocale('ru')}
              className={`flex-1 py-2.5 rounded-hf-md font-bold text-[13px] border transition-all ${
                locale === 'ru'
                  ? 'border-hf-accent bg-hf-accent/10 text-hf-accent'
                  : 'border-hf-border/30 bg-hf-bg-secondary text-hf-text-secondary'
              }`}
            >
              {t('langRu')}
            </button>
          </div>
        </div>

        {/* First Day of Week */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-1">
          <h3 className="text-sm font-bold text-hf-text-primary mb-1">{t('accountFirstDaySection')}</h3>
          <button
            onClick={() => setFirstDayOfWeek(1)}
            className="flex items-center gap-3 py-3 w-full text-left"
          >
            <div
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all ${
                firstDayOfWeek === 1 ? 'border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
              }`}
            >
              {firstDayOfWeek === 1 && (
                <div className="w-[10px] h-[10px] rounded-full bg-hf-accent" />
              )}
            </div>
            <span className="text-[14px] font-medium text-hf-text-primary">{t('accountFirstDayMonday')}</span>
          </button>
          <div className="border-t border-hf-border/30" />
          <button
            onClick={() => setFirstDayOfWeek(7)}
            className="flex items-center gap-3 py-3 w-full text-left"
          >
            <div
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all ${
                firstDayOfWeek === 7 ? 'border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
              }`}
            >
              {firstDayOfWeek === 7 && (
                <div className="w-[10px] h-[10px] rounded-full bg-hf-accent" />
              )}
            </div>
            <span className="text-[14px] font-medium text-hf-text-primary">{t('accountFirstDaySunday')}</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-hf-lg p-4 flex flex-col gap-3 shadow-sm mt-auto">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-red-500">
            <ShieldAlert className="w-[18px] h-[18px]" />
            {t('profileSectionDanger')}
          </h3>
          <p className="text-[12px] text-hf-text-secondary leading-relaxed">
            {t('profileDeleteAccountMessage')}
          </p>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="w-full py-3 rounded-hf-md bg-red-500 text-white font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-600 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('profileMenuDeleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation BottomSheet */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t('profileDeleteAccountTitle')}
      >
        <p className="text-[14px] text-hf-text-secondary mb-6 leading-relaxed">
          {t('profileDeleteAccountMessage')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="flex-1 py-3 rounded-hf-md bg-hf-bg-secondary font-semibold text-[14px] text-hf-text-primary"
          >
            {t('commonCancel')}
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex-1 py-3 rounded-hf-md bg-red-500 text-white font-semibold text-[14px]"
          >
            {t('commonDelete')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
