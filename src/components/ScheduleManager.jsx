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
      if (expandedDayId === dayId) setExpandedDayId(null)
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

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', backgroundColor: '#fff', color: '#0f172a' }
  const btnStyle = { padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }
  const btnSecondaryStyle = { ...btnStyle, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }
  const btnDangerStyle = { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '24px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
      {schedule.map((day) => {
        const isExpanded = expandedDayId === day.id;
        return (
        <div key={day.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: isExpanded ? '20px' : '0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none', paddingBottom: isExpanded ? '12px' : '0' }}>
            <input 
              style={{ ...inputStyle, fontSize: '1rem', fontWeight: 700, border: 'none', padding: '4px', backgroundColor: 'transparent', flex: 1, minWidth: 0 }}
              value={day.name}
              onChange={(event) => updateDayName(day.id, event.target.value)}
              placeholder="Day name"
            />
            <button style={{ ...btnSecondaryStyle, padding: '6px 12px', flexShrink: 0 }} onClick={() => setExpandedDayId(isExpanded ? null : day.id)}>
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {isExpanded && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {day.exercises.map((exercise, exerciseIdx) => (
                          <div key={exercise.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                {exerciseIdx + 1}
                              </span>
                              <input
                                style={{ ...inputStyle, flex: 1, fontWeight: 600, backgroundColor: '#f8fafc' }}
                                value={exercise.name}
                                onChange={(event) => updateExercise(day.id, exercise.id, { name: event.target.value })}
                                placeholder="Exercise name"
                              />
                              <button style={{...btnDangerStyle, padding: '4px'}} onClick={() => deleteExercise(day.id, exercise.id)} title="Remove Exercise">✕</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                              {exercise.sets.map((set, idx) => (
                                <div key={set.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '16px', textAlign: 'right' }}>{idx + 1}.</span>
                                  <input
                                    style={{ ...inputStyle, textAlign: 'center', padding: '6px' }}
                                    type="text"
                                    inputMode="text"
                                    placeholder="Weight"
                                    value={set.weight}
                                    onChange={(event) => updateSet(day.id, exercise.id, set.id, { weight: event.target.value })}
                                  />
                                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>×</span>
                                  <input
                                    style={{ ...inputStyle, textAlign: 'center', padding: '6px' }}
                                    type="text"
                                    inputMode="text"
                                    placeholder="Reps"
                                    value={set.reps}
                                    onChange={(event) => updateSet(day.id, exercise.id, set.id, { reps: event.target.value })}
                                  />
                                  <button style={{...btnDangerStyle, padding: '4px'}} onClick={() => deleteSet(day.id, exercise.id, set.id)}>✕</button>
                                </div>
                              ))}
                              <button style={{ ...btnSecondaryStyle, alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.75rem', marginTop: '4px' }} onClick={() => addSet(day.id, exercise.id)}>+ Add Set</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                        <button style={{...btnSecondaryStyle, width: '100%'}} onClick={() => addExercise(day.id)}>+ Add Exercise</button>
                        <details style={{ fontSize: '0.8rem', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <summary style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>Bulk import exercises</summary>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexDirection: 'column' }}>
                            <textarea placeholder="Paste a list..." value={importTexts[day.id] || ''} onChange={(e) => setImportTexts(prev => ({ ...prev, [day.id]: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button style={{...btnStyle, flex: 1, padding: '6px'}} onClick={() => importExercises(day.id)}>Import</button>
                              <button style={{...btnSecondaryStyle, flex: 1, padding: '6px'}} onClick={() => setImportTexts(prev => ({ ...prev, [day.id]: '' }))}>Clear</button>
                            </div>
                          </div>
                        </details>
                        <button style={{...btnDangerStyle, width: '100%', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, marginTop: '8px'}} onClick={() => deleteDay(day.id)}>Delete Workout Day</button>
                      </div>
            </>
          )}
        </div>
      )})}

      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', backgroundColor: 'transparent', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
        <input
          style={{ ...inputStyle, textAlign: 'center' }}
          type="text"
          placeholder="New workout day name"
          value={newDayName}
          onChange={(event) => setNewDayName(event.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDay()}
        />
        <button style={{...btnStyle, padding: '10px 20px', width: '100%'}} onClick={addDay}>+ Add Workout Day</button>
      </div>
    </div>
  )
}
