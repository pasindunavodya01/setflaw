import React from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Header({ session }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleReload = () => {
    window.dispatchEvent(new CustomEvent('trigger-reload'))
  }

  return (
    <header>
      <div className="header-inner" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/icon-512.png" alt="SetFlow Logo" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
          <div>
            <h1>SetFlow</h1>
            <p>Progressive overload tracker</p>
          </div>
        </div>
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="header-badge">Signed in as {session.user.email}</div>
            <button 
              onClick={handleReload} 
              title="Reload from server" 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
            </button>
            <button 
              onClick={handleSignOut} 
              title="Sign out" 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '4px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
