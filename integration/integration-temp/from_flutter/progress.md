# Progress Tracker: Flutter -> React (FSD + TMA) Migration

Этот файл предназначен для отслеживания прогресса миграции. Агент ИИ должен отмечать выполненные пункты символом `[x]`, находящиеся в процессе переноса символом `[/]`, а невыполненные — `[ ]`.

---

## 🛠️ Этап 1: Подготовка проекта и базовое окружение
- [ ] Инициализация React 19 + TypeScript SPA проекта (в папке `app_react`)
- [ ] Установка npm-пакетов (Vite, TS, Tailwind, Zustand, React Query, Telegram SDK, Zod, Steiger, ESLint)
- [ ] Конфигурация Tailwind CSS (подключение цветов темы Telegram)
- [ ] Конфигурация компилятора (`tsconfig.json` c `strict` и `noUncheckedIndexedAccess`)
- [ ] Настройка линтера архитектуры Steiger (`steiger.config.ts`)
- [ ] Инициализация Telegram SDK в точке входа `src/main.tsx` (соблюдение правил S-01, S-02, S-03)

---

## 🗃️ Этап 2: Shared Layer (Ядро и UI-kit)

### Конфигурация и API (`lib/core/` ➔ `src/shared/`)
- [ ] Конфигурация окружения: `lib/core/config/env.dart` ➔ `src/shared/config/env.ts`
- [ ] Подключение API Supabase: `lib/core/services/supabase_service.dart` ➔ `src/shared/api/supabase/client.ts`
- [ ] Telegram API & хуки: `lib/core/services/telegram_service*` ➔ `src/shared/api/telegram/`
- [ ] Настройка переводов (Локализация): `lib/core/localization/` ➔ `src/shared/lib/i18n/` (ru.json, en.json)
- [ ] Роутер приложения: `lib/core/routing/app_router.dart` ➔ `src/app/providers/router/`

### UI Компоненты (`lib/shared/widgets/hf_*` ➔ `src/shared/ui/`)
- [ ] Кнопка: `hf_button.dart` ➔ `src/shared/ui/button/`
- [ ] Карточка: `hf_card.dart` ➔ `src/shared/ui/card/`
- [ ] Инпут: `hf_input.dart` ➔ `src/shared/ui/input/`
- [ ] Чекбокс: `hf_checkbox.dart` ➔ `src/shared/ui/checkbox/`
- [ ] Переключатель: `hf_toggle.dart` ➔ `src/shared/ui/toggle/`
- [ ] Радиокнопка: `hf_radio.dart` ➔ `src/shared/ui/radio/`
- [ ] Бейдж: `hf_badge.dart` ➔ `src/shared/ui/badge/`
- [ ] Чип: `hf_chip.dart` ➔ `src/shared/ui/chip/`
- [ ] Заголовок: `hf_header_bar.dart` ➔ `src/shared/ui/header-bar/`
- [ ] Таб-бар: `hf_bottom_tab_bar.dart` ➔ `src/shared/ui/bottom-tab-bar/`
- [ ] Слайдер: `hf_slider.dart` ➔ `src/shared/ui/slider/`
- [ ] Скелетон: `hf_skeleton.dart` ➔ `src/shared/ui/skeleton/`
- [ ] Тост (Уведомления): `hf_toast.dart` ➔ `src/shared/ui/toast/`
- [ ] Разметка Markdown: `hf_markdown.dart` ➔ `src/shared/ui/markdown/`
- [ ] Пустые состояния: `hf_empty_state.dart` ➔ `src/shared/ui/empty-state/`
- [ ] Ошибки: `hf_error_state.dart` ➔ `src/shared/ui/error-state/`

---

## 🧩 Этап 3: Перенос бизнес-модулей (Features & Entities)

### 1. 🔐 Модуль Auth (Авторизация)
*Исходные файлы: `lib/features/auth/`*
- [ ] Сессия и авторизация: `auth_repository.dart` + `auth_providers.dart` ➔ `src/entities/session/` (Zustand + React Query)
- [ ] Привязка устройств: `device_link_repository.dart` + `device_link_dialog.dart` ➔ `src/features/link-device/`
- [ ] Экраны:
    - [ ] `splash_screen.dart` ➔ `src/pages/splash/`

