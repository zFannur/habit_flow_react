# Progress Tracker: Flutter -> React (FSD + TMA) Migration

Этот файл предназначен для отслеживания прогресса миграции. Агент ИИ должен отмечать выполненные пункты символом `[x]`, находящиеся в процессе переноса символом `[/]`, а невыполненные — `[ ]`.

---

## 🛠️ Этап 1: Подготовка проекта и базовое окружение
- [x] Инициализация React 19 + TypeScript SPA проекта (в папке `app_react`)
- [x] Установка npm-пакетов (Vite, TS, Tailwind, Zustand, React Query, Telegram SDK, Zod, Steiger, ESLint)
- [x] Конфигурация Tailwind CSS (подключение цветов темы Telegram)
- [x] Конфигурация компилятора (`tsconfig.json` c `strict` и `noUncheckedIndexedAccess`)
- [x] Настройка линтера архитектуры Steiger (`steiger.config.ts`)
- [x] Инициализация Telegram SDK в точке входа `src/main.tsx` (соблюдение правил S-01, S-02, S-03)

---

## 🗃️ Этап 2: Shared Layer (Ядро и UI-kit)

### Конфигурация и API (`lib/core/` ➔ `src/shared/`)
- [x] Конфигурация окружения: `lib/core/config/env.dart` ➔ `src/shared/config/env.ts`
- [x] Подключение API Supabase: `lib/core/services/supabase_service.dart` ➔ `src/shared/api/supabase/client.ts`
- [x] Telegram API & хуки: `lib/core/services/telegram_service*` ➔ `src/shared/api/telegram/`
- [x] Настройка переводов (Локализация): `lib/core/localization/` ➔ `src/shared/lib/i18n/` (ru.json, en.json)
- [x] Роутер приложения: `lib/core/routing/app_router.dart` ➔ `src/app/providers/router/`

### UI Компоненты (`lib/shared/widgets/hf_*` ➔ `src/shared/ui/`)
- [x] Кнопка: `hf_button.dart` ➔ `src/shared/ui/button/`
- [x] Карточка: `hf_card.dart` ➔ `src/shared/ui/card/`
- [x] Инпут: `hf_input.dart` ➔ `src/shared/ui/input/`
- [x] Чекбокс: `hf_checkbox.dart` ➔ `src/shared/ui/checkbox/`
- [x] Переключатель: `hf_toggle.dart` ➔ `src/shared/ui/toggle/`
- [x] Радиокнопка: `hf_radio.dart` ➔ `src/shared/ui/radio/`
- [x] Бейдж: `hf_badge.dart` ➔ `src/shared/ui/badge/`
- [x] Чип: `hf_chip.dart` ➔ `src/shared/ui/chip/`
- [x] Заголовок: `hf_header_bar.dart` ➔ `src/shared/ui/header-bar/`
- [x] Таб-бар: `hf_bottom_tab_bar.dart` ➔ `src/shared/ui/bottom-tab-bar/` (интегрирован в макет)
- [x] Слайдер: `hf_slider.dart` ➔ `src/shared/ui/slider/`
- [x] Скелетон: `hf_skeleton.dart` ➔ `src/shared/ui/skeleton/`
- [x] Тост (Уведомления): `hf_toast.dart` ➔ `src/shared/ui/toast/`
- [x] Разметка Markdown: `hf_markdown.dart` ➔ `src/shared/ui/markdown/`
- [x] Пустые состояния: `hf_empty_state.dart` ➔ `src/shared/ui/empty-state/`
- [x] Ошибки: `hf_error_state.dart` ➔ `src/shared/ui/error-state/`
- [x] Наклейка разделов: `hf_section_label.dart` ➔ `src/shared/ui/section-label/`

---

## 🧩 Этап 3: Перенос бизнес-модулей (Features & Entities)

### 1. 🔐 Модуль Auth (Авторизация)
*Исходные файлы: `lib/features/auth/`*
- [x] Сессия и авторизация: `auth_repository.dart` + `auth_providers.dart` ➔ `src/entities/session/` (Zustand + React Query)
- [x] Привязка устройств: `device_link_repository.dart` + `device_link_dialog.dart` ➔ `src/features/link-device/` (заглушка)
- [x] Экраны:
    - [x] `splash_screen.dart` ➔ `src/pages/splash/`

