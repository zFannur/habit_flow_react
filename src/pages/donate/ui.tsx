import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { Button } from '@/shared/ui';
import { supabase } from '@/shared/api';
import { ArrowLeft } from 'lucide-react';
import { invoice } from '@telegram-apps/sdk-react';

export default function DonatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [stars, setStars] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Call create_invoice Supabase edge function
      const { data, error } = await supabase.functions.invoke('create_invoice', {
        body: {
          amount: stars,
          label: `${stars} Telegram Stars — HabitFlow Support`,
        },
      });

      if (error) throw error;

      const invoiceLink = data?.invoice_link || data?.invoice_url;
      if (!invoiceLink) {
        throw new Error('No invoice link returned from Edge Function');
      }

      // Trigger Telegram payment checkout flow
      if (invoice.open.isAvailable()) {
        const status = await invoice.open(invoiceLink, 'url');
        if (status === 'paid') {
          // Success checkout
          alert('Thank you so much! Payment successful. You are now a Supporter 💎');
          
          // Mark user as supporter in Supabase users table
          await supabase.from('users').update({ is_supporter: true }).eq('id', userId);
          
          navigate('/profile');
        } else {
          alert('Payment cancelled or failed');
        }
      } else {
        // Fallback WebApp script trigger
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(invoiceLink, async (status: string) => {
            if (status === 'paid') {
              alert('Thank you so much! Payment successful. You are now a Supporter 💎');
              await supabase.from('users').update({ is_supporter: true }).eq('id', userId);
              navigate('/profile');
            } else {
              alert('Payment failed');
            }
          });
        } else {
          alert('Telegram WebApp interface is not available');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering payment checkout');
    } finally {
      setLoading(false);
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
          {t('profileMenuDonate')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Support Call-to-action */}
        <div className="bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-2xl p-5 text-center flex flex-col items-center gap-3.5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-3xl">
            💎
          </div>
          <div>
            <h3 className="text-[17px] font-extrabold text-tg-text">Become a Supporter</h3>
            <p className="text-[12.5px] text-tg-hint mt-2 leading-relaxed">
              Support the development of HabitFlow. In return, you'll unlock the exclusive **Poet AI style coach** and a supporter badge 💎 on your profile.
            </p>
          </div>
        </div>

        {/* Stars Chips Selection */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[13px] font-bold text-tg-hint uppercase tracking-wider ml-1">Select donation amount</label>
          <div className="grid grid-cols-2 gap-3">
            {[50, 100, 250, 500].map((val) => (
              <button
                key={val}
                onClick={() => setStars(val)}
                className={`py-4 rounded-2xl border font-extrabold text-[15px] flex flex-col items-center justify-center gap-1.5 transition-all ${
                  stars === val
                    ? 'border-tg-accent bg-tg-accent/8 text-tg-accent shadow'
                    : 'border-tg-hint/10 bg-tg-secondary-bg text-tg-text'
                }`}
              >
                <span className="text-xl">⭐️</span>
                <span>{val} Stars</span>
              </button>
            ))}
          </div>
        </div>

        {/* Checkout Button */}
        <div className="mt-auto shrink-0 pb-6 flex flex-col gap-3">
          <Button
            label={loading ? 'Opening Invoice...' : `Donate ${stars} Stars ⭐️`}
            onClick={handleDonate}
            disabled={loading}
            className="w-full"
          />
          <span className="text-[10px] text-tg-hint text-center font-medium leading-normal">
            Transactions are processed securely by Telegram.<br />No card details are stored by HabitFlow.
          </span>
        </div>
      </div>
    </div>
  );
}
