import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { backButton } from '@telegram-apps/sdk-react'
import { router } from '@/app/providers/router'
import { ToastContainer } from '@/shared/ui/toast'
import { OfflineBanner } from '@/shared/ui/offline-banner'
import { ThemeProvider } from '@/shared/lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

// Корневые маршруты (вкладки + splash/onboarding): нативная кнопка «Назад»
// Telegram на них скрыта. На остальных (push-экраны: детали, формы, под-экраны
// профиля) — показывается и ведёт назад по роутеру.
const ROOT_ROUTES = new Set<string>([
  '/',
  '/splash',
  '/onboarding',
  '/today',
  '/habits',
  '/analytics',
  '/ai',
  '/journal',
  '/profile',
])

function App() {
  useEffect(() => {
    const offClick = backButton.onClick.isAvailable()
      ? backButton.onClick(() => {
          void router.navigate(-1)
        })
      : undefined

    const sync = (pathname: string) => {
      if (ROOT_ROUTES.has(pathname)) {
        backButton.hide.ifAvailable()
      } else {
        backButton.show.ifAvailable()
      }
    }

    sync(router.state.location.pathname)
    const unsubscribe = router.subscribe((state) => sync(state.location.pathname))

    return () => {
      unsubscribe()
      offClick?.()
      backButton.hide.ifAvailable()
    }
  }, [])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <RouterProvider router={router} />
        <ToastContainer />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
