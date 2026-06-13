'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { todayISO, isOverdue, isToday } from '@/lib/utils'
import type { Deadline, Priority } from '@/types'

const PRIORITIES: Priority[] = ['low','medium','high']
const empty = (): Partial<Deadline> => ({ title:'', project:'', date:'', priority:'medium', done: false })

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [filter, setFilter] = useState<'all'|'open'|'overdue'|'done'>('open')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Deadline>>(empty())
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const today = todayISO()

  const load = useCallback(async () => {
    const { data } = await supabase.from('deadlines').select('*').order('date', { ascending: true })
    setDeadlines(data || [])
  }, [supabase])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(empty()); setEditing(null); setOpen(true) }
  function openEdit(d: Deadline) { setForm(d); setEditing(d.id); setOpen(true) }

  async function save() {
    if (!form.title || !form.date) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('deadlines').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
    } else {
      await supabase.from('deadlines').insert({ ...form, user_id: user!.id })
    }
    setSaving(false); setOpen(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this deadline?')) return
    await supabase.from('deadlines').delete().eq('id', id)
    load()
  }

  async function toggleDone(dl: Deadline) {
    await supabase.from('deadlines').update({ done: !dl.done, updated_at: new Date().toISOString() }).eq('id', dl.id)
    load()
  }

  const visible = deadlines.filter(d => {
    if (filter === 'open') return !d.done
    if (filter === 'overdue') return !d.done && d.date < today
    if (filter === 'done') return d.done
    return true
  })

  const overdueCount = deadlines.filter(d => !d.done && d.date < today).length
  const upcomingCount = deadlines.filter(d => !d.done && d.date >= today).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Deadline tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">{upcomingCount} upcoming · {overdueCount > 0 ? <span className="text-red-500">{overdueCount} overdue</span> : '0 overdue'}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add deadline</button>
      </div>

      <div className="card mb-5 p-3 flex gap-1 flex-wrap">
        {(['all','open','overdue','done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'} ${f === 'overdue' && overdueCount > 0 && filter !== 'overdue' ? 'text-red-500' : ''}`}>
            {f} {f === 'overdue' && overdueCount > 0 ? `(${overdueCount})` : ''}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card p-10 text-center text-gray-400 text-sm">No deadlines here.</div>
        )}
        {visible.map(dl => {
          const overdue = isOverdue(dl.date) && !dl.done
          const dueToday = isToday(dl.date) && !dl.done
          return (
            <div key={dl.id} className={`card p-4 hover:shadow-md transition-all ${dl.done ? 'opacity-50' : ''} ${overdue ? 'border-red-100' : ''}`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dl.done}
                  onChange={() => toggleDone(dl)}
                  className="w-4 h-4 rounded accent-brand-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-gray-900 ${dl.done ? 'line-through text-gray-400' : ''}`}>{dl.title}</span>
                    <Badge value={dl.priority} />
                  </div>
                  {dl.project && <p className="text-xs text-gray-400 mt-0.5">{dl.project}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge value={dl.done ? 'done' : overdue ? 'overdue' : dueToday ? 'today' : 'upcoming'} />
                  <span className="text-xs text-gray-400">{dl.date}</span>
                  <button onClick={() => openEdit(dl)} className="btn-ghost px-2 py-1 text-xs">Edit</button>
                  <button onClick={() => remove(dl.id)} className="btn-danger px-2 py-1 text-xs">Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit deadline' : 'Add deadline'}>
        <div className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="What's due?" /></div>
          <div><label className="label">Project / client</label><input className="input" value={form.project||''} onChange={e=>setForm(f=>({...f,project:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date *</label><input className="input" type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority||'medium'} onChange={e=>setForm(f=>({...f,priority:e.target.value as Priority}))}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save deadline'}</button>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
