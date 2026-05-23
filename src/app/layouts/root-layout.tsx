import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ListChecks, BarChart3, Sparkles, User } from 'lucide-react';
import { useTranslation } from '@/shared/lib/i18n';

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { path: '/today', label: t('navToday'), Icon: Home },
    { path: '/habits', label: t('navHabits'), Icon: ListChecks },
    { path: '/analytics', label: t('navAnalytics'), Icon: BarChart3 },
    { path: '/ai', label: t('navAi'), Icon: Sparkles },
    { path: '/profile', label: t('navProfile'), Icon: User },
  ];

  const activeIndex = tabs.findIndex(tab => location.pathname.startsWith(tab.path));

  return (
    <div className="flex flex-col h-full w-full bg-hf-bg-secondary overflow-hidden">
      <main className="flex-1 w-full overflow-y-auto pt-tg-safe-top">
        <Outlet />
      </main>

      <nav className="w-full bg-hf-card border-t border-hf-border shadow-hf-bottom-nav flex items-center justify-around pt-2 pb-5 select-none">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const { Icon } = tab;
          const color = isActive ? 'text-hf-accent' : 'text-hf-text-tertiary';

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
            >
              <div
                className={`w-11 h-7 flex items-center justify-center rounded-[10px] transition-colors duration-150 ${
                  isActive ? 'bg-hf-accent/12' : ''
                }`}
              >
                <Icon className={`w-[22px] h-[22px] ${color}`} />
              </div>
              <span className={`text-[10px] mt-[3px] ${color}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
