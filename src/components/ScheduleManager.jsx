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

  const addDay = () => {
    const name = newDayName.trim() || 'New workout day'
    setSchedule([...schedule, { ...createDay(), name }])
    setNewDayName('')
  }

  const updateDayName = (dayId, name) => {
    setSchedule(schedule.map(day => day.id === dayId ? { ...day, name } : day))
  }

  const deleteDay = (dayId) => {
    setSchedule(schedule.filter(day => day.id !== dayId))
  }

  const addExercise = (dayId) => {
    setSchedule(schedule.map(day => day.id === dayId ? { ...day, exercises: [...day.exercises, createExercise()] } : day))
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
    setSchedule(schedule.map(day => day.id === dayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) } : day))
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
    setSchedule(schedule.map(day => {
      if (day.id !== dayId) return day
      return {
        ...day,
        exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) } : ex),
      }
    }))
  }

  return (
    <div className="schedule-manager">
      <div className="schedule-add-row">
        <input
          type="text"
          placeholder="New workout day name"
          value={newDayName}
          onChange={(event) => setNewDayName(event.target.value)}
        />
        <button onClick={addDay}>Add day</button>
      </div>

      {schedule.map((day) => (
        <div className="schedule-day" key={day.id}>
          <div className="schedule-day-header">
            <input
              value={day.name}
              onChange={(event) => updateDayName(day.id, event.target.value)}
            />
            <div>
              <button className="secondary" onClick={() => addExercise(day.id)}>Add exercise</button>
              <button className="danger" onClick={() => deleteDay(day.id)}>Delete day</button>
            </div>
          </div>

          {day.exercises.map((exercise) => (
            <div className="exercise-card" key={exercise.id}>
              <div className="exercise-header">
                <input
                  value={exercise.name}
                  onChange={(event) => updateExercise(day.id, exercise.id, { name: event.target.value })}
                />
                <button className="danger" onClick={() => deleteExercise(day.id, exercise.id)}>Remove exercise</button>
              </div>

              <div className="sets-grid">
                {exercise.sets.map((set) => (
                  <div className="set-row" key={set.id}>
                    <input
                      className="small-input"
                      type="text"
                      placeholder="Weight"
                      value={set.weight}
                      onChange={(event) => updateSet(day.id, exercise.id, set.id, { weight: event.target.value })}
                    />
                    <input
                      className="small-input"
                      type="text"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(event) => updateSet(day.id, exercise.id, set.id, { reps: event.target.value })}
                    />
                    <button className="danger" onClick={() => deleteSet(day.id, exercise.id, set.id)}>Delete</button>
                  </div>
                ))}
              </div>

              <button className="secondary" onClick={() => addSet(day.id, exercise.id)}>Add set</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