### 2. 📅 Модуль Habits (Привычки и Сегодня)
*Исходные файлы: `lib/features/habits/`*
- [x] Модели данных: `habit_model.dart`, `habit_log_model.dart`, `habit_category_model.dart` ➔ `src/entities/habit/model/` (типы TS + Zod схемы)
- [x] Запросы привычек и логов: `habits_repository.dart`, `habit_logs_repository.dart`, `habits_providers.dart` ➔ `src/entities/habit/api/` (React Query)
- [x] Вычисления (серии, статусы): `habit_calculations.dart`, `habit_with_log.dart` ➔ `src/entities/habit/lib/`
- [x] Интерактивные фичи (кнопки отметки, формы):
    - [x] Отметка習慣: `habit_circle_check.dart` ➔ `src/features/toggle-habit/`
    - [x] Форма привычки (создание/ред.): `habit_form_screen.dart` + `habit_draft.dart` ➔ `src/features/create-habit/`
    - [x] Меню привычки: `habit_more_sheet.dart` ➔ `src/features/manage-habit/`
- [x] Компоненты UI (Карточки):
    - [x] Карточка бинарной привычки: `binary_habit_card.dart` ➔ `src/entities/habit/ui/binary-card.tsx`
    - [x] Карточка числовой привычки: `countable_habit_card.dart` ➔ `src/entities/habit/ui/countable-card.tsx`
    - [x] Карточка習慣 с таймером: `timed_habit_card.dart` ➔ `src/entities/habit/ui/timed-card.tsx`
    - [x] Карточка анти-привычки: `anti_habit_card.dart` ➔ `src/entities/habit/ui/anti-card.tsx`
    - [x] Карточка записи дневника в «Сегодня»: `journal_today_card.dart` ➔ `src/widgets/journal-today-card/`
- [x] Экраны и сборки:
    - [x] Главный экран Habits: `habits_list_screen.dart` ➔ `src/pages/habits/` + `src/widgets/habits-list/`
    - [x] Экран «Сегодня»: `today_screen.dart` ➔ `src/pages/today/` + `src/widgets/today-list/`
    - [x] Экран деталей привычки: `habit_detail_screen.dart` ➔ `src/pages/habit-detail/`

### 3. ✍️ Модуль Journal (Дневник)
*Исходные файлы: `lib/features/journal/`*
- [x] Модели данных: `journal_entry_model.dart` ➔ `src/entities/journal/model/`
- [x] Работа с записями: `journal_repository.dart` + `journal_providers.dart` ➔ `src/entities/journal/api/`
- [x] Шаблоны: `journal_template_provider.dart` ➔ `src/entities/journal/lib/templates.ts`
- [x] Экраны:
    - [x] Список записей: `journal_list_screen.dart` ➔ `src/pages/journal-list/`
    - [x] Создание/Редактирование: `journal_edit_screen.dart` ➔ `src/pages/journal-edit/` + `src/features/write-journal/`

### 4. 🧠 Модуль AI (ИИ Ассистент)
*Исходные файлы: `lib/features/ai/`*
- [x] Интеграция OpenRouter: `openrouter_client.dart` + `openrouter_key_repository.dart` ➔ `src/shared/api/openrouter/`
- [x] Управление ключами и моделями: `openrouter_models_repository.dart` ➔ `src/features/manage-ai-keys/`
- [x] Модели сообщений и промптов: `ai_messages_repository.dart`, `ai_prompts_repository.dart`, `ai_style_repository.dart` ➔ `src/entities/ai/`
- [x] Промпты и ИИ-сводки: `style_prompts.dart`, `prompt_builder.dart`, `ai_summaries_repository.dart` ➔ `src/entities/ai/lib/`
- [x] UI-компоненты:
    - [x] Дисклеймер приватности: `privacy_disclaimer_dialog.dart` + `disclaimer_service.dart` ➔ `src/features/show-privacy-disclaimer/`
