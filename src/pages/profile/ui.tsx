import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useHabitsQuery } from '@/entities/habit';
import { useJournalEntriesQuery } from '@/entities/journal';
import { supabase } from '@/shared/api';
import { BottomSheet } from '@/shared/ui';
import { ChevronRight } from 'lucide-react';

// ─── menu row types ───────────────────────────────────────────────────────────

interface MenuRowData {
  emoji: string;
  label: string;
  iconBg: string;
  danger?: boolean;
  onClick?: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ text, danger = false }: { text: string; danger?: boolean }) {
  return (
    <div className={`px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.07em] ${danger ? 'text-hf-danger/70' : 'text-hf-text-tertiary'}`}>
      {text}
    </div>
  );
}

function MenuGroup({ rows }: { rows: MenuRowData[] }) {
  return (
    <div className="mx-4 bg-hf-card border border-hf-border rounded-[16px] overflow-hidden shadow-hf-card">
      {rows.map((row, i) => (
        <div key={i}>
          <button
            onClick={row.onClick}
            className="w-full flex items-center px-4 py-3 text-left active:bg-hf-bg-tertiary transition-colors"
          >
            {/* Emoji icon in colored square */}
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[18px] leading-none"
              style={{ background: row.iconBg }}
            >
              {row.emoji}
            </div>
            <span className={`flex-1 ml-3 text-[15px] font-medium ${row.danger ? 'text-hf-danger' : 'text-hf-text-primary'}`}>
              {row.label}
            </span>
            {!row.danger && <ChevronRight className="w-[7px] h-[13px] text-hf-text-tertiary shrink-0" strokeWidth={1.8} />}
          </button>
          {/* Divider indented from icon (left 64 = 16 padding + 36 icon + 12 gap) */}
          {i < rows.length - 1 && (
            <div className="h-px bg-hf-border" style={{ marginLeft: 64 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { state: session, logout } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;
  const user = session.status === 'authenticated' ? session.user : null;

  const [isSupporter, setIsSupporter] = useState(false);
  const [daysWithApp, setDaysWithApp] = useState(1);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    if (dates.has(today)) { currentStreak = 1; maxStreak = 1; }
    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = new Date(sorted[i + 1] || '');
      const prev = new Date(sorted[i] || '');
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else { currentStreak = 1; maxStreak = Math.max(maxStreak, currentStreak); }
    }
    return Math.max(maxStreak, 1);
  };

  const maxStreak = calculateMaxStreak();

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      if (error) throw error;

      // Clear all cached queries
      queryClient.clear();

      // Clear entire localStorage (remove EVERYTHING)
      localStorage.clear();

      // Reset session state
      await logout();

      setIsDeleteOpen(false);
      setIsDeleting(false);

      // Close the Mini App if inside Telegram — user will reopen fresh
      const tg = (window as unknown as { Telegram?: { WebApp?: { close?: () => void } } }).Telegram;
      if (tg?.WebApp?.close) {
        tg.WebApp.close();
      } else {
        navigate('/splash', { replace: true });
      }
    } catch (e) {
      console.error('Delete account failed:', e);
      setDeleteError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || '—'
    : '—';
  const initial = displayName.charAt(0).toUpperCase() || '·';
  const usernameLabel = user?.telegram_username ? `@${user.telegram_username}` : '';

  return (
    <div className="w-full min-h-full bg-hf-bg-secondary text-hf-text-primary pb-tg-safe-bottom">
      <div className="h-3" />

      {/* ── User Card ── */}
      <div className="mx-4 bg-hf-card border border-hf-border rounded-[20px] overflow-hidden shadow-hf-card">
        <div className="flex flex-col items-center px-5 pt-6 pb-0">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[34px] font-bold select-none"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            {initial}
          </div>

          <div className="h-3.5" />

          <span className="text-[22px] font-bold text-hf-text-primary tracking-[-0.02em] text-center">
            {displayName}
          </span>

          {usernameLabel && !isSupporter && (
            <span className="text-hf-body-md text-hf-text-tertiary mt-1">{usernameLabel}</span>
          )}

          {isSupporter && (
            <div
              className="mt-3 px-[13px] py-[5px] rounded-full text-[12px] font-medium border"
              style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.3)' }}
            >
              {t('profileBadgeSupporter')}
            </div>
          )}

          <div className="h-4" />

          {/* Stats row */}
          <div className="w-full border-t border-hf-border flex">
            <div className="flex-1 flex flex-col items-center py-3">
              <span className="text-[20px] font-bold text-hf-text-primary tracking-[-0.03em]">{daysWithApp}</span>
              <span className="text-[11px] font-medium text-hf-text-tertiary mt-[3px] tracking-[0.01em] text-center leading-tight">
                {t('profileStatsDaysWithApp')}
              </span>
            </div>
            <div className="w-px bg-hf-border self-stretch" />
            <div className="flex-1 flex flex-col items-center py-3">
              <span className="text-[20px] font-bold text-hf-text-primary tracking-[-0.03em]">{activeHabitsCount}</span>
              <span className="text-[11px] font-medium text-hf-text-tertiary mt-[3px] tracking-[0.01em] text-center leading-tight">
                {t('profileStatsActiveHabits')}
              </span>
            </div>
            <div className="w-px bg-hf-border self-stretch" />
            <div className="flex-1 flex flex-col items-center py-3">
              <span className="text-[20px] font-bold text-hf-text-primary tracking-[-0.03em]">🔥 {maxStreak}</span>
              <span className="text-[11px] font-medium text-hf-text-tertiary mt-[3px] tracking-[0.01em] text-center leading-tight">
                {t('profileStatsStreak')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BASIC ── */}
      <SectionLabel text={t('profileSectionBasic')} />
      <MenuGroup rows={[
        { emoji: '📓', label: t('profileMenuJournal'), iconBg: 'rgba(245,158,11,0.12)', onClick: () => navigate('/journal') },
        { emoji: '👤', label: t('profileMenuAccount'), iconBg: 'rgba(59,130,246,0.12)', onClick: () => navigate('/profile/account') },
      ]} />

      {/* ── SETTINGS ── */}
      <SectionLabel text={t('profileSectionSettings')} />
      <MenuGroup rows={[
        { emoji: '✨', label: t('profileMenuAiSettings'), iconBg: 'rgba(168,85,247,0.12)', onClick: () => navigate('/profile/ai-settings') },
        { emoji: '🔔', label: t('profileMenuNotifications'), iconBg: 'rgba(245,158,11,0.12)', onClick: () => navigate('/profile/notifications') },
        { emoji: '🎨', label: t('profileMenuAppearance'), iconBg: 'rgba(59,130,246,0.12)', onClick: () => navigate('/profile/appearance') },
        { emoji: '📓', label: t('profileMenuReflectionTemplate'), iconBg: 'rgba(16,185,129,0.12)', onClick: () => navigate('/profile/reflection-template') },
      ]} />

      {/* ── SUPPORT ── */}
      <SectionLabel text={t('profileSectionSupport')} />
      <MenuGroup rows={[
        { emoji: '💎', label: t('profileMenuDonate'), iconBg: 'rgba(245,158,11,0.14)', onClick: () => navigate('/profile/donate') },
        { emoji: 'ℹ️', label: t('profileMenuAbout'), iconBg: 'rgba(59,130,246,0.12)', onClick: () => navigate('/profile/about') },
        { emoji: '📜', label: t('profileMenuPrivacy'), iconBg: 'rgba(107,114,128,0.12)', onClick: () => navigate('/profile/privacy') },
        { emoji: '✉️', label: t('profileMenuContact'), iconBg: 'rgba(16,185,129,0.12)', onClick: () => navigate('/profile/contact') },
      ]} />

      {/* ── DANGER ── */}
      <SectionLabel text={t('profileSectionDanger')} danger />
      <MenuGroup rows={[
        { emoji: '🗑️', label: t('profileMenuDeleteAccount'), iconBg: 'rgba(239,68,68,0.10)', danger: true, onClick: () => setIsDeleteOpen(true) },
      ]} />

      <div className="h-5" />

      {/* Delete Confirmation BottomSheet */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t('profileDeleteAccountTitle')}
      >
        <p className="text-[14px] text-hf-text-secondary mb-2 leading-relaxed">
          {t('profileDeleteAccountMessage')}
        </p>
        {deleteError && (
          <p className="text-[13px] text-hf-danger font-medium mb-3 bg-hf-danger/5 px-3 py-2 rounded-hf-md">{deleteError}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => { setIsDeleteOpen(false); setDeleteError(null); }}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-hf-md bg-hf-bg-secondary font-semibold text-[14px] text-hf-text-primary disabled:opacity-40"
          >
            {t('commonCancel')}
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-hf-md bg-hf-danger text-white font-semibold text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isDeleting ? 'Deleting...' : t('commonDelete')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
