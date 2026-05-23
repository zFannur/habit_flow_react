import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { backButton } from '@telegram-apps/sdk-react'
import { router } from '@/app/providers/router'
import { ToastContainer } from '@/shared/ui/toast'
import { ThemeProvider } from '@/shared/lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

function App() {
  useEffect(() => {
    if (backButton.onClick.isAvailable()) {
      backButton.onClick(() => {
        window.history.back();
      });
    }
    if (backButton.show.isAvailable()) {
      backButton.show();
    }
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ToastContainer />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
