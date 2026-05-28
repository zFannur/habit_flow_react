<div align="center">

# HabitFlow — Mini App (React)

**Habit tracker · reflection journal · analytics · AI chat — a React/TypeScript Telegram Mini App.**

[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![Try it in Telegram](https://img.shields.io/badge/Try%20it-%40habit__flow__app__bot-26A5E4.svg?logo=telegram&logoColor=white)](https://t.me/habit_flow_app_bot)

**English** · [Русский](README.ru.md)

🤖 **Live bot → [@habit_flow_app_bot](https://t.me/habit_flow_app_bot)**

</div>

> React 19 + TypeScript Telegram Mini App that authenticates with `initData`,
> talks to Supabase over PostgREST, and renders the full HabitFlow experience —
> Today, Habits, Journal, Analytics, AI, and Profile.
> Built with Feature-Sliced Design, TanStack Query, Zustand, and Tailwind CSS v4.
> The companion notification bot lives in **[habit_flow_bot](https://github.com/zFannur/habit_flow_bot)**.

<!--
📸 Add Mini App screenshots in screenshots/ and uncomment this block.

<p align="center">
  <img src="screenshots/01-today.png"        width="240" alt="Today tab" />
  <img src="screenshots/03-habit-detail.png" width="240" alt="Habit detail with heatmap" />
  <img src="screenshots/05-analytics.png"    width="240" alt="Analytics charts" />
</p>
-->

> 📸 **Screenshots coming soon.**

---

## ✨ What's inside

- **Today** — only habits due now, one-tap done/skip, all-done celebration
- **Habits** — CRUD with emoji icons, colors, schedules, swipe-to-archive/delete
- **Habit detail** — calendar heatmap, history, streaks & recovery, anti-habit "days since"
- **Journal** — reflection entries with optional templates
- **Analytics** — completion rate, trends, bar & pie charts, mood/energy graphs
- **AI** — chat with markdown rendering, periodic summaries, ready-made prompt buttons (OpenRouter, bring your own key)
- **Profile** — settings, AI key, notifications, appearance, donations (Telegram Stars), about/contact
- **Bilingual** RU + EN, theme driven by `Telegram.WebApp.themeParams`

---

## 🚀 Getting started

```bash
npm install

# Copy env and fill in the values
cp .env.example .env

npm run dev          # dev server at localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run lint         # ESLint
```

---

## ⚙️ Environment (`.env`)

| Variable | Required | Default | Purpose |
|---|:--:|---|---|
| `VITE_SUPABASE_URL` | ✅ | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | — | Supabase public anon key |
| `VITE_BOT_USERNAME` | ✅ | — | Telegram bot username (without @) |
| `VITE_OPENROUTER_BASE_URL` | — | `https://openrouter.ai/api/v1` | OpenRouter base URL |
| `VITE_OPENROUTER_DEFAULT_MODEL` | — | `openai/gpt-oss-120b:free` | Default AI model |
| `VITE_ENV` | — | `development` | `production` enables strict modes |
| `VITE_APP_BASE_URL` | — | `https://habitflow.app` | Canonical Mini App URL (HTTP-Referer) |
| `VITE_BOT_PUBLIC_CHANNEL` | — | `https://t.me/habitflow_dev` | Public Telegram channel/chat |
| `VITE_OPENROUTER_KEYS_URL` | — | `https://openrouter.ai/keys` | OpenRouter keys dashboard |

> 🔒 The OpenRouter API key is the **user's own**, stored in `localStorage` under the user's Supabase session.
> `BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` never live here.

---

## 🏗 Architecture

**Feature-Sliced Design (FSD).** Each layer is strictly isolated:

```
src/
├── app/
│   ├── providers/router/   # react-router-dom hash router, 20 routes
│   ├── layouts/            # RootLayout with bottom tab bar
│   └── styles/             # global CSS + Tailwind theme
├── pages/                  # 20 pages (thin entry points)
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
├── widgets/                # composite UI blocks (e.g. journal-today-card)
├── entities/               # domain models + API
│   ├── session/            # auth: initData → Supabase JWT
│   ├── habit/              # Habit model, helpers, tests
│   ├── journal/            # JournalEntry model, reflection templates
│   └── ai/                 # AI summary & chat types, prompt library
└── shared/
    ├── api/
    │   ├── supabase/       # Supabase JS client
    │   ├── openrouter/     # OpenRouter streaming client
    │   └── telegram/       # @telegram-apps/sdk wrapper
    ├── config/             # env validation
    ├── lib/i18n/           # i18n (RU + EN JSON)
    └── ui/                 # design-system primitives
        ├── button/ card/ input/ checkbox/ toggle/ radio/
        ├── badge/ chip/ slider/ skeleton/
        ├── header-bar/ section-label/
        ├── toast/ empty-state/ error-state/ markdown/
        └── index.ts
```

---

## 📐 Conventions

- **Architecture** — [Feature-Sliced Design](https://feature-sliced.design/), enforced by [Steiger](https://github.com/feature-sliced/steiger).
- **State** — Zustand for global stores, TanStack Query for server state.
- **Routing** — React Router DOM v7 (hash router for Telegram iframe compatibility).
- **Styling** — Tailwind CSS v4, CSS custom properties driven by `Telegram.WebApp.themeParams`.
- **Validation** — Zod schemas at all data boundaries.
- **Forms** — react-hook-form + Zod resolver.
- **Localization** — i18n JSON files (`shared/lib/i18n`). **No hard-coded UI strings.**
- **Safe-area** — `--tg-viewport-content-safe-area-inset-top/bottom` applied on every page.
- **Comments** — only "why", never "what the code does".

---

## 🔐 Security

- `BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` — **never** on the client.
- `initData` is validated server-side via Supabase Edge Function; `tg.initDataUnsafe` is for UI params (name, avatar) only — never for auth.
- Supporter status is set exclusively via a database trigger; client cannot self-grant.

---

## 🔗 Related

| Repo | Description |
|---|---|
| [habit_flow_bot](https://github.com/zFannur/habit_flow_bot) | Companion notification bot (Python / aiogram 3) |
| [habit_flow](https://github.com/zFannur/habit_flow) | Flutter Mini App (same product, different tech stack) |

---

## 📄 License

[MIT](LICENSE) © 2026 zFannur.
