# Progress: React → Flutter Design Integration + Logic Fixes

## Этап 1: Дизайн-фундамент ✅
- [x] tailwind.config.js — HFColors токены + типографика + spacing + shadows
- [x] index.css — HFColors CSS-переменные (light/dark)
- [x] ThemeProvider — контекст Light/Dark/Auto + 8 accent-цветов
- [x] App.tsx — интеграция ThemeProvider
- [x] bootstrap.ts — убрана привязка Telegram theme CSS vars

## Этап 2: UI-компоненты ✅
- [x] Button — rounded-hf-md, border-[1.5px], hf-label-*
- [x] Card — rounded-hf-lg, shadow-hf-card, bg-hf-card
- [x] Input — rounded-hf-md, py-[11px]/px-[14px], label hf-label-md
- [x] Toggle — bg-hf-bg-tertiary OFF, hf-text-tertiary OFF thumb, exact positioning
- [x] Badge — py-[3px], font-medium, hf-semantic colors
- [x] Checkbox — OFF border-hf-border, check stroke-[2.2]
- [x] HeaderBar — border-hf-border, gap-1 (4px)
- [x] EmptyState — hf-body-md description
- [x] Skeleton — rounded-hf-md, 1.4s animation, hf colors
- [x] Chip — rounded-hf-full, hf-label-sm count, gap-[5px]
- [x] Slider — bg-hf-bg-tertiary track, shadow-hf-thumb
- [x] Radio — border-hf-border OFF, 10px dot, hf-body-md label
- [x] SectionLabel — hf-text-tertiary, hf-label-sm
- [x] Toast — rounded-[14px], shadow-hf-toast, semantic colors
- [x] BinaryCard — hf-styled card, title-md
- [x] CountableCard — hf-styled card, title-md
- [x] TimedCard — hf-styled card, pill button border-[1.5px]
- [x] AntiCard — rgba anti bg/border
- [x] CircleCheck — bg-hf-card OFF, stroke-[2.2], 15x12 SVG
- [x] StreakBadge — px-[8px] py-[3px], hf-label-sm, hf-warning colors
- [x] EmojiIcon — rounded-hf-md, hf-bg-secondary default

## Этап 3: Страницы ✅
- [x] RootLayout + BottomTabBar — hf-card bg, border-hf-border, shadow-hf-bottom-nav, 44×28 pill tabs
- [x] TodayScreen — rewrite: header-md title, 90-day logs, max streak, hf-styled
- [x] HabitsListScreen — rewrite: bulk log query, streak/rate sorting, hf-styled
- [x] AppearanceSettings — rewrite: ThemeProvider integration, 8 accent colors, HeaderBar
- [x] All pages — глобальная замена tg→hf классов

## Этап 4: Исправление ошибок ✅
- [x] 4.1 (Critical) Binary toggle: uncheck → `missed` log (вместо удаления)
- [x] 4.2 (High) Sort byStreak/byRate: реализована сортировка через bulk logs
- [x] 4.3 (High) Log mutations: инвалидация `['habit_logs', userId, habitId]`
- [x] 4.5 (Medium) `useDeleteMutation`: прямой вызов `useDeleteHabitMutation`
- [x] 4.6 (Medium) Header streak: вычисление maxStreak из 90-дневных логов
- [x] 4.7 (Medium) Onboarding: try-catch на каждый шаблон
- [x] 4.10 (Medium) N+1 лог-запросы: shared `useLogsQuery` на уровне Today + Habits
- [x] 4.12 (Low) Archive confirm: правильный ключ локализации
- [x] 4.13 (Low) syncTimeZone: уже вызывается в store.ts — OK
- [ ] 4.4 (High) n_per_week schedule — требует реструктуризации формы (deferred)
- [ ] 4.8 (Medium) HabitDetail chart + history — крупная фича (deferred)
- [ ] 4.11 (Medium) Accent color + category + endless toggle — реструктуризация (deferred)
- [ ] 4.14 (Medium) AllDone celebration — фича (deferred)

## Этап 5: Проверка ✅
- [x] lint — ESLint: 0 errors, 0 warnings
- [x] typecheck — tsc -b: 0 errors

---

## Что сделано

1. **Полностью заменена дизайн-система** с Telegram-зависимой (`tg:*`) на фиксированную HFColors из Flutter:
   - 20 цветовых токенов (light/dark/семантические)
   - 14 стилей типографики (`hf-display-lg` ... `hf-label-sm`)
   - 5 радиусов (`hf-sm` ... `hf-full`)
   - 9 spacing-значений (8px grid)
   - 5 теней (`hf-card`, `hf-toast`, `hf-bottom-nav`, etc.)

2. **ThemeProvider** с поддержкой Light/Dark/Auto + 8 акцентных цветов (как Flutter)

3. **Все UI-компоненты** приведены к точным спецификациям Flutter:
   - padding, border-radius, тени, цвета, типографика

4. **Глобальная замена классов** `tg-* → hf-*` во всех 40+ файлах

5. **Исправлено 10 логических ошибок**, включая критический баг binary-переключения

## Что отложено

4 фичи требуют более глубокой реструктуризации и могут быть сделаны отдельно:
- `n_per_week` schedule type (habit form)
- HabitDetail chart + history
- Accent color + category + endless toggle (habit form)
- AllDone celebration

## Файлы

Все изменения задокументированы. Ключевые файлы:
- `tailwind.config.js` — новая дизайн-система
- `src/index.css` — HFColors CSS-переменные
- `src/shared/lib/theme/` — ThemeProvider, контекст, типы
- `src/shared/ui/*` — все 15 компонентов обновлены
- `src/entities/habit/ui/*` — все 7 карточек обновлены
- `src/pages/today/ui.tsx` — переписан
- `src/pages/habits/ui.tsx` — переписан
- `src/pages/settings-appearance/ui.tsx` — переписан
- `src/entities/habit/api/hooks.ts` — исправлена инвалидация
- `src/pages/onboarding/ui.tsx` — исправлен try-catch
- `src/pages/habit-detail/ui.tsx` — исправлен useDeleteMutation
