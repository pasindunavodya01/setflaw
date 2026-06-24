import { useEffect, useState, useRef } from 'react'
import ScheduleManager from './ScheduleManager'
import BodyWeightTracker from './BodyWeightTracker'
import { supabase } from '../lib/supabaseClient'

const btnStyle = { padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }
const btnSecondaryStyle = { ...btnStyle, backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1' }
const statBoxStyle = { flex: 1, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'baseline', gap: '8px' }
const statValueStyle = { fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }
const statLabelStyle = { fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }

export default function Dashboard({ session, isOnline }) {
  const userId = session.user.id
  const [schedule, setSchedule] = useState([])
  const [scheduleRowId, setScheduleRowId] = useState(null)
  const [insight, setInsight] = useState('Loading your schedule...')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const saveTimer = useRef(null)
  const suppressNextAutoSave = useRef(true)
  const allowEmptyNextSave = useRef(false)

  const loadSchedule = async () => {
    if (!navigator.onLine) {
      setInsight('You are offline. Connect to the internet to load your schedule.')
      setLoading(false)
      return
    }

    setLoading(true)
    suppressNextAutoSave.current = true

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error loading schedules:', error.message)
      setInsight('Could not load schedule from the database.')
      setLoading(false)
      return
    }

    if (data) {
      const serverSchedule = Array.isArray(data.data) ? data.data : []
      setSchedule(serverSchedule.length > 0 ? serverSchedule : [{ id: Date.now(), name: 'Upper body', exercises: [] }])
      setScheduleRowId(data.id)
      setInsight('Loaded from database')
    } else {
      const defaultSchedule = [{ id: Date.now(), name: 'Upper body', exercises: [] }]
      const insert = await supabase
        .from('schedules')
        .insert({ user_id: userId, name: 'Default', data: defaultSchedule })
        .select()
        .single()

      if (insert.error) {
        console.error('Error creating default schedule:', insert.error.message)
        setInsight('Could not create schedule in the database.')
      } else {
        setSchedule(insert.data.data || defaultSchedule)
        setScheduleRowId(insert.data.id)
        setInsight('Created a new schedule')
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    let mounted = true
    loadSchedule().then(() => {
      if (!mounted) return
    })
    return () => { mounted = false }
  }, [userId])

  useEffect(() => {
    const listener = () => {
      if (!navigator.onLine) {
        window.alert('You are offline. Connect to the internet to reload.')
        return
      }
      loadSchedule()
    }
    window.addEventListener('trigger-reload', listener)
    return () => window.removeEventListener('trigger-reload', listener)
  }, [userId])

  useEffect(() => {
    if (loading || !scheduleRowId || !isOnline) return
    if (suppressNextAutoSave.current) {
      suppressNextAutoSave.current = false
      return
    }
    if (schedule.length === 0 && !allowEmptyNextSave.current) {
      setSyncing(false)
      setInsight('Schedule is empty — not auto-saving. Use Reset/Clear to confirm.')
      return
    }

    setInsight('Saving...')
    setSyncing(true)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!navigator.onLine) {
        setSyncing(false)
        setInsight('You are offline. Changes were not saved.')
        window.alert('You are offline. Connect to the internet to save changes.')
        return
      }

      const payload = { id: scheduleRowId, user_id: userId, name: 'Default', data: schedule }
      const { error } = await supabase.from('schedules').upsert(payload).select().maybeSingle()
      setSyncing(false)

      if (error) {
        console.error('Failed to save schedule:', error.message)
        setInsight('Failed to save to the database.')
      } else {
        const totalExercises = schedule.reduce((acc, day) => acc + day.exercises.length, 0)
        setInsight(`You have ${schedule.length} training day(s) and ${totalExercises} exercise(s) logged.`)
      }
      allowEmptyNextSave.current = false
    }, 800)

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [schedule, loading, scheduleRowId, userId, isOnline])

  const saveNow = async () => {
    if (!navigator.onLine) {
      window.alert('You are offline. Connect to the internet to save changes.')
      setInsight('You are offline. Changes were not saved.')
      return
    }

    setSyncing(true)
    setInsight('Saving...')
    try {
      if (schedule.length === 0 && !allowEmptyNextSave.current) {
        setInsight('Schedule is empty — not saving. Use Reset/Clear to confirm.')
        return
      }
      if (scheduleRowId) {
        const payload = { id: scheduleRowId, user_id: userId, name: 'Default', data: schedule }
        const { error } = await supabase.from('schedules').upsert(payload).select().single()
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('schedules')
          .insert({ user_id: userId, name: 'Default', data: schedule })
          .select()
          .single()
        if (error) throw error
        setScheduleRowId(data.id)
      }
      setInsight('Saved to database')
    } catch (e) {
      console.error('Save failed:', e.message || e)
      setInsight('Save failed')
    } finally {
      setSyncing(false)
      allowEmptyNextSave.current = false
    }
  }

  const resetSchedule = async () => {
    if (!navigator.onLine) {
      window.alert('You are offline. Connect to the internet to reset your schedule.')
      return
    }
    if (!window.confirm('Reset will permanently clear ALL days and exercises in your account. Continue?')) return
    const typed = window.prompt('Type CLEAR to confirm resetting your schedule.')
    if (typed !== 'CLEAR') {
      setInsight('Reset cancelled')
      return
    }
    if (!window.confirm('Final confirmation: this will delete everything. Proceed with reset?')) {
      setInsight('Reset cancelled')
      return
    }
    allowEmptyNextSave.current = true
    setSchedule([])
    await saveNow()
  }

  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: !isOnline ? '#ef4444' : syncing ? '#3b82f6' : loading ? '#eab308' : '#22c55e' }}></div>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
          {!isOnline ? 'Offline' : syncing ? 'Saving changes...' : loading ? 'Loading...' : 'All changes saved'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        <button style={{ ...btnStyle, opacity: isOnline ? 1 : 0.5 }} onClick={saveNow} disabled={!isOnline}>Save</button>
      </div>
    </div>
  )

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      {!isOnline && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>
          You are offline. Connect to the internet to view and edit your data.
        </div>
      )}

      <header style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Ready to crush your goals today? 💪</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{insight}</p>
          </div>
          {headerRight}
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={statBoxStyle}>
            <span style={statValueStyle}>{schedule.length}</span>
            <span style={statLabelStyle}>Training Days</span>
          </div>
          <div style={statBoxStyle}>
            <span style={statValueStyle}>{schedule.reduce((acc, day) => acc + day.exercises.length, 0)}</span>
            <span style={statLabelStyle}>Total Exercises</span>
          </div>
        </div>
      </header>

      <div style={{ pointerEvents: isOnline ? 'auto' : 'none', opacity: isOnline ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <BodyWeightTracker userId={userId} isOnline={isOnline} />

        <ScheduleManager
          schedule={schedule}
          setSchedule={setSchedule}
          isOnline={isOnline}
          onExplicitClear={() => { allowEmptyNextSave.current = true }}
        />

        <details style={{ backgroundColor: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '12px 16px' }}>
          <summary style={{ cursor: 'pointer', color: '#b91c1c', fontWeight: 700 }}>Danger zone</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.875rem' }}>
              Reset will delete your entire schedule (days and exercises). This is intended only for starting over.
            </p>
            <button style={{ ...btnSecondaryStyle, borderColor: '#fecaca', color: '#b91c1c' }} onClick={resetSchedule}>
              Reset schedule…
            </button>
          </div>
        </details>
      </div>
    </section>
  )
}