### 2. 📅 Модуль Habits (Привычки и Сегодня)
*Исходные файлы: `lib/features/habits/`*
- [ ] Модели данных: `habit_model.dart`, `habit_log_model.dart`, `habit_category_model.dart` ➔ `src/entities/habit/model/` (типы TS + Zod схемы)
- [ ] Запросы привычек и логов: `habits_repository.dart`, `habit_logs_repository.dart`, `habits_providers.dart` ➔ `src/entities/habit/api/` (React Query)
- [ ] Вычисления (серии, статусы): `habit_calculations.dart`, `habit_with_log.dart` ➔ `src/entities/habit/lib/`
- [ ] Интерактивные фичи (кнопки отметки, формы):
    - [ ] Отметка習慣: `habit_circle_check.dart` ➔ `src/features/toggle-habit/`
    - [ ] Форма привычки (создание/ред.): `habit_form_screen.dart` + `habit_draft.dart` ➔ `src/features/create-habit/`
    - [ ] Меню привычки: `habit_more_sheet.dart` ➔ `src/features/manage-habit/`
- [ ] Компоненты UI (Карточки):
    - [ ] Карточка бинарной привычки: `binary_habit_card.dart` ➔ `src/entities/habit/ui/binary-card.tsx`
    - [ ] Карточка числовой привычки: `countable_habit_card.dart` ➔ `src/entities/habit/ui/countable-card.tsx`
    - [ ] Карточка習慣 с таймером: `timed_habit_card.dart` ➔ `src/entities/habit/ui/timed-card.tsx`
    - [ ] Карточка анти-привычки: `anti_habit_card.dart` ➔ `src/entities/habit/ui/anti-card.tsx`
    - [ ] Карточка записи дневника в «Сегодня»: `journal_today_card.dart` ➔ `src/widgets/journal-today-card/`
- [ ] Экраны и сборки:
    - [ ] Главный экран Habits: `habits_list_screen.dart` ➔ `src/pages/habits/` + `src/widgets/habits-list/`
    - [ ] Экран «Сегодня»: `today_screen.dart` ➔ `src/pages/today/` + `src/widgets/today-list/`
    - [ ] Экран деталей привычки: `habit_detail_screen.dart` ➔ `src/pages/habit-detail/`

### 3. ✍️ Модуль Journal (Дневник)
*Исходные файлы: `lib/features/journal/`*
- [ ] Модели данных: `journal_entry_model.dart` ➔ `src/entities/journal/model/`
- [ ] Работа с записями: `journal_repository.dart` + `journal_providers.dart` ➔ `src/entities/journal/api/`
- [ ] Шаблоны: `journal_template_provider.dart` ➔ `src/entities/journal/lib/templates.ts`
- [ ] Экраны:
    - [ ] Список записей: `journal_list_screen.dart` ➔ `src/pages/journal-list/`
    - [ ] Создание/Редактирование: `journal_edit_screen.dart` ➔ `src/pages/journal-edit/` + `src/features/write-journal/`

### 4. 🧠 Модуль AI (ИИ Ассистент)
*Исходные файлы: `lib/features/ai/`*
- [ ] Интеграция OpenRouter: `openrouter_client.dart` + `openrouter_key_repository.dart` ➔ `src/shared/api/openrouter/`
- [ ] Управление ключами и моделями: `openrouter_models_repository.dart` ➔ `src/features/manage-ai-keys/`
- [ ] Модели сообщений и промптов: `ai_messages_repository.dart`, `ai_prompts_repository.dart`, `ai_style_repository.dart` ➔ `src/entities/ai/`
- [ ] Промпты и ИИ-сводки: `style_prompts.dart`, `prompt_builder.dart`, `ai_summaries_repository.dart` ➔ `src/entities/ai/lib/`
- [ ] UI-компоненты:
    - [ ] Дисклеймер приватности: `privacy_disclaimer_dialog.dart` + `disclaimer_service.dart` ➔ `src/features/show-privacy-disclaimer/`
