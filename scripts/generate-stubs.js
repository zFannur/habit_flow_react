import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pages = [
  { dir: 'splash', name: 'SplashPage' },
  { dir: 'onboarding', name: 'OnboardingPage' },
  { dir: 'today', name: 'TodayPage' },
  { dir: 'habits', name: 'HabitsPage' },
  { dir: 'habit-detail', name: 'HabitDetailPage' },
  { dir: 'habit-form', name: 'HabitFormPage' },
  { dir: 'journal-list', name: 'JournalListPage' },
  { dir: 'journal-edit', name: 'JournalEditPage' },
  { dir: 'ai-hub', name: 'AiHubPage' },
  { dir: 'ai-summary-detail', name: 'AiSummaryDetailPage' },
  { dir: 'analytics', name: 'AnalyticsPage' },
  { dir: 'profile', name: 'ProfilePage' },
  { dir: 'settings-notifications', name: 'NotificationsSettingsPage' },
  { dir: 'settings-ai', name: 'AiSettingsPage' },
  { dir: 'settings-appearance', name: 'AppearanceSettingsPage' },
  { dir: 'account', name: 'AccountPage' },
  { dir: 'reflection-template', name: 'ReflectionTemplatePage' },
  { dir: 'about', name: 'AboutPage' },
  { dir: 'privacy-policy', name: 'PrivacyPolicyPage' },
  { dir: 'contact', name: 'ContactPage' },
  { dir: 'donate', name: 'DonatePage' }
];

pages.forEach(p => {
  const pageDir = path.resolve(__dirname, `../src/pages/${p.dir}`);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  // Write page component
  const componentContent = `export default function ${p.name}() {
  return (
    <div className="p-4 text-tg-text">
      <h1 className="text-xl font-bold">${p.name}</h1>
      <p className="text-tg-hint mt-2">Stub Page</p>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(pageDir, 'ui.tsx'), componentContent, 'utf8');

  // Write index.ts public API
  const indexContent = `export { default as ${p.name} } from './ui';\n`;
  fs.writeFileSync(path.join(pageDir, 'index.ts'), indexContent, 'utf8');
});

console.log('Stub pages generated successfully!');
