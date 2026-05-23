/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          text: "var(--tg-theme-text-color, #000000)",
          hint: "var(--tg-theme-hint-color, #707579)",
          link: "var(--tg-theme-link-color, #2481cc)",
          button: "var(--tg-theme-button-color, #2481cc)",
          "button-text": "var(--tg-theme-button-text-color, #ffffff)",
          "secondary-bg": "var(--tg-theme-secondary-bg-color, #f4f4f5)",
          header: "var(--tg-theme-header-bg-color, #ffffff)",
          accent: "var(--tg-theme-accent-text-color, #2481cc)",
          section: "var(--tg-theme-section-bg-color, #ffffff)",
          "section-header": "var(--tg-theme-section-header-text-color, #707579)",
          subtitle: "var(--tg-theme-subtitle-text-color, #707579)",
          destructive: "var(--tg-theme-destructive-text-color, #e53935)",
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          anti: "#10B981",
          premium: "#A855F7",
        }
      },
      spacing: {
        "tg-safe-bottom": "var(--tg-viewport-safe-area-inset-bottom, 0px)",
        "tg-safe-top": "var(--tg-viewport-safe-area-inset-top, 0px)",
      }
    },
  },
  plugins: [],
}
