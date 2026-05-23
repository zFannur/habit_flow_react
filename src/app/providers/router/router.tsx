import { createHashRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/app/layouts';

// Pages
import { SplashPage } from '@/pages/splash';
import { OnboardingPage } from '@/pages/onboarding';
import { TodayPage } from '@/pages/today';
import { HabitsPage } from '@/pages/habits';
import { HabitDetailPage } from '@/pages/habit-detail';
import { HabitFormPage } from '@/pages/habit-form';
import { JournalListPage } from '@/pages/journal-list';
import { JournalEditPage } from '@/pages/journal-edit';
import { AiHubPage } from '@/pages/ai-hub';
import { AiSummaryDetailPage } from '@/pages/ai-summary-detail';
import { AnalyticsPage } from '@/pages/analytics';
import { ProfilePage } from '@/pages/profile';
import { NotificationsSettingsPage } from '@/pages/settings-notifications';
import { AiSettingsPage } from '@/pages/settings-ai';
import { AppearanceSettingsPage } from '@/pages/settings-appearance';
import { AccountPage } from '@/pages/account';
import { ReflectionTemplatePage } from '@/pages/reflection-template';
import { AboutPage } from '@/pages/about';
import { PrivacyPolicyPage } from '@/pages/privacy-policy';
import { ContactPage } from '@/pages/contact';
import { DonatePage } from '@/pages/donate';

export const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/splash" replace />,
  },
  {
    path: '/splash',
    element: <SplashPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/habits/new',
    element: <HabitFormPage />,
  },
  {
    path: '/habits/:id/edit',
    element: <HabitFormPage />,
  },
  {
    path: '/habits/:id',
    element: <HabitDetailPage />,
  },
  {
    path: '/journal/new',
    element: <JournalEditPage />,
  },
  {
    path: '/journal/:id',
    element: <JournalEditPage />,
  },
  {
    path: '/summary/:id',
    element: <AiSummaryDetailPage />,
  },
  {
    path: '/profile/donate',
    element: <DonatePage />,
  },
  {
    path: '/profile/notifications',
    element: <NotificationsSettingsPage />,
  },
  {
    path: '/profile/ai-settings',
    element: <AiSettingsPage />,
  },
  {
    path: '/profile/appearance',
    element: <AppearanceSettingsPage />,
  },
  {
    path: '/profile/account',
    element: <AccountPage />,
  },
  {
    path: '/profile/reflection-template',
    element: <ReflectionTemplatePage />,
  },
  {
    path: '/profile/about',
    element: <AboutPage />,
  },
  {
    path: '/profile/privacy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/profile/contact',
    element: <ContactPage />,
  },
  // Shell Route with bottom tab bar
  {
    element: <RootLayout />,
    children: [
      {
        path: '/today',
        element: <TodayPage />,
      },
      {
        path: '/habits',
        element: <HabitsPage />,
      },
      {
        path: '/analytics',
        element: <AnalyticsPage />,
      },
      {
        path: '/ai',
        element: <AiHubPage />,
      },
      {
        path: '/journal',
        element: <JournalListPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/splash" replace />,
  },
]);
