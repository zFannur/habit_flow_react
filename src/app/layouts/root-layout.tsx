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
    <div className="flex flex-col h-full w-full bg-tg-secondary-bg overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto pt-tg-safe-top pb-2">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="w-full bg-tg-bg border-t border-tg-hint/10 flex items-center justify-around py-2 px-1 pb-4 select-none">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const { Icon } = tab;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-tg-accent' : 'text-tg-hint'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
