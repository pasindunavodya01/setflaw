import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Header from './components/Header'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <div className="app-root">
      <Header session={session} />
      <main className="app-main">
        {session ? <Dashboard session={session} /> : <AuthForm />}
      </main>
    </div>
  )
}
