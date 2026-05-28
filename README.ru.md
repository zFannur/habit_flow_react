<div align="center">

# HabitFlow — Mini App (React)

**Трекер привычек · дневник рефлексии · аналитика · ИИ-чат — React/TypeScript Telegram Mini App.**

[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![Попробовать в Telegram](https://img.shields.io/badge/Попробовать-%40habit__flow__app__bot-26A5E4.svg?logo=telegram&logoColor=white)](https://t.me/habit_flow_app_bot)

[English](README.md) · **Русский**

🤖 **Живой бот → [@habit_flow_app_bot](https://t.me/habit_flow_app_bot)**

</div>

> React 19 + TypeScript Telegram Mini App. Авторизуется через `initData`,
> общается с Supabase по PostgREST и рендерит весь опыт HabitFlow —
> Сегодня, Привычки, Дневник, Аналитика, ИИ и Профиль.
> Построен на Feature-Sliced Design, TanStack Query, Zustand и Tailwind CSS v4.
> Бот-компаньон с уведомлениями живёт в **[habit_flow_bot](https://github.com/zFannur/habit_flow_bot)**.

<!--
📸 Добавьте скриншоты Mini App в screenshots/ и раскомментируйте этот блок.

<p align="center">
  <img src="screenshots/01-today.png"        width="240" alt="Вкладка Сегодня" />
  <img src="screenshots/03-habit-detail.png" width="240" alt="Детали привычки с тепловой картой" />
  <img src="screenshots/05-analytics.png"    width="240" alt="Графики аналитики" />
</p>
-->

> 📸 **Скриншоты скоро будут.**

---

## ✨ Что внутри

- **Сегодня** — только привычки, что пора сделать, отметка в один тап, празднование по завершении
- **Привычки** — CRUD с иконками-эмодзи, цвета, расписания, свайп-в-архив/удалить
- **Детали привычки** — тепловая карта-календарь, история, серии и восстановление, «дней без» для анти-привычек
- **Дневник** — записи рефлексии с опциональными шаблонами
- **Аналитика** — процент выполнения, тренды, столбчатые и круговые диаграммы, графики настроения/энергии
- **ИИ** — чат с рендерингом Markdown, периодические сводки и готовые кнопки-промпты (OpenRouter, на своём ключе)
- **Профиль** — настройки, ключ ИИ, уведомления, внешний вид, донаты (Telegram Stars), о приложении/контакты
- **Двуязычность** RU + EN, тема задаётся через `Telegram.WebApp.themeParams`

---

## 🚀 Запуск

```bash
npm install

# Скопируйте .env и заполните значения
cp .env.example .env

npm run dev          # dev-сервер на localhost:5173
npm run build        # продакшн-сборка → dist/
npm run preview      # предпросмотр продакшн-сборки
npm run lint         # ESLint
```

---

## ⚙️ Окружение (`.env`)

| Переменная | Обязательна | Default | Назначение |
|---|:--:|---|---|
| `VITE_SUPABASE_URL` | ✅ | — | URL Supabase-проекта |
| `VITE_SUPABASE_ANON_KEY` | ✅ | — | публичный anon-ключ Supabase |
| `VITE_BOT_USERNAME` | ✅ | — | имя Telegram-бота (без @) |
| `VITE_OPENROUTER_BASE_URL` | — | `https://openrouter.ai/api/v1` | базовый URL OpenRouter |
| `VITE_OPENROUTER_DEFAULT_MODEL` | — | `openai/gpt-oss-120b:free` | модель ИИ по умолчанию |
| `VITE_ENV` | — | `development` | `production` включает строгие режимы |
| `VITE_APP_BASE_URL` | — | `https://habitflow.app` | канонический URL Mini App (HTTP-Referer) |
| `VITE_BOT_PUBLIC_CHANNEL` | — | `https://t.me/habitflow_dev` | публичный канал/чат в Telegram |
| `VITE_OPENROUTER_KEYS_URL` | — | `https://openrouter.ai/keys` | дашборд ключей OpenRouter |

> 🔒 Ключ OpenRouter — **собственный ключ пользователя**, хранится в `localStorage` в рамках сессии Supabase.
> `BOT_TOKEN` и `SUPABASE_SERVICE_ROLE_KEY` здесь не живут никогда.

---

## 🏗 Архитектура

**Feature-Sliced Design (FSD).** Каждый слой строго изолирован:

```
src/
├── app/
│   ├── providers/router/   # react-router-dom hash router, 20 маршрутов
│   ├── layouts/            # RootLayout с нижним таббаром
│   └── styles/             # глобальный CSS + тема Tailwind
├── pages/                  # 20 страниц (тонкие точки входа)
│   ├── splash/
│   ├── onboarding/
│   ├── today/
│   ├── habits/ + habit-detail/ + habit-form/
│   ├── journal-list/ + journal-edit/
│   ├── analytics/
│   ├── ai-hub/ + ai-summary-detail/
│   ├── profile/ + account/
│   ├── settings-notifications/ + settings-ai/ + settings-appearance/
│   ├── reflection-template/
│   └── about/ + privacy-policy/ + contact/ + donate/
├── widgets/                # составные UI-блоки (напр. journal-today-card)
├── entities/               # доменные модели + API
│   ├── session/            # auth: initData → Supabase JWT
│   ├── habit/              # модель Habit, хелперы, тесты
│   ├── journal/            # модель JournalEntry, шаблоны рефлексии
│   └── ai/                 # типы сводок и чата, библиотека промптов
└── shared/
    ├── api/
    │   ├── supabase/       # Supabase JS клиент
    │   ├── openrouter/     # стриминговый клиент OpenRouter
    │   └── telegram/       # обёртка @telegram-apps/sdk
    ├── config/             # валидация env
    ├── lib/i18n/           # i18n (RU + EN JSON)
    └── ui/                 # примитивы дизайн-системы
        ├── button/ card/ input/ checkbox/ toggle/ radio/
        ├── badge/ chip/ slider/ skeleton/
        ├── header-bar/ section-label/
        ├── toast/ empty-state/ error-state/ markdown/
        └── index.ts
```

---

## 📐 Соглашения

- **Архитектура** — [Feature-Sliced Design](https://feature-sliced.design/), контролируется [Steiger](https://github.com/feature-sliced/steiger).
- **Состояние** — Zustand для глобальных сторов, TanStack Query для серверного состояния.
- **Навигация** — React Router DOM v7 (hash router для совместимости с Telegram iframe).
- **Стили** — Tailwind CSS v4, CSS custom properties из `Telegram.WebApp.themeParams`.
- **Валидация** — схемы Zod на всех границах данных.
- **Формы** — react-hook-form + Zod resolver.
- **Локализация** — JSON-файлы i18n (`shared/lib/i18n`). **Никаких хардкоженных строк UI.**
- **Safe-area** — `--tg-viewport-content-safe-area-inset-top/bottom` применяется на каждой странице.
- **Комментарии** — только «почему», никогда «что делает код».

---

## 🔐 Безопасность

- `BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` — **никогда** на клиенте.
- `initData` валидируется на сервере через Supabase Edge Function; `tg.initDataUnsafe` — только для UI-параметров (имя, аватар), не для auth.
- Статус supporter выставляется исключительно через триггер БД; клиент не может назначить его себе сам.

---

## 🔗 Связанные репозитории

| Репозиторий | Описание |
|---|---|
| [habit_flow_bot](https://github.com/zFannur/habit_flow_bot) | Бот-компаньон с уведомлениями (Python / aiogram 3) |
| [habit_flow](https://github.com/zFannur/habit_flow) | Flutter Mini App (тот же продукт, другой стек) |

---

## 📄 Лицензия

[MIT](LICENSE) © 2026 zFannur.
