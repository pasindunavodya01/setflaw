import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const initialState = { email: '', password: '', confirmPassword: '' }

export default function AuthForm({ initialMode = 'login', onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
  }

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setLoading(false)
    setMessage(error ? error.message : 'Logged in successfully.')
  }

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords must match.')
      return
    }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    setLoading(false)
    setMessage(error ? error.message : 'Check your email for the confirmation link.')
  }

  const handleForgotPassword = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    setMessage(error ? error.message : 'Password reset email sent.')
  }

  const submit = (event) => {
    event.preventDefault()
    if (mode === 'login') handleLogin()
    else if (mode === 'register') handleRegister()
    else handleForgotPassword()
  }

  return (
    <section className="auth-card">
      <h2>{mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Reset password'}</h2>
      <form onSubmit={submit}>
        <label>
          Email
          <input type="email" value={form.email} onChange={updateField('email')} required />
        </label>

        {mode !== 'forgot' && (
          <label>
            Password
            <input type="password" value={form.password} onChange={updateField('password')} required />
          </label>
        )}

        {mode === 'register' && (
          <label>
            Confirm password
            <input type="password" value={form.confirmPassword} onChange={updateField('confirmPassword')} required />
          </label>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Working...' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset email'}
        </button>
      </form>

      {message && <div className="auth-message">{message}</div>}

      <div className="auth-switch">
        {onBack && <button type="button" onClick={onBack}>Back to home</button>}
        {mode !== 'login' && <button onClick={() => { setMode('login'); setMessage(''); setForm(initialState) }}>Back to login</button>}
        {mode === 'login' && (
          <>
            <button onClick={() => { setMode('register'); setMessage(''); setForm(initialState) }}>Register</button>
            <button onClick={() => { setMode('forgot'); setMessage(''); setForm({ ...form, password: '', confirmPassword: '' }) }}>Forgot password?</button>
          </>
        )}
        {mode === 'register' && <button onClick={() => { setMode('login'); setMessage(''); setForm(initialState) }}>Already have an account?</button>}
        {mode === 'forgot' && <button onClick={() => { setMode('login'); setMessage(''); setForm(initialState) }}>Back to login</button>}
      </div>
    </section>
  )
}
