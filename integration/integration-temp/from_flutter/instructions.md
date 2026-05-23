# Инструкция по миграции Flutter -> React (FSD + TMA)

Эта инструкция предназначена для ИИ-агента, который будет выполнять пошаговый перенос фронтенда приложения HabitFlow с Flutter на React 19 + TypeScript + Feature-Sliced Design (FSD) 2.1 + Telegram Mini Apps SDK v3.

## Целевой стек
*   **Фреймворк**: React 19 + Vite (SPA)
*   **Стилизация**: Tailwind CSS + CSS-переменные Telegram
*   **Стейт-менеджер**: Zustand (для клиентского состояния) + React Query v5 (для кэширования и запросов к бэкенду/Supabase)
*   **Telegram SDK**: `@telegram-apps/sdk-react` v3
*   **Бэкенд**: Без изменений (Supabase JS Client вместо Supabase Dart Client)
*   **Валидация**: Zod (вместо ручного парсинга и freezed/json)
*   **Архитектурная методология**: Feature-Sliced Design (FSD) 2.1

---

## Архитектурный маппинг (Flutter -> React FSD)

### 1. Ядро приложения (`lib/core/` -> `src/app/` и `src/shared/`)
*   `lib/core/config/` (env, theme, tokens) ➔ `src/shared/config/env.ts` и `src/app/styles/theme.css`
*   `lib/core/routing/app_router.dart` ➔ `src/app/providers/router/` (с использованием `react-router-dom` или легковесного хэндлера страниц для Mini App)
*   `lib/core/services/supabase_service.dart` ➔ `src/shared/api/supabase.ts` (инициализация `@supabase/supabase-js`)
*   `lib/core/services/telegram_service*` ➔ `src/shared/api/telegram/` (инициализация SDK, хуки `useViewport`, `useThemeParams` и т.д.)
*   `lib/core/localization/` (.arb файлы) ➔ `src/shared/lib/i18n/` (ru.json, en.json переводы)

### 2. Общие виджеты (`lib/shared/widgets/` -> `src/shared/ui/`)
Каждая кнопка, чекбокс или инпут с префиксом `hf_` должна быть переписана в чистый React-компонент в папке `src/shared/ui/`:
*   `hf_button.dart` ➔ `src/shared/ui/button.tsx`
*   `hf_card.dart` ➔ `src/shared/ui/card.tsx`
*   `hf_input.dart` ➔ `src/shared/ui/input.tsx`
*   `hf_toast.dart` ➔ `src/shared/ui/toast.tsx` (или использовать `react-hot-toast` / `sonner`)

### 3. Фичи (`lib/features/` -> FSD Layers: `entities`, `features`, `widgets`, `pages`)
Во Flutter фичи сгруппированы по папкам, внутри которых лежат `data`, `domain` и `presentation`. В FSD мы распределяем этот код по слоям:

*   **`entities/` (Бизнес-сущности и их состояние)**:
    *   Сюда переносим модели данных (интерфейсы TS + схемы Zod для валидации) и стейт-менеджеры/запросы API.
    *   *Пример*: `lib/features/habits/data/habit_model.dart` ➔ `src/entities/habit/model/types.ts` и `src/entities/habit/model/validation.ts`.
    *   *Пример*: `habits_repository.dart` ➔ `src/entities/habit/api/habits-api.ts` (запросы к Supabase) и React Query хуки `useHabits()`.
*   **`features/` (Интерактивные действия пользователя)**:
    *   Кнопки, формы, действия, приносящие бизнес-ценность.
    *   *Пример*: Отметка привычки выполненной (`habit_circle_check.dart`) ➔ `src/features/toggle-habit/ui/toggle-habit-button.tsx` (содержит мутацию React Query).
    *   *Пример*: Форма создания привычки (`habit_form_screen.dart`) ➔ `src/features/create-habit/ui/habit-form.tsx`.
*   **`widgets/` (Самостоятельные куски интерфейса)**:
    *   Сборка карточек, списков привычек, шапок, сеток.
    *   *Пример*: Сетка習慣 (`habits_list_screen.dart` / виджеты) ➔ `src/widgets/habits-list/ui/habits-list.tsx`.
*   **`pages/` (Экраны целиком)**:
    *   Композиция виджетов и фичей на конкретной странице.
    *   *Пример*: Экран «Сегодня» (`today_screen.dart`) ➔ `src/pages/today/ui/today-page.tsx`.

---

## Пошаговое руководство по переносу для ИИ-агента

При запуске задачи по переносу, ИИ должен строго следовать этим этапам и обновлять файл `progress.md`:

### Этап 1: Scaffolding (Подготовка рабочего окружения)
1. Инициализировать проект с помощью `vite` (`npm create vite@latest ./ -- --template react-ts` в папке `app_react`).
2. Установить зависимости из канонического стека скилла `tma-react-fsd`:
   ```bash
   npm i @telegram-apps/sdk-react @telegram-apps/sdk zustand @tanstack/react-query zod react-hook-form react-router-dom
   npm i -D tailwindcss postcss autoprefixer steiger @feature-sliced/steiger-plugin eslint vitest
   ```
3. Настроить Tailwind (`npx tailwindcss init -p`), создать конфигурации Vite, TS, а также `steiger.config.ts`.
4. Настроить точку входа `src/main.tsx` и базовую инициализацию Telegram SDK (проверить правило **S-01**, **S-02**, **S-03**).

### Этап 2: Shared & Core Layer
1. Перенести конфигурации (`env.dart` ➔ `.env.local` + `shared/config/env.ts`).
2. Инициализировать клиент Supabase в `src/shared/api/supabase/client.ts`.
3. Создать UI-kit в `src/shared/ui/` на основе виджетов `lib/shared/widgets/`.
4. Реализовать локализацию (перевести `.arb` файлы в JSON и настроить контекст локализации в React).

### Этап 3: Поочередный перенос сущностей и фич (Entities & Features)
Переносить фичи строго в указанном порядке (от простых к сложным/зависимым):
1.  **Auth (Авторизация)**: Перенос `initData` авторизации, генерация сессии Supabase, роутинг на Splash / Main.
2.  **Habits (Привычки)**: CRUD привычек, логи выполнения, вычисления серий (streaks), карточки привычек.
3.  **Journal (Дневник)**: Шаблоны записей, история записей, создание/редактирование.
4.  **AI (ИИ-функции)**: Чат, промпты, история сводок, обработка ключа OpenRouter.
5.  **Analytics (Аналитика)**: Сборки графиков, еженедельные обзоры.
6.  **Profile & Settings**: Настройки внешнего вида, ИИ, донаты (Stars).

---

## Золотые правила WATCHDOG (Выполнять перед каждым коммитом!)

Для любого генерируемого файла ИИ-агент обязан проверить соответствие 33 правилам скилла `tma-react-fsd`. Особое внимание обратить на:
*   **[BLOCKER] A-01 / A-03**: Никаких перекрестных импортов в обход `index.ts` публичных API.
*   **[BLOCKER] T-01**: Никаких `any` в коде TypeScript.
*   **[BLOCKER] S-01 / S-02**: Инициализация SDK строго один раз в корне, синхронный маунт.
*   **[BLOCKER] S-04**: Проверка доступности возможностей SDK (`isAvailable()` / `ifAvailable()`) перед вызовом.
*   **[BLOCKER] U-01 / U-02**: Кнопки и футеры позиционируются по `var(--tg-viewport-safe-area-inset-bottom)`, а не через `env(safe-area-inset-bottom)`.
*   **[BLOCKER] SEC-03**: Никаких токенов бота (`BOT_TOKEN`) во фронтенд-коде.
