import { useEffect, useMemo, useState } from 'react'
import ScheduleManager from './ScheduleManager'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard({ session }) {
  const userId = session.user.id
  const storageKey = useMemo(() => `setflow:schedule:${userId}`, [userId])
  const [schedule, setSchedule] = useState([])
  const [insight, setInsight] = useState('Keep your schedule up to date to review your progress.')

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      setSchedule(JSON.parse(saved))
    } else {
      setSchedule([{ id: Date.now(), name: 'Upper body', exercises: [] }])
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(schedule))
    const totalSets = schedule.reduce((acc, day) => acc + day.exercises.reduce((s, exercise) => s + exercise.sets.length, 0), 0)
    const totalExercises = schedule.reduce((acc, day) => acc + day.exercises.length, 0)
    setInsight(`You have ${schedule.length} training day(s), ${totalExercises} exercise(s), and ${totalSets} set(s) logged.`)
  }, [schedule, storageKey])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {session.user.email}</h2>
          <p>{insight}</p>
        </div>
        <button className="secondary" onClick={signOut}>Sign out</button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-panel">
          <h3>Workout schedule</h3>
          <p>Create days, add exercises, and log reps & weights per set.</p>
          <ScheduleManager schedule={schedule} setSchedule={setSchedule} />
        </div>
        <div className="dashboard-panel stats-panel">
          <h3>Progress overview</h3>
          <p>Use the schedule manager to track your weekly split and set details. Your data persists locally for this account.</p>
          <ul>
            <li><strong>{schedule.length}</strong> planned training day(s)</li>
            <li><strong>{schedule.reduce((acc, day) => acc + day.exercises.length, 0)}</strong> exercises</li>
            <li><strong>{schedule.reduce((acc, day) => acc + day.exercises.reduce((s, exercise) => s + exercise.sets.length, 0), 0)}</strong> total sets</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
