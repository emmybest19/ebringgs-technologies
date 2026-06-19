import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '@ebringgs/styles'
import App from './App.tsx'

// Only wrap with GoogleOAuthProvider when a Client ID is configured.
// Passing an empty string to the provider can break Google's underlying
// script and silently blank-screen the whole app. With no Client ID set,
// the Google button in <SocialAuthButtons /> shows its "not configured"
// fallback instead.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const withAuthProviders = (node: ReactNode): ReactNode =>
  GOOGLE_CLIENT_ID
    ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{node}</GoogleOAuthProvider>
    : node

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {withAuthProviders(<App />)}
  </StrictMode>,
)
