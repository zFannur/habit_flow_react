import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapTelegram } from '@/shared/api/telegram'
import { Env } from '@/shared/config'

// Validate environment variables on startup
Env.assertValid();

bootstrapTelegram(import.meta.env.DEV).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
