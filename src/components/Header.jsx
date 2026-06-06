import React from 'react'

export default function Header(){
  return (
    <header>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <h2 style={{margin:0}}>SetFlow</h2>
        <small style={{opacity:0.8}}>Progressive overload tracker</small>
      </div>
    </header>
  )
}