- [ ] Экраны:
    - [ ] Чат с ИИ: `chat_screen.dart` ➔ `src/pages/ai-chat/` + `src/widgets/chat-window/`
    - [ ] Главный хаб ИИ: `ai_screen.dart` ➔ `src/pages/ai-hub/`
    - [ ] Сводки за период: `summaries_screen.dart` ➔ `src/pages/ai-summaries/`
    - [ ] Детали сводки: `summary_detail_screen.dart` ➔ `src/pages/ai-summary-detail/`
    - [ ] Выбор промптов: `prompts_grid_screen.dart` ➔ `src/pages/ai-prompts/`

### 5. 📊 Модуль Analytics (Аналитика)
*Исходные файлы: `lib/features/analytics/`*
- [ ] Агрегации и логика дат: `aggregations.dart`, `date_range.dart`, `day_of_week.dart`, `mood_band.dart` ➔ `src/entities/analytics/lib/`
- [ ] Поставщики данных аналитики: `analytics_providers.dart`, `correlations_provider.dart` ➔ `src/entities/analytics/api/`
- [ ] Чек-лист обзора: `weekly_review_checklist.dart` ➔ `src/features/weekly-review/`
- [ ] Экраны:
    - [ ] Экран аналитики: `analytics_screen.dart` ➔ `src/pages/analytics/` + `src/widgets/analytics-charts/` (с использованием `recharts` / `chart.js`)

### 6. ⚙️ Модуль Profile & Settings (Профиль и Настройки)
*Исходные файлы: `lib/features/profile/`*
- [ ] Данные профиля: `user_provider.dart` ➔ `src/entities/user/`
- [ ] Поддержка (Донаты Stars): `donations_repository.dart` ➔ `src/features/donate-stars/` (правила P-01 - P-05)
- [ ] Настройки и шаблоны рефлексии: `reflection_template_screen.dart` ➔ `src/features/edit-reflection-templates/`
- [ ] Экраны настроек:
    - [ ] Главный профиль: `profile_screen.dart` ➔ `src/pages/profile/`
    - [ ] Настройки ИИ: `ai_settings_screen.dart` ➔ `src/pages/settings-ai/`
    - [ ] Настройки оформления: `appearance_settings_screen.dart` ➔ `src/pages/settings-appearance/`
    - [ ] Настройки уведомлений: `notifications_settings_screen.dart` ➔ `src/pages/settings-notifications/`
    - [ ] Экран «О проекте»: `about_screen.dart` ➔ `src/pages/about/`
    - [ ] Экран аккаунта: `account_screen.dart` ➔ `src/pages/account/`
    - [ ] Контакты: `contact_screen.dart` ➔ `src/pages/contact/`
    - [ ] Донаты: `donate_screen.dart` ➔ `src/pages/donate/`
    - [ ] Политика конфиденциальности: `privacy_policy_screen.dart` ➔ `src/pages/privacy-policy/`

### 7. 🚀 Onboarding (Обучение)
*Исходные файлы: `lib/features/onboarding/`*
- [ ] Сервис онбординга: `onboarding_repository.dart` ➔ `src/entities/onboarding/`
- [ ] Экраны:
    - [ ] Экран обучения: `onboarding_screen.dart` ➔ `src/pages/onboarding/`
    - [ ] Страница пустого состояния (Витрина): `empty_states_showcase_screen.dart` ➔ `src/pages/empty-states-showcase/`

### 8. 📱 Shell (Системная оболочка)
*Исходные файлы: `lib/features/shell/`*
- [ ] Главная оболочка с табами: `root_shell.dart` ➔ `src/app/layouts/root-layout.tsx`

---

## ✅ Этап 4: Финальное тестирование и аудит
- [ ] Прогон `npm run lint` и исправление ошибок eslint
- [ ] Прогон Steiger-аудита (`npx steiger .`) — 0 ошибок (правило A-06)
- [ ] Написание юнит-тестов (Vitest) для бизнес-расчетов серий и логов (правило CI-01)
- [ ] Тестирование в реальном Webview Telegram (проверка безопасных зон, клавиатуры и свайпов)
