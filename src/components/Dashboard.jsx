  import { useEffect, useMemo, useState, useRef } from 'react'
  import ScheduleManager from './ScheduleManager'
  import { supabase } from '../lib/supabaseClient'

const btnStyle = { padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }
const btnSecondaryStyle = { ...btnStyle, backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' }
const cardStyle = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }
const statBoxStyle = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
const statValueStyle = { fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }
const statLabelStyle = { fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', fontWeight: 600 }

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

    const headerRight = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: syncing ? '#3b82f6' : loading ? '#eab308' : '#22c55e' }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
            {syncing ? 'Saving changes...' : loading ? 'Loading...' : 'All changes saved'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
          <button style={btnStyle} onClick={saveNow}>Save</button>
          <button style={btnSecondaryStyle} onClick={reloadFromServer}>Reload</button>
          <button style={btnSecondaryStyle} onClick={signOut}>Sign Out</button>
        </div>
      </div>
    )

    return (
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <header>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Welcome back, {session.user.email}</h2>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5, opacity: 0.8 }}>{insight}</p>
          {headerRight}
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#0f172a' }}>Progress Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '12px' }}>
              <div style={statBoxStyle}>
                <span style={statValueStyle}>{schedule.length}</span>
                <span style={statLabelStyle}>Days</span>
              </div>
              <div style={statBoxStyle}>
                <span style={statValueStyle}>{schedule.reduce((acc, day) => acc + day.exercises.length, 0)}</span>
                <span style={statLabelStyle}>Exercises</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', paddingLeft: '4px' }}>Your Schedule</h3>
            <ScheduleManager schedule={schedule} setSchedule={setSchedule} />
          </div>
        </div>
      </section>
    )
  }
    
  
