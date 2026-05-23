import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { HeaderBar } from '@/shared/ui';
import { Clock, Bell, BellOff } from 'lucide-react';

function pad(n: number) { return n.toString().padStart(2, '0'); }

export default function NotificationsSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [reflectionOn, setReflectionOn] = useState(true);
  const [reflHour, setReflHour] = useState(21);
  const [reflMin, setReflMin] = useState(30);

  const [quietOn, setQuietOn] = useState(false);
  const [quietFromH, setQuietFromH] = useState(23);
  const [quietFromM, setQuietFromM] = useState(0);
  const [quietToH, setQuietToH] = useState(7);
  const [quietToM, setQuietToM] = useState(0);

  const [sound, setSound] = useState('on');

  const [weeklyOn, setWeeklyOn] = useState(true);
  const [aiSummaryOn, setAiSummaryOn] = useState(true);
  const [recoveryOn, setRecoveryOn] = useState(true);

  const [timePickerOpen, setTimePickerOpen] = useState<'refl' | 'quietFrom' | 'quietTo' | null>(null);
  const [pickerDraftH, setPickerDraftH] = useState(0);
  const [pickerDraftM, setPickerDraftM] = useState(0);

  useEffect(() => {
    setReflectionOn(localStorage.getItem('notify.reflection') !== 'false');
    const rh = parseInt(localStorage.getItem('notify.reflectionHour') || '21');
    const rm = parseInt(localStorage.getItem('notify.reflectionMin') || '30');
    setReflHour(rh); setReflMin(rm);
    setQuietOn(localStorage.getItem('notify.quietHours') === 'true');
    const qfh = parseInt(localStorage.getItem('notify.quietFromH') || '23');
    const qfm = parseInt(localStorage.getItem('notify.quietFromM') || '0');
    const qth = parseInt(localStorage.getItem('notify.quietToH') || '7');
    const qtm = parseInt(localStorage.getItem('notify.quietToM') || '0');
    setQuietFromH(qfh); setQuietFromM(qfm);
    setQuietToH(qth); setQuietToM(qtm);
    setSound(localStorage.getItem('notify.sound') || 'on');
    setWeeklyOn(localStorage.getItem('notify.weekly') !== 'false');
    setAiSummaryOn(localStorage.getItem('notify.aiSummary') !== 'false');
    setRecoveryOn(localStorage.getItem('notify.recovery') !== 'false');
  }, []);

  const persist = () => {
    localStorage.setItem('notify.reflection', reflectionOn ? 'true' : 'false');
    localStorage.setItem('notify.reflectionHour', String(reflHour));
    localStorage.setItem('notify.reflectionMin', String(reflMin));
    localStorage.setItem('notify.quietHours', quietOn ? 'true' : 'false');
    localStorage.setItem('notify.quietFromH', String(quietFromH));
    localStorage.setItem('notify.quietFromM', String(quietFromM));
    localStorage.setItem('notify.quietToH', String(quietToH));
    localStorage.setItem('notify.quietToM', String(quietToM));
    localStorage.setItem('notify.sound', sound);
    localStorage.setItem('notify.weekly', weeklyOn ? 'true' : 'false');
    localStorage.setItem('notify.aiSummary', aiSummaryOn ? 'true' : 'false');
    localStorage.setItem('notify.recovery', recoveryOn ? 'true' : 'false');
  };

  const openTimePicker = (type: 'refl' | 'quietFrom' | 'quietTo') => {
    if (type === 'refl') { setPickerDraftH(reflHour); setPickerDraftM(reflMin); }
    else if (type === 'quietFrom') { setPickerDraftH(quietFromH); setPickerDraftM(quietFromM); }
    else { setPickerDraftH(quietToH); setPickerDraftM(quietToM); }
    setTimePickerOpen(type);
  };

  const confirmTimePicker = () => {
    if (timePickerOpen === 'refl') { setReflHour(pickerDraftH); setReflMin(pickerDraftM); }
    else if (timePickerOpen === 'quietFrom') { setQuietFromH(pickerDraftH); setQuietFromM(pickerDraftM); }
    else if (timePickerOpen === 'quietTo') { setQuietToH(pickerDraftH); setQuietToM(pickerDraftM); }
    setTimePickerOpen(null);
    setTimeout(persist, 0);
  };

  const bubbleParts = t('notificationsPreviewBubble').split('\n');
  const mainLine = bubbleParts[0] || '';
  const streakLine = bubbleParts.length > 1 ? bubbleParts.slice(1).join('\n') : '';

  // Persist on toggle changes
  const toggleAndPersist = (setter: (v: boolean) => void) => (val: boolean) => {
    setter(val);
    setTimeout(persist, 0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary overflow-y-auto pb-tg-safe-bottom">
      <HeaderBar title={t('notificationsTitle')} onBack={() => { persist(); navigate(-1); }} />

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Telegram Banner */}
        <div className="bg-hf-card border border-[#2AABEE]/40 rounded-hf-lg shadow-hf-card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-hf-md bg-[#2AABEE]/12 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#2AABEE" />
              <path d="M5.5 11.8L16.7 7.4c.5-.2.9.1.8.6l-1.9 9c-.1.5-.5.7-.9.4L12 14.9l-1.7 1.7c-.2.2-.4.3-.7.3l.3-2.8 5.4-4.9c.2-.2 0-.3-.3-.1L7.6 13.4 5.3 12.7c-.5-.2-.5-.5.2-.9z" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-hf-text-primary">{t('notificationsTelegramBanner')}</p>
            <p className="text-[12px] text-hf-text-secondary leading-relaxed mt-1">{t('notificationsTelegramDesc')}</p>
          </div>
        </div>

        {/* Reflection Reminder */}
        <SectionLabel label={t('notificationsReflectionSection')} />
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          <ToggleRow
            title={t('notificationsReflectionToggle')}
            value={reflectionOn}
            onChanged={toggleAndPersist(setReflectionOn)}
            showBottomBorder={reflectionOn}
          />
          {reflectionOn && (
            <div className="px-[18px] pt-4 pb-4">
              <button
                onClick={() => openTimePicker('refl')}
                className="flex items-center gap-2 border-[1.5px] border-hf-border rounded-hf-md bg-hf-bg-secondary px-[18px] py-3.5"
              >
                <Clock className="w-4 h-4 text-hf-accent" />
                <span className="text-[28px] font-semibold text-hf-text-primary tracking-tight">
                  {pad(reflHour)}:{pad(reflMin)}
                </span>
              </button>
              <p className="text-[12px] text-hf-text-tertiary mt-2.5 pb-1.5 leading-relaxed">{t('notificationsReflectionHint')}</p>
            </div>
          )}
        </div>

        {/* Quiet Hours */}
        <SectionLabel label={t('notificationsQuietHoursSection')} />
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          <ToggleRow
            title={t('notificationsQuietToggle')}
            value={quietOn}
            onChanged={toggleAndPersist(setQuietOn)}
            showBottomBorder={quietOn}
          />
          {quietOn && (
            <div className="px-[18px] pt-3.5 pb-4">
              <div className="flex items-end gap-2.5">
                <div className="flex-1">
                  <p className="text-[11px] uppercase text-hf-text-tertiary font-semibold tracking-wider mb-1.5">{t('notificationsQuietFrom')}</p>
                  <button
                    onClick={() => openTimePicker('quietFrom')}
                    className="flex items-center gap-1.5 border-[1.5px] border-hf-border rounded-hf-md bg-hf-bg-secondary px-3.5 py-2.5 w-full"
                  >
                    <Clock className="w-4 h-4 text-hf-accent" />
                    <span className="text-[22px] font-semibold text-hf-text-primary tracking-tight">
                      {pad(quietFromH)}:{pad(quietFromM)}
                    </span>
                  </button>
                </div>
                <span className="text-xl text-hf-text-tertiary mb-3.5">—</span>
                <div className="flex-1">
                  <p className="text-[11px] uppercase text-hf-text-tertiary font-semibold tracking-wider mb-1.5">{t('notificationsQuietTo')}</p>
                  <button
                    onClick={() => openTimePicker('quietTo')}
                    className="flex items-center gap-1.5 border-[1.5px] border-hf-border rounded-hf-md bg-hf-bg-secondary px-3.5 py-2.5 w-full"
                  >
                    <Clock className="w-4 h-4 text-hf-accent" />
                    <span className="text-[22px] font-semibold text-hf-text-primary tracking-tight">
                      {pad(quietToH)}:{pad(quietToM)}
                    </span>
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-hf-text-tertiary mt-2.5 leading-relaxed">{t('notificationsQuietHint')}</p>
            </div>
          )}
        </div>

        {/* Sound */}
        <SectionLabel label={t('notificationsSoundSection')} />
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          <SoundRow
            title={t('notificationsSoundOn')}
            subtitle={t('notificationsSoundOnSubtitle')}
            muted={false}
            selected={sound === 'on'}
            onTap={() => { setSound('on'); setTimeout(persist, 0); }}
            showBottomBorder
          />
          <SoundRow
            title={t('notificationsSoundOff')}
            subtitle={t('notificationsSoundOffSubtitle')}
            muted
            selected={sound === 'off'}
            onTap={() => { setSound('off'); setTimeout(persist, 0); }}
            showBottomBorder={false}
          />
        </div>

        {/* Notification Preview */}
        <SectionLabel label={t('notificationsPreviewSection')} />
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4">
          <div className="flex items-end gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1A7FB5] flex items-center justify-center text-lg shrink-0">
              🤖
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#2AABEE] mb-1.5">HabitFlow Bot</p>
              <div className="bg-hf-card border border-hf-border rounded-t-[16px] rounded-br-[16px] rounded-bl-[4px] shadow-sm px-3 py-2.5 max-w-[280px]">
                <p className="text-[14px] text-hf-text-primary leading-relaxed">
                  {mainLine}<br />
                  <span className="font-bold text-hf-warning">{streakLine}</span>
                </p>
                <div className="flex gap-1.5 mt-2.5">
                  <span className="flex-1 text-center py-2 rounded-md border-[1.5px] border-[#2AABEE] text-[13px] font-semibold text-[#2AABEE]">
                    {t('notificationsPreviewDone')}
                  </span>
                  <span className="flex-1 text-center py-2 rounded-md border-[1.5px] border-[#2AABEE] text-[13px] font-semibold text-[#2AABEE]">
                    {t('notificationsPreviewSkip')}
                  </span>
                </div>
                <div className="mt-1.5 py-1.5 rounded-md border-[1.5px] border-hf-border text-center text-[13px] text-hf-text-secondary">
                  {t('notificationsPreviewMore')}
                </div>
                <p className="text-right text-[11px] text-hf-text-tertiary mt-1.5">07:30 ✓</p>
              </div>
            </div>
          </div>
          <div className="border-t border-hf-border mt-3.5 pt-3 text-center">
            <p className="text-[12px] text-hf-text-tertiary leading-relaxed">{t('notificationsPreviewHint')}</p>
          </div>
        </div>

        {/* Rare Notifications */}
        <SectionLabel label={t('notificationsRareSection')} />
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          <RareNotifRow
            emoji="📅"
            iconBg={weeklyOn ? 'bg-[#3B82F6]/10' : 'bg-hf-bg-secondary'}
            title={t('notificationsWeeklyTitle')}
            subtitle={t('notificationsWeeklySubtitle')}
            value={weeklyOn}
            onChanged={toggleAndPersist(setWeeklyOn)}
            showBottomBorder
          />
          <RareNotifRow
            emoji="✨"
            iconBg={aiSummaryOn ? 'bg-[#A855F7]/10' : 'bg-hf-bg-secondary'}
            title={t('notificationsAiSummaryTitle')}
            subtitle={t('notificationsAiSummarySubtitle')}
            value={aiSummaryOn}
            onChanged={toggleAndPersist(setAiSummaryOn)}
            showBottomBorder
          />
          <RareNotifRow
            emoji="🔄"
            iconBg={recoveryOn ? 'bg-[#F59E0B]/10' : 'bg-hf-bg-secondary'}
            title={t('notificationsRecoveryTitle')}
            subtitle={t('notificationsRecoverySubtitle')}
            value={recoveryOn}
            onChanged={toggleAndPersist(setRecoveryOn)}
            showBottomBorder={false}
          />
        </div>

        {/* Bottom padding */}
        <div className="pb-8" />
      </div>

      {/* Time Picker Modal */}
      {timePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTimePickerOpen(null)}>
          <div className="bg-hf-card rounded-hf-lg shadow-xl p-4 w-[260px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3.5">
              <PickerColumn label="h" values={Array.from({ length: 24 }, (_, i) => i)} selected={pickerDraftH} onSelect={(v) => setPickerDraftH(v)} />
              <span className="text-xl text-hf-text-tertiary mb-4">:</span>
              <PickerColumn label="min" values={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]} selected={pickerDraftM} onSelect={(v) => setPickerDraftM(v)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTimePickerOpen(null)} className="flex-1 py-2 rounded-hf-md border-[1.5px] border-hf-border text-[13px] font-semibold text-hf-text-secondary">
                {t('commonCancel')}
              </button>
              <button onClick={confirmTimePicker} className="flex-1 py-2 rounded-hf-md bg-hf-accent text-white text-[13px] font-semibold">
                {t('commonDone')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PickerColumn({ label, values, selected, onSelect }: { label: string; values: number[]; selected: number; onSelect: (v: number) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <p className="text-[10px] font-bold uppercase text-hf-text-tertiary tracking-wider mb-1.5">{label}</p>
      <div className="h-[140px] overflow-y-auto w-full">
        {values.map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`w-full py-1.5 text-center rounded-md text-[14px] font-medium ${
              selected === v ? 'bg-[#3B82F6]/10 text-hf-accent' : 'text-hf-text-primary'
            }`}
          >
            {pad(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold px-1">{label}</p>
  );
}

function ToggleRow({ title, value, onChanged, showBottomBorder }: { title: string; value: boolean; onChanged: (v: boolean) => void; showBottomBorder: boolean }) {
  return (
    <div className={`px-[18px] py-3.5 flex items-center justify-between ${showBottomBorder ? 'border-b border-hf-border' : ''}`}>
      <span className="text-[14px] font-medium text-hf-text-primary flex-1">{title}</span>
      <button
        onClick={() => onChanged(!value)}
        className={`w-12 h-7 rounded-full transition-all duration-200 relative ${value ? 'bg-hf-accent' : 'bg-hf-bg-tertiary'}`}
      >
        <div className={`w-[22px] h-[22px] rounded-full transition-all duration-200 shadow absolute top-[3px] ${
          value ? 'left-[23px] bg-white' : 'left-[3px] bg-hf-text-tertiary'
        }`} />
      </button>
    </div>
  );
}

function SoundRow({ title, subtitle, muted, selected, onTap, showBottomBorder }: {
  title: string; subtitle: string; muted: boolean; selected: boolean; onTap: () => void; showBottomBorder: boolean;
}) {
  return (
    <button
      onClick={onTap}
      className={`w-full px-[18px] py-3.5 flex items-center gap-3 text-left ${showBottomBorder ? 'border-b border-hf-border' : ''}`}
    >
      <div className={`w-9 h-9 rounded-hf-md flex items-center justify-center shrink-0 ${selected ? 'bg-[#3B82F6]/10' : 'bg-hf-bg-secondary'}`}>
        {muted ? <BellOff className="w-[18px] h-[18px] text-hf-text-tertiary" /> : <Bell className="w-[18px] h-[18px] text-hf-accent" />}
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-medium text-hf-text-primary leading-tight">{title}</p>
        <p className="text-[12px] text-hf-text-tertiary leading-tight mt-0.5">{subtitle}</p>
      </div>
      <div
        className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${
          selected ? 'border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
        }`}
      >
        {selected && <div className="w-[10px] h-[10px] rounded-full bg-hf-accent" />}
      </div>
    </button>
  );
}

function RareNotifRow({ emoji, iconBg, title, subtitle, value, onChanged, showBottomBorder }: {
  emoji: string; iconBg: string; title: string; subtitle: string; value: boolean; onChanged: (v: boolean) => void; showBottomBorder: boolean;
}) {
  return (
    <div className={`px-[18px] py-3.5 flex items-center gap-3 ${showBottomBorder ? 'border-b border-hf-border' : ''}`}>
      <div className={`w-9 h-9 rounded-hf-md flex items-center justify-center text-lg shrink-0 ${iconBg}`}>
        {emoji}
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-medium text-hf-text-primary leading-tight">{title}</p>
        <p className="text-[12px] text-hf-text-tertiary leading-tight mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={() => onChanged(!value)}
        className={`w-12 h-7 rounded-full transition-all duration-200 relative ${value ? 'bg-hf-accent' : 'bg-hf-bg-tertiary'}`}
      >
        <div className={`w-[22px] h-[22px] rounded-full transition-all duration-200 shadow absolute top-[3px] ${
          value ? 'left-[23px] bg-white' : 'left-[3px] bg-hf-text-tertiary'
        }`} />
      </button>
    </div>
  );
}
