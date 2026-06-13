'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { todayISO } from '@/lib/utils'
import type { Meeting } from '@/types'

const empty = (): Partial<Meeting> => ({ title:'', date:'', time:'', attendees:'', location:'', agenda:'' })

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filter, setFilter] = useState<'all'|'upcoming'|'past'>('upcoming')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Meeting>>(empty())
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const today = todayISO()

  const load = useCallback(async () => {
    const { data } = await supabase.from('meetings').select('*').order('date', { ascending: true })
    setMeetings(data || [])
  }, [supabase])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(empty()); setEditing(null); setOpen(true) }
  function openEdit(m: Meeting) { setForm(m); setEditing(m.id); setOpen(true) }

  async function save() {
    if (!form.title) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('meetings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
    } else {
      await supabase.from('meetings').insert({ ...form, user_id: user!.id })
    }
    setSaving(false); setOpen(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this meeting?')) return
    await supabase.from('meetings').delete().eq('id', id)
    load()
  }

  const visible = meetings.filter(m => {
    if (filter === 'upcoming') return !m.date || m.date >= today
    if (filter === 'past') return m.date && m.date < today
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meetings.filter(m=>!m.date||m.date>=today).length} upcoming · {meetings.filter(m=>m.date&&m.date<today).length} past</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add meeting</button>
      </div>

      <div className="card mb-5 p-3 flex gap-1">
        {(['all','upcoming','past'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card p-10 text-center text-gray-400 text-sm">No meetings here.</div>
        )}
        {visible.map(mtg => {
          const isPast = mtg.date && mtg.date < today
          return (
            <div key={mtg.id} className={`card p-4 hover:shadow-md transition-all ${isPast ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  {mtg.date && (
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex flex-col items-center justify-center flex-shrink-0 border border-brand-100">
                      <span className="text-sm font-bold text-brand-600">{new Date(mtg.date + 'T00:00').getDate()}</span>
                      <span className="text-xs text-brand-400">{new Date(mtg.date + 'T00:00').toLocaleDateString('en-SG',{month:'short'})}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{mtg.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {mtg.time || ''}{mtg.time && mtg.location ? ' · ' : ''}{mtg.location || ''}
                    </p>
                    {mtg.attendees && <p className="text-xs text-gray-400 mt-1">Attendees: {mtg.attendees}</p>}
                    {mtg.agenda && <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 px-2 py-1.5 rounded-lg">{mtg.agenda}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge value={isPast ? 'done' : 'upcoming'} />
                  <button onClick={() => openEdit(mtg)} className="btn-ghost px-2 py-1 text-xs">Edit</button>
                  <button onClick={() => remove(mtg.id)} className="btn-danger px-2 py-1 text-xs">Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit meeting' : 'Add meeting'}>
        <div className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Meeting topic" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input className="input" type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
            <div><label className="label">Time</label><input className="input" type="time" value={form.time||''} onChange={e=>setForm(f=>({...f,time:e.target.value}))} /></div>
          </div>
          <div><label className="label">Attendees</label><input className="input" value={form.attendees||''} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="Who's joining?" /></div>
          <div><label className="label">Location / link</label><input className="input" value={form.location||''} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Zoom, address…" /></div>
          <div><label className="label">Agenda</label><textarea className="input" rows={3} value={form.agenda||''} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save meeting'}</button>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
