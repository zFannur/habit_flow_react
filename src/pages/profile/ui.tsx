import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useHabitsQuery } from '@/entities/habit';
import { useJournalEntriesQuery, useJournalEntryCountQuery } from '@/entities/journal';
import { supabase } from '@/shared/api';
import {
  User,
  FileText,
  Key,
  Bell,
  Palette,
  ClipboardList,
  Info,
  ShieldCheck,
  Mail,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;
  const user = session.status === 'authenticated' ? session.user : null;

  // Local stats state
  const [isSupporter, setIsSupporter] = useState(false);
  const [daysWithApp, setDaysWithApp] = useState(1);

  // Queries
  const { data: habits } = useHabitsQuery(userId);
  const { data: entries } = useJournalEntriesQuery(userId);
  const { data: entriesCount = 0 } = useJournalEntryCountQuery(userId);

  const activeHabitsCount = habits ? habits.filter((h) => !h.is_archived).length : 0;

  // Load supporter info and app usage days
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
            const diff = Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            setDaysWithApp(Math.max(1, diff));
          }
        }
      });
  }, [userId]);

  const calculateJournalingStreak = () => {
    if (!entries || !entries.length) return 0;
    const dates = new Set(entries.map((e) => e.entry_date));
    let streak = 0;
    const current = new Date();
    
    // Check starting from today or yesterday
    const checkDate = new Date(current);
    let checkStr = checkDate.toISOString().split('T')[0] || '';
    
    // If not found today, check yesterday
    if (!dates.has(checkStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0] || '';
    }
    
    while (dates.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0] || '';
    }
    return streak;
  };

  const journalingStreak = calculateJournalingStreak();

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-tg-secondary-bg border-b border-tg-hint/10 p-6 flex flex-col items-center gap-4 text-center shrink-0">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-tg-accent to-purple-600 shadow-md flex items-center justify-center text-white text-3xl font-extrabold select-none">
            {user ? (user.first_name || 'U').charAt(0).toUpperCase() : 'U'}
          </div>
          {isSupporter && (
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-tg-accent border-2 border-tg-secondary-bg flex items-center justify-center text-white text-[13px] shadow">
              💎
            </span>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-[20px] font-extrabold leading-snug">
            {user ? `${user.first_name || ''} ${user.last_name || ''}` : 'Guest User'}
          </h2>
          {isSupporter ? (
            <span className="text-[11px] font-bold tracking-wider text-tg-accent bg-tg-accent/12 px-2.5 py-0.5 rounded-full mt-1.5 uppercase flex items-center gap-1">
              <span>💎</span> {t('profileBadgeSupporter')}
            </span>
          ) : (
            user?.telegram_username && (
              <span className="text-[12px] text-tg-hint mt-0.5">@{user.telegram_username}</span>
            )
          )}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[18px] font-extrabold text-tg-accent">{daysWithApp}</span>
            <span className="text-[9px] text-tg-hint font-bold uppercase tracking-wider mt-1 leading-normal">
              {t('profileStatsDaysWithApp').replace('\n', ' ')}
            </span>
          </div>

          <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[18px] font-extrabold text-tg-success">{activeHabitsCount}</span>
            <span className="text-[9px] text-tg-hint font-bold uppercase tracking-wider mt-1 leading-normal">
              {t('profileStatsActiveHabits').replace('\n', ' ')}
            </span>
          </div>

          <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[18px] font-extrabold text-orange-500">
              {journalingStreak > 0 ? journalingStreak : entriesCount}
            </span>
            <span className="text-[9px] text-tg-hint font-bold uppercase tracking-wider mt-1 leading-normal">
              {journalingStreak > 0 ? t('profileStatsStreak').replace('\n', ' ') : 'journal entries'}
            </span>
          </div>
        </div>

        {/* Basics Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-tg-hint uppercase tracking-wider ml-1.5">
            {t('profileSectionBasic')}
          </span>
          <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => navigate('/journal')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuJournal')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/account')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuAccount')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-tg-hint uppercase tracking-wider ml-1.5">
            {t('profileSectionSettings')}
          </span>
          <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => navigate('/profile/ai-settings')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuAiSettings')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/notifications')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuNotifications')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/appearance')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuAppearance')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/reflection-template')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuReflectionTemplate')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="flex flex-col gap-1.5 pb-6">
          <span className="text-[11px] font-bold text-tg-hint uppercase tracking-wider ml-1.5">
            {t('profileSectionSupport')}
          </span>
          <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => navigate('/profile/donate')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-[13.5px] font-semibold text-yellow-500">{t('profileMenuDonate')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/about')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuAbout')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/privacy')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all border-b border-tg-hint/5"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuPrivacy')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>

            <button
              onClick={() => navigate('/profile/contact')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-tg-secondary-bg/30 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-tg-accent" />
                <span className="text-[13.5px] font-semibold">{t('profileMenuContact')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-tg-hint" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
