/**
 * Разбор deep link из bot-уведомлений.
 *
 * Бот открывает Mini App ссылками вида `{url}?screen=habit&id=...`,
 * `?screen=journal`, `?screen=summary&id=...`, `?screen=analytics&review=1`
 * (см. `bot/src/services/notifications.py`). При hash-роутинге эти query-
 * параметры лежат в `window.location.search` (до `#`), а не в маршруте
 * react-router — поэтому читаем их отсюда напрямую.
 *
 * Снимок делается один раз при загрузке модуля: hash-навигация меняет только
 * фрагмент, search-часть сохраняется, но фиксируем её, чтобы быть устойчивыми
 * к смене URL-стратегии.
 */
const launchSearch = window.location.search;

/**
 * Целевой маршрут из deep link запуска, либо `null`, если deep link отсутствует
 * или `screen` не распознан. Маппинг повторяет контракт бота 1:1.
 */
export function getInitialDeepLinkRoute(): string | null {
  const params = new URLSearchParams(launchSearch);
  const screen = params.get('screen');
  if (!screen) return null;

  const id = params.get('id');
  switch (screen) {
    case 'habit':
      return id ? `/habits/${id}` : null;
    case 'journal':
      return '/journal';
    case 'summary':
      return id ? `/summary/${id}` : null;
    case 'analytics':
      return params.get('review') === '1' ? '/analytics?review=1' : '/analytics';
    default:
      return null;
  }
}
