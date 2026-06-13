'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { todayISO, isOverdue, isToday } from '@/lib/utils'
import type { Task, TaskStatus, Priority } from '@/types'

const STATUSES: TaskStatus[] = ['todo','in_progress','done']
const PRIORITIES: Priority[] = ['low','medium','high']
const empty = (): Partial<Task> => ({ title:'', project:'', due_date:'', priority:'medium', status:'todo' })

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<TaskStatus|'all'|'today'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Task>>(empty())
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const today = todayISO()

  const load = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
  }, [supabase])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(empty()); setEditing(null); setOpen(true) }
  function openEdit(t: Task) { setForm(t); setEditing(t.id); setOpen(true) }

  async function save() {
    if (!form.title) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('tasks').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
    } else {
      await supabase.from('tasks').insert({ ...form, user_id: user!.id })
    }
    setSaving(false); setOpen(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  async function toggleDone(task: Task) {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id)
    load()
  }

  const visible = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'today') return t.due_date === today && t.status !== 'done'
    return t.status === filter
  })

  const todayCount = tasks.filter(t => t.due_date === today && t.status !== 'done').length
  const overdueCount = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Daily tasks</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tasks.length} tasks · {todayCount} due today · {overdueCount > 0 ? `${overdueCount} overdue` : `${doneCount} done`}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add task</button>
      </div>

      <div className="card mb-5 p-3 flex gap-1 flex-wrap">
        {(['all','today','todo','in_progress','done'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {s.replace('_',' ')} {s === 'today' && todayCount > 0 ? <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5 text-xs">{todayCount}</span> : null}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card p-10 text-center text-gray-400 text-sm">No tasks here.</div>
        )}
        {visible.map(task => {
          const overdue = isOverdue(task.due_date) && task.status !== 'done'
          const dueToday = isToday(task.due_date) && task.status !== 'done'
          return (
            <div key={task.id} className={`card p-4 hover:shadow-md transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => toggleDone(task)}
                  className="w-4 h-4 rounded accent-brand-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                    <Badge value={task.status} />
                    <Badge value={task.priority} />
                  </div>
                  {task.project && <p className="text-xs text-gray-400 mt-0.5">{task.project}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.due_date && (
                    <Badge value={overdue ? 'overdue' : dueToday ? 'today' : 'upcoming'} />
                  )}
                  {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                  <button onClick={() => openEdit(task)} className="btn-ghost px-2 py-1 text-xs">Edit</button>
                  <button onClick={() => remove(task.id)} className="btn-danger px-2 py-1 text-xs">Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit task' : 'Add task'}>
        <div className="space-y-3">
          <div><label className="label">Task *</label><input className="input" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="What needs to be done?" /></div>
          <div><label className="label">Project</label><input className="input" value={form.project||''} onChange={e=>setForm(f=>({...f,project:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Due date</label><input className="input" type="date" value={form.due_date||''} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} /></div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority||'medium'} onChange={e=>setForm(f=>({...f,priority:e.target.value as Priority}))}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status||'todo'} onChange={e=>setForm(f=>({...f,status:e.target.value as TaskStatus}))}>
              {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save task'}</button>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
