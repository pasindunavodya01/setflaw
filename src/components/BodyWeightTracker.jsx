import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const btnStyle = {
  padding: '8px 16px',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
}
const btnSecondaryStyle = {
  ...btnStyle,
  backgroundColor: '#fff',
  color: '#334155',
  border: '1px solid #cbd5e1',
}
const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
  color: '#0f172a',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function BodyWeightTracker({ userId, isOnline = true }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [weight, setWeight] = useState('')
  const [recordedAt, setRecordedAt] = useState(todayIso())
  const [note, setNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const loadEntries = async () => {
    if (!navigator.onLine) {
      setLoading(false)
      setMessage('You are offline. Connect to the internet to load weight history.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('body_weights')
      .select('id, weight, recorded_at, note, created_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load body weights:', error.message)
      setMessage('Could not load weight history.')
      setEntries([])
    } else {
      setEntries(data || [])
      setMessage('')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEntries()
  }, [userId])

  const latestEntry = entries[0] ?? null

  const saveWeight = async () => {
    if (!isOnline || !navigator.onLine) {
      window.alert('You are offline. Connect to the internet to log weight.')
      return
    }

    const parsed = Number(weight)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('Enter a valid weight greater than 0.')
      return
    }
    if (!recordedAt) {
      setMessage('Choose a date for this weigh-in.')
      return
    }

    setSaving(true)
    setMessage('Saving weight...')

    const payload = {
      user_id: userId,
      weight: parsed,
      recorded_at: recordedAt,
      note: note.trim() || null,
    }

    const { error } = await supabase.from('body_weights').insert(payload)
    setSaving(false)

    if (error) {
      console.error('Failed to save body weight:', error.message)
      setMessage('Could not save weight. Try again.')
      return
    }

    setWeight('')
    setNote('')
    setRecordedAt(todayIso())
    setMessage('Weight saved.')
    await loadEntries()
  }

  const deleteEntry = async (entry) => {
    if (!isOnline || !navigator.onLine) {
      window.alert('You are offline. Connect to the internet to delete entries.')
      return
    }
    if (!window.confirm(`Delete weight entry from ${formatDate(entry.recorded_at)}?`)) return

    const { error } = await supabase.from('body_weights').delete().eq('id', entry.id).eq('user_id', userId)
    if (error) {
      console.error('Failed to delete body weight:', error.message)
      setMessage('Could not delete entry.')
      return
    }

    setMessage('Entry deleted.')
    await loadEntries()
  }

  return (
    <section
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Body weight</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            {loading
              ? 'Loading...'
              : latestEntry
                ? `Last recorded: ${latestEntry.weight} on ${formatDate(latestEntry.recorded_at)}`
                : 'No weigh-ins yet. Log your first entry below.'}
          </p>
        </div>
        {latestEntry && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {latestEntry.weight}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(latestEntry.recorded_at)}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
          Weight
          <input
            style={inputStyle}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            placeholder="e.g. 72.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
          Date
          <input
            style={inputStyle}
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
          Note (optional)
          <input
            style={inputStyle}
            type="text"
            placeholder="Morning, after workout..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button style={{ ...btnStyle, opacity: saving || !isOnline ? 0.7 : 1 }} onClick={saveWeight} disabled={saving || !isOnline}>
          {saving ? 'Saving...' : 'Log weight'}
        </button>
      </div>

      {message && <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{message}</p>}

      <div>
        <button
          style={{ ...btnSecondaryStyle, width: '100%' }}
          onClick={() => setShowHistory((open) => !open)}
        >
          {showHistory ? 'Hide history' : `View history (${entries.length})`}
        </button>
      </div>

      {showHistory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entries.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>No history yet.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{entry.weight}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(entry.recorded_at)}</div>
                  {entry.note && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>{entry.note}</div>}
                </div>
                <button
                  style={{ ...btnSecondaryStyle, padding: '6px 10px', color: '#b91c1c', borderColor: '#fecaca' }}
                  onClick={() => deleteEntry(entry)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
