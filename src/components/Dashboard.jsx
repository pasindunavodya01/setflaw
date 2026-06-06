  import { useEffect, useMemo, useState, useRef } from 'react'
  import ScheduleManager from './ScheduleManager'
  import { supabase } from '../lib/supabaseClient'

const btnStyle = { padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }
const btnSecondaryStyle = { ...btnStyle, backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1' }
const statBoxStyle = { flex: 1, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'baseline', gap: '8px' }
const statValueStyle = { fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }
const statLabelStyle = { fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }

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
          .maybeSingle()

        if (!mounted) return

        if (error) {
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
        const { error } = await supabase
  .from('schedules')
  .upsert(payload)
  .select()
  .maybeSingle()
        setSyncing(false)
        if (error) {
          console.error('Failed to save schedule:', error.message)
          setInsight('Failed to save. Working offline.')
        } else {
          const totalExercises = schedule.reduce((acc, day) => acc + day.exercises.length, 0)
          setInsight(`You have ${schedule.length} training day(s) and ${totalExercises} exercise(s) logged.`)
        }
      }, 800)
      return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
    }, [schedule, loading, scheduleRowId, userId])

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
        const { data, error } = await supabase.from('schedules').select('*').eq('user_id', userId).limit(1).maybeSingle()
        if (error) throw error
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

    useEffect(() => {
      const listener = () => reloadFromServer()
      window.addEventListener('trigger-reload', listener)
      return () => window.removeEventListener('trigger-reload', listener)
    })

    const headerRight = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: syncing ? '#3b82f6' : loading ? '#eab308' : '#22c55e' }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
            {syncing ? 'Saving changes...' : loading ? 'Loading...' : 'All changes saved'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button style={btnStyle} onClick={saveNow}>Save</button>
        </div>
      </div>
    )

    return (
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', boxSizing: 'border-box' }}>
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

        <ScheduleManager schedule={schedule} setSchedule={setSchedule} />
      </section>
    )
  }
    
  
