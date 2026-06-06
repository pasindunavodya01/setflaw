import React from 'react'

export default function WorkoutDayCard({dayName}){
  return (
    <div style={{border:'1px solid #e5e7eb',padding:12,borderRadius:8}}>
      <strong>{dayName}</strong>
      <div style={{marginTop:8}}>No exercises yet.</div>
    </div>
  )
}
