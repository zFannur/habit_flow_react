import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { HeaderBar } from '@/shared/ui';
import { supabase } from '@/shared/api';
import { Pencil, ChevronRight } from 'lucide-react';
import { invoice } from '@telegram-apps/sdk-react';

const PRESETS = [
  { stars: 50, usd: '$1.00', label: 'Coffee' },
  { stars: 100, usd: '$2.00', label: 'Lunch', popular: true },
  { stars: 250, usd: '$5.00', label: 'Dinner' },
  { stars: 500, usd: '$10.00', label: 'Day of work' },
];

export default function DonatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [selected, setSelected] = useState(1);
  const [customStars, setCustomStars] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedStars = isCustom ? (parseInt(customStars) || 0) : PRESETS[selected]?.stars || 0;

  const handleDonate = async () => {
    if (!userId || selectedStars <= 0) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create_invoice', {
        body: {
          amount: selectedStars,
          label: `${selectedStars} Telegram Stars — HabitFlow Support`,
        },
      });

      if (error) throw error;

      const invoiceLink = data?.invoice_link || data?.invoice_url;
      if (!invoiceLink) throw new Error('No invoice link returned');

      if (invoice.open.isAvailable()) {
        const status = await invoice.open(invoiceLink, 'url');
        if (status === 'paid') {
          await supabase.from('users').update({ is_supporter: true }).eq('id', userId);
          navigate('/profile');
        }
      } else if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(invoiceLink, async (status: string) => {
          if (status === 'paid') {
            await supabase.from('users').update({ is_supporter: true }).eq('id', userId);
            navigate('/profile');
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (idx: number) => {
    setSelected(idx);
    setIsCustom(false);
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary overflow-y-auto pb-tg-safe-bottom">
      <HeaderBar title={t('donateTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Hero Card */}
        <div className="rounded-hf-lg border border-hf-border shadow-hf-card overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--hf-card, #1C2128) 60%, rgba(245, 158, 11, 0.04) 100%)' }}>
          <div className="absolute -top-6 -right-6 w-[120px] h-[120px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)' }} />
          <div className="relative p-5 flex flex-col items-center text-center gap-3">
            <svg width="72" height="72" viewBox="0 0 80 80" className="mb-1">
              <defs>
                <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
              <polygon
                points="40,6 48.7,28.5 73,28.5 53.2,43.2 60.6,66.5 40,52.4 19.4,66.5 26.8,43.2 7,28.5 31.3,28.5"
                fill="url(#starGrad)"
              />
            </svg>
            <h3 className="text-[22px] font-bold text-hf-text-primary tracking-tight">{t('donateHeroTitle')}</h3>
            <p className="text-[14px] text-hf-text-secondary leading-relaxed max-w-[300px]">{t('donateHeroMessage')}</p>
          </div>
        </div>

        {/* Presets Grid */}
        <p className="text-[13px] font-semibold text-hf-text-secondary tracking-wide">{t('donatePresetsLabel')}</p>
        <div className="grid grid-cols-2 gap-2.5" style={{ clipPath: 'none', overflow: 'visible' }}>
          {PRESETS.map((p, i) => (
            <div key={i} className="relative" style={{ clipPath: 'none', overflow: 'visible' }}>
              {p.popular && (
                <div className="absolute -top-2.5 left-0 right-0 flex justify-center z-10">
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-[10px] font-bold tracking-wider">
                    {t('donatePopularBadge')}
                  </span>
                </div>
              )}
              <button
                onClick={() => handlePresetSelect(i)}
                className={`w-full rounded-hf-md border-[1.5px] p-4 flex flex-col items-center justify-center gap-1 min-h-[96px] transition-all ${
                  !isCustom && selected === i
                    ? 'border-hf-accent bg-hf-card shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                    : 'border-hf-border bg-hf-card shadow-hf-card'
                }`}
              >
                <span className={`text-xl font-bold tracking-tight ${!isCustom && selected === i ? 'text-hf-accent' : 'text-hf-text-primary'}`}>
                  {p.stars} ⭐
                </span>
                <span className="text-[12px] text-hf-text-tertiary">≈ {p.usd}</span>
                <span className={`text-[11px] font-semibold tracking-wide ${!isCustom && selected === i ? 'text-hf-accent' : 'text-hf-text-secondary'}`}>
                  {p.label}
                </span>
              </button>
            </div>
          ))}
          {/* Custom Amount */}
          <button
            onClick={handleCustomSelect}
            className={`rounded-hf-md border-[1.5px] p-4 flex flex-col items-center justify-center gap-1 min-h-[96px] transition-all ${
              isCustom ? 'border-hf-accent bg-hf-card shadow-[0_0_0_3px_rgba(59,130,246,0.15)]' : 'border-hf-border bg-hf-card shadow-hf-card'
            }`}
          >
            {isCustom ? (
              <>
                <p className="text-[11px] text-hf-text-tertiary tracking-wider">{t('donateCustomInputLabel')}</p>
                <input
                  type="number"
                  value={customStars}
                  onChange={(e) => setCustomStars(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="100"
                  className="w-full bg-hf-bg-secondary border-[1.5px] border-hf-accent rounded-hf-md py-2 text-center text-xl font-bold text-hf-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            ) : (
              <>
                <Pencil className="w-[22px] h-[22px] text-hf-text-secondary" />
                <span className={`text-[14px] font-semibold ${isCustom ? 'text-hf-accent' : 'text-hf-text-primary'}`}>
                  {t('donateCustomButton')}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Benefits Card */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 mt-1">
          <h4 className="text-[15px] font-semibold text-hf-text-primary tracking-tight mb-3.5">{t('donateBenefitsTitle')}</h4>
          <BenefitRow icon="💎" text={t('donateBenefitBadge')} />
          <Divider />
          <BenefitRow icon="✍️" text={t('donateBenefitStyle')} />
          <Divider />
          <BenefitRow icon="🎨" text={t('donateBenefitColor')} />
          <Divider />
          <BenefitRow icon="❤️" text={t('donateBenefitThanks')} />
        </div>

        {/* CTA Button */}
        <button
          onClick={handleDonate}
          disabled={selectedStars <= 0 || loading}
          className={`w-full py-[15px] rounded-hf-md flex items-center justify-center gap-2 text-[15px] font-bold tracking-tight transition-all ${
            selectedStars > 0
              ? 'bg-hf-accent text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)] active:scale-[0.98]'
              : 'bg-hf-bg-tertiary text-hf-text-tertiary cursor-not-allowed'
          }`}
        >
          {loading ? (
            <svg className="w-[18px] h-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeLinecap="round" className="opacity-25" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="15.7" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <polygon points="9,1.5 11.2,6.5 16.5,6.9 12.6,10.3 13.9,15.5 9,12.7 4.1,15.5 5.4,10.3 1.5,6.9 6.8,6.5" />
            </svg>
          )}
          <span>{selectedStars > 0 ? t('donateCta', { stars: selectedStars }) : t('donateTitle')}</span>
        </button>
        <p className="text-[11px] text-hf-text-tertiary text-center leading-relaxed -mt-2">{t('donateMobileNote')}</p>

        {/* Transaction History Link */}
        <button className="flex items-center justify-center gap-1 text-[13px] text-hf-accent font-semibold py-1.5">
          {t('donateHistoryLink')}
          <ChevronRight className="w-3 h-3" />
        </button>

        <div className="pb-4" />
      </div>
    </div>
  );
}

function BenefitRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-9 h-9 rounded-hf-md bg-hf-bg-tertiary flex items-center justify-center text-lg shrink-0">{icon}</div>
      <p className="text-[14px] text-hf-text-primary leading-snug">{text}</p>
    </div>
  );
}

function Divider() {
  return <div className="h-3" />;
}
