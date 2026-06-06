import React from 'react'
import Header from './components/Header'

export default function App(){
  return (
    <div className="app-root">
      <Header />
      <main style={{padding:20}}>
        <h1>Welcome to SetFlow</h1>
        <p>Track workouts, log sets with weights & reps, and follow progress over time.</p>
      </main>
    </div>
  )
}