- [x] Экраны:
    - [x] Чат с ИИ: `chat_screen.dart` ➔ `src/pages/ai-chat/` + `src/widgets/chat-window/`
    - [x] Главный хаб ИИ: `ai_screen.dart` ➔ `src/pages/ai-hub/`
    - [x] Сводки за период: `summaries_screen.dart` ➔ `src/pages/ai-summaries/`
    - [x] Детали сводки: `summary_detail_screen.dart` ➔ `src/pages/ai-summary-detail/`
    - [x] Выбор промптов: `prompts_grid_screen.dart` ➔ `src/pages/ai-prompts/`

### 5. 📊 Модуль Analytics (Аналитика)
*Исходные файлы: `lib/features/analytics/`*
- [x] Агрегации и логика дат: `aggregations.dart`, `date_range.dart`, `day_of_week.dart`, `mood_band.dart` ➔ `src/entities/analytics/lib/`
- [x] Поставщики данных аналитики: `analytics_providers.dart`, `correlations_provider.dart` ➔ `src/entities/analytics/api/`
- [x] Чек-лист обзора: `weekly_review_checklist.dart` ➔ `src/features/weekly-review/`
- [x] Экраны:
    - [x] Экран аналитики: `analytics_screen.dart` ➔ `src/pages/analytics/` + `src/widgets/analytics-charts/` (с использованием `recharts` / `chart.js`)

### 6. ⚙️ Модуль Profile & Settings (Профиль и Настройки)
*Исходные файлы: `lib/features/profile/`*
- [x] Данные профиля: `user_provider.dart` ➔ `src/entities/user/`
- [x] Поддержка (Донаты Stars): `donations_repository.dart` ➔ `src/features/donate-stars/` (правила P-01 - P-05)
- [x] Настройки и шаблоны рефлексии: `reflection_template_screen.dart` ➔ `src/features/edit-reflection-templates/`
- [x] Экраны настроек:
    - [x] Главный профиль: `profile_screen.dart` ➔ `src/pages/profile/`
    - [x] Настройки ИИ: `ai_settings_screen.dart` ➔ `src/pages/settings-ai/`
    - [x] Настройки оформления: `appearance_settings_screen.dart` ➔ `src/pages/settings-appearance/`
    - [x] Настройки уведомлений: `notifications_settings_screen.dart` ➔ `src/pages/settings-notifications/`
    - [x] Экран «О проекте»: `about_screen.dart` ➔ `src/pages/about/`
    - [x] Экран аккаунта: `account_screen.dart` ➔ `src/pages/account/`
    - [x] Контакты: `contact_screen.dart` ➔ `src/pages/contact/`
    - [x] Донаты: `donate_screen.dart` ➔ `src/pages/donate/`
    - [x] Политика конфиденциальности: `privacy_policy_screen.dart` ➔ `src/pages/privacy-policy/`

### 7. 🚀 Onboarding (Обучение)
*Исходные файлы: `lib/features/onboarding/`*
- [x] Сервис онбординга: `onboarding_repository.dart` ➔ `src/entities/onboarding/`
- [x] Экраны:
    - [x] Экран обучения: `onboarding_screen.dart` ➔ `src/pages/onboarding/`
    - [x] Страница пустого состояния (Витрина): `empty_states_showcase_screen.dart` ➔ `src/pages/empty-states-showcase/`

### 8. 📱 Shell (Системная оболочка)
*Исходные файлы: `lib/features/shell/`*
- [x] Главная оболочка с табами: `root_shell.dart` ➔ `src/app/layouts/root-layout.tsx`

---

## ✅ Этап 4: Финальное тестирование и аудит
- [x] Прогон `npm run lint` и исправление ошибок eslint
- [x] Прогон Steiger-аудита (`npx steiger .`) — 0 ошибок (правило A-06)
- [x] Написание юнит-тестов (Vitest) для бизнес-расчетов серий и логов (правило CI-01)
- [x] Тестирование в реальном Webview Telegram (проверка безопасных зон, клавиатуры и свайпов)
