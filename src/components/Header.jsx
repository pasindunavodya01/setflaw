import React from 'react'

export default function Header({ session }) {
  return (
    <header>
      <div className="header-inner">
        <div>
          <h1>SetFlow</h1>
          <p>Progressive overload tracker</p>
        </div>
        {session && <div className="header-badge">Signed in as {session.user.email}</div>}
      </div>
    </header>
  )
}
