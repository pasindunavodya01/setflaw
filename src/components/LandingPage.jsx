import React from 'react'

export default function LandingPage({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '24px', textAlign: 'center', padding: '24px' }}>
      <div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px 0' }}>Welcome to SetFlow</h2>
        <p style={{ fontSize: '1.125rem', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
          Your personal progressive overload tracker. Log your workouts, track your progress, and crush your goals.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => onNavigate('login')}
          style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}
        >
          Login
        </button>
        <button 
          onClick={() => onNavigate('register')}
          style={{ padding: '12px 24px', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}
        >
          Register
        </button>
      </div>
    </div>
  )
}