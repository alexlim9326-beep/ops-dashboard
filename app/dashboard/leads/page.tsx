'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import type { Lead, LeadStatus, Priority } from '@/types'

const STATUSES: LeadStatus[] = ['new','contacted','qualified','nurturing','converted','dead']
const PRIORITIES: Priority[] = ['low','medium','high']
const empty = (): Partial<Lead> => ({ name:'', company:'', source:'', status:'new', priority:'medium', notes:'' })

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<LeadStatus|'all'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Lead>>(empty())
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
  }, [supabase])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(empty()); setEditing(null); setOpen(true) }
  function openEdit(l: Lead) { setForm(l); setEditing(l.id); setOpen(true) }

  async function save() {
    if (!form.name) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('leads').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
    } else {
      await supabase.from('leads').insert({ ...form, user_id: user!.id })
    }
    setSaving(false); setOpen(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    load()
  }

  const visible = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const hot = leads.filter(l => l.priority === 'high' && l.status !== 'converted').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Lead tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">{leads.length} leads · {hot} hot</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add lead</button>
      </div>

      <div className="card mb-5 p-3 flex gap-1 flex-wrap">
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {s} {s !== 'all' && <span className="opacity-70">({leads.filter(l=>l.status===s).length})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card p-10 text-center text-gray-400 text-sm">No leads here. Add your first lead.</div>
        )}
        {visible.map(lead => (
          <div key={lead.id} className="card p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{lead.name}</span>
                  <Badge value={lead.status} />
                  <Badge value={lead.priority} />
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  {lead.company}{lead.company && lead.source ? ' · ' : ''}{lead.source ? `via ${lead.source}` : ''}
                </p>
                {lead.notes && <p className="text-xs text-gray-400 mt-1.5">{lead.notes}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(lead)} className="btn-ghost px-2 py-1 text-xs">Edit</button>
                <button onClick={() => remove(lead.id)} className="btn-danger px-2 py-1 text-xs">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit lead' : 'Add lead'}>
        <div className="space-y-3">
          <div><label className="label">Name *</label><input className="input" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company</label><input className="input" value={form.company||''} onChange={e=>setForm(f=>({...f,company:e.target.value}))} /></div>
            <div><label className="label">Source</label><input className="input" value={form.source||''} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="referral, Instagram…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Status</label>
              <select className="input" value={form.status||'new'} onChange={e=>setForm(f=>({...f,status:e.target.value as LeadStatus}))}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority||'medium'} onChange={e=>setForm(f=>({...f,priority:e.target.value as Priority}))}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save lead'}</button>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
