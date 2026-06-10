import {
  init as initSDK,
  miniApp,
  themeParams,
  viewport,
  backButton,
  swipeBehavior,
  setDebug,
} from '@telegram-apps/sdk-react';

export async function bootstrapTelegram(debug = false): Promise<void> {
  // 1. Enable debug logging in development
  setDebug(debug);

  try {
    // 2. init() MUST be called before any component.mount()
    initSDK();

    // 3. Mount miniApp FIRST (synchronous — preferred over async mount())
    if (miniApp.mountSync.isAvailable()) {
      miniApp.mountSync();
    } else if (miniApp.mount.isAvailable()) {
      await miniApp.mount();
    }

    // 3b. Inform Telegram the app is ready — hides loading placeholder immediately
    if (miniApp.ready.isAvailable()) {
      miniApp.ready();
    }

    // 4. Mount themeParams AFTER miniApp (NOT in parallel — known race bug)
    if (themeParams.mountSync.isAvailable()) {
      themeParams.mountSync();
    } else if (themeParams.mount.isAvailable()) {
      await themeParams.mount();
    }

    // 5. Bind CSS variables — only viewport safe-area; HFColors theme is used for colors
    miniApp.bindCssVars();

    // 6. Mount viewport (async; safe to fire-and-forget with error handling)
    if (viewport.mount.isAvailable()) {
      await viewport.mount().catch(console.error);
      viewport.bindCssVars(); // --tg-viewport-height, --tg-viewport-safe-area-inset-*, etc.
      viewport.expand();      // expand to maximum available height
    }

    // NB: не запрашиваем fullscreen (Bot API 8.0+) намеренно. В fullscreen
    // Telegram резервирует большую content-safe-area сверху (под свои кнопки
    // управления), из-за чего `pt-tg-safe-top` давал огромный отступ почти на
    // всех экранах. В обычном режиме нативная шапка Telegram уже сверху.

    // 7. Back button
    if (backButton.mount.isAvailable()) {
      backButton.mount();
    }

    // 9. Swipe behavior — REQUIRED to prevent swipe-to-close on scroll
    if (swipeBehavior.mount.isAvailable()) {
      swipeBehavior.mount();
    }
    swipeBehavior.disableVertical.ifAvailable();
  } catch (error) {
    console.error('Failed to bootstrap Telegram SDK:', error);
  }
}
