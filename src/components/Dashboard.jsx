import { useEffect, useMemo, useState, useRef } from 'react'
import ScheduleManager from './ScheduleManager'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard({ session }) {
  const userId = session.user.id
  const [schedule, setSchedule] = useState([])
  const [scheduleRowId, setScheduleRowId] = useState(null)
  const [insight, setInsight] = useState('Loading your schedule...')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const saveTimer = useRef(null)

  // load schedule (stored as JSON in `schedules.data`)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (!mounted) return

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows
        console.error('Error loading schedules:', error.message)
        setSchedule([{ id: Date.now(), name: 'Upper body', exercises: [] }])
        setLoading(false)
        return
      }

      if (data) {
        try {
          setSchedule(data.data || [])
          setScheduleRowId(data.id)
        } catch (e) {
          setSchedule([])
        }
      } else {
        // create default schedule row
        const defaultSchedule = [{ id: Date.now(), name: 'Upper body', exercises: [] }]
        const insert = await supabase.from('schedules').insert({ user_id: userId, name: 'Default', data: defaultSchedule }).select().single()
        if (insert.error) console.error('Error creating default schedule:', insert.error.message)
        else {
          setSchedule(insert.data.data || [])
          setScheduleRowId(insert.data.id)
        }
      }

      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [userId])

  // auto-save (debounced) schedule changes into Supabase
  useEffect(() => {
    if (loading || !scheduleRowId) return
    setInsight('Saving...')
    setSyncing(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const payload = { id: scheduleRowId, user_id: userId, name: 'Default', data: schedule }
      const { error } = await supabase.from('schedules').upsert(payload).select().single()
      setSyncing(false)
      if (error) {
        console.error('Failed to save schedule:', error.message)
        setInsight('Failed to save. Working offline.')
      } else {
        const totalSets = schedule.reduce((acc, day) => acc + day.exercises.reduce((s, exercise) => s + exercise.sets.length, 0), 0)
        const totalExercises = schedule.reduce((acc, day) => acc + day.exercises.length, 0)
        setInsight(`You have ${schedule.length} training day(s), ${totalExercises} exercise(s), and ${totalSets} set(s) logged.`)
      }
    }, 800)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [schedule, loading, scheduleRowId, userId])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const saveNow = async () => {
    setSyncing(true)
    setInsight('Saving...')
    try {
      if (scheduleRowId) {
        const payload = { id: scheduleRowId, user_id: userId, name: 'Default', data: schedule }
        const { error } = await supabase.from('schedules').upsert(payload).select().single()
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('schedules').insert({ user_id: userId, name: 'Default', data: schedule }).select().single()
        if (error) throw error
        setScheduleRowId(data.id)
      }
      setInsight('Saved')
    } catch (e) {
      console.error('Save failed:', e.message || e)
      setInsight('Save failed')
    } finally {
      setSyncing(false)
    }
  }

  const reloadFromServer = async () => {
    setLoading(true)
    setInsight('Reloading...')
    try {
      const { data, error } = await supabase.from('schedules').select('*').eq('user_id', userId).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setSchedule(data.data || [])
        setScheduleRowId(data.id)
        setInsight('Loaded from server')
      } else {
        setInsight('No server schedule found')
      }
    } catch (e) {
      console.error('Reload failed:', e.message || e)
      setInsight('Reload failed')
    } finally {
      setLoading(false)
    }
  }

  const headerRight = (
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      {syncing ? <small style={{color:'#2563eb'}}>Syncing…</small> : <small style={{color:'#64748b'}}>{loading ? 'Loading' : 'Saved'}</small>}
      <button onClick={saveNow}>Save</button>
      <button onClick={reloadFromServer} className="secondary">Reload</button>
      <button className="secondary" onClick={signOut}>Sign out</button>
    </div>
  )

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {session.user.email}</h2>
          <p>{insight}</p>
        </div>
        {headerRight}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-panel">
          <h3>Workout schedule</h3>
          <p>Create days, add exercises, and log reps & weights per set. Changes save automatically to your Supabase project.</p>
          <ScheduleManager schedule={schedule} setSchedule={setSchedule} />
        </div>
        <div className="dashboard-panel stats-panel">
          <h3>Progress overview</h3>
          <p>Use the schedule manager to track your weekly split and set details. Your data is stored in Supabase.</p>
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
