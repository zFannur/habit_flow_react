import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { BottomSheet } from '@/shared/ui';
import { supabase } from '@/shared/api';
import { ArrowLeft, Languages, Trash2, ShieldAlert } from 'lucide-react';

export default function AccountPage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { state: session, logout } = useSessionStore();
  const user = session.status === 'authenticated' ? session.user : null;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // 1. Delete rows from supabase
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      if (error) throw error;
      
      // 2. Perform logout and go back to splash screen
      await logout();
      setIsDeleteOpen(false);
      navigate('/splash');
    } catch (e) {
      console.error(e);
      alert('Failed to delete account');
    }
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
          {t('profileMenuAccount')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* User Card info */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-tg-accent to-purple-600 shadow flex items-center justify-center text-white text-2xl font-extrabold select-none">
            {user ? (user.first_name || 'U').charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-tg-text truncate">
              {user ? `${user.first_name || ''} ${user.last_name || ''}` : 'Guest User'}
            </h3>
            {user?.telegram_username && (
              <p className="text-[12px] text-tg-hint mt-0.5">
                @{user.telegram_username}
              </p>
            )}
          </div>
        </div>

        {/* Account Details list */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex flex-col gap-3 text-[13px] shadow-sm">
          <div className="flex justify-between border-b border-tg-hint/5 pb-2">
            <span className="text-tg-hint">Telegram ID</span>
            <span className="font-bold text-tg-text">{user?.telegram_user_id || 'Not linked'}</span>
          </div>
          <div className="flex justify-between border-b border-tg-hint/5 pb-2">
            <span className="text-tg-hint">First Name</span>
            <span className="font-bold text-tg-text">{user?.first_name || '—'}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-tg-hint">Language</span>
            <span className="font-bold text-tg-text uppercase">{locale}</span>
          </div>
        </div>

        {/* Language option switch */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-tg-text">
            <Languages className="w-4 h-4 text-tg-accent" />
            Switch Language
          </h3>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setLocale('en')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] border transition-all ${
                locale === 'en' ? 'border-tg-accent bg-tg-accent/8 text-tg-accent' : 'border-tg-hint/10 bg-tg-secondary-bg'
              }`}
            >
              {t('langEn')}
            </button>
            <button
              onClick={() => setLocale('ru')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] border transition-all ${
                locale === 'ru' ? 'border-tg-accent bg-tg-accent/8 text-tg-accent' : 'border-tg-hint/10 bg-tg-secondary-bg'
              }`}
            >
              {t('langRu')}
            </button>
          </div>

        </div>

        {/* Danger zone delete button */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm mt-auto">
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-red-500">
            <ShieldAlert className="w-4.5 h-4.5" />
            {t('profileSectionDanger')}
          </h3>
          <p className="text-[12px] text-tg-hint leading-relaxed">
            {t('profileDeleteAccountMessage')}
          </p>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="w-full mt-2 py-3 rounded-xl bg-red-500 text-white font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-600 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('profileMenuDeleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t('profileDeleteAccountTitle')}
      >
        <p className="text-[14px] text-tg-hint mb-6 leading-relaxed">
          {t('profileDeleteAccountMessage')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="flex-1 py-3 rounded-xl bg-tg-secondary-bg font-semibold text-[14px] text-tg-text"
          >
            {t('commonCancel')}
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-[14px]"
          >
            {t('commonDelete')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
