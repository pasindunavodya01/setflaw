import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import AuthForm from './components/AuthForm'
import LandingPage from './components/LandingPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState(null) // 'login', 'register', or null for landing page

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setAuthMode(null) // Reset auth mode successfully upon login
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="app-container">
      <Header session={session} />
      <main style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        {session ? (
          <Dashboard session={session} />
        ) : authMode ? (
          <AuthForm initialMode={authMode} onBack={() => setAuthMode(null)} />
        ) : (
          <LandingPage onNavigate={setAuthMode} />
        )}
      </main>
    </div>
  )
}