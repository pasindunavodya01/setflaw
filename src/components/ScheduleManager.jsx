import { useState } from 'react'

function createDay() {
  return { id: Date.now(), name: 'New workout day', exercises: [] }
}

function createExercise() {
  return { id: Date.now() + Math.random(), name: 'New exercise', sets: [{ id: Date.now(), weight: '', reps: '' }] }
}

function createSet() {
  return { id: Date.now() + Math.random(), weight: '', reps: '' }
}

export default function ScheduleManager({ schedule, setSchedule }) {
  const [newDayName, setNewDayName] = useState('')
  const [importTexts, setImportTexts] = useState({})
  const [expandedDayId, setExpandedDayId] = useState(null)

  const addDay = () => {
    const name = newDayName.trim() || 'New workout day'
    setSchedule([...schedule, { ...createDay(), name }])
    setNewDayName('')
  }

  const updateDayName = (dayId, name) => {
    setSchedule(schedule.map(day => day.id === dayId ? { ...day, name } : day))
  }

  const deleteDay = (dayId) => {
    if (window.confirm('Are you sure you want to delete this workout day?')) {
      setSchedule(schedule.filter(day => day.id !== dayId))
      setExpandedDayId(null)
    }
  }

  const addExercise = (dayId) => {
    setSchedule(schedule.map(day => day.id === dayId ? { ...day, exercises: [...day.exercises, createExercise()] } : day))
  }

  const importExercises = (dayId) => {
    const text = (importTexts[dayId] || '').trim()
    if (!text) return
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    const newExercises = lines.map(name => ({ ...createExercise(), name }))
    setSchedule(schedule.map(day => day.id === dayId ? { ...day, exercises: [...day.exercises, ...newExercises] } : day))
    setImportTexts(prev => ({ ...prev, [dayId]: '' }))
  }

  const updateExercise = (dayId, exerciseId, updates) => {
    setSchedule(schedule.map(day => {
      if (day.id !== dayId) return day
      return {
        ...day,
        exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex),
      }
    }))
  }

  const deleteExercise = (dayId, exerciseId) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      setSchedule(schedule.map(day => day.id === dayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) } : day))
    }
  }

  const addSet = (dayId, exerciseId) => {
    setSchedule(schedule.map(day => {
      if (day.id !== dayId) return day
      return {
        ...day,
        exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: [...ex.sets, createSet()] } : ex),
      }
    }))
  }

  const updateSet = (dayId, exerciseId, setId, updates) => {
    setSchedule(schedule.map(day => {
      if (day.id !== dayId) return day
      return {
        ...day,
        exercises: day.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex
          return {
            ...ex,
            sets: ex.sets.map(set => set.id === setId ? { ...set, ...updates } : set),
          }
        }),
      }
    }))
  }

  const deleteSet = (dayId, exerciseId, setId) => {
    if (window.confirm('Are you sure you want to delete this set?')) {
      setSchedule(schedule.map(day => {
        if (day.id !== dayId) return day
        return {
          ...day,
          exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) } : ex),
        }
      }))
    }
  }

  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#fff', color: '#111827' }
  const btnStyle = { padding: '12px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }
  const btnSecondaryStyle = { ...btnStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }
  const btnDangerStyle = { ...btnSecondaryStyle, color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {schedule.map((day) => {
        const isExpanded = expandedDayId === day.id;
        return (
        <div key={day.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                style={{ ...inputStyle, fontSize: '1.25rem', fontWeight: 700, border: 'none', borderBottom: isExpanded ? '2px solid #e5e7eb' : 'none', borderRadius: 0, padding: '8px 4px', backgroundColor: 'transparent', flex: 1, minWidth: 0 }}
                value={day.name}
                onChange={(event) => updateDayName(day.id, event.target.value)}
                placeholder="Day name"
              />
              <button 
                style={{ ...btnSecondaryStyle, padding: '8px 16px', flexShrink: 0 }}
                onClick={() => setExpandedDayId(isExpanded ? null : day.id)}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
          
            {isExpanded && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={{...btnSecondaryStyle, flex: 1}} onClick={() => addExercise(day.id)}>+ Exercise</button>
                <button style={{...btnDangerStyle, flex: 1}} onClick={() => deleteDay(day.id)}>Delete Day</button>
              </div>
            )}
          </div>

          {isExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <details style={{ fontSize: '0.875rem', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <summary style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>Bulk import exercises (paste list)</summary>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexDirection: 'column' }}>
                  <textarea
                    placeholder="Squat&#10;Bench press&#10;Barbell row"
                    value={importTexts[day.id] || ''}
                    onChange={(e) => setImportTexts(prev => ({ ...prev, [day.id]: e.target.value }))}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{...btnStyle, flex: 1}} onClick={() => importExercises(day.id)}>Import</button>
                    <button style={{...btnSecondaryStyle, flex: 1}} onClick={() => setImportTexts(prev => ({ ...prev, [day.id]: '' }))}>Clear</button>
                  </div>
                </div>
              </details>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {day.exercises.map((exercise) => (
                  <div key={exercise.id} style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        style={{ ...inputStyle, flex: 1, fontWeight: 600, padding: '10px 12px', minWidth: 0 }}
                        value={exercise.name}
                        onChange={(event) => updateExercise(day.id, exercise.id, { name: event.target.value })}
                        placeholder="Exercise name"
                      />
                      <button style={{...btnDangerStyle, padding: '10px 14px', flexShrink: 0}} onClick={() => deleteExercise(day.id, exercise.id)} title="Remove Exercise">✕</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {exercise.sets.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px', gap: '8px', padding: '0 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <span>Weight</span>
                          <span>Reps</span>
                          <span style={{ textAlign: 'center' }}>Del</span>
                        </div>
                      )}
                      {exercise.sets.map((set) => (
                        <div key={set.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px', gap: '8px', alignItems: 'center' }}>
                          <input
                            style={{ ...inputStyle, textAlign: 'center', padding: '10px', minWidth: 0 }}
                            type="text"
                            inputMode="text"
                            placeholder="lbs/kg"
                            value={set.weight}
                            onChange={(event) => updateSet(day.id, exercise.id, set.id, { weight: event.target.value })}
                          />
                          <input
                            style={{ ...inputStyle, textAlign: 'center', padding: '10px', minWidth: 0 }}
                            type="text"
                            inputMode="text"
                            placeholder="reps"
                            value={set.reps}
                            onChange={(event) => updateSet(day.id, exercise.id, set.id, { reps: event.target.value })}
                          />
                          <button style={{...btnDangerStyle, padding: '10px 0', width: '100%'}} onClick={() => deleteSet(day.id, exercise.id, set.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                    
                    <button style={{...btnSecondaryStyle, width: '100%', padding: '10px'}} onClick={() => addSet(day.id, exercise.id)}>+ Add Set</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      )})}

      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', backgroundColor: '#fff', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '20px' }}>
        <input
          style={{ ...inputStyle, textAlign: 'center' }}
          type="text"
          placeholder="New workout day name"
          value={newDayName}
          onChange={(event) => setNewDayName(event.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDay()}
        />
        <button style={{...btnStyle, padding: '14px'}} onClick={addDay}>+ Add Workout Day</button>
      </div>
    </div>
  )
}
