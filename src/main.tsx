import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapTelegram } from '@/shared/api/telegram'
import { Env } from '@/shared/config'

// Validate environment variables on startup
Env.assertValid();

const BOOTSTRAP_TIMEOUT_MS = 5000;
Promise.race([
  bootstrapTelegram(import.meta.env.DEV),
  new Promise<void>((resolve) => setTimeout(resolve, BOOTSTRAP_TIMEOUT_MS)),
]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
