import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useHabitsQuery } from '@/entities/habit';
import { useJournalEntriesQuery } from '@/entities/journal';
import { supabase } from '@/shared/api';
import { BottomSheet } from '@/shared/ui';
import {
  FileText,
  User,
  Key,
  Bell,
  Palette,
  ClipboardList,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  Mail,
  Trash2,
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session, logout } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;
  const user = session.status === 'authenticated' ? session.user : null;

  const [isSupporter, setIsSupporter] = useState(false);
  const [daysWithApp, setDaysWithApp] = useState(1);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: habits } = useHabitsQuery(userId);
  const { data: entries } = useJournalEntriesQuery(userId);

  const activeHabitsCount = habits ? habits.filter((h) => !h.is_archived).length : 0;

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('users')
      .select('created_at, is_supporter')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.is_supporter) setIsSupporter(data.is_supporter);
          if (data.created_at) {
            const start = new Date(data.created_at);
            const diff = Math.ceil(
              (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
            );
            setDaysWithApp(Math.max(1, diff));
          }
        }
      });
  }, [userId]);

  const calculateMaxStreak = () => {
    if (!entries || !entries.length) return 0;
    const dates = new Set(entries.map((e) => e.entry_date));

    let maxStreak = 0;
    let currentStreak = 0;

    const sorted = [...dates].sort();
    const today = new Date().toISOString().split('T')[0] || '';

    if (dates.has(today)) {
      currentStreak = 1;
      maxStreak = 1;
    }

    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = new Date(sorted[i + 1] || '');
      const prev = new Date(sorted[i] || '');
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      }
    }

    return Math.max(maxStreak, 1);
  };

  const maxStreak = calculateMaxStreak();

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
    }
  };

  const userInitial = user
    ? (user.first_name || 'U').charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <header className="w-full bg-hf-bg-primary border-b border-hf-border flex items-center px-4 pt-tg-safe-top pb-3">
        <h1 className="flex-1 text-[20px] font-bold text-hf-text-primary tracking-[-0.02em]">
          {t('navProfile')}
        </h1>
      </header>

      <div className="flex-1 flex flex-col gap-5 max-w-md mx-auto w-full p-4">
        {/* User Card */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-5 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-hf-accent to-[#6366F1] shadow-md flex items-center justify-center text-white text-3xl font-extrabold select-none">
            {userInitial}
          </div>

          <h2 className="text-hf-headline-sm text-hf-text-primary text-center">
            {user
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : 'Guest User'}
          </h2>

          {isSupporter ? (
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-hf-premium/10 text-hf-premium border border-hf-premium/20">
              {t('profileBadgeSupporter')}
            </span>
          ) : (
            user?.telegram_username && (
              <span className="text-hf-label-sm text-hf-text-tertiary">
                @{user.telegram_username}
              </span>
            )
          )}

          {/* Stats Row */}
          <div className="w-full flex items-center justify-around mt-2 pt-2 border-t border-hf-border/20">
            <div className="flex flex-col items-center flex-1">
              <span className="text-hf-headline-sm text-hf-text-primary font-bold">
                {daysWithApp}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-hf-text-tertiary mt-0.5 text-center leading-tight">
                {t('profileStatsDaysWithApp').replace('\n', ' ')}
              </span>
            </div>

            <div className="w-px h-8 bg-hf-border/30" />

            <div className="flex flex-col items-center flex-1">
              <span className="text-hf-headline-sm text-hf-success font-bold">
                {activeHabitsCount}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-hf-text-tertiary mt-0.5 text-center leading-tight">
                {t('profileStatsActiveHabits').replace('\n', ' ')}
              </span>
            </div>

            <div className="w-px h-8 bg-hf-border/30" />

            <div className="flex flex-col items-center flex-1">
              <span className="text-hf-headline-sm text-hf-warning font-bold">
                {maxStreak}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-hf-text-tertiary mt-0.5 text-center leading-tight">
                {t('profileStatsStreak').replace('\n', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-hf-label-sm font-bold uppercase tracking-[0.08em] text-hf-text-tertiary ml-1.5">
            {t('profileSectionBasic')}
          </span>
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
            <button
              onClick={() => navigate('/journal')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuJournal')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/account')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuAccount')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-hf-label-sm font-bold uppercase tracking-[0.08em] text-hf-text-tertiary ml-1.5">
            {t('profileSectionSettings')}
          </span>
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
            <button
              onClick={() => navigate('/profile/ai-settings')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuAiSettings')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/notifications')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuNotifications')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/appearance')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuAppearance')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/reflection-template')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuReflectionTemplate')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-hf-label-sm font-bold uppercase tracking-[0.08em] text-hf-text-tertiary ml-1.5">
            {t('profileSectionSupport')}
          </span>
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
            <button
              onClick={() => navigate('/profile/donate')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-[13.5px] font-semibold text-yellow-500">
                  {t('profileMenuDonate')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/about')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuAbout')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/privacy')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all border-b border-hf-border/5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuPrivacy')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>

            <button
              onClick={() => navigate('/profile/contact')}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-hf-bg-secondary/30 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-hf-accent" />
                <span className="text-[13.5px] font-semibold">
                  {t('profileMenuContact')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-hf-text-secondary" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-hf-lg p-4 flex flex-col gap-3 mb-4">
          <h3 className="text-red-500 font-bold text-hf-label-sm uppercase tracking-wider">
            {t('profileSectionDanger')}
          </h3>
          <p className="text-hf-label-sm text-hf-text-secondary leading-relaxed">
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
