import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';
import { ArrowLeft, Bell, BellOff, Volume2, ShieldAlert } from 'lucide-react';

export default function NotificationsSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [reminders, setReminders] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Load from localStorage
  useEffect(() => {
    setReminders(localStorage.getItem('notify.reminders') !== 'false');
    setSounds(localStorage.getItem('notify.sounds') !== 'false');
    setWeeklyDigest(localStorage.getItem('notify.weekly') !== 'false');
  }, []);

  const handleSave = () => {
    localStorage.setItem('notify.reminders', reminders ? 'true' : 'false');
    localStorage.setItem('notify.sounds', sounds ? 'true' : 'false');
    localStorage.setItem('notify.weekly', weeklyDigest ? 'true' : 'false');
    alert('Notification settings saved!');
    navigate(-1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-hf-border/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-hf-text-primary" />
        </button>
        <h2 className="text-[17px] font-bold">
          {t('profileMenuNotifications')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* Toggle cards */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
          {/* Reminders Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center">
              {reminders ? <Bell className="w-5 h-5 text-hf-accent" /> : <BellOff className="w-5 h-5 text-hf-text-secondary" />}
              <div className="flex flex-col">
                <span className="text-[14px] font-bold">Habit Reminders</span>
                <span className="text-[11px] text-hf-text-secondary mt-0.5">Receive reminders at scheduled times</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reminders}
              onChange={(e) => setReminders(e.target.checked)}
              className="w-9 h-5 rounded-full bg-hf-bg-secondary border border-hf-border/25 accent-hf-accent cursor-pointer"
            />
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between border-t border-hf-border/5 pt-4">
            <div className="flex gap-3 items-center">
              <Volume2 className="w-5 h-5 text-hf-accent" />
              <div className="flex flex-col">
                <span className="text-[14px] font-bold">Notification Sounds</span>
                <span className="text-[11px] text-hf-text-secondary mt-0.5">Play a notification sound</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sounds}
              onChange={(e) => setSounds(e.target.checked)}
              className="w-9 h-5 rounded-full bg-hf-bg-secondary border border-hf-border/25 accent-hf-accent cursor-pointer"
            />
          </div>

          {/* Weekly review reminder */}
          <div className="flex items-center justify-between border-t border-hf-border/5 pt-4">
            <div className="flex gap-3 items-center">
              <ShieldAlert className="w-5 h-5 text-hf-accent" />
              <div className="flex flex-col">
                <span className="text-[14px] font-bold">Weekly Review Digest</span>
                <span className="text-[11px] text-hf-text-secondary mt-0.5">Reminder to close weekly reports on Sunday</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="w-9 h-5 rounded-full bg-hf-bg-secondary border border-hf-border/25 accent-hf-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Save button */}
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
